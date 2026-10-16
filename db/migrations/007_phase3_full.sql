-- ============================================================
-- SKB Education — Phase 3.2 Full Schema
-- Teachers · Exams · Attendance · Notices
-- ============================================================

-- ── INVITATIONS ──
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  email text not null,
  role text not null check (role in ('teacher','student','parent','accountant')),
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  status text not null default 'pending' check (status in ('pending','accepted','expired','cancelled')),
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now()
);
create index if not exists idx_invitations_token on public.invitations(token);
create index if not exists idx_invitations_inst on public.invitations(institution_id, status);

-- ── EXAMS ──
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  title text not null,
  description text,
  type text not null default 'mcq' check (type in ('mcq','written','mixed')),
  subject text,
  duration_minutes int default 60,
  total_marks int default 100,
  start_at timestamptz,
  end_at timestamptz,
  status text not null default 'draft' check (status in ('draft','published','ongoing','completed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_exams_inst on public.exams(institution_id, status);

-- ── QUESTIONS ──
create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  question_text text not null,
  type text not null default 'mcq' check (type in ('mcq','short','long')),
  options jsonb,
  correct_answer text,
  marks int not null default 1,
  order_index int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_questions_exam on public.questions(exam_id, order_index);

-- ── SUBMISSIONS ──
create table if not exists public.exam_submissions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score numeric default 0,
  status text not null default 'submitted' check (status in ('submitted','graded','reviewed')),
  submitted_at timestamptz default now(),
  graded_at timestamptz,
  unique (exam_id, student_id)
);

-- ── ATTENDANCE ──
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null default current_date,
  status text not null default 'present' check (status in ('present','absent','late','excused')),
  note text,
  marked_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  unique (class_id, student_id, date)
);
create index if not exists idx_attendance_inst_date on public.attendance(institution_id, date);

-- ── NOTICES ──
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  content text,
  category text not null default 'general' check (category in ('general','exam','holiday','urgent','event')),
  audience text not null default 'all' check (audience in ('all','teachers','students','parents')),
  is_pinned boolean default false,
  published_at timestamptz default now(),
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_notices_inst on public.notices(institution_id, published_at desc);

-- ============================================================
-- RLS
-- ============================================================
alter table public.invitations enable row level security;
alter table public.exams enable row level security;
alter table public.questions enable row level security;
alter table public.exam_submissions enable row level security;
alter table public.attendance enable row level security;
alter table public.notices enable row level security;

-- Invitations: admin only
drop policy if exists "invitations_admin" on public.invitations;
create policy "invitations_admin" on public.invitations
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- Exams: members read, admin write
drop policy if exists "exams_member_read" on public.exams;
drop policy if exists "exams_admin_write" on public.exams;
create policy "exams_member_read" on public.exams
  for select to authenticated using (public.is_member_of(institution_id));
create policy "exams_admin_write" on public.exams
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- Questions: read via exam membership, admin write
drop policy if exists "questions_read" on public.questions;
drop policy if exists "questions_admin" on public.questions;
create policy "questions_read" on public.questions
  for select to authenticated
  using (exists (select 1 from public.exams e where e.id = exam_id and public.is_member_of(e.institution_id)));
create policy "questions_admin" on public.questions
  for all to authenticated
  using (exists (select 1 from public.exams e where e.id = exam_id and public.is_admin_of(e.institution_id)))
  with check (exists (select 1 from public.exams e where e.id = exam_id and public.is_admin_of(e.institution_id)));

-- Submissions
drop policy if exists "submissions_read" on public.exam_submissions;
drop policy if exists "submissions_insert" on public.exam_submissions;
create policy "submissions_read" on public.exam_submissions
  for select to authenticated
  using (exists (select 1 from public.exams e where e.id = exam_id and public.is_member_of(e.institution_id)));
create policy "submissions_insert" on public.exam_submissions
  for insert to authenticated
  with check (exists (select 1 from public.exams e where e.id = exam_id and public.is_member_of(e.institution_id)));

-- Attendance
drop policy if exists "attendance_member" on public.attendance;
drop policy if exists "attendance_admin" on public.attendance;
create policy "attendance_member" on public.attendance
  for select to authenticated using (public.is_member_of(institution_id));
create policy "attendance_admin" on public.attendance
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- Notices
drop policy if exists "notices_member_read" on public.notices;
drop policy if exists "notices_admin_write" on public.notices;
create policy "notices_member_read" on public.notices
  for select to authenticated using (public.is_member_of(institution_id));
create policy "notices_admin_write" on public.notices
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ============================================================
-- ATTENDANCE SUMMARY FUNCTION
-- ============================================================
create or replace function public.attendance_summary(p_institution_id uuid, p_days int default 30)
returns table (
  student_id uuid,
  full_name text,
  present_count bigint,
  absent_count bigint,
  late_count bigint,
  total_days bigint,
  percentage numeric
)
language sql security definer stable set search_path = public as $$
  select
    s.id,
    s.full_name,
    count(*) filter (where a.status = 'present') as present_count,
    count(*) filter (where a.status = 'absent') as absent_count,
    count(*) filter (where a.status = 'late') as late_count,
    count(a.id) as total_days,
    case when count(a.id) = 0 then 0
      else round(100.0 * count(*) filter (where a.status in ('present','late')) / count(a.id), 1)
    end as percentage
  from public.students s
  left join public.attendance a on a.student_id = s.id
    and a.date >= current_date - p_days
  where s.institution_id = p_institution_id
    and public.is_admin_of(p_institution_id)
  group by s.id, s.full_name
  order by s.full_name;
$$;
