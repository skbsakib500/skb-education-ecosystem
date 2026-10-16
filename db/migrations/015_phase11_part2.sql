-- ============================================================
-- Phase 11 Part 2: Bulk Import + Fee Receipt + Result Publish
--                  Holiday Calendar + Class Promotion
-- ============================================================

-- ── HOLIDAYS ──
create table if not exists public.holidays (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  name_bn text,
  start_date date not null,
  end_date date,
  type text default 'general' check (type in ('general','govt','religious','exam','event','vacation')),
  is_recurring boolean default false,
  description text,
  created_at timestamptz default now()
);
create index if not exists idx_holidays_inst on public.holidays(institution_id, start_date);

alter table public.holidays enable row level security;
drop policy if exists "holidays_read" on public.holidays;
drop policy if exists "holidays_admin" on public.holidays;
create policy "holidays_read" on public.holidays
  for select to authenticated using (public.is_member_of(institution_id));
create policy "holidays_admin" on public.holidays
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ── RESULT PUBLISH CONTROL ──
alter table public.exams add column if not exists results_published boolean default false;
alter table public.exams add column if not exists results_published_at timestamptz;

-- RLS: student can only see results if results_published = true
drop policy if exists "attempts_student_own" on public.exam_attempts;
create policy "attempts_student_own" on public.exam_attempts
  for select to authenticated
  using (
    (student_id in (select id from public.students where linked_user_id = auth.uid())
      and exists (select 1 from public.exams e where e.id = exam_id and e.results_published = true))
    or public.is_admin_of(institution_id)
    or exists (select 1 from public.memberships m
      where m.institution_id = exam_attempts.institution_id
        and m.user_id = auth.uid() and m.role = 'teacher')
  );

-- ── CLASS PROMOTION LOG ──
create table if not exists public.promotion_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  from_class_id uuid references public.classes(id) on delete set null,
  to_class_id uuid references public.classes(id) on delete set null,
  from_academic_year_id uuid references public.academic_years(id) on delete set null,
  to_academic_year_id uuid references public.academic_years(id) on delete set null,
  students_count int default 0,
  performed_by uuid references auth.users(id) on delete set null,
  performed_at timestamptz default now()
);
create index if not exists idx_promotion_inst on public.promotion_logs(institution_id, performed_at desc);

alter table public.promotion_logs enable row level security;
drop policy if exists "promotion_read" on public.promotion_logs;
drop policy if exists "promotion_admin" on public.promotion_logs;
create policy "promotion_read" on public.promotion_logs
  for select to authenticated using (public.is_member_of(institution_id));
create policy "promotion_admin" on public.promotion_logs
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ── BULK STUDENT IMPORT (SECURITY DEFINER) ──
create or replace function public.bulk_import_students(
  p_institution_id uuid,
  p_students jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_success int := 0;
  v_failed int := 0;
  v_errors jsonb := '[]'::jsonb;
  v_item jsonb;
  v_class_id uuid;
  v_idx int := 0;
begin
  if v_user_id is null then raise exception 'Auth required'; end if;
  if not public.is_admin_of(p_institution_id) then
    raise exception 'Admin access required';
  end if;

  for v_item in select * from jsonb_array_elements(p_students)
  loop
    v_idx := v_idx + 1;
    begin
      -- Resolve class by name/section
      v_class_id := null;
      if v_item->>'class_name' is not null and length(v_item->>'class_name') > 0 then
        select id into v_class_id from public.classes
          where institution_id = p_institution_id
            and lower(name) = lower(v_item->>'class_name')
          limit 1;
      end if;

      if (v_item->>'full_name') is null or length(v_item->>'full_name') = 0 then
        v_failed := v_failed + 1;
        v_errors := v_errors || jsonb_build_object('row', v_idx, 'reason', 'Missing name');
        continue;
      end if;

      insert into public.students (
        institution_id, full_name, roll_number, class_id,
        class_role, email, guardian_email, guardian_name, guardian_phone, address
      ) values (
        p_institution_id,
        trim(v_item->>'full_name'),
        nullif(trim(coalesce(v_item->>'roll_number','')), ''),
        v_class_id,
        coalesce(nullif(v_item->>'class_role',''), 'student'),
        nullif(lower(trim(coalesce(v_item->>'email',''))), ''),
        nullif(lower(trim(coalesce(v_item->>'guardian_email',''))), ''),
        nullif(trim(coalesce(v_item->>'guardian_name','')), ''),
        nullif(trim(coalesce(v_item->>'guardian_phone','')), ''),
        nullif(trim(coalesce(v_item->>'address','')), '')
      );
      v_success := v_success + 1;
    exception when others then
      v_failed := v_failed + 1;
      v_errors := v_errors || jsonb_build_object('row', v_idx, 'reason', SQLERRM);
    end;
  end loop;

  return jsonb_build_object('success', v_success, 'failed', v_failed, 'errors', v_errors);
end;
$$;
grant execute on function public.bulk_import_students to authenticated;

-- ── PROMOTE STUDENTS ──
create or replace function public.promote_students(
  p_institution_id uuid,
  p_from_class_id uuid,
  p_to_class_id uuid,
  p_academic_year_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_count int := 0;
begin
  if v_user_id is null then raise exception 'Auth required'; end if;
  if not public.is_admin_of(p_institution_id) then raise exception 'Admin access required'; end if;
  if p_from_class_id = p_to_class_id then raise exception 'Same class selected'; end if;

  update public.students
    set class_id = p_to_class_id
    where institution_id = p_institution_id
      and class_id = p_from_class_id;

  get diagnostics v_count = row_count;

  insert into public.promotion_logs
    (institution_id, from_class_id, to_class_id, to_academic_year_id, students_count, performed_by)
  values
    (p_institution_id, p_from_class_id, p_to_class_id, p_academic_year_id, v_count, v_user_id);

  return jsonb_build_object('promoted', v_count);
end;
$$;
grant execute on function public.promote_students to authenticated;

-- ── PUBLISH/UNPUBLISH RESULTS ──
create or replace function public.publish_exam_results(
  p_exam_id uuid,
  p_publish boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_inst uuid;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  select institution_id into v_inst from public.exams where id = p_exam_id;
  if v_inst is null then raise exception 'Exam not found'; end if;
  if not public.is_admin_of(v_inst) then raise exception 'Admin required'; end if;

  update public.exams
    set results_published = p_publish,
        results_published_at = case when p_publish then now() else null end
    where id = p_exam_id;
end;
$$;
grant execute on function public.publish_exam_results to authenticated;
