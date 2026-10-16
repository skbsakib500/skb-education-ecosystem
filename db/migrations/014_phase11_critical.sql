-- ============================================================
-- Phase 11: Critical Features
-- Password Reset + Profile Edit + Academic Year
-- ============================================================

-- Profile extended fields
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists blood_group text;

-- Academic Year/Session
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_current boolean default false,
  is_archived boolean default false,
  created_at timestamptz default now(),
  unique (institution_id, name)
);
create index if not exists idx_academic_years_inst on public.academic_years(institution_id, is_current);

alter table public.academic_years enable row level security;
drop policy if exists "ay_read" on public.academic_years;
drop policy if exists "ay_admin" on public.academic_years;
create policy "ay_read" on public.academic_years
  for select to authenticated using (public.is_member_of(institution_id));
create policy "ay_admin" on public.academic_years
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- Set current year (only one current per institution)
create or replace function public.set_current_academic_year(p_institution_id uuid, p_year_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin_of(p_institution_id) then
    raise exception 'Admin access required';
  end if;
  update public.academic_years
    set is_current = false
    where institution_id = p_institution_id;
  update public.academic_years
    set is_current = true
    where id = p_year_id and institution_id = p_institution_id;
end;
$$;
grant execute on function public.set_current_academic_year to authenticated;

-- Global search function
create or replace function public.search_institution(
  p_institution_id uuid,
  p_query text
)
returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
  v_q text := '%' || lower(trim(p_query)) || '%';
  v_students jsonb;
  v_teachers jsonb;
  v_classes jsonb;
  v_exams jsonb;
begin
  if not public.is_member_of(p_institution_id) then
    raise exception 'Access denied';
  end if;

  if length(trim(p_query)) < 2 then
    return jsonb_build_object('students', '[]'::jsonb, 'teachers', '[]'::jsonb, 'classes', '[]'::jsonb, 'exams', '[]'::jsonb);
  end if;

  select jsonb_agg(jsonb_build_object('id', id, 'full_name', full_name, 'student_id', student_id, 'roll_number', roll_number))
    into v_students
    from public.students
    where institution_id = p_institution_id
      and (lower(full_name) like v_q or lower(coalesce(student_id,'')) like v_q or coalesce(roll_number,'') like v_q)
    limit 10;

  select jsonb_agg(jsonb_build_object('user_id', m.user_id, 'full_name', p.full_name, 'email', p.email, 'role', m.role))
    into v_teachers
    from public.memberships m
    left join public.profiles p on p.id = m.user_id
    where m.institution_id = p_institution_id
      and m.role in ('teacher','admin','accountant')
      and (lower(coalesce(p.full_name,'')) like v_q or lower(coalesce(p.email,'')) like v_q)
    limit 10;

  select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'section', section))
    into v_classes
    from public.classes
    where institution_id = p_institution_id
      and (lower(name) like v_q or lower(coalesce(section,'')) like v_q)
    limit 10;

  select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'subject', subject, 'status', status))
    into v_exams
    from public.exams
    where institution_id = p_institution_id
      and (lower(title) like v_q or lower(coalesce(subject,'')) like v_q)
    limit 10;

  return jsonb_build_object(
    'students', coalesce(v_students, '[]'::jsonb),
    'teachers', coalesce(v_teachers, '[]'::jsonb),
    'classes',  coalesce(v_classes,  '[]'::jsonb),
    'exams',    coalesce(v_exams,    '[]'::jsonb)
  );
end;
$$;
grant execute on function public.search_institution to authenticated;

-- Institution update helper (RPC — bypasses complexity)
create or replace function public.update_institution(
  p_institution_id uuid,
  p_name text,
  p_type text,
  p_emoji text,
  p_division text,
  p_city text,
  p_education_board text,
  p_contact_phone text,
  p_contact_email text,
  p_description text,
  p_motto text,
  p_established_year int
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_result jsonb;
begin
  if not public.is_admin_of(p_institution_id) then
    raise exception 'Admin access required';
  end if;

  update public.institutions
    set name = trim(p_name),
        type = p_type,
        emoji = p_emoji,
        division = p_division,
        city = p_city,
        education_board = p_education_board,
        contact_phone = p_contact_phone,
        contact_email = p_contact_email,
        description = p_description,
        motto = p_motto,
        established_year = p_established_year
    where id = p_institution_id;

  select to_jsonb(i.*) into v_result from public.institutions i where i.id = p_institution_id;
  return v_result;
end;
$$;
grant execute on function public.update_institution to authenticated;

-- Profile update helper
create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_bio text,
  p_address text,
  p_dob date,
  p_blood_group text,
  p_avatar_url text
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  update public.profiles
    set full_name = trim(p_full_name),
        phone = p_phone,
        bio = p_bio,
        address = p_address,
        date_of_birth = p_dob,
        blood_group = p_blood_group,
        avatar_url = p_avatar_url
    where id = auth.uid();
end;
$$;
grant execute on function public.update_my_profile to authenticated;

-- Avatar storage policies (public avatar bucket)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_public_read" on storage.objects;
drop policy if exists "avatar_own_upload" on storage.objects;
drop policy if exists "avatar_own_update" on storage.objects;

create policy "avatar_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatar_own_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar_own_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
