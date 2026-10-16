-- ============================================================
-- Migration 025: Homework/Assignments + Leave Management
-- ============================================================

-- ── HOMEWORK / ASSIGNMENTS ──
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  teacher_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  attachment_urls jsonb default '[]'::jsonb,
  max_marks int default 100,
  due_at timestamptz not null,
  allow_late boolean default false,
  is_graded boolean default true,
  status text default 'active' check (status in ('draft','active','closed')),
  created_at timestamptz default now()
);
create index if not exists idx_assignments_class on public.assignments(class_id, due_at desc);
create index if not exists idx_assignments_teacher on public.assignments(teacher_id, created_at desc);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  content text,
  attachment_urls jsonb default '[]'::jsonb,
  submitted_at timestamptz default now(),
  is_late boolean default false,
  marks_obtained int,
  feedback text,
  graded_at timestamptz,
  graded_by uuid references auth.users(id) on delete set null,
  status text default 'submitted' check (status in ('submitted','graded','returned','late')),
  unique (assignment_id, student_id)
);
create index if not exists idx_submissions_assignment on public.assignment_submissions(assignment_id, status);
create index if not exists idx_submissions_student on public.assignment_submissions(student_id, submitted_at desc);

-- ── LEAVE MANAGEMENT ──
create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  requester_role text not null check (requester_role in ('student','teacher','staff')),
  student_id uuid references public.students(id) on delete set null,
  leave_type text default 'sick' check (leave_type in ('sick','casual','emergency','family','vacation','other')),
  start_date date not null,
  end_date date not null,
  reason text not null,
  attachment_url text,
  status text default 'pending' check (status in ('pending','approved','rejected','cancelled')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz default now()
);
create index if not exists idx_leave_inst on public.leave_requests(institution_id, status);
create index if not exists idx_leave_requester on public.leave_requests(requester_id, created_at desc);

-- ── RLS ──
alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;
alter table public.leave_requests enable row level security;

-- Assignments: member read, teacher/admin write
drop policy if exists "assignments_read" on public.assignments;
drop policy if exists "assignments_write" on public.assignments;
create policy "assignments_read" on public.assignments
  for select to authenticated using (public.is_member_of(institution_id));
create policy "assignments_write" on public.assignments
  for all to authenticated
  using (public.is_admin_of(institution_id) or teacher_id = auth.uid())
  with check (public.is_admin_of(institution_id) or teacher_id = auth.uid());

-- Submissions: read own or teacher
drop policy if exists "submissions_read" on public.assignment_submissions;
drop policy if exists "submissions_student_insert" on public.assignment_submissions;
drop policy if exists "submissions_teacher_grade" on public.assignment_submissions;
create policy "submissions_read" on public.assignment_submissions
  for select to authenticated
  using (
    student_id in (select id from public.students where linked_user_id = auth.uid())
    or assignment_id in (select id from public.assignments where teacher_id = auth.uid() or public.is_admin_of(institution_id))
  );
create policy "submissions_student_insert" on public.assignment_submissions
  for insert to authenticated
  with check (student_id in (select id from public.students where linked_user_id = auth.uid()));
create policy "submissions_teacher_grade" on public.assignment_submissions
  for update to authenticated
  using (assignment_id in (select id from public.assignments where teacher_id = auth.uid() or public.is_admin_of(institution_id)));

-- Leave requests: own read, own create, admin review
drop policy if exists "leave_read" on public.leave_requests;
drop policy if exists "leave_create_own" on public.leave_requests;
drop policy if exists "leave_admin_review" on public.leave_requests;
create policy "leave_read" on public.leave_requests
  for select to authenticated
  using (requester_id = auth.uid() or public.is_admin_of(institution_id));
create policy "leave_create_own" on public.leave_requests
  for insert to authenticated with check (requester_id = auth.uid());
create policy "leave_admin_review" on public.leave_requests
  for update to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ── FUNCTIONS ──

-- Create assignment (bulk notify students)
create or replace function public.create_assignment(
  p_institution_id uuid,
  p_class_id uuid,
  p_subject_id uuid,
  p_title text,
  p_description text,
  p_max_marks int,
  p_due_at timestamptz,
  p_allow_late boolean default false
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_count int := 0;
  v_teacher uuid := auth.uid();
begin
  if v_teacher is null then raise exception 'Auth required'; end if;
  if not public.is_member_of(p_institution_id) then raise exception 'Access denied'; end if;

  insert into public.assignments (
    institution_id, class_id, subject_id, teacher_id,
    title, description, max_marks, due_at, allow_late, status
  ) values (
    p_institution_id, p_class_id, p_subject_id, v_teacher,
    trim(p_title), p_description, p_max_marks, p_due_at, p_allow_late, 'active'
  ) returning id into v_id;

  -- Notify students in that class
  insert into public.notifications (institution_id, recipient_user_id, title, body, category, link)
  select p_institution_id, s.linked_user_id,
    '📝 New Assignment: ' || trim(p_title),
    'Due: ' || to_char(p_due_at, 'DD Mon YYYY HH24:MI'),
    'general',
    '/student/assignments/?id=' || v_id
  from public.students s
  where s.institution_id = p_institution_id
    and s.class_id = p_class_id
    and s.linked_user_id is not null;
  get diagnostics v_count = row_count;

  return jsonb_build_object('assignment_id', v_id, 'notified', v_count);
end;
$$;
grant execute on function public.create_assignment to authenticated;

-- Submit assignment
create or replace function public.submit_assignment(
  p_assignment_id uuid,
  p_content text,
  p_attachment_urls jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_student_id uuid;
  v_assignment record;
  v_submission_id uuid;
  v_is_late boolean := false;
  v_existing uuid;
begin
  if v_me is null then raise exception 'Auth required'; end if;

  select id into v_student_id from public.students where linked_user_id = v_me
    and institution_id = (select institution_id from public.assignments where id = p_assignment_id)
    limit 1;
  if v_student_id is null then raise exception 'Not enrolled'; end if;

  select * into v_assignment from public.assignments where id = p_assignment_id;
  if v_assignment is null then raise exception 'Assignment not found'; end if;
  if v_assignment.status <> 'active' then raise exception 'Assignment closed'; end if;

  if now() > v_assignment.due_at then
    if not v_assignment.allow_late then raise exception 'Deadline passed'; end if;
    v_is_late := true;
  end if;

  select id into v_existing from public.assignment_submissions
    where assignment_id = p_assignment_id and student_id = v_student_id;

  if v_existing is not null then
    update public.assignment_submissions set
      content = p_content, attachment_urls = p_attachment_urls,
      submitted_at = now(), is_late = v_is_late, status = 'submitted'
    where id = v_existing;
    return jsonb_build_object('submission_id', v_existing, 'is_late', v_is_late, 'updated', true);
  end if;

  insert into public.assignment_submissions (
    assignment_id, student_id, content, attachment_urls, is_late
  ) values (
    p_assignment_id, v_student_id, p_content, p_attachment_urls, v_is_late
  ) returning id into v_submission_id;

  -- Notify teacher
  if v_assignment.teacher_id is not null then
    insert into public.notifications (institution_id, recipient_user_id, title, body, category, link)
    values (v_assignment.institution_id, v_assignment.teacher_id,
      '📥 New submission',
      'Someone submitted: ' || v_assignment.title,
      'general',
      '/institutions/view/?slug=unknown');
  end if;

  return jsonb_build_object('submission_id', v_submission_id, 'is_late', v_is_late);
end;
$$;
grant execute on function public.submit_assignment to authenticated;

-- Grade submission
create or replace function public.grade_submission(
  p_submission_id uuid,
  p_marks int,
  p_feedback text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_sub record;
  v_max int;
  v_student_user uuid;
begin
  if v_me is null then raise exception 'Auth required'; end if;

  select s.*, a.max_marks, a.institution_id as inst_id, a.title as a_title
  into v_sub
  from public.assignment_submissions s
  join public.assignments a on a.id = s.assignment_id
  where s.id = p_submission_id;

  if v_sub is null then raise exception 'Submission not found'; end if;

  if not (public.is_admin_of(v_sub.inst_id) or exists (
    select 1 from public.assignments where id = v_sub.assignment_id and teacher_id = v_me
  )) then raise exception 'Not authorized'; end if;

  if p_marks < 0 or p_marks > v_sub.max_marks then
    raise exception 'Marks must be 0-%', v_sub.max_marks;
  end if;

  update public.assignment_submissions set
    marks_obtained = p_marks, feedback = p_feedback,
    graded_at = now(), graded_by = v_me, status = 'graded'
  where id = p_submission_id;

  -- Notify student
  select linked_user_id into v_student_user from public.students where id = v_sub.student_id;
  if v_student_user is not null then
    insert into public.notifications (institution_id, recipient_user_id, title, body, category)
    values (v_sub.inst_id, v_student_user,
      '📊 Assignment graded',
      v_sub.a_title || ' — ' || p_marks || '/' || v_sub.max_marks,
      'result');
  end if;
end;
$$;
grant execute on function public.grade_submission to authenticated;

-- List my assignments (student view)
create or replace function public.my_assignments()
returns table (
  id uuid, title text, description text, subject_id uuid, class_id uuid,
  max_marks int, due_at timestamptz, allow_late boolean, status text,
  teacher_name text, institution_name text, institution_slug text,
  submission_status text, marks_obtained int, feedback text,
  attachment_urls jsonb, submission_id uuid
)
language sql security definer stable set search_path = public as $$
  with my_classes as (
    select id, institution_id, class_id from public.students where linked_user_id = auth.uid()
  )
  select
    a.id, a.title, a.description, a.subject_id, a.class_id,
    a.max_marks, a.due_at, a.allow_late, a.status,
    (select full_name from public.profiles where id = a.teacher_id) as teacher_name,
    (select name from public.institutions where id = a.institution_id) as institution_name,
    (select slug from public.institutions where id = a.institution_id) as institution_slug,
    s.status as submission_status, s.marks_obtained, s.feedback,
    a.attachment_urls, s.id as submission_id
  from public.assignments a
  left join public.assignment_submissions s on s.assignment_id = a.id and s.student_id in (select id from public.students where linked_user_id = auth.uid())
  where a.class_id in (select class_id from my_classes)
    and a.status = 'active'
  order by a.due_at desc;
$$;
grant execute on function public.my_assignments to authenticated;

-- List assignments for teacher
create or replace function public.teacher_assignments(p_institution_id uuid)
returns table (
  id uuid, title text, class_name text, section text, subject_name text,
  max_marks int, due_at timestamptz, status text,
  submissions_count bigint, graded_count bigint, pending_count bigint
)
language sql security definer stable set search_path = public as $$
  select
    a.id, a.title, c.name, c.section,
    (select name from public.subjects where id = a.subject_id) as subject_name,
    a.max_marks, a.due_at, a.status,
    (select count(*) from public.assignment_submissions where assignment_id = a.id) as submissions_count,
    (select count(*) from public.assignment_submissions where assignment_id = a.id and status = 'graded') as graded_count,
    (select count(*) from public.assignment_submissions where assignment_id = a.id and status = 'submitted') as pending_count
  from public.assignments a
  join public.classes c on c.id = a.class_id
  where a.institution_id = p_institution_id
    and (a.teacher_id = auth.uid() or public.is_admin_of(p_institution_id))
  order by a.created_at desc;
$$;
grant execute on function public.teacher_assignments to authenticated;

-- Approve/reject leave
create or replace function public.review_leave(
  p_leave_id uuid,
  p_approve boolean,
  p_note text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_leave record;
begin
  if v_me is null then raise exception 'Auth required'; end if;
  select * into v_leave from public.leave_requests where id = p_leave_id;
  if v_leave is null then raise exception 'Not found'; end if;
  if not public.is_admin_of(v_leave.institution_id) then raise exception 'Not authorized'; end if;

  update public.leave_requests set
    status = case when p_approve then 'approved' else 'rejected' end,
    reviewed_by = v_me, reviewed_at = now(), review_note = p_note
  where id = p_leave_id;

  -- Notify requester
  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  values (v_leave.institution_id, v_leave.requester_id,
    case when p_approve then '✅ Leave approved' else '❌ Leave rejected' end,
    v_leave.leave_type || ': ' || to_char(v_leave.start_date, 'DD Mon') || ' → ' || to_char(v_leave.end_date, 'DD Mon'),
    'general');
end;
$$;
grant execute on function public.review_leave to authenticated;
