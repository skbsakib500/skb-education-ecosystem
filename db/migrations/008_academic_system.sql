-- ============================================================
-- SKB Education — Academic System + Class Roles
-- ============================================================

-- Institutions: Academic structure fields
alter table public.institutions add column if not exists academic_stream text default 'general'
  check (academic_stream in ('general','madrasah','technical','higher_ed'));

alter table public.institutions add column if not exists academic_term text default 'annual'
  check (academic_term in ('annual','semester','trimester'));

alter table public.institutions add column if not exists level_label text default 'Class';

alter table public.institutions add column if not exists levels jsonb default '[]'::jsonb;

-- Students: class role (for captain / assistant captain) + roll
alter table public.students add column if not exists class_role text default 'student'
  check (class_role in ('student','captain','assistant_captain','prefect','monitor'));

-- Students: académic id (universal student ID)
alter table public.students add column if not exists student_id text;

-- Unique student_id per institution
create unique index if not exists idx_students_inst_student_id
  on public.students(institution_id, student_id)
  where student_id is not null;

-- Classes: level from institutions.levels
alter table public.classes add column if not exists level_key text;
alter table public.classes add column if not exists capacity int default 0;

-- Auto student_id generation
create or replace function public.generate_student_id(p_institution_id uuid, p_seq int default null)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next int;
  v_id text;
begin
  select coalesce(substring(slug from 1 for 3), 'STU') into v_prefix
  from public.institutions where id = p_institution_id;

  if p_seq is null then
    select coalesce(max(
      case when student_id ~ '^[A-Z0-9]+-[0-9]+$'
      then split_part(student_id, '-', 2)::int else 0 end
    ), 0) + 1 into v_next
    from public.students
    where institution_id = p_institution_id;
  else
    v_next := p_seq;
  end if;

  v_id := upper(v_prefix) || '-' || lpad(v_next::text, 5, '0');
  return v_id;
end;
$$;

-- Add student_id auto-fill trigger
create or replace function public.students_auto_id()
returns trigger language plpgsql security definer as $$
begin
  if new.student_id is null or length(new.student_id) = 0 then
    new.student_id := public.generate_student_id(new.institution_id);
  end if;
  return new;
end;
$$;

drop trigger if exists students_auto_id_trg on public.students;
create trigger students_auto_id_trg
  before insert on public.students
  for each row execute function public.students_auto_id();

-- Class role summary function
create or replace function public.class_roles_summary(p_class_id uuid)
returns table (
  role text,
  full_name text,
  student_id text
)
language sql security definer stable set search_path = public as $$
  select class_role, full_name, student_id
  from public.students
  where class_id = p_class_id
    and class_role in ('captain','assistant_captain','prefect','monitor')
  order by
    case class_role
      when 'captain' then 1
      when 'assistant_captain' then 2
      when 'prefect' then 3
      when 'monitor' then 4
      else 5
    end;
$$;
