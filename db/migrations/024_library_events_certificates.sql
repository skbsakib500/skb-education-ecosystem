-- ============================================================
-- Migration 024: Library + Events + Certificates
-- ============================================================

-- ── LIBRARY ──
create table if not exists public.library_books (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  author text,
  isbn text,
  category text default 'general',
  publisher text,
  edition text,
  language text default 'Bangla',
  total_copies int default 1,
  available_copies int default 1,
  shelf text,
  cover_url text,
  description text,
  is_active boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_books_inst on public.library_books(institution_id, created_at desc);
create index if not exists idx_books_category on public.library_books(institution_id, category);

create table if not exists public.library_issues (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  book_id uuid not null references public.library_books(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  borrower_user_id uuid references auth.users(id) on delete set null,
  issued_by uuid references auth.users(id) on delete set null,
  issued_at timestamptz default now(),
  due_date date not null,
  returned_at timestamptz,
  status text default 'issued' check (status in ('issued','returned','overdue','lost')),
  fine_amount numeric default 0,
  fine_paid boolean default false,
  notes text
);
create index if not exists idx_issues_inst on public.library_issues(institution_id, status);
create index if not exists idx_issues_student on public.library_issues(student_id, status);

-- ── EVENTS ──
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  title text not null,
  title_bn text,
  description text,
  event_type text default 'general'
    check (event_type in ('general','exam','holiday','sports','cultural','meeting','ptm','result','other')),
  start_at timestamptz not null,
  end_at timestamptz,
  venue text,
  class_ids jsonb default '[]'::jsonb,
  audience text default 'all' check (audience in ('all','teachers','students','parents','class')),
  cover_url text,
  is_public boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_events_inst on public.events(institution_id, start_at);

create table if not exists public.event_rsvps (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  response text default 'going' check (response in ('going','maybe','not_going')),
  created_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- ── CERTIFICATES ──
create table if not exists public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  name text not null,
  type text default 'achievement'
    check (type in ('achievement','completion','participation','excellence','attendance','sports','custom')),
  body_template text not null,
  signature_names jsonb default '[]'::jsonb,
  background_color text default '#ffffff',
  border_color text default '#10b981',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institutions(id) on delete cascade,
  template_id uuid references public.certificate_templates(id) on delete set null,
  recipient_name text not null,
  recipient_user_id uuid references auth.users(id) on delete set null,
  student_id uuid references public.students(id) on delete set null,
  certificate_type text default 'achievement',
  title text not null,
  description text,
  issued_date date default current_date,
  certificate_no text unique,
  issued_by uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_certs_inst on public.certificates(institution_id, created_at desc);
create index if not exists idx_certs_recipient on public.certificates(recipient_user_id);

-- ── RLS ──
alter table public.library_books enable row level security;
alter table public.library_issues enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificates enable row level security;

-- Books
drop policy if exists "books_read" on public.library_books;
drop policy if exists "books_admin" on public.library_books;
create policy "books_read" on public.library_books for select to authenticated using (public.is_member_of(institution_id));
create policy "books_admin" on public.library_books for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Issues
drop policy if exists "issues_read" on public.library_issues;
drop policy if exists "issues_admin" on public.library_issues;
create policy "issues_read" on public.library_issues for select to authenticated
  using (public.is_member_of(institution_id) or borrower_user_id = auth.uid());
create policy "issues_admin" on public.library_issues for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Events
drop policy if exists "events_read" on public.events;
drop policy if exists "events_admin" on public.events;
create policy "events_read" on public.events for select to authenticated using (is_public = true or public.is_member_of(institution_id));
create policy "events_admin" on public.events for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

drop policy if exists "rsvp_own" on public.event_rsvps;
create policy "rsvp_own" on public.event_rsvps for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Templates
drop policy if exists "tpl_read" on public.certificate_templates;
drop policy if exists "tpl_admin" on public.certificate_templates;
create policy "tpl_read" on public.certificate_templates for select to authenticated using (public.is_member_of(institution_id));
create policy "tpl_admin" on public.certificate_templates for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- Certificates
drop policy if exists "cert_read" on public.certificates;
drop policy if exists "cert_admin" on public.certificates;
create policy "cert_read" on public.certificates for select to authenticated
  using (public.is_member_of(institution_id) or recipient_user_id = auth.uid());
create policy "cert_admin" on public.certificates for all to authenticated
  using (public.is_admin_of(institution_id)) with check (public.is_admin_of(institution_id));

-- ── AUTO FUNCTIONS ──

-- Auto-update book availability on issue/return
create or replace function public.sync_book_availability()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' and new.status = 'issued' then
    update public.library_books set available_copies = greatest(available_copies - 1, 0) where id = new.book_id;
  elsif tg_op = 'UPDATE' then
    if old.status = 'issued' and new.status = 'returned' then
      update public.library_books set available_copies = available_copies + 1 where id = new.book_id;
    elsif old.status = 'returned' and new.status = 'issued' then
      update public.library_books set available_copies = greatest(available_copies - 1, 0) where id = new.book_id;
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists trg_book_avail on public.library_issues;
create trigger trg_book_avail after insert or update on public.library_issues
  for each row execute function public.sync_book_availability();

-- Auto-generate certificate number
create or replace function public.gen_certificate_no()
returns trigger language plpgsql security definer as $$
declare
  v_prefix text;
begin
  if new.certificate_no is null or new.certificate_no = '' then
    select coalesce(substring(slug from 1 for 3), 'SKB') into v_prefix from public.institutions where id = new.institution_id;
    new.certificate_no := upper(v_prefix) || '-CERT-' || to_char(now(), 'YYMMDD') || '-' || substr(new.id::text, 1, 6);
  end if;
  return new;
end;
$$;
drop trigger if exists trg_cert_no on public.certificates;
create trigger trg_cert_no before insert on public.certificates
  for each row execute function public.gen_certificate_no();

-- Certificate issue helper (batch for class)
create or replace function public.issue_class_certificates(
  p_institution_id uuid,
  p_class_id uuid,
  p_certificate_type text,
  p_title text,
  p_description text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_count int := 0;
  v_user uuid := auth.uid();
  v_student record;
begin
  if v_user is null then raise exception 'Auth required'; end if;
  if not public.is_admin_of(p_institution_id) then raise exception 'Admin required'; end if;

  for v_student in
    select id, full_name, linked_user_id from public.students
    where institution_id = p_institution_id and class_id = p_class_id
  loop
    insert into public.certificates (
      institution_id, recipient_name, recipient_user_id, student_id,
      certificate_type, title, description, issued_by
    ) values (
      p_institution_id, v_student.full_name, v_student.linked_user_id, v_student.id,
      p_certificate_type, p_title, p_description, v_user
    );
    v_count := v_count + 1;
  end loop;

  return jsonb_build_object('issued', v_count);
end;
$$;
grant execute on function public.issue_class_certificates to authenticated;

-- Library stats
create or replace function public.library_stats(p_institution_id uuid)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'total_books', (select count(*) from public.library_books where institution_id = p_institution_id),
    'total_copies', (select coalesce(sum(total_copies), 0) from public.library_books where institution_id = p_institution_id),
    'available_copies', (select coalesce(sum(available_copies), 0) from public.library_books where institution_id = p_institution_id),
    'issued_now', (select count(*) from public.library_issues where institution_id = p_institution_id and status = 'issued'),
    'overdue', (select count(*) from public.library_issues where institution_id = p_institution_id and status = 'issued' and due_date < current_date),
    'returned_this_month', (select count(*) from public.library_issues where institution_id = p_institution_id and status = 'returned' and returned_at >= date_trunc('month', current_date))
  );
$$;
grant execute on function public.library_stats to authenticated;

-- Search books
create or replace function public.search_books(p_institution_id uuid, p_query text default '', p_category text default null, p_limit int default 50)
returns table (id uuid, title text, author text, isbn text, category text, language text, total_copies int, available_copies int, shelf text, cover_url text)
language sql security definer stable set search_path = public as $$
  select id, title, author, isbn, category, language, total_copies, available_copies, shelf, cover_url
  from public.library_books
  where institution_id = p_institution_id and is_active = true
    and (p_category is null or category = p_category)
    and (p_query = '' or lower(title) like '%' || lower(p_query) || '%' or lower(coalesce(author,'')) like '%' || lower(p_query) || '%' or lower(coalesce(isbn,'')) like '%' || lower(p_query) || '%')
  order by title
  limit p_limit;
$$;
grant execute on function public.search_books to authenticated;

-- Upcoming events for institution
create or replace function public.upcoming_events(p_institution_id uuid, p_limit int default 10)
returns table (id uuid, title text, title_bn text, event_type text, start_at timestamptz, end_at timestamptz, venue text, cover_url text, rsvp_count bigint)
language sql security definer stable set search_path = public as $$
  select e.id, e.title, e.title_bn, e.event_type, e.start_at, e.end_at, e.venue, e.cover_url,
    (select count(*) from public.event_rsvps where event_id = e.id and response = 'going')
  from public.events e
  where e.institution_id = p_institution_id and e.start_at >= now() - interval '1 day'
    and (e.is_public = true or public.is_member_of(e.institution_id))
  order by e.start_at asc limit p_limit;
$$;
grant execute on function public.upcoming_events to authenticated;
