alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.memberships enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;

create or replace function public.is_member_of(inst_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.memberships
    where institution_id = inst_id and user_id = auth.uid() and status = 'active');
$$;

create or replace function public.is_admin_of(inst_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists(select 1 from public.memberships
    where institution_id = inst_id and user_id = auth.uid() and role = 'admin');
$$;
