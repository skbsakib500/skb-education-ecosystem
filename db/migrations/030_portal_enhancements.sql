-- ============================================================
-- Migration 030: Parent Portal 2.0 + Teacher Analytics + Prefs
-- ============================================================

-- Notification preferences
create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  attendance_alerts boolean default true,
  exam_results boolean default true,
  fee_reminders boolean default true,
  assignment_alerts boolean default true,
  notice_alerts boolean default true,
  message_alerts boolean default true,
  result_alerts boolean default true,
  email_enabled boolean default false,
  quiet_hours_start time,
  quiet_hours_end time,
  updated_at timestamptz default now()
);

-- Teacher class notes (private observations)
create table if not exists public.teacher_notes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  note text not null,
  category text default 'general'
    check (category in ('general','behavior','academic','concern','praise')),
  is_private boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_teacher_notes on public.teacher_notes(teacher_id, student_id, created_at desc);

-- Parent-child access log (for audit)
create table if not exists public.parent_access_log (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  action text not null,
  created_at timestamptz default now()
);
create index if not exists idx_parent_log on public.parent_access_log(parent_user_id, created_at desc);

-- RLS
alter table public.notification_preferences enable row level security;
alter table public.teacher_notes enable row level security;
alter table public.parent_access_log enable row level security;

drop policy if exists "np_own" on public.notification_preferences;
create policy "np_own" on public.notification_preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "tn_read" on public.teacher_notes;
drop policy if exists "tn_own" on public.teacher_notes;
create policy "tn_read" on public.teacher_notes
  for select to authenticated
  using (teacher_id = auth.uid() or public.is_admin_of(institution_id));
create policy "tn_own" on public.teacher_notes
  for all to authenticated
  using (teacher_id = auth.uid())
  with check (teacher_id = auth.uid());

drop policy if exists "pal_own" on public.parent_access_log;
create policy "pal_own" on public.parent_access_log
  for all to authenticated using (parent_user_id = auth.uid()) with check (parent_user_id = auth.uid());

-- ── PARENT PORTAL FUNCTIONS ──

-- My children with full summary
create or replace function public.my_children_summary()
returns table (
  student_id uuid, full_name text, student_code text, class_name text, section text,
  institution_name text, institution_slug text, institution_emoji text,
  attendance_pct numeric, avg_exam numeric, fee_due numeric,
  class_role text, relationship text
)
language sql security definer stable set search_path = public as $$
  select
    s.id, s.full_name, s.student_id, c.name, c.section,
    i.name, i.slug, i.emoji,
    coalesce((
      select round(100.0 * count(*) filter (where status in ('present','late')) / nullif(count(*), 0), 1)
      from public.attendance a
      where a.student_id = s.id and a.date >= current_date - 30
    ), 0),
    coalesce((
      select round(avg(case when ea.total_marks > 0 then ea.score::numeric/ea.total_marks*100 else 0 end), 1)
      from public.exam_attempts ea
      where ea.student_id = s.id and ea.status = 'graded'
    ), 0),
    coalesce((
      select sum(amount - paid_amount)
      from public.fee_payments fp
      where fp.student_id = s.id and fp.status in ('pending','partial','overdue')
    ), 0),
    s.class_role,
    psl.relationship
  from public.parent_student_links psl
  join public.students s on s.id = psl.student_id
  left join public.classes c on c.id = s.class_id
  join public.institutions i on i.id = s.institution_id
  where psl.parent_user_id = auth.uid()
  order by s.full_name;
$$;
grant execute on function public.my_children_summary to authenticated;

-- Child recent activity (last 20 items)
create or replace function public.child_recent_activity(p_student_id uuid, p_limit int default 20)
returns table (kind text, title text, description text, at timestamptz, meta jsonb)
language sql security definer stable set search_path = public as $$
  with access_check as (
    select 1 from public.parent_student_links
    where parent_user_id = auth.uid() and student_id = p_student_id
    union all
    select 1 where public.is_admin_of((select institution_id from public.students where id = p_student_id))
  )
  select * from (
    select 'attendance'::text as kind,
      case when a.status = 'present' then '✅ Present'
           when a.status = 'absent' then '❌ Absent'
           when a.status = 'late' then '⏰ Late'
           else '📝 ' || initcap(a.status) end as title,
      coalesce(a.note, '') as description, a.created_at as at,
      jsonb_build_object('status', a.status, 'date', a.date) as meta
    from public.attendance a where a.student_id = p_student_id
    union all
    select 'exam'::text, '📊 ' || e.title,
      'Score: ' || ea.score || '/' || ea.total_marks,
      ea.submitted_at,
      jsonb_build_object('score', ea.score, 'total', ea.total_marks, 'exam_id', e.id)
    from public.exam_attempts ea join public.exams e on e.id = ea.exam_id
    where ea.student_id = p_student_id and ea.status = 'graded'
    union all
    select 'fee'::text, '💰 ' || coalesce(fp.fee_name, 'Fee'),
      '৳' || fp.paid_amount || ' of ৳' || fp.amount,
      fp.created_at,
      jsonb_build_object('status', fp.status, 'paid', fp.paid_amount, 'due', (fp.amount - fp.paid_amount))
    from public.fee_payments fp where fp.student_id = p_student_id
    union all
    select 'assignment'::text, '📓 ' || a.title,
      case when sub.status = 'graded' then 'Graded: ' || sub.marks_obtained || '/' || a.max_marks
           when sub.status = 'submitted' then 'Submitted'
           else 'Assigned' end,
      coalesce(sub.submitted_at, a.created_at),
      jsonb_build_object('assignment_id', a.id, 'status', sub.status)
    from public.assignments a
    left join public.assignment_submissions sub on sub.assignment_id = a.id and sub.student_id = p_student_id
    where a.class_id = (select class_id from public.students where id = p_student_id)
  ) activity
  where exists (select 1 from access_check)
  order by at desc
  limit p_limit;
$$;
grant execute on function public.child_recent_activity to authenticated;

-- ── TEACHER ANALYTICS ──

create or replace function public.teacher_dashboard(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'my_classes', (
      select count(distinct class_id) from public.timetable_slots
      where institution_id = p_institution_id and teacher_id = auth.uid()
    ),
    'my_students', (
      select count(distinct s.id) from public.students s
      where s.institution_id = p_institution_id
        and s.class_id in (select distinct class_id from public.timetable_slots where institution_id = p_institution_id and teacher_id = auth.uid())
    ),
    'pending_grading', (
      select count(*) from public.assignment_submissions sub
      join public.assignments a on a.id = sub.assignment_id
      where a.institution_id = p_institution_id and a.teacher_id = auth.uid() and sub.status = 'submitted'
    ),
    'active_assignments', (
      select count(*) from public.assignments
      where institution_id = p_institution_id and teacher_id = auth.uid() and status = 'active'
    ),
    'today_classes', (
      select count(*) from public.timetable_slots
      where institution_id = p_institution_id and teacher_id = auth.uid()
        and day_of_week = extract(dow from current_date)
    )
  );
$$;
grant execute on function public.teacher_dashboard to authenticated;

-- Class performance (for teacher)
create or replace function public.teacher_class_performance(p_institution_id uuid, p_class_id uuid)
returns table (
  student_id uuid, full_name text, student_code text, roll_number text,
  attendance_pct numeric, avg_exam numeric, assignments_submitted bigint, assignments_total bigint,
  fee_due numeric, class_role text
)
language sql security definer stable set search_path = public as $$
  with class_students as (
    select id, full_name, student_id, roll_number, class_role
    from public.students
    where institution_id = p_institution_id and class_id = p_class_id
  ),
  class_assignments as (
    select id from public.assignments
    where institution_id = p_institution_id and class_id = p_class_id and status = 'active'
  )
  select
    cs.id, cs.full_name, cs.student_id, cs.roll_number,
    coalesce((
      select round(100.0 * count(*) filter (where status in ('present','late')) / nullif(count(*), 0), 1)
      from public.attendance where student_id = cs.id and date >= current_date - 30
    ), 0),
    coalesce((
      select round(avg(case when ea.total_marks > 0 then ea.score::numeric/ea.total_marks*100 else 0 end), 1)
      from public.exam_attempts ea where ea.student_id = cs.id and ea.status = 'graded'
    ), 0),
    (select count(*) from public.assignment_submissions where student_id = cs.id and assignment_id in (select id from class_assignments)),
    (select count(*) from class_assignments),
    coalesce((select sum(amount - paid_amount) from public.fee_payments where student_id = cs.id and status in ('pending','partial','overdue')), 0),
    cs.class_role
  from class_students cs
  order by cs.roll_number nulls last, cs.full_name;
$$;
grant execute on function public.teacher_class_performance to authenticated;

-- Get my notification preferences
create or replace function public.get_my_notification_prefs()
returns jsonb language sql security definer stable set search_path = public as $$
  select coalesce(
    (select to_jsonb(np.*) from public.notification_preferences np where np.user_id = auth.uid()),
    jsonb_build_object(
      'attendance_alerts', true, 'exam_results', true, 'fee_reminders', true,
      'assignment_alerts', true, 'notice_alerts', true, 'message_alerts', true,
      'result_alerts', true, 'email_enabled', false,
      'quiet_hours_start', null, 'quiet_hours_end', null
    )
  );
$$;
grant execute on function public.get_my_notification_prefs to authenticated;

-- Update my notification preferences
create or replace function public.update_my_notification_prefs(
  p_attendance_alerts boolean,
  p_exam_results boolean,
  p_fee_reminders boolean,
  p_assignment_alerts boolean,
  p_notice_alerts boolean,
  p_message_alerts boolean,
  p_result_alerts boolean,
  p_email_enabled boolean,
  p_quiet_hours_start time default null,
  p_quiet_hours_end time default null
)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  insert into public.notification_preferences (
    user_id, attendance_alerts, exam_results, fee_reminders, assignment_alerts,
    notice_alerts, message_alerts, result_alerts, email_enabled,
    quiet_hours_start, quiet_hours_end, updated_at
  ) values (
    auth.uid(), p_attendance_alerts, p_exam_results, p_fee_reminders, p_assignment_alerts,
    p_notice_alerts, p_message_alerts, p_result_alerts, p_email_enabled,
    p_quiet_hours_start, p_quiet_hours_end, now()
  )
  on conflict (user_id) do update set
    attendance_alerts = excluded.attendance_alerts,
    exam_results = excluded.exam_results,
    fee_reminders = excluded.fee_reminders,
    assignment_alerts = excluded.assignment_alerts,
    notice_alerts = excluded.notice_alerts,
    message_alerts = excluded.message_alerts,
    result_alerts = excluded.result_alerts,
    email_enabled = excluded.email_enabled,
    quiet_hours_start = excluded.quiet_hours_start,
    quiet_hours_end = excluded.quiet_hours_end,
    updated_at = now();
end;
$$;
grant execute on function public.update_my_notification_prefs to authenticated;

-- Backup summary (for admin)
create or replace function public.institution_backup_summary(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'institution', (select to_jsonb(i.*) from public.institutions i where i.id = p_institution_id),
    'counts', jsonb_build_object(
      'students', (select count(*) from public.students where institution_id = p_institution_id),
      'classes', (select count(*) from public.classes where institution_id = p_institution_id),
      'teachers', (select count(*) from public.memberships where institution_id = p_institution_id and role = 'teacher'),
      'exams', (select count(*) from public.exams where institution_id = p_institution_id),
      'assignments', (select count(*) from public.assignments where institution_id = p_institution_id),
      'attendance_records', (select count(*) from public.attendance where institution_id = p_institution_id),
      'fee_records', (select count(*) from public.fee_payments where institution_id = p_institution_id),
      'documents', (select count(*) from public.student_documents where institution_id = p_institution_id)
    ),
    'generated_at', now()
  );
$$;
grant execute on function public.institution_backup_summary to authenticated;
