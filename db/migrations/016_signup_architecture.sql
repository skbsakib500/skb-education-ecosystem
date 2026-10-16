-- ============================================================
-- Migration 016: Complete Signup Architecture (FIXED)
-- ============================================================

-- Enable pg_trgm for fuzzy search
create extension if not exists pg_trgm;

-- Extend profiles
alter table public.profiles add column if not exists primary_role text;
alter table public.profiles add column if not exists sub_role text;
alter table public.profiles add column if not exists onboarding_complete boolean default false;
alter table public.profiles add column if not exists interests jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists preferences jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists phone_verified boolean default false;

-- user_intents
create table if not exists public.user_intents (
  user_id uuid primary key references auth.users(id) on delete cascade,
  intended_role text,
  sub_role text,
  signup_step int default 1,
  completed boolean default false,
  extra_data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.user_intents enable row level security;
drop policy if exists "intents_own" on public.user_intents;
create policy "intents_own" on public.user_intents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- institution_requests
create table if not exists public.institution_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  name_bn text,
  type text not null default 'school',
  division text,
  district text,
  city text,
  education_board text,
  contact_email text,
  contact_phone text,
  description text,
  requested_role text default 'admin',
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','claimed')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  institution_id uuid references public.institutions(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_inst_req_status on public.institution_requests(status, created_at);

alter table public.institution_requests enable row level security;
drop policy if exists "inst_req_own_read" on public.institution_requests;
drop policy if exists "inst_req_own_create" on public.institution_requests;
drop policy if exists "inst_req_admin_all" on public.institution_requests;

create policy "inst_req_own_read" on public.institution_requests
  for select to authenticated using (requested_by = auth.uid() or public.is_platform_admin());
create policy "inst_req_own_create" on public.institution_requests
  for insert to authenticated with check (requested_by = auth.uid());
create policy "inst_req_admin_all" on public.institution_requests
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

-- institution_claims
create table if not exists public.institution_claims (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  claimed_by uuid not null references auth.users(id) on delete cascade,
  evidence text,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now()
);
create index if not exists idx_claims_status on public.institution_claims(status);

alter table public.institution_claims enable row level security;
drop policy if exists "claims_own" on public.institution_claims;
drop policy if exists "claims_admin" on public.institution_claims;
create policy "claims_own" on public.institution_claims
  for select to authenticated using (claimed_by = auth.uid() or public.is_platform_admin());
create policy "claims_admin" on public.institution_claims
  for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin());

-- join_requests
create table if not exists public.join_requests (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  requested_role text not null
    check (requested_role in ('teacher','student','parent','accountant','librarian','receptionist')),
  metadata jsonb default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz default now(),
  unique (institution_id, user_id, requested_role)
);
create index if not exists idx_join_req_inst on public.join_requests(institution_id, status);
create index if not exists idx_join_req_user on public.join_requests(user_id, status);

alter table public.join_requests enable row level security;
drop policy if exists "join_req_own" on public.join_requests;
drop policy if exists "join_req_create" on public.join_requests;
drop policy if exists "join_req_admin" on public.join_requests;

create policy "join_req_own" on public.join_requests
  for select to authenticated using (user_id = auth.uid() or public.is_admin_of(institution_id) or public.is_platform_admin());
create policy "join_req_create" on public.join_requests
  for insert to authenticated with check (user_id = auth.uid());
create policy "join_req_admin" on public.join_requests
  for all to authenticated using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- ── FUZZY SEARCH FUNCTION (FIXED with similarity from pg_trgm) ──
drop function if exists public.search_institutions_fuzzy(text, text, int);

create or replace function public.search_institutions_fuzzy(
  p_query text,
  p_division text default null,
  p_limit int default 10
)
returns table (
  id uuid,
  name text,
  slug text,
  type text,
  emoji text,
  logo_url text,
  division text,
  district text,
  city text,
  student_count bigint,
  match_score int
)
language sql security definer stable set search_path = public, extensions as $$
  with normalized as (
    select
      i.id, i.name, i.slug, i.type, i.emoji, i.logo_url,
      i.division, i.city,
      (select count(*) from public.students s where s.institution_id = i.id) as student_count,
      case
        when lower(i.name) = lower(p_query) then 100
        when lower(i.name) like lower(p_query) || '%' then 90
        when lower(i.name) like '%' || lower(p_query) || '%' then 75
        when lower(i.slug) like lower(p_query) || '%' then 85
        when similarity(p_query, i.name) > 0.3 then 50 + (similarity(p_query, i.name) * 40)::int
        else 0
      end as match_score
    from public.institutions i
    where i.status = 'active'
      and (p_division is null or i.division = p_division)
      and (
        lower(i.name) like '%' || lower(p_query) || '%'
        or lower(i.slug) like '%' || lower(p_query) || '%'
        or similarity(p_query, i.name) > 0.2
      )
  )
  select id, name, slug, type, emoji, logo_url, division, null::text as district, city, student_count, match_score
  from normalized
  where match_score > 0
  order by match_score desc, student_count desc
  limit p_limit;
$$;
grant execute on function public.search_institutions_fuzzy to authenticated;

-- ── REMAINING FUNCTIONS ──

-- Record user intent
create or replace function public.record_user_intent(
  p_intended_role text,
  p_sub_role text default null,
  p_step int default 1,
  p_extra jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  insert into public.user_intents (user_id, intended_role, sub_role, signup_step, extra_data)
  values (auth.uid(), p_intended_role, p_sub_role, p_step, p_extra)
  on conflict (user_id) do update set
    intended_role = excluded.intended_role,
    sub_role = excluded.sub_role,
    signup_step = excluded.signup_step,
    extra_data = excluded.extra_data,
    updated_at = now();
end;
$$;
grant execute on function public.record_user_intent to authenticated;

-- Request institution creation
create or replace function public.request_institution(
  p_name text,
  p_type text,
  p_division text,
  p_district text,
  p_city text,
  p_education_board text,
  p_contact_email text,
  p_contact_phone text,
  p_description text
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  if length(trim(p_name)) < 2 then raise exception 'Name too short'; end if;

  insert into public.institution_requests (
    requested_by, name, type, division, district, city,
    education_board, contact_email, contact_phone, description
  ) values (
    auth.uid(), trim(p_name), p_type, p_division, p_district, p_city,
    p_education_board, p_contact_email, p_contact_phone, p_description
  ) returning id into v_id;

  return jsonb_build_object('request_id', v_id, 'status', 'pending');
end;
$$;
grant execute on function public.request_institution to authenticated;

-- Approve institution request
create or replace function public.approve_institution_request(
  p_request_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_req record;
  v_inst_id uuid;
  v_slug text;
  v_base_slug text;
  v_counter int := 0;
begin
  if not public.is_platform_admin() then raise exception 'Platform admin required'; end if;

  select * into v_req from public.institution_requests where id = p_request_id;
  if v_req is null then raise exception 'Request not found'; end if;
  if v_req.status <> 'pending' then raise exception 'Already processed'; end if;

  v_base_slug := lower(regexp_replace(v_req.name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_base_slug := trim(both '-' from v_base_slug);
  v_slug := v_base_slug;
  while exists (select 1 from public.institutions where slug = v_slug) loop
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  end loop;

  insert into public.institutions (
    name, slug, type, division, city, education_board,
    contact_email, contact_phone, description,
    owner_email, status
  ) values (
    v_req.name, v_slug, v_req.type, v_req.division, v_req.city,
    v_req.education_board, v_req.contact_email, v_req.contact_phone,
    v_req.description,
    (select email from auth.users where id = v_req.requested_by),
    'active'
  ) returning id into v_inst_id;

  insert into public.memberships (institution_id, user_id, role)
  values (v_inst_id, v_req.requested_by, 'admin')
  on conflict do nothing;

  update public.institution_requests
    set status = 'approved', institution_id = v_inst_id,
        reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
    where id = p_request_id;

  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  values (v_inst_id, v_req.requested_by, '🎉 Institution approved!',
    v_req.name || ' অনুমোদিত হয়েছে। এখন admin হিসেবে কাজ শুরু করুন।', 'general');

  return jsonb_build_object('institution_id', v_inst_id, 'slug', v_slug, 'status', 'approved');
end;
$$;
grant execute on function public.approve_institution_request to authenticated;

-- Reject institution request
create or replace function public.reject_institution_request(
  p_request_id uuid,
  p_reason text
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  if not public.is_platform_admin() then raise exception 'Platform admin required'; end if;
  select * into v_req from public.institution_requests where id = p_request_id;
  if v_req is null then raise exception 'Not found'; end if;

  update public.institution_requests
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_reason
    where id = p_request_id;

  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  values (null, v_req.requested_by, 'Institution request update',
    'আপনার request টি অনুমোদিত হয়নি: ' || p_reason, 'general');
end;
$$;
grant execute on function public.reject_institution_request to authenticated;

-- Request to join
create or replace function public.request_to_join(
  p_institution_id uuid,
  p_role text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
  v_inst record;
  v_admin_ids uuid[];
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  if exists (select 1 from public.memberships where institution_id = p_institution_id and user_id = auth.uid() and role = p_role) then
    return jsonb_build_object('status', 'already_member');
  end if;

  if exists (select 1 from public.join_requests where institution_id = p_institution_id and user_id = auth.uid() and requested_role = p_role and status = 'pending') then
    return jsonb_build_object('status', 'already_pending');
  end if;

  select * into v_inst from public.institutions where id = p_institution_id;
  if v_inst is null then raise exception 'Institution not found'; end if;

  insert into public.join_requests (institution_id, user_id, requested_role, metadata)
  values (p_institution_id, auth.uid(), p_role, p_metadata)
  returning id into v_id;

  select array_agg(user_id) into v_admin_ids
  from public.memberships where institution_id = p_institution_id and role = 'admin';

  if v_admin_ids is not null then
    insert into public.notifications (institution_id, recipient_user_id, title, body, category)
    select p_institution_id, unnest(v_admin_ids),
      'New ' || p_role || ' join request',
      coalesce((select full_name from public.profiles where id = auth.uid()), 'A user') || ' wants to join as ' || p_role,
      'general';
  end if;

  return jsonb_build_object('request_id', v_id, 'status', 'pending');
end;
$$;
grant execute on function public.request_to_join to authenticated;

-- Approve join request
create or replace function public.approve_join_request(
  p_request_id uuid,
  p_notes text default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  select * into v_req from public.join_requests where id = p_request_id;
  if v_req is null then raise exception 'Not found'; end if;
  if not public.is_admin_of(v_req.institution_id) then raise exception 'Admin required'; end if;
  if v_req.status <> 'pending' then raise exception 'Already processed'; end if;

  insert into public.memberships (institution_id, user_id, role)
  values (v_req.institution_id, v_req.user_id, v_req.requested_role)
  on conflict do nothing;

  if v_req.requested_role = 'student' then
    update public.students set linked_user_id = v_req.user_id
    where institution_id = v_req.institution_id
      and lower(email) = (select lower(email) from auth.users where id = v_req.user_id)
      and linked_user_id is null;
  end if;

  if v_req.requested_role = 'parent' then
    insert into public.parent_student_links (parent_user_id, student_id, institution_id, relationship)
    select v_req.user_id, s.id, v_req.institution_id, 'guardian'
    from public.students s
    where s.institution_id = v_req.institution_id
      and lower(s.guardian_email) = (select lower(email) from auth.users where id = v_req.user_id)
    on conflict do nothing;
  end if;

  update public.join_requests
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_notes
    where id = p_request_id;

  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  values (v_req.institution_id, v_req.user_id, '✅ Request approved!',
    'আপনার ' || v_req.requested_role || ' হিসেবে যুক্ত হওয়ার request অনুমোদিত হয়েছে।', 'general');

  return jsonb_build_object('status', 'approved');
end;
$$;
grant execute on function public.approve_join_request to authenticated;

-- Reject join request
create or replace function public.reject_join_request(
  p_request_id uuid,
  p_reason text
)
returns void
language plpgsql security definer set search_path = public as $$
declare v_req record;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  select * into v_req from public.join_requests where id = p_request_id;
  if v_req is null then raise exception 'Not found'; end if;
  if not public.is_admin_of(v_req.institution_id) then raise exception 'Admin required'; end if;

  update public.join_requests
    set status = 'rejected', reviewed_by = auth.uid(), reviewed_at = now(), review_notes = p_reason
    where id = p_request_id;

  insert into public.notifications (institution_id, recipient_user_id, title, body, category)
  values (v_req.institution_id, v_req.user_id, 'Join request update',
    'আপনার request টি অনুমোদিত হয়নি: ' || p_reason, 'general');
end;
$$;
grant execute on function public.reject_join_request to authenticated;

-- Complete onboarding
create or replace function public.complete_onboarding(
  p_primary_role text,
  p_sub_role text default null,
  p_interests jsonb default '[]'::jsonb,
  p_preferences jsonb default '{}'::jsonb
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  update public.profiles
    set primary_role = p_primary_role, sub_role = p_sub_role,
        interests = p_interests, preferences = p_preferences,
        onboarding_complete = true
    where id = auth.uid();

  update public.user_intents set completed = true, updated_at = now() where user_id = auth.uid();
end;
$$;
grant execute on function public.complete_onboarding to authenticated;

-- My pending requests
create or replace function public.my_pending_requests()
returns table (
  request_type text,
  id uuid,
  institution_name text,
  role_or_status text,
  created_at timestamptz
)
language sql security definer stable set search_path = public as $$
  select 'join'::text, jr.id, i.name, jr.requested_role, jr.created_at
  from public.join_requests jr
  join public.institutions i on i.id = jr.institution_id
  where jr.user_id = auth.uid() and jr.status = 'pending'
  union all
  select 'institution'::text, ir.id, ir.name, ir.status, ir.created_at
  from public.institution_requests ir
  where ir.requested_by = auth.uid() and ir.status = 'pending'
  order by created_at desc;
$$;
grant execute on function public.my_pending_requests to authenticated;
