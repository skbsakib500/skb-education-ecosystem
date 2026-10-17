-- SKB Migration 007: Expand banned words + auto-report + admin CRUD

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1. content_reports: allow auto-reports (reporter_id NULL)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE content_reports ALTER COLUMN reporter_id DROP NOT NULL;
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS is_auto boolean DEFAULT false;
ALTER TABLE content_reports ADD COLUMN IF NOT EXISTS auto_matched_word text;

-- Drop old unique constraint (allows NULL reporter_id duplicates properly)
ALTER TABLE content_reports DROP CONSTRAINT IF EXISTS content_reports_reporter_id_content_type_content_id_key;
DROP INDEX IF EXISTS content_reports_reporter_id_content_type_content_id_key;

-- Re-add partial unique: only when reporter_id is not null
CREATE UNIQUE INDEX IF NOT EXISTS uq_reports_user 
  ON content_reports(reporter_id, content_type, content_id) 
  WHERE reporter_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- 2. Update trigger: also create auto-report
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION auto_flag_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match record;
  v_flagged boolean := false;
  v_matched_words text[] := ARRAY[]::text[];
BEGIN
  FOR v_match IN SELECT * FROM scan_content_for_banned_words(NEW.content) LOOP
    INSERT INTO content_flags (content_type, content_id, matched_word, severity, auto_actioned)
    VALUES ('post', NEW.id, v_match.matched_word, v_match.severity, true);
    v_matched_words := array_append(v_matched_words, v_match.matched_word);
    v_flagged := true;
  END LOOP;

  IF v_flagged THEN
    NEW.is_hidden := true;
    NEW.hidden_reason := 'Auto-flagged: banned word detected';
    NEW.hidden_at := now();

    INSERT INTO content_reports (
      reporter_id, content_type, content_id, content_preview, reason,
      description, status, is_auto, auto_matched_word
    ) VALUES (
      NULL, 'post', NEW.id, substring(NEW.content, 1, 200),
      'harassment',
      'Auto-flagged: matched banned words (' || array_to_string(v_matched_words, ', ') || ')',
      'pending', true, array_to_string(v_matched_words, ', ')
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION auto_flag_discussion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match record;
  v_flagged boolean := false;
  v_matched_words text[] := ARRAY[]::text[];
  v_text text;
BEGIN
  v_text := coalesce(NEW.title,'') || ' ' || coalesce(NEW.body,'');
  FOR v_match IN SELECT * FROM scan_content_for_banned_words(v_text) LOOP
    INSERT INTO content_flags (content_type, content_id, matched_word, severity, auto_actioned)
    VALUES ('discussion', NEW.id, v_match.matched_word, v_match.severity, true);
    v_matched_words := array_append(v_matched_words, v_match.matched_word);
    v_flagged := true;
  END LOOP;

  IF v_flagged THEN
    NEW.is_hidden := true;
    NEW.hidden_reason := 'Auto-flagged: banned word detected';

    INSERT INTO content_reports (
      reporter_id, content_type, content_id, content_preview, reason,
      description, status, is_auto, auto_matched_word
    ) VALUES (
      NULL, 'discussion', NEW.id,
      substring(coalesce(NEW.title,'') || ' — ' || coalesce(NEW.body,''), 1, 200),
      'harassment',
      'Auto-flagged: matched banned words (' || array_to_string(v_matched_words, ', ') || ')',
      'pending', true, array_to_string(v_matched_words, ', ')
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Comments trigger (for social_comments)
CREATE OR REPLACE FUNCTION auto_flag_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_match record;
  v_flagged boolean := false;
  v_matched_words text[] := ARRAY[]::text[];
BEGIN
  FOR v_match IN SELECT * FROM scan_content_for_banned_words(NEW.content) LOOP
    INSERT INTO content_flags (content_type, content_id, matched_word, severity, auto_actioned)
    VALUES ('comment', NEW.id, v_match.matched_word, v_match.severity, true);
    v_matched_words := array_append(v_matched_words, v_match.matched_word);
    v_flagged := true;
  END LOOP;

  IF v_flagged THEN
    NEW.is_hidden := true;

    INSERT INTO content_reports (
      reporter_id, content_type, content_id, content_preview, reason,
      description, status, is_auto, auto_matched_word
    ) VALUES (
      NULL, 'comment', NEW.id, substring(NEW.content, 1, 200),
      'harassment',
      'Auto-flagged: banned words (' || array_to_string(v_matched_words, ', ') || ')',
      'pending', true, array_to_string(v_matched_words, ', ')
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_flag_comment_trigger ON social_comments;
CREATE TRIGGER auto_flag_comment_trigger
  BEFORE INSERT ON social_comments
  FOR EACH ROW EXECUTE FUNCTION auto_flag_comment();

-- ═══════════════════════════════════════════════════════════════════
-- 3. Admin CRUD RPCs for banned words
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION admin_list_banned_words()
RETURNS TABLE(
  id uuid, word text, language text, category text, severity text,
  is_active boolean, created_at timestamptz
) LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public AS $$
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  RETURN QUERY SELECT bw.id, bw.word, bw.language, bw.category, bw.severity, bw.is_active, bw.created_at
    FROM banned_words bw ORDER BY bw.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_add_banned_word(
  p_word text, p_language text DEFAULT 'mix',
  p_category text DEFAULT 'profanity', p_severity text DEFAULT 'high'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_word text;
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  v_word := lower(trim(p_word));
  IF length(v_word) < 2 THEN RAISE EXCEPTION 'Word too short'; END IF;

  INSERT INTO banned_words (word, language, category, severity)
  VALUES (v_word, p_language, p_category, p_severity)
  ON CONFLICT (word) DO UPDATE SET is_active = true
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'word', v_word, 'status', 'ok');
END;
$$;

CREATE OR REPLACE FUNCTION admin_toggle_banned_word(p_word_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE banned_words SET is_active = NOT is_active WHERE id = p_word_id;
  RETURN jsonb_build_object('status', 'ok');
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_banned_word(p_word_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_platform_admin() THEN RAISE EXCEPTION 'Not authorized'; END IF;
  DELETE FROM banned_words WHERE id = p_word_id;
  RETURN jsonb_build_object('status', 'ok');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. Seed EXPANDED Bengali + English list
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO banned_words (word, language, category, severity) VALUES
  -- ═══ Bengali profanity ═══
  ('মাদারচোদ', 'bn', 'profanity', 'critical'),
  ('মাদারচোদা', 'bn', 'profanity', 'critical'),
  ('বাপচোদ', 'bn', 'profanity', 'critical'),
  ('বাপচোদা', 'bn', 'profanity', 'critical'),
  ('চোদা', 'bn', 'profanity', 'critical'),
  ('চুদি', 'bn', 'profanity', 'critical'),
  ('চোদাচুদি', 'bn', 'explicit', 'critical'),
  ('বোকাচোদা', 'bn', 'profanity', 'critical'),
  ('চোদনিরপোলা', 'bn', 'profanity', 'critical'),
  ('কুত্তা', 'bn', 'profanity', 'high'),
  ('কুত্তারবাচ্চা', 'bn', 'profanity', 'critical'),
  ('শুয়োর', 'bn', 'profanity', 'high'),
  ('শুয়োরেরবাচ্চা', 'bn', 'profanity', 'critical'),
  ('শালা', 'bn', 'profanity', 'high'),
  ('শালী', 'bn', 'profanity', 'high'),
  ('সালা', 'bn', 'profanity', 'high'),
  ('মাগি', 'bn', 'profanity', 'critical'),
  ('মাগীরপোলা', 'bn', 'profanity', 'critical'),
  ('বেশ্যা', 'bn', 'profanity', 'critical'),
  ('খানকি', 'bn', 'profanity', 'critical'),
  ('খানকিরপোলা', 'bn', 'profanity', 'critical'),
  ('রান্ডি', 'bn', 'profanity', 'critical'),
  ('রান্ড', 'bn', 'profanity', 'critical'),
  ('বাঁদর', 'bn', 'harassment', 'high'),
  ('বানর', 'bn', 'harassment', 'medium'),
  ('লুচ্চা', 'bn', 'harassment', 'high'),
  ('বেইমান', 'bn', 'harassment', 'medium'),
  ('নপুংসক', 'bn', 'harassment', 'high'),
  ('হিজরা', 'bn', 'harassment', 'high'),
  -- ═══ Bengali explicit ═══
  ('ভোদা', 'bn', 'explicit', 'critical'),
  ('ভোদাই', 'bn', 'explicit', 'critical'),
  ('গুদ', 'bn', 'explicit', 'critical'),
  ('ধন', 'bn', 'explicit', 'high'),
  ('লিঙ্গ', 'bn', 'explicit', 'medium'),
  ('পোঁদ', 'bn', 'explicit', 'critical'),
  ('পোদ', 'bn', 'explicit', 'critical'),
  -- ═══ Bengali violence/threats ═══
  ('ধর্ষণ', 'bn', 'violence', 'critical'),
  ('ধর্ষক', 'bn', 'violence', 'critical'),
  ('মেরেদিব', 'bn', 'violence', 'high'),
  ('মেরেফেলব', 'bn', 'violence', 'critical'),
  ('খুন', 'bn', 'violence', 'high'),
  ('খুনি', 'bn', 'violence', 'high'),
  ('মর', 'bn', 'harassment', 'medium'),
  ('মরেগা', 'bn', 'harassment', 'high'),
  ('মরেযা', 'bn', 'harassment', 'high'),
  ('আত্মহত্যাকর', 'bn', 'harassment', 'critical'),
  ('আত্মহত্যা', 'bn', 'harassment', 'high'),
  -- ═══ Bengali sexual harassment ═══
  ('যৌনহয়রানি', 'bn', 'harassment', 'critical'),
  ('ধর্ষণেরচেষ্টা', 'bn', 'violence', 'critical'),
  -- ═══ English profanity ═══
  ('fuck', 'en', 'profanity', 'critical'),
  ('fucking', 'en', 'profanity', 'critical'),
  ('fucked', 'en', 'profanity', 'critical'),
  ('fucker', 'en', 'profanity', 'critical'),
  ('motherfucker', 'en', 'profanity', 'critical'),
  ('shit', 'en', 'profanity', 'high'),
  ('shitty', 'en', 'profanity', 'high'),
  ('bitch', 'en', 'profanity', 'critical'),
  ('bitches', 'en', 'profanity', 'critical'),
  ('bastard', 'en', 'profanity', 'high'),
  ('asshole', 'en', 'profanity', 'critical'),
  ('dick', 'en', 'profanity', 'high'),
  ('pussy', 'en', 'explicit', 'critical'),
  ('cock', 'en', 'explicit', 'high'),
  ('cunt', 'en', 'explicit', 'critical'),
  ('whore', 'en', 'profanity', 'critical'),
  ('slut', 'en', 'profanity', 'critical'),
  ('retard', 'en', 'harassment', 'high'),
  -- ═══ English explicit ═══
  ('porn', 'en', 'explicit', 'critical'),
  ('porno', 'en', 'explicit', 'critical'),
  ('pornography', 'en', 'explicit', 'critical'),
  ('xxx', 'en', 'explicit', 'critical'),
  ('nude', 'en', 'explicit', 'critical'),
  ('naked', 'en', 'explicit', 'high'),
  ('nsfw', 'en', 'explicit', 'high'),
  ('sex', 'en', 'explicit', 'medium'),
  ('sexy', 'en', 'explicit', 'medium'),
  ('orgasm', 'en', 'explicit', 'critical'),
  ('masturbate', 'en', 'explicit', 'critical'),
  ('blowjob', 'en', 'explicit', 'critical'),
  ('handjob', 'en', 'explicit', 'critical'),
  -- ═══ English violence ═══
  ('rape', 'en', 'violence', 'critical'),
  ('raped', 'en', 'violence', 'critical'),
  ('raping', 'en', 'violence', 'critical'),
  ('rapist', 'en', 'violence', 'critical'),
  ('murder', 'en', 'violence', 'high'),
  ('kill you', 'en', 'violence', 'critical'),
  ('kill yourself', 'en', 'harassment', 'critical'),
  ('kys', 'en', 'harassment', 'critical'),
  ('die', 'en', 'harassment', 'low'),
  ('go die', 'en', 'harassment', 'critical'),
  ('i will kill', 'en', 'violence', 'critical'),
  ('bomb', 'en', 'violence', 'medium'),
  ('shoot you', 'en', 'violence', 'critical'),
  -- ═══ English harassment ═══
  ('idiot', 'en', 'harassment', 'medium'),
  ('moron', 'en', 'harassment', 'medium'),
  ('stupid', 'en', 'harassment', 'low'),
  ('loser', 'en', 'harassment', 'low'),
  ('worthless', 'en', 'harassment', 'medium'),
  ('ugly', 'en', 'harassment', 'low'),
  ('fatso', 'en', 'harassment', 'medium'),
  ('gay', 'en', 'hate', 'high'),
  ('faggot', 'en', 'hate', 'critical'),
  ('nigga', 'en', 'hate', 'critical'),
  ('nigger', 'en', 'hate', 'critical')
ON CONFLICT (word) DO NOTHING;

GRANT EXECUTE ON FUNCTION admin_list_banned_words() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_add_banned_word(text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_toggle_banned_word(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_banned_word(uuid) TO authenticated;

COMMIT;
