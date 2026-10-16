-- ============================================================
-- Migration 021: Gamification — Points, Badges, Streaks, Leaderboard
-- ============================================================

-- User points & streaks
create table if not exists public.user_gamification (
  user_id uuid primary key references auth.users(id) on delete cascade,
  total_points int default 0,
  current_streak int default 0,
  longest_streak int default 0,
  last_active_date date,
  level int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Points ledger (audit trail)
create table if not exists public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  points int not null,
  action text not null,
  description text,
  reference_id uuid,
  created_at timestamptz default now()
);
create index if not exists idx_points_user on public.points_ledger(user_id, created_at desc);

-- Badges master
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  name_bn text,
  description text,
  emoji text default '🏆',
  color text default '#10b981',
  tier text default 'bronze' check (tier in ('bronze','silver','gold','platinum','diamond')),
  requirement_type text,
  requirement_value int,
  is_active boolean default true,
  sort_order int default 0
);

-- User's earned badges
create table if not exists public.user_badges (
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz default now(),
  primary key (user_id, badge_id)
);
create index if not exists idx_user_badges_user on public.user_badges(user_id, earned_at desc);

-- RLS
alter table public.user_gamification enable row level security;
alter table public.points_ledger enable row level security;
alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists "ug_read_all" on public.user_gamification;
drop policy if exists "ug_own" on public.user_gamification;
create policy "ug_read_all" on public.user_gamification for select to authenticated using (true);
create policy "ug_own" on public.user_gamification for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "pl_read_own" on public.points_ledger;
drop policy if exists "pl_admin" on public.points_ledger;
create policy "pl_read_own" on public.points_ledger for select to authenticated using (user_id = auth.uid());
create policy "pl_admin" on public.points_ledger for all to authenticated with check (false);

drop policy if exists "badges_read_all" on public.badges;
drop policy if exists "badges_admin" on public.badges;
create policy "badges_read_all" on public.badges for select to authenticated using (is_active = true);
create policy "badges_admin" on public.badges for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists "ub_read_all" on public.user_badges;
drop policy if exists "ub_admin" on public.user_badges;
create policy "ub_read_all" on public.user_badges for select to authenticated using (true);
create policy "ub_admin" on public.user_badges for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ── AWARD POINTS FUNCTION ──
create or replace function public.award_points(
  p_user_id uuid,
  p_points int,
  p_action text,
  p_description text default null,
  p_reference_id uuid default null
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_total int;
  v_level int;
begin
  if p_user_id is null then raise exception 'User required'; end if;

  insert into public.user_gamification (user_id, total_points)
  values (p_user_id, 0)
  on conflict (user_id) do nothing;

  insert into public.points_ledger (user_id, points, action, description, reference_id)
  values (p_user_id, p_points, p_action, p_description, p_reference_id);

  update public.user_gamification
    set total_points = total_points + p_points,
        updated_at = now()
    where user_id = p_user_id
    returning total_points into v_total;

  -- Level: every 500 points = 1 level
  v_level := greatest(1, floor(v_total / 500) + 1);
  update public.user_gamification set level = v_level where user_id = p_user_id;

  return jsonb_build_object('total', v_total, 'level', v_level, 'gained', p_points);
end;
$$;
grant execute on function public.award_points to authenticated;

-- ── STREAK UPDATE FUNCTION ──
create or replace function public.update_my_streak()
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_me uuid := auth.uid();
  v_last date;
  v_current int;
  v_longest int;
  v_today date := current_date;
  v_new int;
begin
  if v_me is null then raise exception 'Auth required'; end if;

  insert into public.user_gamification (user_id) values (v_me) on conflict (user_id) do nothing;

  select last_active_date, current_streak, longest_streak into v_last, v_current, v_longest
  from public.user_gamification where user_id = v_me;

  if v_last = v_today then
    return jsonb_build_object('streak', v_current, 'no_change', true);
  end if;

  if v_last = v_today - 1 then
    v_new := v_current + 1;
  else
    v_new := 1;
  end if;

  update public.user_gamification
    set current_streak = v_new,
        longest_streak = greatest(v_longest, v_new),
        last_active_date = v_today,
        total_points = total_points + case when v_new > 1 then 5 else 10 end,
        updated_at = now()
    where user_id = v_me;

  insert into public.points_ledger (user_id, points, action, description)
  values (v_me, case when v_new > 1 then 5 else 10 end, 'daily_login',
    'Daily check-in (streak: ' || v_new || ')');

  -- Award streak milestone badges
  if v_new = 7 then
    perform public.try_award_badge(v_me, 'streak_7');
  elsif v_new = 30 then
    perform public.try_award_badge(v_me, 'streak_30');
  elsif v_new = 100 then
    perform public.try_award_badge(v_me, 'streak_100');
  end if;

  return jsonb_build_object('streak', v_new, 'longest', greatest(v_longest, v_new));
end;
$$;
grant execute on function public.update_my_streak to authenticated;

-- ── BADGE HELPER ──
create or replace function public.try_award_badge(p_user_id uuid, p_badge_code text)
returns boolean
language plpgsql security definer set search_path = public as $$
declare
  v_badge_id uuid;
  v_inserted boolean := false;
begin
  select id into v_badge_id from public.badges where code = p_badge_code and is_active = true;
  if v_badge_id is null then return false; end if;

  insert into public.user_badges (user_id, badge_id)
  values (p_user_id, v_badge_id)
  on conflict do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    -- Notify
    insert into public.notifications (institution_id, recipient_user_id, title, body, category)
    values (null, p_user_id, '🏆 New Badge Unlocked!',
      (select name from public.badges where id = v_badge_id) || ' badge পেয়েছেন!', 'general');
  end if;
  return v_inserted;
end;
$$;
grant execute on function public.try_award_badge to authenticated;

-- ── MY GAMIFICATION SUMMARY ──
create or replace function public.my_gamification()
returns jsonb
language sql security definer stable set search_path = public as $$
  select jsonb_build_object(
    'total_points', coalesce(g.total_points, 0),
    'level', coalesce(g.level, 1),
    'current_streak', coalesce(g.current_streak, 0),
    'longest_streak', coalesce(g.longest_streak, 0),
    'rank_global', (
      select count(*) + 1 from public.user_gamification g2
      where g2.total_points > coalesce(g.total_points, 0)
    ),
    'badges_count', (select count(*) from public.user_badges where user_id = auth.uid()),
    'next_level_points', (coalesce(g.level, 1) * 500),
    'progress', coalesce(g.total_points, 0) - ((coalesce(g.level, 1) - 1) * 500)
  )
  from public.user_gamification g
  where g.user_id = auth.uid();
$$;
grant execute on function public.my_gamification to authenticated;

-- ── LEADERBOARD ──
create or replace function public.get_leaderboard(p_scope text default 'global', p_institution_id uuid default null, p_limit int default 50)
returns table (
  user_id uuid, full_name text, username text, avatar_url text,
  total_points int, level int, current_streak int, badges_count bigint, rank bigint
)
language sql security definer stable set search_path = public as $$
  with base as (
    select
      g.user_id, p.full_name, p.username, p.avatar_url,
      g.total_points, g.level, g.current_streak,
      (select count(*) from public.user_badges where user_id = g.user_id) as badges_count
    from public.user_gamification g
    join public.profiles p on p.id = g.user_id
    where
      case
        when p_scope = 'institution' and p_institution_id is not null then
          exists (select 1 from public.memberships m where m.user_id = g.user_id and m.institution_id = p_institution_id)
        else true
      end
  )
  select user_id, full_name, username, avatar_url, total_points, level, current_streak, badges_count,
    row_number() over (order by total_points desc) as rank
  from base
  order by total_points desc
  limit p_limit;
$$;
grant execute on function public.get_leaderboard to authenticated;

-- ── AUTO-AWARD ON EVENTS ──
-- On exam graded
create or replace function public.award_on_exam_graded()
returns trigger language plpgsql security definer as $$
declare
  v_student_user uuid;
  v_pct numeric;
begin
  if new.status <> 'graded' or old.status = 'graded' then return new; end if;
  select linked_user_id into v_student_user from public.students where id = new.student_id;
  if v_student_user is null then return new; end if;

  v_pct := case when new.total_marks > 0 then new.score::numeric / new.total_marks * 100 else 0 end;

  perform public.award_points(v_student_user, 20, 'exam_completed', 'Exam submitted');
  if v_pct >= 90 then
    perform public.award_points(v_student_user, 30, 'exam_excellent', 'Scored 90%+');
    perform public.try_award_badge(v_student_user, 'ace_90');
  elsif v_pct >= 80 then
    perform public.award_points(v_student_user, 20, 'exam_great', 'Scored 80%+');
  end if;

  if (select count(*) from public.exam_attempts where student_id = new.student_id and status = 'graded') = 1 then
    perform public.try_award_badge(v_student_user, 'first_exam');
  end if;
  if (select count(*) from public.exam_attempts where student_id = new.student_id and status = 'graded') = 10 then
    perform public.try_award_badge(v_student_user, 'exam_10');
  end if;

  return new;
end;
$$;
drop trigger if exists trg_award_exam on public.exam_attempts;
create trigger trg_award_exam after update on public.exam_attempts
  for each row execute function public.award_on_exam_graded();

-- On post create
create or replace function public.award_on_post()
returns trigger language plpgsql security definer as $$
begin
  perform public.award_points(new.user_id, 3, 'post_created', 'Created a post');
  if (select count(*) from public.social_posts where user_id = new.user_id) = 1 then
    perform public.try_award_badge(new.user_id, 'first_post');
  end if;
  if (select count(*) from public.social_posts where user_id = new.user_id) = 50 then
    perform public.try_award_badge(new.user_id, 'poster_50');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_award_post on public.social_posts;
create trigger trg_award_post after insert on public.social_posts
  for each row execute function public.award_on_post();

-- On follow
create or replace function public.award_on_follow()
returns trigger language plpgsql security definer as $$
begin
  perform public.award_points(new.follower_id, 1, 'follow_user', 'Followed a user');
  perform public.award_points(new.following_id, 2, 'gained_follower', 'Gained a follower');
  if (select count(*) from public.social_follows where following_id = new.following_id) = 10 then
    perform public.try_award_badge(new.following_id, 'influencer_10');
  end if;
  if (select count(*) from public.social_follows where following_id = new.following_id) = 100 then
    perform public.try_award_badge(new.following_id, 'influencer_100');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_award_follow on public.social_follows;
create trigger trg_award_follow after insert on public.social_follows
  for each row execute function public.award_on_follow();

-- On discussion answer
create or replace function public.award_on_answer()
returns trigger language plpgsql security definer as $$
begin
  perform public.award_points(new.author_id, 5, 'answer_posted', 'Answered a question');
  return new;
end;
$$;
drop trigger if exists trg_award_answer on public.discussion_answers;
create trigger trg_award_answer after insert on public.discussion_answers
  for each row execute function public.award_on_answer();

-- Mark best answer → award bonus
create or replace function public.award_best_answer()
returns trigger language plpgsql security definer as $$
begin
  if new.is_best and not coalesce(old.is_best, false) then
    perform public.award_points(new.author_id, 25, 'best_answer', 'Answer marked as best');
    perform public.try_award_badge(new.author_id, 'first_best_answer');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_award_best on public.discussion_answers;
create trigger trg_award_best after update on public.discussion_answers
  for each row execute function public.award_best_answer();

-- ── SEED BADGES ──
insert into public.badges (code, name, name_bn, description, emoji, color, tier, requirement_type, requirement_value, sort_order)
values
  ('first_post', 'First Post', 'প্রথম পোস্ট', 'Created your first social post', '✍️', '#10b981', 'bronze', 'post_count', 1, 1),
  ('first_exam', 'First Exam', 'প্রথম পরীক্ষা', 'Completed your first exam', '📝', '#10b981', 'bronze', 'exam_count', 1, 2),
  ('first_best_answer', 'First Best Answer', 'প্রথম সেরা উত্তর', 'Got your first best answer', '⭐', '#f59e0b', 'silver', 'best_answer_count', 1, 3),
  ('streak_7', 'Week Warrior', 'সাপ্তাহিক যোদ্ধা', '7-day login streak', '🔥', '#f97316', 'silver', 'streak_days', 7, 4),
  ('streak_30', 'Month Master', 'মাসিক মাস্টার', '30-day login streak', '💎', '#8b5cf6', 'gold', 'streak_days', 30, 5),
  ('streak_100', 'Century Legend', 'শতাব্দীর কিংবদন্তি', '100-day login streak', '👑', '#e879f9', 'platinum', 'streak_days', 100, 6),
  ('exam_10', 'Consistent Learner', 'নিয়মিত শিক্ষার্থী', '10 exams completed', '📚', '#10b981', 'silver', 'exam_count', 10, 7),
  ('ace_90', 'High Achiever', 'উচ্চ অর্জনকারী', 'Scored 90%+ in an exam', '🎯', '#ef4444', 'gold', 'score_90', 1, 8),
  ('poster_50', 'Content Creator', 'কনটেন্ট ক্রিয়েটর', 'Created 50 posts', '🎨', '#8b5cf6', 'gold', 'post_count', 50, 9),
  ('influencer_10', 'Rising Star', 'উদীয়মান তারকা', 'Gained 10 followers', '🌟', '#f59e0b', 'silver', 'follower_count', 10, 10),
  ('influencer_100', 'Influencer', 'ইনফ্লুয়েন্সার', 'Gained 100 followers', '⭐', '#ef4444', 'gold', 'follower_count', 100, 11),
  ('helpful_10', 'Helpful Mind', 'সহায়ক মন', '10 answers given', '🤝', '#06b6d4', 'silver', 'answer_count', 10, 12),
  ('reader_50', 'Avid Reader', 'আগ্রহী পাঠক', 'Read 50 journal articles', '📖', '#14b8a6', 'silver', 'journal_reads', 50, 13),
  ('teacher_hero', 'Teaching Hero', 'শিক্ষাদান নায়ক', 'Instructor with 50+ students', '👨‍🏫', '#10b981', 'gold', 'student_count', 50, 14)
on conflict (code) do nothing;
