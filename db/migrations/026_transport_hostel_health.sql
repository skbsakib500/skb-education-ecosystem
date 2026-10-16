-- ============================================================
-- Migration 026: Transport + Hostel + Health Records
-- ============================================================

-- ── TRANSPORT ──
create table if not exists public.transport_routes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  route_code text,
  start_point text,
  end_point text,
  distance_km numeric,
  monthly_fee numeric default 0,
  capacity int default 50,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_routes_inst on public.transport_routes(institution_id, is_active);

create table if not exists public.transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  route_id uuid references public.transport_routes(id) on delete set null,
  registration_no text not null,
  model text,
  capacity int default 50,
  driver_name text,
  driver_phone text,
  driver_license text,
  helper_name text,
  helper_phone text,
  insurance_expiry date,
  fitness_expiry date,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.transport_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.transport_routes(id) on delete cascade,
  name text not null,
  sequence int not null default 0,
  pickup_time time,
  drop_time time,
  landmark text,
  created_at timestamptz default now()
);
create index if not exists idx_stops_route on public.transport_stops(route_id, sequence);

create table if not exists public.transport_assignments (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  route_id uuid references public.transport_routes(id) on delete set null,
  stop_id uuid references public.transport_stops(id) on delete set null,
  vehicle_id uuid references public.transport_vehicles(id) on delete set null,
  direction text default 'both' check (direction in ('pickup','drop','both')),
  start_date date default current_date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique (student_id)
);

-- ── HOSTEL ──
create table if not exists public.hostel_blocks (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  gender text default 'mixed' check (gender in ('boys','girls','mixed')),
  total_rooms int default 0,
  warden_name text,
  warden_phone text,
  address text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  block_id uuid not null references public.hostel_blocks(id) on delete cascade,
  room_no text not null,
  floor int default 0,
  capacity int default 4,
  occupied int default 0,
  monthly_fee numeric default 0,
  room_type text default 'shared' check (room_type in ('single','double','triple','shared','dorm')),
  has_ac boolean default false,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_rooms_block on public.hostel_rooms(block_id, is_active);

create table if not exists public.hostel_allocations (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  room_id uuid not null references public.hostel_rooms(id) on delete cascade,
  bed_no text,
  start_date date default current_date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_alloc_room on public.hostel_allocations(room_id, is_active);
create index if not exists idx_alloc_student on public.hostel_allocations(student_id, is_active);

-- ── HEALTH RECORDS ──
create table if not exists public.student_health (
  student_id uuid primary key references public.students(id) on delete cascade,
  blood_group text,
  height_cm numeric,
  weight_kg numeric,
  allergies jsonb default '[]'::jsonb,
  chronic_conditions jsonb default '[]'::jsonb,
  medications jsonb default '[]'::jsonb,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  insurance_provider text,
  insurance_policy_no text,
  last_checkup_date date,
  notes text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.health_incidents (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  incident_type text default 'other'
    check (incident_type in ('injury','illness','fever','accident','allergy','emergency','other')),
  severity text default 'low' check (severity in ('low','medium','high','critical')),
  description text not null,
  treatment text,
  reported_by uuid references auth.users(id) on delete set null,
  incident_at timestamptz default now(),
  parent_notified boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_incidents_student on public.health_incidents(student_id, incident_at desc);

create table if not exists public.vaccinations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  vaccine_name text not null,
  dose_no int,
  administered_date date,
  next_due_date date,
  administered_by text,
  batch_no text,
  notes text,
  created_at timestamptz default now()
);
create index if not exists idx_vacc_student on public.vaccinations(student_id);

-- ── RLS ──
alter table public.transport_routes enable row level security;
alter table public.transport_vehicles enable row level security;
alter table public.transport_stops enable row level security;
alter table public.transport_assignments enable row level security;
alter table public.hostel_blocks enable row level security;
alter table public.hostel_rooms enable row level security;
alter table public.hostel_allocations enable row level security;
alter table public.student_health enable row level security;
alter table public.health_incidents enable row level security;
alter table public.vaccinations enable row level security;

-- Transport
drop policy if exists "tr_read" on public.transport_routes;
drop policy if exists "tr_admin" on public.transport_routes;
create policy "tr_read" on public.transport_routes for select to authenticated using (public.is_member_of(institution_id));
create policy "tr_admin" on public.transport_routes for all to authenticated using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "tv_read" on public.transport_vehicles;
drop policy if exists "tv_admin" on public.transport_vehicles;
create policy "tv_read" on public.transport_vehicles for select to authenticated using (public.is_member_of(institution_id));
create policy "tv_admin" on public.transport_vehicles for all to authenticated using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "ts_read" on public.transport_stops;
drop policy if exists "ts_admin" on public.transport_stops;
create policy "ts_read" on public.transport_stops for select to authenticated
  using (route_id in (select id from public.transport_routes where public.is_member_of(institution_id)));
create policy "ts_admin" on public.transport_stops for all to authenticated
  using (route_id in (select id from public.transport_routes where public.is_admin_of(institution_id)))
  with check (route_id in (select id from public.transport_routes where public.is_admin_of(institution_id)));

drop policy if exists "ta_read" on public.transport_assignments;
drop policy if exists "ta_admin" on public.transport_assignments;
create policy "ta_read" on public.transport_assignments for select to authenticated
  using (public.is_member_of(institution_id) or student_id in (select id from public.students where linked_user_id = auth.uid()));
create policy "ta_admin" on public.transport_assignments for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Hostel
drop policy if exists "hb_read" on public.hostel_blocks;
drop policy if exists "hb_admin" on public.hostel_blocks;
create policy "hb_read" on public.hostel_blocks for select to authenticated using (public.is_member_of(institution_id));
create policy "hb_admin" on public.hostel_blocks for all to authenticated using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "hr_read" on public.hostel_rooms;
drop policy if exists "hr_admin" on public.hostel_rooms;
create policy "hr_read" on public.hostel_rooms for select to authenticated
  using (block_id in (select id from public.hostel_blocks where public.is_member_of(institution_id)));
create policy "hr_admin" on public.hostel_rooms for all to authenticated
  using (block_id in (select id from public.hostel_blocks where public.is_admin_of(institution_id)))
  with check (block_id in (select id from public.hostel_blocks where public.is_admin_of(institution_id)));

drop policy if exists "ha_read" on public.hostel_allocations;
drop policy if exists "ha_admin" on public.hostel_allocations;
create policy "ha_read" on public.hostel_allocations for select to authenticated
  using (public.is_member_of(institution_id) or student_id in (select id from public.students where linked_user_id = auth.uid()));
create policy "ha_admin" on public.hostel_allocations for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Health
drop policy if exists "sh_read" on public.student_health;
drop policy if exists "sh_admin" on public.student_health;
create policy "sh_read" on public.student_health for select to authenticated
  using (student_id in (select id from public.students where linked_user_id = auth.uid() or public.is_admin_of(institution_id)));
create policy "sh_admin" on public.student_health for all to authenticated
  using (student_id in (select id from public.students where public.is_admin_of(institution_id)))
  with check (student_id in (select id from public.students where public.is_admin_of(institution_id)));

drop policy if exists "hi_read" on public.health_incidents;
drop policy if exists "hi_admin" on public.health_incidents;
create policy "hi_read" on public.health_incidents for select to authenticated
  using (public.is_member_of(institution_id) or student_id in (select id from public.students where linked_user_id = auth.uid()));
create policy "hi_admin" on public.health_incidents for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "va_read" on public.vaccinations;
drop policy if exists "va_admin" on public.vaccinations;
create policy "va_read" on public.vaccinations for select to authenticated
  using (student_id in (select id from public.students where linked_user_id = auth.uid() or public.is_admin_of(institution_id)));
create policy "va_admin" on public.vaccinations for all to authenticated
  using (student_id in (select id from public.students where public.is_admin_of(institution_id)))
  with check (student_id in (select id from public.students where public.is_admin_of(institution_id)));

-- ── AUTO SYNC ROOM OCCUPANCY ──
create or replace function public.sync_room_occupancy()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' and new.is_active = true then
    update public.hostel_rooms set occupied = occupied + 1 where id = new.room_id;
  elsif tg_op = 'UPDATE' then
    if old.is_active and not new.is_active then
      update public.hostel_rooms set occupied = greatest(occupied - 1, 0) where id = old.room_id;
    elsif not old.is_active and new.is_active then
      update public.hostel_rooms set occupied = occupied + 1 where id = new.room_id;
    end if;
  elsif tg_op = 'DELETE' and old.is_active then
    update public.hostel_rooms set occupied = greatest(occupied - 1, 0) where id = old.room_id;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_room_occupancy on public.hostel_allocations;
create trigger trg_room_occupancy after insert or update or delete on public.hostel_allocations
  for each row execute function public.sync_room_occupancy();

-- ── HELPER FUNCTIONS ──
create or replace function public.transport_stats(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'total_routes', (select count(*) from public.transport_routes where institution_id = p_institution_id and is_active),
    'total_vehicles', (select count(*) from public.transport_vehicles where institution_id = p_institution_id and is_active),
    'total_students', (select count(*) from public.transport_assignments where institution_id = p_institution_id and is_active),
    'total_capacity', (select coalesce(sum(capacity), 0) from public.transport_vehicles where institution_id = p_institution_id and is_active)
  );
$$;
grant execute on function public.transport_stats to authenticated;

create or replace function public.hostel_stats(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'total_blocks', (select count(*) from public.hostel_blocks where institution_id = p_institution_id and is_active),
    'total_rooms', (select count(*) from public.hostel_rooms r join public.hostel_blocks b on b.id = r.block_id where b.institution_id = p_institution_id and r.is_active),
    'total_capacity', (select coalesce(sum(capacity), 0) from public.hostel_rooms r join public.hostel_blocks b on b.id = r.block_id where b.institution_id = p_institution_id and r.is_active),
    'occupied', (select coalesce(sum(occupied), 0) from public.hostel_rooms r join public.hostel_blocks b on b.id = r.block_id where b.institution_id = p_institution_id and r.is_active),
    'active_allocations', (select count(*) from public.hostel_allocations where institution_id = p_institution_id and is_active)
  );
$$;
grant execute on function public.hostel_stats to authenticated;

create or replace function public.health_stats(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'with_records', (select count(*) from public.student_health sh join public.students s on s.id = sh.student_id where s.institution_id = p_institution_id),
    'incidents_this_month', (select count(*) from public.health_incidents where institution_id = p_institution_id and incident_at >= date_trunc('month', current_date)),
    'critical_incidents', (select count(*) from public.health_incidents where institution_id = p_institution_id and severity in ('high','critical') and incident_at >= current_date - 30),
    'allergies_flagged', (select count(*) from public.student_health sh join public.students s on s.id = sh.student_id where s.institution_id = p_institution_id and jsonb_array_length(sh.allergies) > 0)
  );
$$;
grant execute on function public.health_stats to authenticated;
