create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null default 'school',
  status text not null default 'active',
  owner_email text not null,
  logo_url text, emoji text default '🏫',
  division text, city text, education_board text,
  contact_phone text, contact_email text,
  description text, motto text, established_year int,
  created_at timestamptz default now()
);
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, full_name text, avatar_url text,
  created_at timestamptz default now()
);
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','teacher','student','parent','accountant')),
  status text not null default 'active',
  created_at timestamptz default now(),
  unique (institution_id, user_id, role)
);
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null, section text,
  created_at timestamptz default now()
);
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  roll_number text, full_name text not null,
  created_at timestamptz default now()
);
