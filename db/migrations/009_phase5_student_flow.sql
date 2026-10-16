-- ============================================================
-- SKB Education — Phase 5: Student Join + Exam Attempt
-- ============================================================

-- Students: link to auth.users (after they accept invite)
alter table public.students add column if not exists email text;
alter table public.students add column if not exists linked_user_id uuid references auth.users(id) on delete set null;
alter table public.students add column if not exists admission_date date default current_date;
alter table public.students add column if not exists dob date;
alter table public.students add column if not exists guardian_name text;
alter table public.students add column if not exists guardian_phone text;
alter table public.students add column if not exists address text;

-- Exam attempts (student side)
create table if not exists public.exam_attempts (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  started_at timestamptz default now(),
  submitted_at timestamptz,
  score numeric default 0,
  total_marks int default 0,
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','graded','expired')),
  answers jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (exam_id, student_id)
);
create index if not exists idx_attempts_student on public.exam_attempts(student_id, status);
create index if not exists idx_attempts_exam on public.exam_attempts(exam_id, status);

-- Accept invitation function
create or replace function public.accept_invitation(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv record;
  v_user_id uuid := auth.uid();
  v_user_email text;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  -- Find invitation
  select * into v_inv from public.invitations
    where token = p_token
      and status = 'pending'
      and expires_at > now()
    limit 1;

  if v_inv is null then
    raise exception 'Invalid or expired invitation';
  end if;

  if lower(v_user_email) <> lower(v_inv.email) then
    raise exception 'This invitation is for %', v_inv.email;
  end if;

  -- Check if already a member
  if exists (
    select 1 from public.memberships
    where institution_id = v_inv.institution_id
      and user_id = v_user_id
      and role = v_inv.role
  ) then
    update public.invitations set status = 'accepted' where id = v_inv.id;
    return jsonb_build_object('already_member', true, 'institution_id', v_inv.institution_id);
  end if;

  -- Add membership
  insert into public.memberships (institution_id, user_id, role)
  values (v_inv.institution_id, v_user_id, v_inv.role);

  -- If student invite → try to link student record by email
  if v_inv.role = 'student' then
    update public.students
      set linked_user_id = v_user_id
      where institution_id = v_inv.institution_id
        and lower(email) = lower(v_user_email)
        and linked_user_id is null;
  end if;

  -- Mark accepted
  update public.invitations
    set status = 'accepted'
    where id = v_inv.id;

  select jsonb_build_object(
    'institution_id', v_inv.institution_id,
    'role', v_inv.role,
    'success', true
  ) into v_result;

  return v_result;
end;
$$;

grant execute on function public.accept_invitation to authenticated;

-- Auto-grade function: MCQ
create or replace function public.grade_exam_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt record;
  v_question record;
  v_user_answer text;
  v_score numeric := 0;
  v_total int := 0;
  v_result jsonb;
begin
  select * into v_attempt from public.exam_attempts where id = p_attempt_id;
  if v_attempt is null then raise exception 'Attempt not found'; end if;
  if v_attempt.status = 'graded' then
    return jsonb_build_object('score', v_attempt.score, 'total', v_attempt.total_marks);
  end if;

  for v_question in
    select * from public.questions where exam_id = v_attempt.exam_id order by order_index
  loop
    v_total := v_total + v_question.marks;
    v_user_answer := v_attempt.answers->>(v_question.id::text);
    if v_user_answer is not null and v_user_answer = v_question.correct_answer then
      v_score := v_score + v_question.marks;
    end if;
  end loop;

  update public.exam_attempts
    set score = v_score,
        total_marks = v_total,
        status = 'graded',
        submitted_at = coalesce(submitted_at, now())
    where id = p_attempt_id;

  v_result := jsonb_build_object('score', v_score, 'total', v_total);
  return v_result;
end;
$$;

grant execute on function public.grade_exam_attempt to authenticated;

-- RLS for exam_attempts
alter table public.exam_attempts enable row level security;

drop policy if exists "attempts_student_own" on public.exam_attempts;
drop policy if exists "attempts_admin_all" on public.exam_attempts;
drop policy if exists "attempts_insert_member" on public.exam_attempts;
drop policy if exists "attempts_update_own" on public.exam_attempts;

create policy "attempts_student_own" on public.exam_attempts
  for select to authenticated
  using (
    student_id in (
      select id from public.students
      where linked_user_id = auth.uid()
    )
    or public.is_admin_of(institution_id)
  );

create policy "attempts_insert_member" on public.exam_attempts
  for insert to authenticated
  with check (
    student_id in (
      select id from public.students
      where linked_user_id = auth.uid()
    )
  );

create policy "attempts_update_own" on public.exam_attempts
  for update to authenticated
  using (
    student_id in (
      select id from public.students
      where linked_user_id = auth.uid()
    )
    or public.is_admin_of(institution_id)
  );

create policy "attempts_admin_all" on public.exam_attempts
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));
