-- ============================================================
-- Migration 027: Online Payments + Receipts + Data Export
-- ============================================================

-- Payment transactions (gateway agnostic)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_payment_id uuid references public.fee_payments(id) on delete set null,
  amount numeric not null,
  currency text default 'BDT',
  gateway text not null check (gateway in ('bkash','nagad','rocket','sslcommerz','manual','bank','cash')),
  gateway_txn_id text,
  gateway_response jsonb default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','success','failed','cancelled','refunded')),
  paid_at timestamptz,
  failure_reason text,
  initiator_user_id uuid references auth.users(id) on delete set null,
  receipt_no text,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_txn_inst on public.payment_transactions(institution_id, status, created_at desc);
create index if not exists idx_txn_student on public.payment_transactions(student_id, created_at desc);
create index if not exists idx_txn_gateway on public.payment_transactions(gateway_txn_id) where gateway_txn_id is not null;

-- Fee categories (extend)
alter table public.fee_structures add column if not exists gateway_enabled boolean default true;
alter table public.fee_structures add column if not exists late_fee_percent numeric default 0;
alter table public.fee_structures add column if not exists late_fee_after_days int default 0;

-- Audit logs
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists idx_audit_inst on public.audit_logs(institution_id, created_at desc);
create index if not exists idx_audit_actor on public.audit_logs(actor_user_id, created_at desc);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);

-- Payment links (shareable)
create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  fee_payment_id uuid references public.fee_payments(id) on delete set null,
  amount numeric not null,
  token text not null unique default encode(gen_random_bytes(12), 'hex'),
  note text,
  status text default 'active' check (status in ('active','used','expired','cancelled')),
  expires_at timestamptz default (now() + interval '30 days'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_plink_token on public.payment_links(token);
create index if not exists idx_plink_student on public.payment_links(student_id);

-- RLS
alter table public.payment_transactions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.payment_links enable row level security;

drop policy if exists "txn_read" on public.payment_transactions;
drop policy if exists "txn_admin" on public.payment_transactions;
create policy "txn_read" on public.payment_transactions
  for select to authenticated
  using (public.is_admin_of(institution_id)
    or student_id in (select id from public.students where linked_user_id = auth.uid()));
create policy "txn_admin" on public.payment_transactions
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

drop policy if exists "audit_read" on public.audit_logs;
drop policy if exists "audit_admin" on public.audit_logs;
create policy "audit_read" on public.audit_logs
  for select to authenticated using (public.is_admin_of(institution_id));
create policy "audit_admin" on public.audit_logs
  for insert to authenticated with check (public.is_admin_of(institution_id));

drop policy if exists "plink_read" on public.payment_links;
drop policy if exists "plink_admin" on public.payment_links;
create policy "plink_read" on public.payment_links
  for select to authenticated
  using (public.is_admin_of(institution_id)
    or student_id in (select id from public.students where linked_user_id = auth.uid())
    or status = 'active');
create policy "plink_admin" on public.payment_links
  for all to authenticated
  using (public.is_admin_of(institution_id))
  with check (public.is_admin_of(institution_id));

-- ── FUNCTIONS ──

-- Generate receipt number + mark fee paid
create or replace function public.confirm_payment(
  p_txn_id uuid,
  p_gateway_txn_id text default null,
  p_response jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_txn record;
  v_receipt text;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  select * into v_txn from public.payment_transactions where id = p_txn_id;
  if v_txn is null then raise exception 'Transaction not found'; end if;

  if not (public.is_admin_of(v_txn.institution_id)
    or v_txn.student_id in (select id from public.students where linked_user_id = auth.uid())) then
    raise exception 'Access denied';
  end if;

  v_receipt := 'SKB-' || to_char(now(), 'YYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

  update public.payment_transactions set
    status = 'success',
    gateway_txn_id = coalesce(p_gateway_txn_id, gateway_txn_id),
    gateway_response = p_response,
    paid_at = now(),
    receipt_no = v_receipt,
    updated_at = now()
  where id = p_txn_id;

  if v_txn.fee_payment_id is not null then
    update public.fee_payments set
      paid_amount = paid_amount + v_txn.amount,
      status = case when paid_amount + v_txn.amount >= amount then 'paid' else 'partial' end,
      paid_date = current_date,
      payment_method = v_txn.gateway,
      transaction_id = v_receipt
    where id = v_txn.fee_payment_id;
  end if;

  -- Notify student + parent
  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  select v_txn.institution_id, s.linked_user_id,
    '✅ Payment received',
    '৳' || v_txn.amount || ' received via ' || v_txn.gateway || '. Receipt: ' || v_receipt,
    'fee'
  from public.students s
  where s.id = v_txn.student_id and s.linked_user_id is not null;

  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  select v_txn.institution_id, psl.parent_user_id,
    '✅ Payment received',
    'Fee payment of ৳' || v_txn.amount || ' confirmed. Receipt: ' || v_receipt,
    'fee'
  from public.parent_student_links psl
  where psl.student_id = v_txn.student_id;

  return jsonb_build_object('receipt_no', v_receipt, 'status', 'success');
end;
$$;
grant execute on function public.confirm_payment to authenticated;

-- Create payment link (shareable URL)
create or replace function public.create_payment_link(
  p_institution_id uuid,
  p_student_id uuid,
  p_fee_payment_id uuid,
  p_amount numeric,
  p_note text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_token text;
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  if not public.is_admin_of(p_institution_id) then raise exception 'Admin required'; end if;

  insert into public.payment_links (institution_id, student_id, fee_payment_id, amount, note, created_by)
  values (p_institution_id, p_student_id, p_fee_payment_id, p_amount, p_note, auth.uid())
  returning id, token into v_id, v_token;

  return jsonb_build_object('link_id', v_id, 'token', v_token,
    'url', 'https://skbsakib500.github.io/skb-education-ecosystem/pay/?token=' || v_token);
end;
$$;
grant execute on function public.create_payment_link to authenticated;

-- Bulk delete students helper
create or replace function public.bulk_delete_students(
  p_institution_id uuid,
  p_student_ids uuid[]
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count int := 0;
begin
  if not public.is_admin_of(p_institution_id) then raise exception 'Admin required'; end if;
  delete from public.students where institution_id = p_institution_id and id = any(p_student_ids);
  get diagnostics v_count = row_count;
  return jsonb_build_object('deleted', v_count);
end;
$$;
grant execute on function public.bulk_delete_students to authenticated;

-- Audit trigger helper
create or replace function public.log_audit(
  p_action text, p_entity_type text, p_entity_id uuid,
  p_old jsonb default null, p_new jsonb default null
)
returns void language plpgsql security definer set search_path = public as $$
declare v_inst uuid;
begin
  v_inst := coalesce(
    (p_new->>'institution_id')::uuid,
    (p_old->>'institution_id')::uuid
  );
  insert into public.audit_logs (institution_id, actor_user_id, action, entity_type, entity_id, old_data, new_data)
  values (v_inst, auth.uid(), p_action, p_entity_type, p_entity_id, p_old, p_new);
end;
$$;
grant execute on function public.log_audit to authenticated;

-- Fee summary report (for export)
create or replace function public.fee_collection_report(
  p_institution_id uuid, p_from date, p_to date
)
returns table (
  student_name text, student_code text, class_name text,
  fee_name text, month text, year int,
  amount numeric, paid numeric, due numeric, status text,
  payment_date date, method text, receipt text
)
language sql security definer stable set search_path = public as $$
  select s.full_name, s.student_id, c.name,
    fp.fee_name, fp.month, fp.year,
    fp.amount, fp.paid_amount, (fp.amount - fp.paid_amount),
    fp.status, fp.paid_date, fp.payment_method, fp.transaction_id
  from public.fee_payments fp
  join public.students s on s.id = fp.student_id
  left join public.classes c on c.id = s.class_id
  where fp.institution_id = p_institution_id
    and public.is_admin_of(p_institution_id)
    and (p_from is null or fp.created_at::date >= p_from)
    and (p_to is null or fp.created_at::date <= p_to)
  order by fp.created_at desc;
$$;
grant execute on function public.fee_collection_report to authenticated;

-- Attendance report for export
create or replace function public.attendance_export(
  p_institution_id uuid, p_class_id uuid, p_from date, p_to date
)
returns table (student_name text, student_code text, class_name text, date date, status text, note text)
language sql security definer stable set search_path = public as $$
  select s.full_name, s.student_id, c.name, a.date, a.status, a.note
  from public.attendance a
  join public.students s on s.id = a.student_id
  left join public.classes c on c.id = a.class_id
  where a.institution_id = p_institution_id
    and (p_class_id is null or a.class_id = p_class_id)
    and (p_from is null or a.date >= p_from)
    and (p_to is null or a.date <= p_to)
    and public.is_member_of(p_institution_id)
  order by a.date desc, s.full_name;
$$;
grant execute on function public.attendance_export to authenticated;

-- Auto-audit on fee_payment insert
create or replace function public.audit_fee_payment()
returns trigger language plpgsql security definer as $$
begin
  perform public.log_audit('insert', 'fee_payment', new.id, null, to_jsonb(new.*));
  return new;
end;
$$;
drop trigger if exists trg_audit_fee on public.fee_payments;
create trigger trg_audit_fee after insert on public.fee_payments
  for each row execute function public.audit_fee_payment();

create or replace function public.audit_student_insert()
returns trigger language plpgsql security definer as $$
begin
  perform public.log_audit('insert', 'student', new.id, null, to_jsonb(new.*));
  return new;
end;
$$;
drop trigger if exists trg_audit_student on public.students;
create trigger trg_audit_student after insert on public.students
  for each row execute function public.audit_student_insert();
