-- ============================================================
-- Migration 019: Marketplace + Knowledge Hub
-- ============================================================

-- ── TUTOR PROFILES ──
create table if not exists public.tutor_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  headline text,
  bio text,
  subjects jsonb default '[]'::jsonb,
  levels jsonb default '[]'::jsonb,
  languages jsonb default '["Bangla","English"]'::jsonb,
  hourly_rate_bdt numeric,
  negotiable boolean default true,
  mode text default 'both' check (mode in ('online','offline','both')),
  division text,
  city text,
  availability jsonb default '{}'::jsonb,
  experience_years int default 0,
  education text,
  is_active boolean default true,
  rating_avg numeric default 0,
  rating_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_tutors_active on public.tutor_profiles(is_active, rating_avg desc);
create index if not exists idx_tutors_subjects on public.tutor_profiles using gin(subjects);

-- ── TUTOR REQUESTS (parents/students looking for tutor) ──
create table if not exists public.tutor_requests (
  id uuid primary key default gen_random_uuid(),
  posted_by uuid not null references auth.users(id) on delete cascade,
  student_name text,
  class_level text,
  subjects jsonb default '[]'::jsonb,
  budget_min numeric,
  budget_max numeric,
  mode text default 'both' check (mode in ('online','offline','both')),
  division text,
  city text,
  preferred_time text,
  notes text,
  status text default 'open' check (status in ('open','closed','hired')),
  applications_count int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_tutor_requests_status on public.tutor_requests(status, created_at desc);

-- ── TUTOR APPLICATIONS ──
create table if not exists public.tutor_applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.tutor_requests(id) on delete cascade,
  tutor_user_id uuid not null references auth.users(id) on delete cascade,
  message text,
  proposed_rate numeric,
  status text default 'pending' check (status in ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz default now(),
  unique(request_id, tutor_user_id)
);

-- ── JOB POSTINGS (institutions hiring) ──
create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid references public.institutions(id) on delete cascade,
  posted_by uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  role_type text default 'teacher'
    check (role_type in ('teacher','tutor','admin','accountant','librarian','receptionist','other')),
  subjects jsonb default '[]'::jsonb,
  class_levels jsonb default '[]'::jsonb,
  employment_type text default 'full_time'
    check (employment_type in ('full_time','part_time','contract','internship')),
  experience_min int default 0,
  salary_min numeric,
  salary_max numeric,
  location text,
  division text,
  city text,
  application_deadline date,
  status text default 'open' check (status in ('draft','open','closed')),
  applications_count int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_jobs_status on public.job_postings(status, created_at desc);
create index if not exists idx_jobs_inst on public.job_postings(institution_id);

-- ── JOB APPLICATIONS ──
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.job_postings(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  cover_letter text,
  resume_url text,
  expected_salary numeric,
  status text default 'pending' check (status in ('pending','shortlisted','interviewed','accepted','rejected','withdrawn')),
  created_at timestamptz default now(),
  unique(job_id, applicant_id)
);

-- ── DISCUSSIONS (Quora-style) ──
create table if not exists public.discussions (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  topic text,
  tags jsonb default '[]'::jsonb,
  upvotes int default 0,
  answers_count int default 0,
  views int default 0,
  is_answered boolean default false,
  best_answer_id uuid,
  created_at timestamptz default now()
);
create index if not exists idx_disc_topic on public.discussions(topic, created_at desc);
create index if not exists idx_disc_hot on public.discussions(upvotes desc, answers_count desc);

-- ── DISCUSSION ANSWERS ──
create table if not exists public.discussion_answers (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  upvotes int default 0,
  is_best boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_disc_answers on public.discussion_answers(discussion_id, upvotes desc);

-- ── DISCUSSION VOTES ──
create table if not exists public.discussion_votes (
  user_id uuid not null references auth.users(id) on delete cascade,
  discussion_id uuid references public.discussions(id) on delete cascade,
  answer_id uuid references public.discussion_answers(id) on delete cascade,
  vote int not null check (vote in (1, -1)),
  created_at timestamptz default now(),
  check ((discussion_id is not null)::int + (answer_id is not null)::int = 1),
  unique(user_id, discussion_id, answer_id)
);

-- ── JOURNALS (Research/Study) ──
create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  institution_id uuid references public.institutions(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  cover_url text,
  category text default 'general'
    check (category in ('general','research','student','faculty','literary','science','arts')),
  is_public boolean default true,
  members_count int default 0,
  articles_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.journal_articles (
  id uuid primary key default gen_random_uuid(),
  journal_id uuid not null references public.journals(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  abstract text,
  content text,
  pdf_url text,
  tags jsonb default '[]'::jsonb,
  reads int default 0,
  likes int default 0,
  status text default 'published' check (status in ('draft','published','archived')),
  published_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists idx_journal_articles on public.journal_articles(journal_id, published_at desc);

-- ── RLS ──
alter table public.tutor_profiles enable row level security;
alter table public.tutor_requests enable row level security;
alter table public.tutor_applications enable row level security;
alter table public.job_postings enable row level security;
alter table public.job_applications enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_answers enable row level security;
alter table public.discussion_votes enable row level security;
alter table public.journals enable row level security;
alter table public.journal_articles enable row level security;

-- Tutor profiles: public read, own write
drop policy if exists "tutors_read" on public.tutor_profiles;
drop policy if exists "tutors_own" on public.tutor_profiles;
create policy "tutors_read" on public.tutor_profiles for select to authenticated using (true);
create policy "tutors_own" on public.tutor_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tutor requests
drop policy if exists "tutor_req_read" on public.tutor_requests;
drop policy if exists "tutor_req_own" on public.tutor_requests;
create policy "tutor_req_read" on public.tutor_requests for select to authenticated using (true);
create policy "tutor_req_own" on public.tutor_requests for all to authenticated using (posted_by = auth.uid()) with check (posted_by = auth.uid());

-- Tutor applications
drop policy if exists "tutor_app_read" on public.tutor_applications;
drop policy if exists "tutor_app_insert" on public.tutor_applications;
drop policy if exists "tutor_app_own" on public.tutor_applications;
create policy "tutor_app_read" on public.tutor_applications for select to authenticated
  using (tutor_user_id = auth.uid() or request_id in (select id from public.tutor_requests where posted_by = auth.uid()));
create policy "tutor_app_insert" on public.tutor_applications for insert to authenticated with check (tutor_user_id = auth.uid());
create policy "tutor_app_own" on public.tutor_applications for update to authenticated
  using (tutor_user_id = auth.uid() or request_id in (select id from public.tutor_requests where posted_by = auth.uid()));

-- Jobs
drop policy if exists "jobs_read" on public.job_postings;
drop policy if exists "jobs_insert" on public.job_postings;
drop policy if exists "jobs_own" on public.job_postings;
create policy "jobs_read" on public.job_postings for select to authenticated using (status = 'open' or posted_by = auth.uid());
create policy "jobs_insert" on public.job_postings for insert to authenticated
  with check (
    posted_by = auth.uid()
    and (institution_id is null or public.is_admin_of(institution_id))
  );
create policy "jobs_own" on public.job_postings for all to authenticated
  using (posted_by = auth.uid() or (institution_id is not null and public.is_admin_of(institution_id)))
  with check (posted_by = auth.uid() or (institution_id is not null and public.is_admin_of(institution_id)));

-- Job applications
drop policy if exists "job_app_read" on public.job_applications;
drop policy if exists "job_app_insert" on public.job_applications;
drop policy if exists "job_app_own" on public.job_applications;
create policy "job_app_read" on public.job_applications for select to authenticated
  using (applicant_id = auth.uid() or job_id in (select id from public.job_postings where posted_by = auth.uid() or (institution_id is not null and public.is_admin_of(institution_id))));
create policy "job_app_insert" on public.job_applications for insert to authenticated with check (applicant_id = auth.uid());
create policy "job_app_own" on public.job_applications for update to authenticated
  using (applicant_id = auth.uid() or job_id in (select id from public.job_postings where posted_by = auth.uid()));

-- Discussions
drop policy if exists "disc_read" on public.discussions;
drop policy if exists "disc_own" on public.discussions;
create policy "disc_read" on public.discussions for select to authenticated using (true);
create policy "disc_own" on public.discussions for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

-- Discussion answers
drop policy if exists "disc_ans_read" on public.discussion_answers;
drop policy if exists "disc_ans_insert" on public.discussion_answers;
drop policy if exists "disc_ans_own" on public.discussion_answers;
create policy "disc_ans_read" on public.discussion_answers for select to authenticated using (true);
create policy "disc_ans_insert" on public.discussion_answers for insert to authenticated with check (author_id = auth.uid());
create policy "disc_ans_own" on public.discussion_answers for update to authenticated
  using (author_id = auth.uid() or discussion_id in (select id from public.discussions where author_id = auth.uid()));

-- Votes
drop policy if exists "votes_read" on public.discussion_votes;
drop policy if exists "votes_own" on public.discussion_votes;
create policy "votes_read" on public.discussion_votes for select to authenticated using (true);
create policy "votes_own" on public.discussion_votes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Journals
drop policy if exists "journals_read" on public.journals;
drop policy if exists "journals_own" on public.journals;
create policy "journals_read" on public.journals for select to authenticated using (is_public = true or owner_id = auth.uid());
create policy "journals_own" on public.journals for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- Journal articles
drop policy if exists "jarticles_read" on public.journal_articles;
drop policy if exists "jarticles_own" on public.journal_articles;
create policy "jarticles_read" on public.journal_articles for select to authenticated
  using (status = 'published' or author_id = auth.uid());
create policy "jarticles_own" on public.journal_articles for all to authenticated
  using (author_id = auth.uid() or journal_id in (select id from public.journals where owner_id = auth.uid()))
  with check (author_id = auth.uid() or journal_id in (select id from public.journals where owner_id = auth.uid()));

-- ── COUNTER TRIGGERS ──
create or replace function public.update_application_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_table_name = 'tutor_applications' then
    if tg_op = 'INSERT' then update public.tutor_requests set applications_count = applications_count + 1 where id = new.request_id;
    elsif tg_op = 'DELETE' then update public.tutor_requests set applications_count = greatest(applications_count - 1, 0) where id = old.request_id; end if;
  elsif tg_table_name = 'job_applications' then
    if tg_op = 'INSERT' then update public.job_postings set applications_count = applications_count + 1 where id = new.job_id;
    elsif tg_op = 'DELETE' then update public.job_postings set applications_count = greatest(applications_count - 1, 0) where id = old.job_id; end if;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_tutor_app_count on public.tutor_applications;
create trigger trg_tutor_app_count after insert or delete on public.tutor_applications for each row execute function public.update_application_count();
drop trigger if exists trg_job_app_count on public.job_applications;
create trigger trg_job_app_count after insert or delete on public.job_applications for each row execute function public.update_application_count();

create or replace function public.update_disc_answer_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then update public.discussions set answers_count = answers_count + 1 where id = new.discussion_id;
  elsif tg_op = 'DELETE' then update public.discussions set answers_count = greatest(answers_count - 1, 0) where id = old.discussion_id; end if;
  return null;
end;
$$;
drop trigger if exists trg_disc_ans_count on public.discussion_answers;
create trigger trg_disc_ans_count after insert or delete on public.discussion_answers for each row execute function public.update_disc_answer_count();

create or replace function public.update_disc_votes()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    if new.discussion_id is not null then update public.discussions set upvotes = upvotes + new.vote where id = new.discussion_id; end if;
    if new.answer_id is not null then update public.discussion_answers set upvotes = upvotes + new.vote where id = new.answer_id; end if;
  elsif tg_op = 'DELETE' then
    if old.discussion_id is not null then update public.discussions set upvotes = upvotes - old.vote where id = old.discussion_id; end if;
    if old.answer_id is not null then update public.discussion_answers set upvotes = upvotes - old.vote where id = old.answer_id; end if;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_disc_votes on public.discussion_votes;
create trigger trg_disc_votes after insert or delete on public.discussion_votes for each row execute function public.update_disc_votes();

create or replace function public.update_journal_article_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then update public.journals set articles_count = articles_count + 1 where id = new.journal_id;
  elsif tg_op = 'DELETE' then update public.journals set articles_count = greatest(articles_count - 1, 0) where id = old.journal_id; end if;
  return null;
end;
$$;
drop trigger if exists trg_jarticle_count on public.journal_articles;
create trigger trg_jarticle_count after insert or delete on public.journal_articles for each row execute function public.update_journal_article_count();

-- ── SEARCH FUNCTIONS ──
create or replace function public.search_tutors(p_query text default '', p_subject text default null, p_mode text default null, p_limit int default 20)
returns table (user_id uuid, full_name text, username text, avatar_url text, headline text, subjects jsonb, hourly_rate_bdt numeric, mode text, rating_avg numeric, rating_count int, division text, city text)
language sql security definer stable set search_path = public as $$
  select tp.user_id, p.full_name, p.username, p.avatar_url, tp.headline, tp.subjects,
    tp.hourly_rate_bdt, tp.mode, tp.rating_avg, tp.rating_count, tp.division, tp.city
  from public.tutor_profiles tp
  join public.profiles p on p.id = tp.user_id
  where tp.is_active = true
    and (p_subject is null or tp.subjects ? p_subject)
    and (p_mode is null or tp.mode = p_mode or tp.mode = 'both')
    and (p_query = '' or lower(coalesce(tp.headline,'')) like '%' || lower(p_query) || '%' or lower(coalesce(p.full_name,'')) like '%' || lower(p_query) || '%' or lower(coalesce(p.username,'')) like '%' || lower(p_query) || '%')
  order by tp.rating_avg desc, tp.rating_count desc, tp.created_at desc
  limit p_limit;
$$;
grant execute on function public.search_tutors to authenticated;

create or replace function public.search_jobs(p_query text default '', p_role text default null, p_division text default null, p_limit int default 30)
returns table (id uuid, title text, role_type text, employment_type text, subjects jsonb, salary_min numeric, salary_max numeric, location text, division text, city text, institution_name text, institution_emoji text, institution_logo text, applications_count int, created_at timestamptz)
language sql security definer stable set search_path = public as $$
  select j.id, j.title, j.role_type, j.employment_type, j.subjects, j.salary_min, j.salary_max,
    j.location, j.division, j.city, i.name, i.emoji, i.logo_url, j.applications_count, j.created_at
  from public.job_postings j
  left join public.institutions i on i.id = j.institution_id
  where j.status = 'open'
    and (p_role is null or j.role_type = p_role)
    and (p_division is null or j.division = p_division)
    and (p_query = '' or lower(j.title) like '%' || lower(p_query) || '%' or lower(coalesce(j.description,'')) like '%' || lower(p_query) || '%')
  order by j.created_at desc
  limit p_limit;
$$;
grant execute on function public.search_jobs to authenticated;

create or replace function public.get_discussions(p_topic text default null, p_sort text default 'hot', p_limit int default 30)
returns table (id uuid, title text, body text, topic text, tags jsonb, upvotes int, answers_count int, views int, is_answered boolean, created_at timestamptz, author_name text, author_username text, author_avatar text, author_headline text)
language sql security definer stable set search_path = public as $$
  select d.id, d.title, d.body, d.topic, d.tags, d.upvotes, d.answers_count, d.views, d.is_answered, d.created_at,
    p.full_name, p.username, p.avatar_url, p.headline
  from public.discussions d
  left join public.profiles p on p.id = d.author_id
  where (p_topic is null or d.topic = p_topic)
  order by
    case when p_sort = 'new' then extract(epoch from d.created_at) * -1 else 0 end asc,
    case when p_sort = 'top' or p_sort = 'hot' then d.upvotes end desc,
    case when p_sort = 'hot' then d.answers_count end desc,
    d.created_at desc
  limit p_limit;
$$;
grant execute on function public.get_discussions to authenticated;

create or replace function public.mark_best_answer(p_answer_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_disc_id uuid;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  select discussion_id into v_disc_id from public.discussion_answers where id = p_answer_id;
  if not exists (select 1 from public.discussions where id = v_disc_id and author_id = auth.uid()) then
    raise exception 'Only question author can mark best answer';
  end if;
  update public.discussion_answers set is_best = false where discussion_id = v_disc_id;
  update public.discussion_answers set is_best = true where id = p_answer_id;
  update public.discussions set best_answer_id = p_answer_id, is_answered = true where id = v_disc_id;
end;
$$;
grant execute on function public.mark_best_answer to authenticated;
