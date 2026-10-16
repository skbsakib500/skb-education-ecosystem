-- ============================================================
-- Migration 022: Journals + Global Search + Analytics
-- ============================================================

-- Ensure journal tables exist with proper structure
alter table public.journals add column if not exists followers_count int default 0;
alter table public.journal_articles add column if not exists reading_time_min int;

-- Journal followers
create table if not exists public.journal_followers (
  journal_id uuid not null references public.journals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (journal_id, user_id)
);

alter table public.journal_followers enable row level security;
drop policy if exists "jf_read_all" on public.journal_followers;
drop policy if exists "jf_own" on public.journal_followers;
create policy "jf_read_all" on public.journal_followers for select to authenticated using (true);
create policy "jf_own" on public.journal_followers for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Auto count follower
create or replace function public.update_journal_follower_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.journals set followers_count = followers_count + 1 where id = new.journal_id;
  elsif tg_op = 'DELETE' then
    update public.journals set followers_count = greatest(followers_count - 1, 0) where id = old.journal_id;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_journal_follow_count on public.journal_followers;
create trigger trg_journal_follow_count after insert or delete on public.journal_followers
  for each row execute function public.update_journal_follower_count();

-- ── GLOBAL SEARCH ──
create or replace function public.global_search(p_query text, p_limit int default 5)
returns jsonb
language plpgsql security definer stable set search_path = public, extensions as $$
declare
  v_q text := trim(p_query);
  v_pattern text;
  v_users jsonb;
  v_institutions jsonb;
  v_posts jsonb;
  v_discussions jsonb;
  v_journals jsonb;
  v_tutors jsonb;
  v_jobs jsonb;
begin
  if length(v_q) < 2 then
    return jsonb_build_object('users','[]'::jsonb,'institutions','[]'::jsonb,'posts','[]'::jsonb,'discussions','[]'::jsonb,'journals','[]'::jsonb,'tutors','[]'::jsonb,'jobs','[]'::jsonb);
  end if;
  v_pattern := '%' || lower(v_q) || '%';

  -- Users
  select jsonb_agg(jsonb_build_object('id', id, 'username', username, 'full_name', full_name, 'avatar_url', avatar_url, 'headline', headline, 'primary_role', primary_role))
  into v_users
  from (select id, username, full_name, avatar_url, headline, primary_role from public.profiles
    where (lower(coalesce(full_name,'')) like v_pattern or lower(coalesce(username,'')) like v_pattern or lower(coalesce(headline,'')) like v_pattern)
    and username is not null limit p_limit) u;

  -- Institutions
  select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'slug', slug, 'emoji', emoji, 'logo_url', logo_url, 'type', type, 'city', city))
  into v_institutions
  from (select id, name, slug, emoji, logo_url, type, city from public.institutions
    where lower(name) like v_pattern or lower(slug) like v_pattern limit p_limit) i;

  -- Posts
  select jsonb_agg(jsonb_build_object('id', id, 'content', substring(content,1,120), 'post_type', post_type, 'author_name', author_name, 'author_username', author_username))
  into v_posts
  from (select sp.id, sp.content, sp.post_type, pr.full_name as author_name, pr.username as author_username
    from public.social_posts sp left join public.profiles pr on pr.id = sp.user_id
    where sp.visibility = 'public' and lower(sp.content) like v_pattern
    order by sp.created_at desc limit p_limit) p;

  -- Discussions
  select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'topic', topic, 'answers_count', answers_count))
  into v_discussions
  from (select id, title, topic, answers_count from public.discussions
    where lower(title) like v_pattern or lower(coalesce(body,'')) like v_pattern limit p_limit) d;

  -- Journals
  select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'slug', slug, 'description', description, 'articles_count', articles_count))
  into v_journals
  from (select id, name, slug, description, articles_count from public.journals
    where is_public = true and (lower(name) like v_pattern or lower(coalesce(description,'')) like v_pattern) limit p_limit) j;

  -- Tutors
  select jsonb_agg(jsonb_build_object('user_id', user_id, 'full_name', full_name, 'username', username, 'headline', headline, 'subjects', subjects, 'hourly_rate_bdt', hourly_rate_bdt))
  into v_tutors
  from (select tp.user_id, p.full_name, p.username, tp.headline, tp.subjects, tp.hourly_rate_bdt
    from public.tutor_profiles tp join public.profiles p on p.id = tp.user_id
    where tp.is_active = true and (lower(coalesce(tp.headline,'')) like v_pattern or lower(coalesce(p.full_name,'')) like v_pattern)
    limit p_limit) t;

  -- Jobs
  select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'role_type', role_type, 'institution_name', institution_name))
  into v_jobs
  from (select j.id, j.title, j.role_type, i.name as institution_name
    from public.job_postings j left join public.institutions i on i.id = j.institution_id
    where j.status = 'open' and (lower(j.title) like v_pattern or lower(coalesce(j.description,'')) like v_pattern)
    limit p_limit) jb;

  return jsonb_build_object(
    'users', coalesce(v_users, '[]'::jsonb),
    'institutions', coalesce(v_institutions, '[]'::jsonb),
    'posts', coalesce(v_posts, '[]'::jsonb),
    'discussions', coalesce(v_discussions, '[]'::jsonb),
    'journals', coalesce(v_journals, '[]'::jsonb),
    'tutors', coalesce(v_tutors, '[]'::jsonb),
    'jobs', coalesce(v_jobs, '[]'::jsonb)
  );
end;
$$;
grant execute on function public.global_search to authenticated;

-- ── ANALYTICS FOR SUPER ADMIN ──
create or replace function public.platform_analytics(p_days int default 30)
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'new_users', jsonb_build_object(
      'today', (select count(*) from auth.users where created_at::date = current_date),
      'week', (select count(*) from auth.users where created_at >= current_date - 7),
      'month', (select count(*) from auth.users where created_at >= current_date - p_days)
    ),
    'new_institutions', jsonb_build_object(
      'today', (select count(*) from public.institutions where created_at::date = current_date),
      'week', (select count(*) from public.institutions where created_at >= current_date - 7),
      'month', (select count(*) from public.institutions where created_at >= current_date - p_days)
    ),
    'activity', jsonb_build_object(
      'posts_today', (select count(*) from public.social_posts where created_at::date = current_date),
      'posts_week', (select count(*) from public.social_posts where created_at >= current_date - 7),
      'messages_today', (select count(*) from public.messages where created_at::date = current_date),
      'exam_attempts_today', (select count(*) from public.exam_attempts where created_at::date = current_date),
      'new_discussions_today', (select count(*) from public.discussions where created_at::date = current_date)
    ),
    'engagement', jsonb_build_object(
      'total_posts', (select count(*) from public.social_posts),
      'total_messages', (select count(*) from public.messages),
      'total_follows', (select count(*) from public.social_follows),
      'total_badges_earned', (select count(*) from public.user_badges),
      'total_points_awarded', (select coalesce(sum(points), 0) from public.points_ledger)
    ),
    'top_institutions', coalesce((
      select jsonb_agg(jsonb_build_object('name', name, 'emoji', emoji, 'students', (select count(*) from public.students where institution_id = i.id)))
      from (select * from public.institutions order by (select count(*) from public.students where institution_id = institutions.id) desc limit 5) i
    ), '[]'::jsonb),
    'signup_trend', coalesce((
      select jsonb_agg(jsonb_build_object('date', d::date, 'count', coalesce(c, 0)))
      from generate_series(current_date - p_days + 1, current_date, interval '1 day') d
      left join (select created_at::date as dt, count(*) as c from auth.users where created_at >= current_date - p_days group by 1) u on u.dt = d::date
    ), '[]'::jsonb)
  )
  where public.is_platform_admin();
$$;
grant execute on function public.platform_analytics to authenticated;

-- My personal analytics
create or replace function public.my_analytics()
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'posts', (select count(*) from public.social_posts where user_id = auth.uid()),
    'followers', (select count(*) from public.social_follows where following_id = auth.uid()),
    'following', (select count(*) from public.social_follows where follower_id = auth.uid()),
    'messages_sent', (select count(*) from public.messages where sender_id = auth.uid()),
    'exams_taken', (select count(*) from public.exam_attempts where student_id in (select id from public.students where linked_user_id = auth.uid())),
    'discussions', (select count(*) from public.discussions where author_id = auth.uid()),
    'answers_given', (select count(*) from public.discussion_answers where author_id = auth.uid()),
    'posts_likes_received', (select coalesce(sum(likes_count), 0) from public.social_posts where user_id = auth.uid())
  );
$$;
grant execute on function public.my_analytics to authenticated;
