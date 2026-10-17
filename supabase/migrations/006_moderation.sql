-- SKB Migration 006: Moderation System
-- Auto-flag + report + ban + admin queue

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1. Add hidden columns
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason text,
  ADD COLUMN IF NOT EXISTS hidden_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS hidden_at timestamptz;

ALTER TABLE discussions
  ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS hidden_reason text;

ALTER TABLE social_comments
  ADD COLUMN IF NOT EXISTS is_hidden boolean DEFAULT false;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Content Reports
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('post','comment','discussion','discussion_answer','profile')),
  content_id uuid NOT NULL,
  content_preview text,
  reason text NOT NULL CHECK (reason IN ('harassment','spam','hate','explicit','violence','misinformation','other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','reviewed','actioned','dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  action_taken text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(reporter_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_content ON content_reports(content_type, content_id);

-- ═══════════════════════════════════════════════════════════════════
-- 3. User Bans
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  category text NOT NULL DEFAULT 'warning' CHECK (category IN ('warning','temp_ban','permanent')),
  banned_by uuid NOT NULL REFERENCES auth.users(id),
  banned_at timestamptz DEFAULT now(),
  banned_until timestamptz,
  unban_reason text,
  unbanned_by uuid REFERENCES auth.users(id),
  unbanned_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_bans_user_active ON user_bans(user_id) 
  WHERE unbanned_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Banned Words
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS banned_words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text NOT NULL UNIQUE,
  language text DEFAULT 'mix' CHECK (language IN ('bn','en','mix')),
  category text NOT NULL DEFAULT 'profanity' CHECK (category IN ('profanity','harassment','hate','explicit','violence')),
  severity text NOT NULL DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════════
-- 5. Content Flags (auto-moderation audit)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  matched_word text NOT NULL,
  severity text NOT NULL,
  auto_actioned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flags_content ON content_flags(content_type, content_id);

-- ═══════════════════════════════════════════════════════════════════
-- 6. Helper Functions
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION is_user_banned(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_bans
    WHERE user_id = p_user_id
      AND unbanned_at IS NULL
      AND (banned_until IS NULL OR banned_until > now())
  );
END;
$$;

CREATE OR REPLACE FUNCTION scan_content_for_banned_words(p_text text)
RETURNS TABLE(matched_word text, severity text, category text)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF p_text IS NULL OR length(p_text) = 0 THEN RETURN; END IF;
  RETURN QUERY
  SELECT bw.word, bw.severity, bw.category
  FROM banned_words bw
  WHERE bw.is_active = true
    AND p_text ILIKE '%' || bw.word || '%';
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 7. Auto-flag trigger on post insert
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_flag_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match record;
  v_flagged boolean := false;
  v_severity text := 'low';
BEGIN
  FOR v_match IN SELECT * FROM scan_content_for_banned_words(NEW.content) LOOP
    INSERT INTO content_flags (content_type, content_id, matched_word, severity, auto_actioned)
    VALUES ('post', NEW.id, v_match.matched_word, v_match.severity, true);
    v_flagged := true;
    IF v_match.severity = 'critical' THEN v_severity := 'critical'; END IF;
  END LOOP;

  IF v_flagged THEN
    NEW.is_hidden := true;
    NEW.hidden_reason := 'Auto-flagged: prohibited content (' || v_severity || ')';
    NEW.hidden_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_flag_post_trigger ON social_posts;
CREATE TRIGGER auto_flag_post_trigger
  BEFORE INSERT ON social_posts
  FOR EACH ROW EXECUTE FUNCTION auto_flag_post();

-- Also for discussions
CREATE OR REPLACE FUNCTION auto_flag_discussion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match record;
  v_flagged boolean := false;
BEGIN
  FOR v_match IN SELECT * FROM scan_content_for_banned_words(coalesce(NEW.title,'') || ' ' || coalesce(NEW.body,'')) LOOP
    INSERT INTO content_flags (content_type, content_id, matched_word, severity, auto_actioned)
    VALUES ('discussion', NEW.id, v_match.matched_word, v_match.severity, true);
    v_flagged := true;
  END LOOP;

  IF v_flagged THEN
    NEW.is_hidden := true;
    NEW.hidden_reason := 'Auto-flagged: prohibited content';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_flag_discussion_trigger ON discussions;
CREATE TRIGGER auto_flag_discussion_trigger
  BEFORE INSERT ON discussions
  FOR EACH ROW EXECUTE FUNCTION auto_flag_discussion();

-- ═══════════════════════════════════════════════════════════════════
-- 8. Submit report (any authenticated user)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION submit_report(
  p_content_type text,
  p_content_id uuid,
  p_reason text,
  p_description text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid := auth.uid();
  v_preview text;
  v_report_id uuid;
  v_count int;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  IF p_content_type = 'post' THEN
    SELECT substring(content, 1, 200) INTO v_preview FROM social_posts WHERE id = p_content_id;
  ELSIF p_content_type = 'comment' THEN
    SELECT substring(content, 1, 200) INTO v_preview FROM social_comments WHERE id = p_content_id;
  ELSIF p_content_type = 'discussion' THEN
    SELECT substring(coalesce(title,'') || ' — ' || coalesce(body, ''), 1, 200) INTO v_preview FROM discussions WHERE id = p_content_id;
  END IF;

  INSERT INTO content_reports (reporter_id, content_type, content_id, content_preview, reason, description)
  VALUES (v_me, p_content_type, p_content_id, v_preview, p_reason, p_description)
  ON CONFLICT (reporter_id, content_type, content_id) DO NOTHING
  RETURNING id INTO v_report_id;

  IF v_report_id IS NULL THEN
    RETURN jsonb_build_object('status', 'already_reported');
  END IF;

  SELECT count(*)::int INTO v_count FROM content_reports
    WHERE content_type = p_content_type AND content_id = p_content_id AND status = 'pending';

  -- Auto-hide if 3+ reports
  IF v_count >= 3 THEN
    IF p_content_type = 'post' THEN
      UPDATE social_posts SET is_hidden = true, hidden_reason = 'Auto-hidden: ' || v_count || ' reports', hidden_at = now()
        WHERE id = p_content_id AND is_hidden = false;
    ELSIF p_content_type = 'discussion' THEN
      UPDATE discussions SET is_hidden = true WHERE id = p_content_id AND is_hidden = false;
    END IF;
  END IF;

  RETURN jsonb_build_object('status', 'submitted', 'report_id', v_report_id, 'auto_hidden', v_count >= 3);
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 9. Admin review report
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION admin_review_report(
  p_report_id uuid,
  p_action text,
  p_notes text DEFAULT NULL,
  p_ban_category text DEFAULT 'warning',
  p_ban_days int DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me uuid := auth.uid();
  v_report content_reports;
  v_content_owner uuid;
BEGIN
  IF v_me IS NULL OR NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p_action NOT IN ('dismiss','hide','ban_user') THEN RAISE EXCEPTION 'Invalid action'; END IF;

  SELECT * INTO v_report FROM content_reports WHERE id = p_report_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;

  IF p_action = 'hide' THEN
    IF v_report.content_type = 'post' THEN
      UPDATE social_posts SET is_hidden = true, hidden_reason = coalesce(p_notes, 'Hidden by admin'),
        hidden_by = v_me, hidden_at = now() WHERE id = v_report.content_id;
    ELSIF v_report.content_type = 'discussion' THEN
      UPDATE discussions SET is_hidden = true, hidden_reason = coalesce(p_notes, 'Hidden by admin') WHERE id = v_report.content_id;
    END IF;
  ELSIF p_action = 'ban_user' THEN
    IF v_report.content_type = 'post' THEN
      SELECT user_id INTO v_content_owner FROM social_posts WHERE id = v_report.content_id;
    ELSIF v_report.content_type = 'discussion' THEN
      SELECT author_id INTO v_content_owner FROM discussions WHERE id = v_report.content_id;
    END IF;

    IF v_content_owner IS NOT NULL THEN
      INSERT INTO user_bans (user_id, reason, category, banned_by, banned_until)
      VALUES (v_content_owner, coalesce(p_notes, 'Policy violation'),
        p_ban_category, v_me,
        CASE WHEN p_ban_days IS NOT NULL THEN now() + (p_ban_days || ' days')::interval ELSE NULL END);
    END IF;
  END IF;

  UPDATE content_reports
    SET status = CASE WHEN p_action = 'dismiss' THEN 'dismissed' ELSE 'actioned' END,
        reviewed_by = v_me, reviewed_at = now(), action_taken = p_action
    WHERE id = p_report_id;

  INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, new_data)
  VALUES (v_me, 'moderation.' || p_action, 'report', p_report_id,
    jsonb_build_object('action', p_action, 'notes', p_notes));

  RETURN jsonb_build_object('status', 'ok');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 10. Queue for admin
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION my_moderation_queue()
RETURNS TABLE(
  report_id uuid, content_type text, content_id uuid, content_preview text,
  reason text, description text, status text, reporter_id uuid,
  created_at timestamptz, content_owner uuid, reporter_count int,
  content_owner_name text
) LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT is_platform_admin() THEN RETURN; END IF;

  RETURN QUERY
  SELECT cr.id, cr.content_type, cr.content_id, cr.content_preview,
         cr.reason, cr.description, cr.status, cr.reporter_id,
         cr.created_at,
         CASE cr.content_type
           WHEN 'post' THEN (SELECT user_id FROM social_posts WHERE id = cr.content_id)
           WHEN 'discussion' THEN (SELECT author_id FROM discussions WHERE id = cr.content_id)
           ELSE NULL
         END,
         (SELECT count(*)::int FROM content_reports cr2
          WHERE cr2.content_type = cr.content_type AND cr2.content_id = cr.content_id),
         CASE cr.content_type
           WHEN 'post' THEN (SELECT full_name FROM profiles p JOIN social_posts sp ON sp.user_id = p.id WHERE sp.id = cr.content_id)
           WHEN 'discussion' THEN (SELECT full_name FROM profiles p JOIN discussions d ON d.author_id = p.id WHERE d.id = cr.content_id)
           ELSE 'Unknown'
         END
  FROM content_reports cr
  ORDER BY cr.created_at DESC
  LIMIT 200;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 11. Ban/unban RPCs
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION admin_ban_user(
  p_user_id uuid, p_reason text, p_category text DEFAULT 'warning', p_days int DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_me uuid := auth.uid();
BEGIN
  IF v_me IS NULL OR NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  INSERT INTO user_bans (user_id, reason, category, banned_by, banned_until)
  VALUES (p_user_id, p_reason, p_category, v_me,
    CASE WHEN p_days IS NOT NULL THEN now() + (p_days || ' days')::interval ELSE NULL END);
  RETURN jsonb_build_object('status', 'ok');
END;
$$;

CREATE OR REPLACE FUNCTION admin_unban_user(p_user_id uuid, p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_me uuid := auth.uid();
BEGIN
  IF v_me IS NULL OR NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE user_bans SET unbanned_at = now(), unbanned_by = v_me, unban_reason = p_reason
    WHERE user_id = p_user_id AND unbanned_at IS NULL;
  RETURN jsonb_build_object('status', 'ok');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 12. RLS
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cr_own_insert" ON content_reports;
CREATE POLICY "cr_own_insert" ON content_reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "cr_read" ON content_reports;
CREATE POLICY "cr_read" ON content_reports FOR SELECT USING (auth.uid() = reporter_id OR is_platform_admin());

DROP POLICY IF EXISTS "cr_admin_update" ON content_reports;
CREATE POLICY "cr_admin_update" ON content_reports FOR UPDATE USING (is_platform_admin());

DROP POLICY IF EXISTS "ub_read" ON user_bans;
CREATE POLICY "ub_read" ON user_bans FOR SELECT USING (auth.uid() = user_id OR is_platform_admin());

DROP POLICY IF EXISTS "ub_admin" ON user_bans;
CREATE POLICY "ub_admin" ON user_bans FOR ALL USING (is_platform_admin());

DROP POLICY IF EXISTS "bw_read" ON banned_words;
CREATE POLICY "bw_read" ON banned_words FOR SELECT USING (true);

DROP POLICY IF EXISTS "bw_admin" ON banned_words;
CREATE POLICY "bw_admin" ON banned_words FOR ALL USING (is_platform_admin());

DROP POLICY IF EXISTS "cf_admin" ON content_flags;
CREATE POLICY "cf_admin" ON content_flags FOR ALL USING (is_platform_admin());

-- ═══════════════════════════════════════════════════════════════════
-- 13. Seed banned words (Bengali + English)
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO banned_words (word, language, category, severity) VALUES
  ('fuck', 'en', 'profanity', 'high'),
  ('fucking', 'en', 'profanity', 'high'),
  ('shit', 'en', 'profanity', 'medium'),
  ('bitch', 'en', 'profanity', 'high'),
  ('bastard', 'en', 'profanity', 'medium'),
  ('asshole', 'en', 'profanity', 'high'),
  ('damn', 'en', 'profanity', 'low'),
  ('porn', 'en', 'explicit', 'critical'),
  ('xxx', 'en', 'explicit', 'critical'),
  ('sexy', 'en', 'explicit', 'medium'),
  ('nude', 'en', 'explicit', 'critical'),
  ('naked', 'en', 'explicit', 'high'),
  ('rape', 'en', 'violence', 'critical'),
  ('kill yourself', 'en', 'harassment', 'critical'),
  ('kys', 'en', 'harassment', 'critical'),
  ('মাদারচোদ', 'bn', 'profanity', 'critical'),
  ('বাঁদর', 'bn', 'harassment', 'high'),
  ('কুত্তা', 'bn', 'profanity', 'high'),
  ('শুয়োর', 'bn', 'profanity', 'high'),
  ('চোদা', 'bn', 'explicit', 'critical'),
  ('ধর্ষণ', 'bn', 'violence', 'critical'),
  ('আত্মহত্যা', 'bn', 'harassment', 'high')
ON CONFLICT (word) DO NOTHING;

GRANT EXECUTE ON FUNCTION submit_report(text,uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_review_report(uuid,text,text,text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION my_moderation_queue() TO authenticated;
GRANT EXECUTE ON FUNCTION is_user_banned(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_ban_user(uuid,text,text,int) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_unban_user(uuid,text) TO authenticated;

COMMIT;
