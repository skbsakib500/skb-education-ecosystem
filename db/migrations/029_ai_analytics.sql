-- ============================================================
-- Migration 029: AI Tutor + Advanced Analytics (FIXED)
-- ============================================================

create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text default 'New Chat',
  subject text,
  context_type text default 'general'
    check (context_type in ('general','homework','exam_prep','concept','career','study_plan')),
  is_archived boolean default false,
  total_messages int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_ai_conv_user on public.ai_conversations(user_id, updated_at desc);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  tokens_used int default 0,
  model text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_ai_msg_conv on public.ai_messages(conversation_id, created_at);

create table if not exists public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  messages_today int default 0,
  messages_total int default 0,
  last_reset_date date default current_date,
  daily_limit int default 20,
  updated_at timestamptz default now()
);

create table if not exists public.student_insights (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  risk_level text default 'low' check (risk_level in ('low','medium','high','critical')),
  risk_score numeric default 0,
  factors jsonb default '{}'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  computed_at timestamptz default now(),
  unique (student_id)
);
create index if not exists idx_insights_inst on public.student_insights(institution_id, risk_level);

create table if not exists public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  snapshot_date date default current_date,
  students_total int default 0,
  attendance_rate numeric default 0,
  avg_exam_score numeric default 0,
  fee_collection_rate numeric default 0,
  active_assignments int default 0,
  new_enrollments int default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  unique (institution_id, snapshot_date)
);
create index if not exists idx_snapshots_inst on public.analytics_snapshots(institution_id, snapshot_date desc);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_usage enable row level security;
alter table public.student_insights enable row level security;
alter table public.analytics_snapshots enable row level security;

drop policy if exists "ai_conv_own" on public.ai_conversations;
create policy "ai_conv_own" on public.ai_conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "ai_msg_own" on public.ai_messages;
create policy "ai_msg_own" on public.ai_messages
  for all to authenticated
  using (conversation_id in (select id from public.ai_conversations where user_id = auth.uid()))
  with check (conversation_id in (select id from public.ai_conversations where user_id = auth.uid()));

drop policy if exists "ai_usage_own" on public.ai_usage;
create policy "ai_usage_own" on public.ai_usage
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "insights_read" on public.student_insights;
drop policy if exists "insights_admin" on public.student_insights;
create policy "insights_read" on public.student_insights
  for select to authenticated
  using (public.is_admin_of(institution_id)
    or student_id in (select id from public.students where linked_user_id = auth.uid()));
create policy "insights_admin" on public.student_insights
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

drop policy if exists "snapshots_read" on public.analytics_snapshots;
drop policy if exists "snapshots_admin" on public.analytics_snapshots;
create policy "snapshots_read" on public.analytics_snapshots
  for select to authenticated using (public.is_member_of(institution_id));
create policy "snapshots_admin" on public.analytics_snapshots
  for all to authenticated using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ── FUNCTIONS ──

create or replace function public.check_ai_quota()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_me uuid := auth.uid(); v_usage record;
begin
  if v_me is null then raise exception 'Auth required'; end if;
  insert into public.ai_usage (user_id) values (v_me) on conflict (user_id) do nothing;
  update public.ai_usage set messages_today = 0, last_reset_date = current_date
    where user_id = v_me and last_reset_date < current_date;
  select * into v_usage from public.ai_usage where user_id = v_me;
  return jsonb_build_object(
    'allowed', v_usage.messages_today < v_usage.daily_limit,
    'used', v_usage.messages_today,
    'limit', v_usage.daily_limit,
    'remaining', greatest(0, v_usage.daily_limit - v_usage.messages_today)
  );
end;
$$;
grant execute on function public.check_ai_quota to authenticated;

create or replace function public.increment_ai_usage()
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  update public.ai_usage set messages_today = messages_today + 1,
    messages_total = messages_total + 1, updated_at = now()
  where user_id = auth.uid();
end;
$$;
grant execute on function public.increment_ai_usage to authenticated;

create or replace function public.compute_student_risk(p_student_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_student record;
  v_att_pct numeric := 0;
  v_exam_avg numeric := 0;
  v_fee_due numeric := 0;
  v_score numeric := 0;
  v_risk text := 'low';
  v_factors jsonb := '{}'::jsonb;
  v_recommendations jsonb := '[]'::jsonb;
begin
  select id, institution_id, full_name into v_student from public.students where id = p_student_id;
  if v_student is null then raise exception 'Student not found'; end if;

  select case when count(*) > 0
    then round(100.0 * count(*) filter (where status in ('present','late')) / count(*), 1)
    else 100 end
  into v_att_pct
  from public.attendance
  where student_id = p_student_id and date >= current_date - 30;

  select coalesce(round(avg(case when total_marks > 0 then score::numeric/total_marks*100 else 0 end), 1), 0)
  into v_exam_avg
  from public.exam_attempts
  where student_id = p_student_id and status = 'graded';

  select coalesce(sum(amount - paid_amount), 0) into v_fee_due
  from public.fee_payments
  where student_id = p_student_id and status in ('pending','partial','overdue');

  v_score := 0;
  if v_att_pct < 50 then v_score := v_score + 40;
  elsif v_att_pct < 70 then v_score := v_score + 25;
  elsif v_att_pct < 85 then v_score := v_score + 10; end if;

  if v_exam_avg > 0 and v_exam_avg < 40 then v_score := v_score + 35;
  elsif v_exam_avg < 60 and v_exam_avg > 0 then v_score := v_score + 20;
  elsif v_exam_avg < 75 and v_exam_avg > 0 then v_score := v_score + 8; end if;

  if v_fee_due > 5000 then v_score := v_score + 25;
  elsif v_fee_due > 2000 then v_score := v_score + 15;
  elsif v_fee_due > 0 then v_score := v_score + 5; end if;

  if v_score >= 75 then v_risk := 'critical';
  elsif v_score >= 50 then v_risk := 'high';
  elsif v_score >= 25 then v_risk := 'medium';
  else v_risk := 'low'; end if;

  v_factors := jsonb_build_object('attendance_rate', v_att_pct, 'exam_average', v_exam_avg, 'fee_due', v_fee_due);

  if v_att_pct < 70 then v_recommendations := v_recommendations || '["Improve attendance — meet with parents"]'::jsonb; end if;
  if v_exam_avg < 60 and v_exam_avg > 0 then v_recommendations := v_recommendations || '["Extra tutoring for weak subjects"]'::jsonb; end if;
  if v_fee_due > 2000 then v_recommendations := v_recommendations || '["Follow up on fee payment"]'::jsonb; end if;

  insert into public.student_insights (institution_id, student_id, risk_level, risk_score, factors, recommendations, computed_at)
  values (v_student.institution_id, p_student_id, v_risk, v_score, v_factors, v_recommendations, now())
  on conflict (student_id) do update set
    risk_level = excluded.risk_level, risk_score = excluded.risk_score,
    factors = excluded.factors, recommendations = excluded.recommendations,
    computed_at = excluded.computed_at;

  return jsonb_build_object('risk_level', v_risk, 'risk_score', v_score, 'factors', v_factors, 'recommendations', v_recommendations);
end;
$$;
grant execute on function public.compute_student_risk to authenticated;

create or replace function public.compute_institution_risks(p_institution_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count int := 0; v_student record;
begin
  if not public.is_admin_of(p_institution_id) then raise exception 'Admin required'; end if;
  for v_student in select id from public.students where institution_id = p_institution_id loop
    perform public.compute_student_risk(v_student.id);
    v_count := v_count + 1;
  end loop;
  return jsonb_build_object('computed', v_count);
end;
$$;
grant execute on function public.compute_institution_risks to authenticated;

create or replace function public.at_risk_students(p_institution_id uuid, p_limit int default 50)
returns table (
  student_id uuid, full_name text, student_code text,
  class_name text, section text,
  risk_level text, risk_score numeric, factors jsonb, recommendations jsonb
)
language sql security definer stable set search_path = public as $$
  select si.student_id, s.full_name, s.student_id, c.name, c.section,
    si.risk_level, si.risk_score, si.factors, si.recommendations
  from public.student_insights si
  join public.students s on s.id = si.student_id
  left join public.classes c on c.id = s.class_id
  where si.institution_id = p_institution_id
    and si.risk_level in ('high','critical')
    and public.is_admin_of(p_institution_id)
  order by si.risk_score desc
  limit p_limit;
$$;
grant execute on function public.at_risk_students to authenticated;

-- Simple analytics (no top_subjects to avoid errors)
create or replace function public.institution_analytics(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'students', jsonb_build_object(
      'total', (select count(*) from public.students where institution_id = p_institution_id),
      'active', (select count(*) from public.students where institution_id = p_institution_id and linked_user_id is not null)
    ),
    'attendance', jsonb_build_object(
      'rate_30d', coalesce((
        select round(100.0 * count(*) filter (where status in ('present','late')) / nullif(count(*), 0), 1)
        from public.attendance where institution_id = p_institution_id and date >= current_date - 30
      ), 0),
      'today', (select count(*) from public.attendance where institution_id = p_institution_id and date = current_date)
    ),
    'exams', jsonb_build_object(
      'avg_score', coalesce((
        select round(avg(case when total_marks > 0 then score::numeric/total_marks*100 else 0 end), 1)
        from public.exam_attempts where institution_id = p_institution_id and status = 'graded'
      ), 0),
      'total_attempts', (select count(*) from public.exam_attempts where institution_id = p_institution_id and status = 'graded')
    ),
    'fees', jsonb_build_object(
      'collected', coalesce((select sum(paid_amount) from public.fee_payments where institution_id = p_institution_id), 0),
      'expected', coalesce((select sum(amount) from public.fee_payments where institution_id = p_institution_id and status <> 'waived'), 0),
      'pending', coalesce((select sum(amount - paid_amount) from public.fee_payments where institution_id = p_institution_id and status in ('pending','partial','overdue')), 0)
    ),
    'risk', jsonb_build_object(
      'high', (select count(*) from public.student_insights where institution_id = p_institution_id and risk_level = 'high'),
      'critical', (select count(*) from public.student_insights where institution_id = p_institution_id and risk_level = 'critical')
    )
  );
$$;
grant execute on function public.institution_analytics to authenticated;

create or replace function public.create_ai_chat(p_title text default 'New Chat', p_subject text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  insert into public.ai_conversations (user_id, title, subject)
  values (auth.uid(), coalesce(p_title, 'New Chat'), p_subject)
  returning id into v_id;
  return v_id;
end;
$$;
grant execute on function public.create_ai_chat to authenticated;
