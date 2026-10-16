-- ============================================================
-- Phase 9: SaaS Business Layer
-- ============================================================

-- Platform Admins (SKB Owner)
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text default 'owner' check (role in ('owner','support','billing')),
  created_at timestamptz default now()
);

-- Subscription Plans (master)
create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_bn text,
  tier int not null default 1,
  price_bdt numeric not null default 0,
  billing_cycle text default 'monthly' check (billing_cycle in ('monthly','yearly','lifetime')),
  max_students int default 100,
  max_teachers int default 10,
  max_classes int default 20,
  max_storage_mb int default 500,
  features jsonb default '{}'::jsonb,
  is_active boolean default true,
  is_public boolean default true,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Institution subscriptions
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null unique references public.institutions(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete restrict,
  status text not null default 'trial' check (status in ('trial','active','past_due','suspended','cancelled')),
  started_at timestamptz default now(),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  current_period_start timestamptz default now(),
  current_period_end timestamptz default (now() + interval '30 days'),
  cancelled_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- Subscription invoices (billing)
create table if not exists public.subscription_invoices (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  invoice_no text unique,
  amount numeric not null default 0,
  paid_amount numeric default 0,
  status text not null default 'pending' check (status in ('pending','paid','overdue','cancelled','refunded')),
  due_date date,
  paid_date date,
  payment_method text,
  transaction_id text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_sub_invoices_inst on public.subscription_invoices(institution_id, status);

-- Institution usage stats (rolled up)
alter table public.institutions add column if not exists suspended_at timestamptz;
alter table public.institutions add column if not exists suspended_reason text;

-- ── RLS ──
alter table public.platform_admins enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.subscription_invoices enable row level security;

-- helper: am I a platform admin?
create or replace function public.is_platform_admin()
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;
grant execute on function public.is_platform_admin to authenticated;

-- Platform admins policies
drop policy if exists "pa_self_read" on public.platform_admins;
drop policy if exists "pa_admin_all" on public.platform_admins;
create policy "pa_self_read" on public.platform_admins
  for select to authenticated using (user_id = auth.uid() or public.is_platform_admin());
create policy "pa_admin_all" on public.platform_admins
  for all to authenticated using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Subscription plans: readable to all authenticated (for pricing pages)
drop policy if exists "plans_read" on public.subscription_plans;
drop policy if exists "plans_admin" on public.subscription_plans;
create policy "plans_read" on public.subscription_plans
  for select to authenticated using (is_active = true and is_public = true or public.is_platform_admin());
create policy "plans_admin" on public.subscription_plans
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Subscriptions: institution admin or platform admin
drop policy if exists "subs_read" on public.subscriptions;
drop policy if exists "subs_admin" on public.subscriptions;
create policy "subs_read" on public.subscriptions
  for select to authenticated
  using (public.is_admin_of(institution_id) or public.is_platform_admin());
create policy "subs_admin" on public.subscriptions
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Invoices
drop policy if exists "inv_read" on public.subscription_invoices;
drop policy if exists "inv_admin" on public.subscription_invoices;
create policy "inv_read" on public.subscription_invoices
  for select to authenticated
  using (public.is_admin_of(institution_id) or public.is_platform_admin());
create policy "inv_admin" on public.subscription_invoices
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- ── SEED PLANS ──
insert into public.subscription_plans (code, name, name_bn, tier, price_bdt, max_students, max_teachers, max_classes, max_storage_mb, features, sort_order)
values
  ('free', 'Free', 'ফ্রি', 1, 0, 100, 10, 20, 500,
   '{"ai_tutor": false, "custom_domain": false, "report_cards": true, "finance": false, "api_access": false, "priority_support": false}'::jsonb, 1),
  ('starter', 'Starter', 'স্টার্টার', 2, 1500, 500, 30, 50, 2000,
   '{"ai_tutor": false, "custom_domain": false, "report_cards": true, "finance": true, "api_access": false, "priority_support": false}'::jsonb, 2),
  ('pro', 'Pro', 'প্রো', 3, 3500, 2000, 100, 200, 10000,
   '{"ai_tutor": true, "custom_domain": false, "report_cards": true, "finance": true, "api_access": true, "priority_support": true}'::jsonb, 3),
  ('enterprise', 'Enterprise', 'এন্টারপ্রাইজ', 4, 15000, 100000, 5000, 5000, 100000,
   '{"ai_tutor": true, "custom_domain": true, "report_cards": true, "finance": true, "api_access": true, "priority_support": true, "white_label": true}'::jsonb, 4)
on conflict (code) do update set
  name = excluded.name, name_bn = excluded.name_bn, price_bdt = excluded.price_bdt,
  max_students = excluded.max_students, max_teachers = excluded.max_teachers,
  max_classes = excluded.max_classes, features = excluded.features;

-- ── AUTO-ASSIGN FREE PLAN ON INSTITUTION CREATE ──
create or replace function public.assign_default_plan()
returns trigger language plpgsql security definer as $$
declare
  v_plan_id uuid;
begin
  select id into v_plan_id from public.subscription_plans where code = 'free' limit 1;
  if v_plan_id is not null then
    insert into public.subscriptions (institution_id, plan_id, status)
    values (new.id, v_plan_id, 'trial')
    on conflict (institution_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_assign_default_plan on public.institutions;
create trigger trg_assign_default_plan
  after insert on public.institutions
  for each row execute function public.assign_default_plan();

-- Assign existing institutions to free plan
insert into public.subscriptions (institution_id, plan_id, status)
select i.id, (select id from public.subscription_plans where code='free' limit 1), 'active'
from public.institutions i
where not exists (select 1 from public.subscriptions s where s.institution_id = i.id);

-- ── SUBSCRIPTION HELPER FUNCTIONS ──
create or replace function public.institution_subscription(p_institution_id uuid)
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'plan_code', sp.code,
    'plan_name', sp.name,
    'status', s.status,
    'trial_ends_at', s.trial_ends_at,
    'current_period_end', s.current_period_end,
    'max_students', sp.max_students,
    'max_teachers', sp.max_teachers,
    'max_classes', sp.max_classes,
    'features', sp.features
  )
  from public.subscriptions s
  join public.subscription_plans sp on sp.id = s.plan_id
  where s.institution_id = p_institution_id
  limit 1;
$$;
grant execute on function public.institution_subscription to authenticated;

-- Check if institution can add X
create or replace function public.can_add_student(p_institution_id uuid)
returns jsonb
language plpgsql security definer stable set search_path = public as $$
declare
  v_plan record;
  v_count int;
begin
  select sp.* into v_plan
  from public.subscriptions s
  join public.subscription_plans sp on sp.id = s.plan_id
  where s.institution_id = p_institution_id;

  if v_plan is null then
    return jsonb_build_object('allowed', true, 'reason', 'no_plan');
  end if;

  select count(*) into v_count from public.students where institution_id = p_institution_id;

  return jsonb_build_object(
    'allowed', v_count < v_plan.max_students,
    'current', v_count,
    'max', v_plan.max_students,
    'reason', case when v_count >= v_plan.max_students then 'limit_reached' else null end
  );
end;
$$;
grant execute on function public.can_add_student to authenticated;

-- ── PLATFORM STATS (for Super Admin) ──
create or replace function public.platform_stats()
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'total_institutions', (select count(*) from public.institutions),
    'active_institutions', (select count(*) from public.institutions where status = 'active' and suspended_at is null),
    'suspended_institutions', (select count(*) from public.institutions where suspended_at is not null),
    'total_users', (select count(*) from auth.users),
    'total_students', (select count(*) from public.students),
    'total_teachers', (select count(*) from public.memberships where role = 'teacher'),
    'total_exams', (select count(*) from public.exams),
    'total_attempts', (select count(*) from public.exam_attempts),
    'total_revenue', (select coalesce(sum(paid_amount),0) from public.subscription_invoices where status = 'paid'),
    'pending_revenue', (select coalesce(sum(amount),0) from public.subscription_invoices where status in ('pending','overdue')),
    'plans_breakdown', (
      select jsonb_agg(jsonb_build_object('code', sp.code, 'name', sp.name, 'count', cnt))
      from (
        select s.plan_id, count(*) as cnt from public.subscriptions s group by s.plan_id
      ) c
      join public.subscription_plans sp on sp.id = c.plan_id
    )
  )
  where public.is_platform_admin();
$$;
grant execute on function public.platform_stats to authenticated;

-- ── SUSPEND / ACTIVATE INSTITUTION ──
create or replace function public.suspend_institution(p_institution_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin required';
  end if;
  update public.institutions
    set status = 'suspended', suspended_at = now(), suspended_reason = p_reason
    where id = p_institution_id;
end;
$$;

create or replace function public.reactivate_institution(p_institution_id uuid)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Platform admin required';
  end if;
  update public.institutions
    set status = 'active', suspended_at = null, suspended_reason = null
    where id = p_institution_id;
end;
$$;

grant execute on function public.suspend_institution to authenticated;
grant execute on function public.reactivate_institution to authenticated;
