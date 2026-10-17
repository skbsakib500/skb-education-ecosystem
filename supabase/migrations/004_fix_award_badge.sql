-- Fix: try_award_badge had boolean/integer type confusion
-- v_inserted was boolean but assigned row_count (integer), then compared > 0

CREATE OR REPLACE FUNCTION public.try_award_badge(p_user_id uuid, p_badge_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  v_badge_id uuid;
  v_count integer := 0;
begin
  select id into v_badge_id
    from public.badges
    where code = p_badge_code and is_active = true;

  if v_badge_id is null then
    return false;
  end if;

  insert into public.user_badges (user_id, badge_id)
  values (p_user_id, v_badge_id)
  on conflict do nothing;

  get diagnostics v_count = row_count;

  if v_count > 0 then
    insert into public.notifications (institution_id, recipient_user_id, title, body, category)
    values (
      null,
      p_user_id,
      '🏆 New Badge Unlocked!',
      (select name from public.badges where id = v_badge_id) || ' badge পেয়েছেন!',
      'general'
    );
  end if;

  return v_count > 0;
end;
$function$;
