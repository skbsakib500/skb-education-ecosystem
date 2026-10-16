-- ============================================================
-- Phase 6: Finance + Analytics + Parent Links
-- ============================================================

-- Students: guardian email for parent auto-link
alter table public.students add column if not exists guardian_email text;
create index if not exists idx_students_guardian_email
  on public.students(institution_id, lower(guardian_email))
  where guardian_email is not null;

-- ── FEE STRUCTURES ──
create table if not exists public.fee_structures (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  name text not null,
  amount numeric not null default 0,
  frequency text not null default 'monthly'
    check (frequency in ('one_time','monthly','quarterly','yearly')),
  due_day int default 10,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_fee_structures_inst on public.fee_structures(institution_id, is_active);

-- ── FEE PAYMENTS ──
create table if not exists public.fee_payments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_id uuid references public.fee_structures(id) on delete set null,
  fee_name text,
  amount numeric not null default 0,
  paid_amount numeric not null default 0,
  status text not null default 'pending'
    check (status in ('pending','partial','paid','overdue','waived')),
  payment_method text
    check (payment_method is null or payment_method in ('cash','bkash','nagad','rocket','bank','card','other')),
  transaction_id text,
  month text,
  year int,
  due_date date,
  paid_date date,
  note text,
  recorded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_fee_payments_student on public.fee_payments(student_id, status);
create index if not exists idx_fee_payments_inst on public.fee_payments(institution_id, status);

-- ── PARENT LINKS ──
create table if not exists public.parent_student_links (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  institution_id uuid not null references public.institutions(id) on delete cascade,
  relationship text default 'guardian'
    check (relationship in ('father','mother','guardian','other')),
  created_at timestamptz default now(),
  unique (parent_user_id, student_id)
);
create index if not exists idx_parent_links_parent on public.parent_student_links(parent_user_id);

-- ── RLS ──
alter table public.fee_structures enable row level security;
alter table public.fee_payments enable row level security;
alter table public.parent_student_links enable row level security;

drop policy if exists "fee_structures_read" on public.fee_structures;
drop policy if exists "fee_structures_admin" on public.fee_structures;
create policy "fee_structures_read" on public.fee_structures
  for select to authenticated using (public.is_member_of(institution_id));
create policy "fee_structures_admin" on public.fee_structures
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

drop policy if exists "fee_payments_read" on public.fee_payments;
drop policy if exists "fee_payments_admin" on public.fee_payments;
create policy "fee_payments_read" on public.fee_payments
  for select to authenticated using (public.is_member_of(institution_id));
create policy "fee_payments_admin" on public.fee_payments
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

drop policy if exists "parent_links_own" on public.parent_student_links;
drop policy if exists "parent_links_admin" on public.parent_student_links;
create policy "parent_links_own" on public.parent_student_links
  for select to authenticated using (parent_user_id = auth.uid());
create policy "parent_links_admin" on public.parent_student_links
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ── UPDATE accept_invitation to auto-link parents ──
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
  v_link_count int := 0;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select email into v_user_email from auth.users where id = v_user_id;

  select * into v_inv from public.invitations
    where token = p_token and status = 'pending' and expires_at > now()
    limit 1;

  if v_inv is null then
    raise exception 'Invalid or expired invitation';
  end if;

  if lower(v_user_email) <> lower(v_inv.email) then
    raise exception 'This invitation is for %', v_inv.email;
  end if;

  if exists (
    select 1 from public.memberships
    where institution_id = v_inv.institution_id
      and user_id = v_user_id and role = v_inv.role
  ) then
    update public.invitations set status = 'accepted' where id = v_inv.id;
    return jsonb_build_object('already_member', true, 'institution_id', v_inv.institution_id);
  end if;

  insert into public.memberships (institution_id, user_id, role)
  values (v_inv.institution_id, v_user_id, v_inv.role);

  -- Student: link to student record by email
  if v_inv.role = 'student' then
    update public.students
      set linked_user_id = v_user_id
      where institution_id = v_inv.institution_id
        and lower(email) = lower(v_user_email)
        and linked_user_id is null;
  end if;

  -- Parent: link to students whose guardian_email matches
  if v_inv.role = 'parent' then
    insert into public.parent_student_links (parent_user_id, student_id, institution_id, relationship)
    select v_user_id, s.id, v_inv.institution_id, 'guardian'
    from public.students s
    where s.institution_id = v_inv.institution_id
      and lower(s.guardian_email) = lower(v_user_email)
    on conflict (parent_user_id, student_id) do nothing;

    get diagnostics v_link_count = row_count;
  end if;

  update public.invitations set status = 'accepted' where id = v_inv.id;

  return jsonb_build_object(
    'success', true,
    'institution_id', v_inv.institution_id,
    'role', v_inv.role,
    'linked_children', v_link_count
  );
end;
$$;

grant execute on function public.accept_invitation to authenticated;

-- ── ANALYTICS FUNCTIONS ──
create or replace function public.institution_dashboard_stats(p_institution_id uuid)
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'classes',           (select count(*) from public.classes where institution_id = p_institution_id),
    'students',          (select count(*) from public.students where institution_id = p_institution_id),
    'teachers',          (select count(*) from public.memberships where institution_id = p_institution_id and role = 'teacher'),
    'exams',             (select count(*) from public.exams where institution_id = p_institution_id),
    'attempts',          (select count(*) from public.exam_attempts where institution_id = p_institution_id),
    'attendance_today',  (select count(*) from public.attendance where institution_id = p_institution_id and date = current_date),
    'fees_collected',    (select coalesce(sum(paid_amount),0) from public.fee_payments where institution_id = p_institution_id and status in ('paid','partial')),
    'fees_pending',      (select coalesce(sum(amount - paid_amount),0) from public.fee_payments where institution_id = p_institution_id and status in ('pending','partial','overdue'))
  );
$$;

create or replace function public.finance_summary(p_institution_id uuid)
returns table (
  total_students bigint,
  total_expected numeric,
  total_collected numeric,
  total_pending numeric,
  paid_count bigint,
  pending_count bigint,
  overdue_count bigint
)
language sql security definer stable set search_path = public as $$
  select
    (select count(distinct student_id) from public.fee_payments where institution_id = p_institution_id),
    coalesce((select sum(amount) from public.fee_payments where institution_id = p_institution_id and status <> 'waived'), 0),
    coalesce((select sum(paid_amount) from public.fee_payments where institution_id = p_institution_id), 0),
    coalesce((select sum(amount - paid_amount) from public.fee_payments where institution_id = p_institution_id and status in ('pending','partial','overdue')), 0),
    (select count(*) from public.fee_payments where institution_id = p_institution_id and status = 'paid'),
    (select count(*) from public.fee_payments where institution_id = p_institution_id and status in ('pending','partial')),
    (select count(*) from public.fee_payments where institution_id = p_institution_id and status = 'overdue');
$$;

grant execute on function public.institution_dashboard_stats to authenticated;
grant execute on function public.finance_summary to authenticated;
