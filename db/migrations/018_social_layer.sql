-- ============================================================
-- Migration 018: Social Layer
-- ============================================================

-- Extend profiles (LinkedIn-style)
alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists expertise jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists open_to jsonb default '[]'::jsonb;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists website text;
alter table public.profiles add column if not exists social_links jsonb default '{}'::jsonb;
alter table public.profiles add column if not exists followers_count int default 0;
alter table public.profiles add column if not exists following_count int default 0;

create unique index if not exists idx_profiles_username on public.profiles (lower(username)) where username is not null;

-- Posts
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  post_type text not null default 'text'
    check (post_type in ('text','question','announcement','journal','achievement','resource')),
  media_urls jsonb default '[]'::jsonb,
  visibility text not null default 'public'
    check (visibility in ('public','institution','followers','private')),
  institution_id uuid references public.institutions(id) on delete set null,
  tags jsonb default '[]'::jsonb,
  likes_count int default 0,
  comments_count int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_posts_user on public.social_posts(user_id, created_at desc);
create index if not exists idx_posts_inst on public.social_posts(institution_id, created_at desc);
create index if not exists idx_posts_type on public.social_posts(post_type, created_at desc);

-- Follows
create table if not exists public.social_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists idx_follows_following on public.social_follows(following_id);

-- Likes
create table if not exists public.social_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.social_posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);
create index if not exists idx_likes_post on public.social_likes(post_id);

-- Comments
create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  parent_id uuid references public.social_comments(id) on delete cascade,
  created_at timestamptz default now()
);
create index if not exists idx_comments_post on public.social_comments(post_id, created_at);

-- RLS
alter table public.social_posts enable row level security;
alter table public.social_follows enable row level security;
alter table public.social_likes enable row level security;
alter table public.social_comments enable row level security;

drop policy if exists "posts_read_all" on public.social_posts;
drop policy if exists "posts_insert_own" on public.social_posts;
drop policy if exists "posts_update_own" on public.social_posts;
drop policy if exists "posts_delete_own" on public.social_posts;

create policy "posts_read_all" on public.social_posts
  for select to authenticated using (
    visibility = 'public'
    or user_id = auth.uid()
    or (visibility = 'followers' and exists (select 1 from public.social_follows where follower_id = auth.uid() and following_id = user_id))
    or (visibility = 'institution' and institution_id in (select institution_id from public.memberships where user_id = auth.uid()))
  );
create policy "posts_insert_own" on public.social_posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "posts_update_own" on public.social_posts
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "posts_delete_own" on public.social_posts
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "follows_read_all" on public.social_follows;
drop policy if exists "follows_insert_own" on public.social_follows;
drop policy if exists "follows_delete_own" on public.social_follows;
create policy "follows_read_all" on public.social_follows
  for select to authenticated using (true);
create policy "follows_insert_own" on public.social_follows
  for insert to authenticated with check (follower_id = auth.uid());
create policy "follows_delete_own" on public.social_follows
  for delete to authenticated using (follower_id = auth.uid());

drop policy if exists "likes_read_all" on public.social_likes;
drop policy if exists "likes_insert_own" on public.social_likes;
drop policy if exists "likes_delete_own" on public.social_likes;
create policy "likes_read_all" on public.social_likes
  for select to authenticated using (true);
create policy "likes_insert_own" on public.social_likes
  for insert to authenticated with check (user_id = auth.uid());
create policy "likes_delete_own" on public.social_likes
  for delete to authenticated using (user_id = auth.uid());

drop policy if exists "comments_read_all" on public.social_comments;
drop policy if exists "comments_insert_own" on public.social_comments;
drop policy if exists "comments_delete_own" on public.social_comments;
create policy "comments_read_all" on public.social_comments
  for select to authenticated using (true);
create policy "comments_insert_own" on public.social_comments
  for insert to authenticated with check (user_id = auth.uid());
create policy "comments_delete_own" on public.social_comments
  for delete to authenticated using (user_id = auth.uid());

-- ── COUNTER TRIGGERS ──
create or replace function public.update_post_like_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_post_like_count on public.social_likes;
create trigger trg_post_like_count after insert or delete on public.social_likes
  for each row execute function public.update_post_like_count();

create or replace function public.update_post_comment_count()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_post_comment_count on public.social_comments;
create trigger trg_post_comment_count after insert or delete on public.social_comments
  for each row execute function public.update_post_comment_count();

create or replace function public.update_follow_counts()
returns trigger language plpgsql security definer as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set followers_count = followers_count + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set followers_count = greatest(followers_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end;
$$;
drop trigger if exists trg_follow_counts on public.social_follows;
create trigger trg_follow_counts after insert or delete on public.social_follows
  for each row execute function public.update_follow_counts();

-- ── USERNAME AUTO-GENERATE ──
create or replace function public.generate_username(p_full_name text, p_user_id uuid)
returns text language plpgsql as $$
declare
  v_base text;
  v_slug text;
  v_counter int := 0;
begin
  v_base := lower(regexp_replace(coalesce(p_full_name, 'user'), '[^a-zA-Z0-9]+', '', 'g'));
  if length(v_base) < 3 then v_base := 'user' || substr(p_user_id::text, 1, 6); end if;
  v_base := substr(v_base, 1, 20);
  v_slug := v_base;
  while exists (select 1 from public.profiles where lower(username) = v_slug) loop
    v_counter := v_counter + 1;
    v_slug := v_base || v_counter::text;
  end loop;
  return v_slug;
end;
$$;

create or replace function public.ensure_my_username()
returns text language plpgsql security definer set search_path = public as $$
declare v_username text;
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;
  select username into v_username from public.profiles where id = auth.uid();
  if v_username is null then
    v_username := public.generate_username((select coalesce(full_name, 'user') from public.profiles where id = auth.uid()), auth.uid());
    update public.profiles set username = v_username where id = auth.uid();
  end if;
  return v_username;
end;
$$;
grant execute on function public.ensure_my_username to authenticated;

-- ── FEED ALGORITHM ──
create or replace function public.get_feed(p_limit int default 30, p_offset int default 0)
returns table (
  id uuid,
  content text,
  post_type text,
  media_urls jsonb,
  tags jsonb,
  likes_count int,
  comments_count int,
  created_at timestamptz,
  user_id uuid,
  author_name text,
  author_username text,
  author_avatar text,
  author_headline text,
  author_role text,
  institution_name text,
  institution_emoji text,
  is_liked boolean,
  is_following_author boolean,
  score numeric
)
language sql security definer stable set search_path = public as $$
  with my_insts as (
    select distinct institution_id from public.memberships where user_id = auth.uid()
  ),
  following as (
    select following_id from public.social_follows where follower_id = auth.uid()
  )
  select
    p.id, p.content, p.post_type, p.media_urls, p.tags,
    p.likes_count, p.comments_count, p.created_at,
    p.user_id,
    coalesce(pr.full_name, 'User') as author_name,
    pr.username as author_username,
    pr.avatar_url as author_avatar,
    pr.headline as author_headline,
    pr.primary_role as author_role,
    i.name as institution_name,
    i.emoji as institution_emoji,
    (exists (select 1 from public.social_likes where user_id = auth.uid() and post_id = p.id)) as is_liked,
    (exists (select 1 from following where following_id = p.user_id)) as is_following_author,
    (
      case when p.user_id in (select following_id from following) then 10 else 0 end
      + case when p.institution_id in (select institution_id from my_insts) then 5 else 0 end
      + case when p.user_id = auth.uid() then 3 else 0 end
      + least(p.likes_count * 0.5, 5)
      + greatest(0, 5 - extract(epoch from (now() - p.created_at)) / 86400 * 0.3)
    )::numeric as score
  from public.social_posts p
  left join public.profiles pr on pr.id = p.user_id
  left join public.institutions i on i.id = p.institution_id
  where (
    p.visibility = 'public'
    or p.user_id = auth.uid()
    or (p.visibility = 'followers' and p.user_id in (select following_id from following))
    or (p.visibility = 'institution' and p.institution_id in (select institution_id from my_insts))
  )
  order by score desc, p.created_at desc
  limit p_limit offset p_offset;
$$;
grant execute on function public.get_feed to authenticated;

-- ── TRENDING POSTS ──
create or replace function public.get_trending_posts(p_limit int default 10)
returns table (
  id uuid, content text, post_type text, likes_count int, comments_count int,
  created_at timestamptz, author_name text, author_username text, author_avatar text
)
language sql security definer stable set search_path = public as $$
  select p.id, p.content, p.post_type, p.likes_count, p.comments_count, p.created_at,
    coalesce(pr.full_name, 'User'), pr.username, pr.avatar_url
  from public.social_posts p
  left join public.profiles pr on pr.id = p.user_id
  where p.visibility = 'public' and p.created_at >= now() - interval '7 days'
  order by (p.likes_count * 2 + p.comments_count * 3) desc, p.created_at desc
  limit p_limit;
$$;
grant execute on function public.get_trending_posts to authenticated;

-- ── SUGGESTED FOLLOWS ──
create or replace function public.get_suggested_follows(p_limit int default 10)
returns table (
  user_id uuid, full_name text, username text, avatar_url text, headline text,
  primary_role text, followers_count int, mutual_inst int
)
language sql security definer stable set search_path = public as $$
  with my_insts as (
    select distinct institution_id from public.memberships where user_id = auth.uid()
  ),
  already_following as (
    select following_id from public.social_follows where follower_id = auth.uid()
  )
  select
    p.id, p.full_name, p.username, p.avatar_url, p.headline, p.primary_role, p.followers_count,
    (select count(*)::int from public.memberships m
     where m.user_id = p.id and m.institution_id in (select institution_id from my_insts)) as mutual_inst
  from public.profiles p
  where p.id <> auth.uid()
    and p.id not in (select following_id from already_following)
    and p.username is not null
  order by mutual_inst desc, p.followers_count desc, random()
  limit p_limit;
$$;
grant execute on function public.get_suggested_follows to authenticated;

-- ── PUBLIC PROFILE ──
create or replace function public.get_public_profile(p_username text)
returns jsonb language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'profile', jsonb_build_object(
      'id', p.id, 'username', p.username, 'full_name', p.full_name,
      'avatar_url', p.avatar_url, 'headline', p.headline, 'bio', p.bio,
      'location', p.location, 'website', p.website, 'expertise', p.expertise,
      'open_to', p.open_to, 'primary_role', p.primary_role,
      'followers_count', p.followers_count, 'following_count', p.following_count,
      'created_at', p.created_at
    ),
    'is_following', exists (select 1 from public.social_follows where follower_id = auth.uid() and following_id = p.id),
    'is_me', p.id = auth.uid(),
    'posts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', sp.id, 'content', sp.content, 'post_type', sp.post_type,
        'likes_count', sp.likes_count, 'comments_count', sp.comments_count,
        'created_at', sp.created_at, 'tags', sp.tags
      ) order by sp.created_at desc)
      from public.social_posts sp
      where sp.user_id = p.id and sp.visibility = 'public'
      limit 10
    ), '[]'::jsonb),
    'recent_institutions', coalesce((
      select jsonb_agg(distinct jsonb_build_object('name', i.name, 'emoji', i.emoji, 'logo_url', i.logo_url, 'role', m.role))
      from public.memberships m
      join public.institutions i on i.id = m.institution_id
      where m.user_id = p.id
    ), '[]'::jsonb)
  )
  from public.profiles p
  where lower(p.username) = lower(p_username);
$$;
grant execute on function public.get_public_profile to authenticated;

-- ── AUTO USERNAME ON SIGNUP ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
declare v_username text;
begin
  v_username := public.generate_username(coalesce(new.raw_user_meta_data->>'full_name', 'user'), new.id);
  insert into public.profiles (id, email, full_name, username)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), v_username)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill usernames for existing users
update public.profiles
set username = public.generate_username(coalesce(full_name, split_part(email, '@', 1)), id)
where username is null;
