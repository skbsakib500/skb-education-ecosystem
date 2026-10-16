-- Class performance
create or replace function public.class_performance_report(p_institution_id uuid)
returns table (class_id uuid, class_name text, section text, student_count bigint, avg_exam_score numeric, avg_attendance numeric, exam_count bigint)
language sql security definer stable set search_path = public as $$
  select c.id, c.name, c.section,
    (select count(*) from public.students s where s.class_id = c.id),
    coalesce((select round(avg(case when ea.total_marks > 0 then ea.score::numeric / ea.total_marks * 100 else 0 end), 1)
      from public.exam_attempts ea join public.students s on s.id = ea.student_id
      where s.class_id = c.id and ea.status = 'graded'), 0),
    coalesce((select round(100.0 * count(*) filter (where status in ('present','late')) / nullif(count(*), 0), 1)
      from public.attendance where class_id = c.id and date >= current_date - 30), 0),
    (select count(*) from public.exams e where e.class_id = c.id)
  from public.classes c
  where c.institution_id = p_institution_id and public.is_member_of(p_institution_id)
  order by c.name, c.section;
$$;
grant execute on function public.class_performance_report to authenticated;

-- Student full profile
create or replace function public.student_full_profile(p_student_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'student', to_jsonb(s.*),
    'class', (select jsonb_build_object('name', c.name, 'section', c.section) from public.classes c where c.id = s.class_id),
    'institution', (select jsonb_build_object('name', i.name, 'slug', i.slug, 'emoji', i.emoji, 'logo_url', i.logo_url) from public.institutions i where i.id = s.institution_id),
    'exams', coalesce((select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'subject', e.subject, 'score', ea.score, 'total', ea.total_marks, 'status', ea.status, 'date', ea.submitted_at) order by ea.submitted_at desc)
      from public.exam_attempts ea join public.exams e on e.id = ea.exam_id where ea.student_id = s.id), '[]'::jsonb),
    'attendance_summary', (select jsonb_build_object('present', count(*) filter (where status = 'present'), 'absent', count(*) filter (where status = 'absent'), 'late', count(*) filter (where status = 'late'), 'total', count(*)) from public.attendance where student_id = s.id),
    'fees', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'fee_name', fee_name, 'amount', amount, 'paid', paid_amount, 'status', status, 'month', month, 'year', year) order by created_at desc) from public.fee_payments where student_id = s.id), '[]'::jsonb)
  )
  from public.students s
  where s.id = p_student_id and public.is_member_of(s.institution_id);
$$;
grant execute on function public.student_full_profile to authenticated;

-- Attendance monthly report
create or replace function public.attendance_monthly_report(p_institution_id uuid, p_class_id uuid, p_month text)
returns table (student_id uuid, student_name text, student_code text, present bigint, absent bigint, late bigint, excused bigint, working_days bigint, percentage numeric)
language sql security definer stable set search_path = public as $$
  select s.id, s.full_name, s.student_id,
    count(*) filter (where a.status = 'present'),
    count(*) filter (where a.status = 'absent'),
    count(*) filter (where a.status = 'late'),
    count(*) filter (where a.status = 'excused'),
    count(distinct a.date),
    case when count(a.id) > 0 then round(100.0 * count(*) filter (where a.status in ('present','late')) / count(a.id), 1) else 0 end
  from public.students s
  left join public.attendance a on a.student_id = s.id and to_char(a.date, 'YYYY-MM') = p_month
  where s.institution_id = p_institution_id and (p_class_id is null or s.class_id = p_class_id) and public.is_member_of(p_institution_id)
  group by s.id, s.full_name, s.student_id order by s.full_name;
$$;
grant execute on function public.attendance_monthly_report to authenticated;

-- Determine card tier
create or replace function public.get_card_tier(p_student_id uuid)
returns text language sql security definer stable set search_path = public as $$
  select case
    when s.class_role in ('captain','assistant_captain','prefect') then 'gold'
    when sp.code = 'enterprise' then 'platinum'
    when sp.code = 'pro' then 'gold'
    when sp.code = 'starter' then 'silver'
    else 'bronze'
  end
  from public.students s
  join public.institutions i on i.id = s.institution_id
  left join public.subscriptions sub on sub.institution_id = i.id
  left join public.subscription_plans sp on sp.id = sub.plan_id
  where s.id = p_student_id;
$$;
grant execute on function public.get_card_tier to authenticated;
