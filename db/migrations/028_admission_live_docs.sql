-- ============================================================
-- Migration 028: Admission + Live Classes + Document Vault
-- ============================================================

-- ── ADMISSION APPLICATIONS ──
create table if not exists public.admission_applications (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  application_no text unique,
  applicant_name text not null,
  applicant_dob date,
  gender text check (gender in ('male','female','other')),
  class_applied_for uuid references public.classes(id) on delete set null,
  class_name text,
  guardian_name text not null,
  guardian_phone text not null,
  guardian_email text,
  guardian_relation text,
  address text,
  previous_school text,
  previous_class text,
  blood_group text,
  religion text,
  quota text,
  attachment_urls jsonb default '[]'::jsonb,
  status text default 'pending'
    check (status in ('pending','under_review','shortlisted','approved','rejected','enrolled')),
  review_notes text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  enrolled_student_id uuid references public.students(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_admission_inst on public.admission_applications(institution_id, status, created_at desc);
create index if not exists idx_admission_no on public.admission_applications(application_no);

-- ── LIVE CLASSES ──
create table if not exists public.live_classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid references auth.users(id) on delete set null,
  title text not null,
  platform text default 'zoom'
    check (platform in ('zoom','google_meet','teams','jitsi','youtube','custom')),
  join_url text not null,
  meeting_id text,
  passcode text,
  scheduled_at timestamptz not null,
  duration_minutes int default 60,
  recording_url text,
  status text default 'scheduled'
    check (status in ('scheduled','live','completed','cancelled')),
  created_at timestamptz default now()
);
create index if not exists idx_live_class_inst on public.live_classes(institution_id, scheduled_at desc);
create index if not exists idx_live_class_class on public.live_classes(class_id, scheduled_at desc);

-- ── DOCUMENT VAULT ──
create table if not exists public.student_documents (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  doc_type text not null default 'other'
    check (doc_type in ('birth_certificate','transcript','id_card','photo','medical','transfer_certificate','nid','other')),
  title text not null,
  file_url text not null,
  file_size bigint,
  mime_type text,
  issued_date date,
  expiry_date date,
  is_verified boolean default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_docs_student on public.student_documents(student_id, doc_type);
create index if not exists idx_docs_inst on public.student_documents(institution_id);

-- ── RLS ──
alter table public.admission_applications enable row level security;
alter table public.live_classes enable row level security;
alter table public.student_documents enable row level security;

-- Admission: public insert, admin manage
drop policy if exists "admission_public_insert" on public.admission_applications;
drop policy if exists "admission_inst_read" on public.admission_applications;
drop policy if exists "admission_admin" on public.admission_applications;
create policy "admission_public_insert" on public.admission_applications
  for insert to authenticated with check (true);
create policy "admission_inst_read" on public.admission_applications
  for select to authenticated using (public.is_admin_of(institution_id));
create policy "admission_admin" on public.admission_applications
  for all to authenticated using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Live classes: members read
drop policy if exists "live_read" on public.live_classes;
drop policy if exists "live_write" on public.live_classes;
create policy "live_read" on public.live_classes
  for select to authenticated using (public.is_member_of(institution_id));
create policy "live_write" on public.live_classes
  for all to authenticated
  using (public.is_admin_of(institution_id) or teacher_id = auth.uid())
  with check (public.is_admin_of(institution_id) or teacher_id = auth.uid());

-- Documents
drop policy if exists "docs_read" on public.student_documents;
drop policy if exists "docs_write" on public.student_documents;
create policy "docs_read" on public.student_documents
  for select to authenticated
  using (
    public.is_admin_of(institution_id)
    or student_id in (select id from public.students where linked_user_id = auth.uid())
    or student_id in (
      select s.id from public.students s
      join public.parent_student_links psl on psl.student_id = s.id
      where psl.parent_user_id = auth.uid()
    )
  );
create policy "docs_write" on public.student_documents
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- Storage bucket
insert into storage.buckets (id, name, public, file_size_limit)
values ('student-documents', 'student-documents', false, 10485760)
on conflict (id) do nothing;

drop policy if exists "sd_read_auth" on storage.objects;
drop policy if exists "sd_upload_auth" on storage.objects;
create policy "sd_read_auth" on storage.objects
  for select using (bucket_id = 'student-documents' and auth.uid() is not null);
create policy "sd_upload_auth" on storage.objects
  for insert with check (
    bucket_id = 'student-documents' and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── FUNCTIONS ──

create or replace function public.gen_application_no()
returns trigger language plpgsql security definer as $$
declare
  v_prefix text;
begin
  if new.application_no is null or new.application_no = '' then
    select coalesce(substring(slug from 1 for 3), 'APP') into v_prefix
      from public.institutions where id = new.institution_id;
    new.application_no := 'ADM-' || upper(coalesce(v_prefix, 'SKB')) || '-' ||
      to_char(now(), 'YYMMDD') || '-' || substr(new.id::text, 1, 4);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_app_no on public.admission_applications;
create trigger trg_app_no before insert on public.admission_applications
  for each row execute function public.gen_application_no();

-- Submit admission (public)
create or replace function public.submit_admission(
  p_institution_id uuid,
  p_applicant_name text,
  p_applicant_dob date,
  p_gender text,
  p_class_name text,
  p_guardian_name text,
  p_guardian_phone text,
  p_guardian_email text,
  p_guardian_relation text,
  p_address text,
  p_previous_school text,
  p_previous_class text,
  p_blood_group text,
  p_religion text,
  p_quota text,
  p_attachment_urls jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_no text;
begin
  insert into public.admission_applications (
    institution_id, applicant_name, applicant_dob, gender, class_name,
    guardian_name, guardian_phone, guardian_email, guardian_relation, address,
    previous_school, previous_class, blood_group, religion, quota, attachment_urls
  ) values (
    p_institution_id, trim(p_applicant_name), p_applicant_dob, p_gender, p_class_name,
    trim(p_guardian_name), trim(p_guardian_phone), p_guardian_email, p_guardian_relation, p_address,
    p_previous_school, p_previous_class, p_blood_group, p_religion, p_quota, p_attachment_urls
  ) returning id, application_no into v_id, v_no;

  -- Notify admins
  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  select p_institution_id, m.user_id,
    '📥 New admission application',
    p_applicant_name || ' — Class ' || coalesce(p_class_name, '—'),
    'general'
  from public.memberships m
  where m.institution_id = p_institution_id and m.role = 'admin';

  return jsonb_build_object('application_id', v_id, 'application_no', v_no, 'status', 'pending');
end;
$$;
grant execute on function public.submit_admission to authenticated;

-- Approve admission → create student + send invite
create or replace function public.approve_admission(
  p_application_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_app record;
  v_student_id uuid;
  v_class_id uuid;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  select * into v_app from public.admission_applications where id = p_application_id;
  if v_app is null then raise exception 'Application not found'; end if;
  if not public.is_admin_of(v_app.institution_id) then raise exception 'Admin required'; end if;
  if v_app.status = 'enrolled' then raise exception 'Already enrolled'; end if;

  -- Try to match class by name
  v_class_id := null;
  if v_app.class_name is not null and length(v_app.class_name) > 0 then
    select id into v_class_id from public.classes
      where institution_id = v_app.institution_id and lower(name) = lower(v_app.class_name)
      limit 1;
  end if;

  insert into public.students (
    institution_id, full_name, class_id, email, guardian_name, guardian_phone, guardian_email, address, blood_group
  ) values (
    v_app.institution_id, v_app.applicant_name, v_class_id,
    v_app.guardian_email, v_app.guardian_name, v_app.guardian_phone, v_app.guardian_email, v_app.address, v_app.blood_group
  ) returning id into v_student_id;

  update public.admission_applications set
    status = 'enrolled',
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_notes,
    enrolled_student_id = v_student_id
  where id = p_application_id;

  -- Auto-invite guardian email if provided
  if v_app.guardian_email is not null and length(trim(v_app.guardian_email)) > 0 then
    insert into public.invitations (institution_id, email, role)
    values (v_app.institution_id, lower(trim(v_app.guardian_email)), 'parent')
    on conflict do nothing;
  end if;

  return jsonb_build_object('student_id', v_student_id, 'status', 'enrolled');
end;
$$;
grant execute on function public.approve_admission to authenticated;

-- Update admission status
create or replace function public.update_admission_status(
  p_application_id uuid,
  p_status text,
  p_notes text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_inst uuid;
begin
  select institution_id into v_inst from public.admission_applications where id = p_application_id;
  if v_inst is null then raise exception 'Not found'; end if;
  if not public.is_admin_of(v_inst) then raise exception 'Admin required'; end if;

  update public.admission_applications set
    status = p_status,
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    review_notes = p_notes
  where id = p_application_id;
end;
$$;
grant execute on function public.update_admission_status to authenticated;

-- Admission stats
create or replace function public.admission_stats(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'total', (select count(*) from public.admission_applications where institution_id = p_institution_id),
    'pending', (select count(*) from public.admission_applications where institution_id = p_institution_id and status = 'pending'),
    'under_review', (select count(*) from public.admission_applications where institution_id = p_institution_id and status = 'under_review'),
    'enrolled', (select count(*) from public.admission_applications where institution_id = p_institution_id and status = 'enrolled'),
    'rejected', (select count(*) from public.admission_applications where institution_id = p_institution_id and status = 'rejected'),
    'this_month', (select count(*) from public.admission_applications where institution_id = p_institution_id and created_at >= date_trunc('month', current_date))
  );
$$;
grant execute on function public.admission_stats to authenticated;

-- Upcoming live classes for user
create or replace function public.my_live_classes()
returns table (
  id uuid, title text, platform text, join_url text, passcode text,
  scheduled_at timestamptz, duration_minutes int, status text,
  class_name text, section text, subject_name text, teacher_name text,
  institution_name text, institution_emoji text
)
language sql security definer stable set search_path = public as $$
  with my_data as (
    select class_id, institution_id from public.students where linked_user_id = auth.uid()
    union
    select c.id, c.institution_id from public.classes c
    join public.memberships m on m.institution_id = c.institution_id
    where m.user_id = auth.uid() and m.role in ('admin','teacher')
    union
    select s.class_id, s.institution_id from public.students s
    join public.parent_student_links psl on psl.student_id = s.id
    where psl.parent_user_id = auth.uid()
  )
  select
    lc.id, lc.title, lc.platform, lc.join_url, lc.passcode,
    lc.scheduled_at, lc.duration_minutes, lc.status,
    c.name, c.section,
    (select name from public.subjects where id = lc.subject_id),
    (select full_name from public.profiles where id = lc.teacher_id),
    (select name from public.institutions where id = lc.institution_id),
    (select emoji from public.institutions where id = lc.institution_id)
  from public.live_classes lc
  join public.classes c on c.id = lc.class_id
  where lc.class_id in (select class_id from my_data where class_id is not null)
    and lc.scheduled_at >= now() - interval '2 hours'
  order by lc.scheduled_at asc
  limit 50;
$$;
grant execute on function public.my_live_classes to authenticated;

-- Public application status tracker (by application no)
create or replace function public.track_application(p_application_no text)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'application_no', a.application_no,
    'applicant_name', a.applicant_name,
    'class_name', a.class_name,
    'status', a.status,
    'submitted_at', a.created_at,
    'reviewed_at', a.reviewed_at,
    'review_notes', a.review_notes,
    'institution_name', i.name,
    'institution_emoji', i.emoji
  )
  from public.admission_applications a
  join public.institutions i on i.id = a.institution_id
  where a.application_no = p_application_no
  limit 1;
$$;
grant execute on function public.track_application to authenticated;
