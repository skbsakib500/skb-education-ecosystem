-- ============================================================
-- Phase 7: Timetable + Teacher assignments + Report Cards
-- ============================================================

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  code text,
  class_id uuid references public.classes(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_subjects_inst on public.subjects(institution_id);
create index if not exists idx_subjects_teacher on public.subjects(teacher_id);

-- Timetable slots
create table if not exists public.timetable_slots (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  subject_id uuid references public.subjects(id) on delete set null,
  day_of_week int not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  room text,
  teacher_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_timetable_class on public.timetable_slots(class_id, day_of_week);

-- Class teachers
create table if not exists public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  is_primary boolean default false,
  created_at timestamptz default now(),
  unique (class_id, teacher_id)
);

-- RLS
alter table public.subjects enable row level security;
alter table public.timetable_slots enable row level security;
alter table public.class_teachers enable row level security;

drop policy if exists "subjects_read" on public.subjects;
drop policy if exists "subjects_admin" on public.subjects;
create policy "subjects_read" on public.subjects for select to authenticated using (public.is_member_of(institution_id));
create policy "subjects_admin" on public.subjects for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "timetable_read" on public.timetable_slots;
drop policy if exists "timetable_admin" on public.timetable_slots;
create policy "timetable_read" on public.timetable_slots for select to authenticated using (public.is_member_of(institution_id));
create policy "timetable_admin" on public.timetable_slots for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "class_teachers_read" on public.class_teachers;
drop policy if exists "class_teachers_admin" on public.class_teachers;
create policy "class_teachers_read" on public.class_teachers for select to authenticated using (public.is_member_of(institution_id));
create policy "class_teachers_admin" on public.class_teachers for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Teacher's classes helper (FIXED: subquery for ORDER BY)
drop function if exists public.teacher_classes(uuid, uuid);

create or replace function public.teacher_classes(p_institution_id uuid, p_teacher_id uuid)
returns table (class_id uuid, class_name text, section text, is_primary boolean)
language sql security definer stable set search_path = public as $$
  select * from (
    select c.id as class_id, c.name as class_name, c.section, ct.is_primary
    from public.classes c
    join public.class_teachers ct on ct.class_id = c.id
    where c.institution_id = p_institution_id and ct.teacher_id = p_teacher_id
    union
    select distinct c.id, c.name, c.section, false
    from public.classes c
    join public.timetable_slots ts on ts.class_id = c.id
    where c.institution_id = p_institution_id and ts.teacher_id = p_teacher_id
  ) t
  order by t.class_name, t.section;
$$;

grant execute on function public.teacher_classes to authenticated;
