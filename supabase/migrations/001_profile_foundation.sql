-- =====================================================================
-- SKB Education Ecosystem — Profile Foundation Migration
-- Version: 1.0.0 · Date: 2026-10-17
-- Non-destructive: only ADDs columns, tables, policies, functions
-- Rollback: see bottom of file
-- =====================================================================

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1. ENHANCE EXISTING profiles TABLE (safe adds)
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS profile_visibility text 
    DEFAULT 'restricted'
    CHECK (profile_visibility IN ('public','members','institution','restricted')),
  ADD COLUMN IF NOT EXISTS role_specific jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS age_bracket text,
  ADD COLUMN IF NOT EXISTS privacy_version integer DEFAULT 1;

-- ═══════════════════════════════════════════════════════════════════
-- 2. FIELD REGISTRY (data-driven metadata for every profile field)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profile_field_registry (
  field_key          text PRIMARY KEY,
  label              text NOT NULL,
  data_type          text NOT NULL CHECK (data_type IN ('text','number','date','jsonb','boolean','array','url','email','phone')),
  sensitivity        text NOT NULL CHECK (sensitivity IN ('public','internal','sensitive','critical')),
  default_visibility text NOT NULL DEFAULT 'restricted'
                     CHECK (default_visibility IN ('public','members','institution','restricted')),
  owner_editable     boolean DEFAULT true,
  institution_verified boolean DEFAULT false,
  never_public       boolean DEFAULT false,
  created_at         timestamptz DEFAULT now()
);

INSERT INTO profile_field_registry 
  (field_key, label, data_type, sensitivity, default_visibility, owner_editable, institution_verified, never_public)
VALUES
  ('full_name',    'Full Name',     'text',  'public',    'members',     true,  false, false),
  ('avatar_url',   'Avatar',        'url',   'public',    'members',     true,  false, false),
  ('headline',     'Headline',      'text',  'public',    'public',      true,  false, false),
  ('bio',          'Bio',           'text',  'internal',  'members',     true,  false, false),
  ('username',     'Username',      'text',  'public',    'public',      true,  false, false),
  ('location',     'Location',      'text',  'internal',  'members',     true,  false, false),
  ('website',      'Website',       'url',   'public',    'public',      true,  false, false),
  ('expertise',    'Expertise',     'array', 'public',    'public',      true,  false, false),
  ('interests',    'Interests',     'array', 'public',    'members',     true,  false, false),
  ('open_to',      'Open To',       'array', 'public',    'public',      true,  false, false),
  ('social_links', 'Social Links',  'jsonb', 'public',    'public',      true,  false, false),
  ('primary_role', 'Role',          'text',  'public',    'members',     false, false, false),
  ('sub_role',     'Sub-role',      'text',  'public',    'members',     false, false, false),
  ('email',        'Email',         'email', 'sensitive', 'restricted',  false, false, false),
  ('phone',        'Phone',         'phone', 'sensitive', 'restricted',  true,  false, false),
  ('date_of_birth','Date of Birth', 'date',  'critical',  'restricted',  true,  false, true),
  ('blood_group',  'Blood Group',   'text',  'sensitive', 'restricted',  true,  false, false),
  ('address',      'Address',       'text',  'sensitive', 'restricted',  true,  false, true)
ON CONFLICT (field_key) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- 3. PER-USER PER-FIELD PRIVACY OVERRIDE
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profile_privacy_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key   text NOT NULL REFERENCES profile_field_registry(field_key) ON DELETE CASCADE,
  visibility  text NOT NULL CHECK (visibility IN ('public','members','institution','restricted')),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_privacy_user ON profile_privacy_settings(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- 4. VERIFICATION RECORDS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS verification_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type      text NOT NULL CHECK (subject_type IN ('identity','institution','credential','achievement')),
  subject_id        uuid NOT NULL,
  verification_type text NOT NULL,
  issuer_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','verified','rejected','expired','revoked')),
  evidence_url      text,
  verified_at       timestamptz,
  expires_at        timestamptz,
  revoked_at        timestamptz,
  revoked_reason    text,
  metadata          jsonb DEFAULT '{}'::jsonb,
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verif_subject ON verification_records(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_verif_status ON verification_records(status) WHERE status = 'verified';

-- ═══════════════════════════════════════════════════════════════════
-- 5. CONSENT RECORDS
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS consent_records (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type   text NOT NULL CHECK (consent_type IN ('terms','privacy','guardian','marketing','data_processing')),
  purpose        text,
  policy_version text NOT NULL DEFAULT '1.0',
  status         text NOT NULL DEFAULT 'granted' CHECK (status IN ('granted','withdrawn')),
  granted_at     timestamptz DEFAULT now(),
  withdrawn_at   timestamptz,
  metadata       jsonb DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_consent_user ON consent_records(user_id, consent_type);

-- ═══════════════════════════════════════════════════════════════════
-- 6. PROFILE VIEW LOG (retention: manual cleanup later via cron)
-- ═══════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS profile_view_log (
  id          bigserial PRIMARY KEY,
  viewer_id   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  view_type   text NOT NULL DEFAULT 'profile' CHECK (view_type IN ('profile','portfolio','credential')),
  viewed_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_view_target_time ON profile_view_log(target_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_view_viewer_time ON profile_view_log(viewer_id, viewed_at DESC);

-- ═══════════════════════════════════════════════════════════════════
-- 7. RLS ON NEW TABLES
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE profile_field_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_view_log ENABLE ROW LEVEL SECURITY;

-- Registry: everyone can read metadata
DROP POLICY IF EXISTS "registry readable" ON profile_field_registry;
CREATE POLICY "registry readable" ON profile_field_registry FOR SELECT USING (true);

-- Privacy settings: own R/W only
DROP POLICY IF EXISTS "privacy own read" ON profile_privacy_settings;
DROP POLICY IF EXISTS "privacy own insert" ON profile_privacy_settings;
DROP POLICY IF EXISTS "privacy own update" ON profile_privacy_settings;
DROP POLICY IF EXISTS "privacy own delete" ON profile_privacy_settings;
CREATE POLICY "privacy own read"   ON profile_privacy_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "privacy own insert" ON profile_privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "privacy own update" ON profile_privacy_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "privacy own delete" ON profile_privacy_settings FOR DELETE USING (auth.uid() = user_id);

-- Verification: own read OR institution admin read
DROP POLICY IF EXISTS "verification read" ON verification_records;
CREATE POLICY "verification read" ON verification_records FOR SELECT USING (
  auth.uid() = subject_id
  OR (subject_type = 'institution' AND EXISTS (
    SELECT 1 FROM memberships 
    WHERE user_id = auth.uid() AND institution_id = subject_id 
      AND role IN ('admin','owner') AND status = 'active'
  ))
  OR EXISTS (SELECT 1 FROM platform_admins WHERE user_id = auth.uid())
);

-- Consent: own read/write
DROP POLICY IF EXISTS "consent own read" ON consent_records;
DROP POLICY IF EXISTS "consent own insert" ON consent_records;
CREATE POLICY "consent own read"   ON consent_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "consent own insert" ON consent_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- View log: target sees own views, viewer can insert own
DROP POLICY IF EXISTS "view log own target" ON profile_view_log;
DROP POLICY IF EXISTS "view log insert own" ON profile_view_log;
CREATE POLICY "view log own target" ON profile_view_log FOR SELECT USING (auth.uid() = target_id);
CREATE POLICY "view log insert own" ON profile_view_log FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- ═══════════════════════════════════════════════════════════════════
-- 8. FIX profiles RLS — add UPDATE (was missing → profile save was broken)
-- ═══════════════════════════════════════════════════════════════════
DROP POLICY IF EXISTS "update own profile" ON profiles;
CREATE POLICY "update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- ═══════════════════════════════════════════════════════════════════
-- 9. CENTRAL AUTHORIZATION FUNCTION
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION authorize_profile_field(
  p_viewer_id uuid,
  p_target_id uuid,
  p_field_key text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_visibility      text;
  v_default         text;
  v_never_public    boolean;
  v_shared_insts    boolean;
  v_is_admin        boolean;
BEGIN
  -- Owner always sees own
  IF p_viewer_id IS NOT NULL AND p_viewer_id = p_target_id THEN
    RETURN true;
  END IF;

  -- Load field registry
  SELECT default_visibility, never_public 
    INTO v_default, v_never_public
    FROM profile_field_registry 
    WHERE field_key = p_field_key;

  IF NOT FOUND THEN RETURN false; END IF;

  -- User override or default
  SELECT visibility INTO v_visibility
    FROM profile_privacy_settings
    WHERE user_id = p_target_id AND field_key = p_field_key;

  IF v_visibility IS NULL THEN
    v_visibility := v_default;
  END IF;

  -- Never-public hard-lock (DOB, address, etc.)
  IF v_never_public AND v_visibility = 'public' THEN
    v_visibility := 'restricted';
  END IF;

  -- Anonymous viewer
  IF p_viewer_id IS NULL THEN
    RETURN v_visibility = 'public';
  END IF;

  CASE v_visibility
    WHEN 'public' THEN
      RETURN true;
    WHEN 'members' THEN
      RETURN true;
    WHEN 'institution' THEN
      SELECT EXISTS (
        SELECT 1 FROM memberships m1
        JOIN memberships m2 ON m1.institution_id = m2.institution_id
        WHERE m1.user_id = p_viewer_id AND m1.status = 'active'
          AND m2.user_id = p_target_id AND m2.status = 'active'
      ) INTO v_shared_insts;
      RETURN v_shared_insts;
    WHEN 'restricted' THEN
      -- Institution admin of target's institution
      SELECT EXISTS (
        SELECT 1 FROM memberships
        WHERE user_id = p_viewer_id 
          AND role IN ('admin','owner') 
          AND status = 'active'
          AND institution_id IN (
            SELECT institution_id FROM memberships 
            WHERE user_id = p_target_id AND status = 'active'
          )
      ) INTO v_is_admin;
      RETURN v_is_admin;
    ELSE
      RETURN false;
  END CASE;
END;
$$;

GRANT EXECUTE ON FUNCTION authorize_profile_field(uuid, uuid, text) TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════
-- 10. ENHANCED PUBLIC PROFILE (filtered projection + view log)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_public_profile_v2(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_target     profiles;
  v_result     jsonb := '{}'::jsonb;
  v_field      record;
  v_viewer_id  uuid := auth.uid();
BEGIN
  SELECT * INTO v_target FROM profiles 
    WHERE username = p_slug OR id::text = p_slug 
    LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  v_result := jsonb_build_object('id', v_target.id);

  FOR v_field IN SELECT field_key FROM profile_field_registry LOOP
    IF authorize_profile_field(v_viewer_id, v_target.id, v_field.field_key) THEN
      CASE v_field.field_key
        WHEN 'full_name'    THEN v_result := v_result || jsonb_build_object('full_name', v_target.full_name);
        WHEN 'avatar_url'   THEN v_result := v_result || jsonb_build_object('avatar_url', v_target.avatar_url);
        WHEN 'headline'     THEN v_result := v_result || jsonb_build_object('headline', v_target.headline);
        WHEN 'bio'          THEN v_result := v_result || jsonb_build_object('bio', v_target.bio);
        WHEN 'username'     THEN v_result := v_result || jsonb_build_object('username', v_target.username);
        WHEN 'location'     THEN v_result := v_result || jsonb_build_object('location', v_target.location);
        WHEN 'website'      THEN v_result := v_result || jsonb_build_object('website', v_target.website);
        WHEN 'expertise'    THEN v_result := v_result || jsonb_build_object('expertise', v_target.expertise);
        WHEN 'interests'    THEN v_result := v_result || jsonb_build_object('interests', v_target.interests);
        WHEN 'open_to'      THEN v_result := v_result || jsonb_build_object('open_to', v_target.open_to);
        WHEN 'social_links' THEN v_result := v_result || jsonb_build_object('social_links', v_target.social_links);
        WHEN 'primary_role' THEN v_result := v_result || jsonb_build_object('primary_role', v_target.primary_role);
        WHEN 'sub_role'     THEN v_result := v_result || jsonb_build_object('sub_role', v_target.sub_role);
        WHEN 'email'        THEN v_result := v_result || jsonb_build_object('email', v_target.email);
        WHEN 'phone'        THEN v_result := v_result || jsonb_build_object('phone', v_target.phone);
        WHEN 'date_of_birth' THEN v_result := v_result || jsonb_build_object('date_of_birth', v_target.date_of_birth);
        WHEN 'blood_group'  THEN v_result := v_result || jsonb_build_object('blood_group', v_target.blood_group);
        WHEN 'address'      THEN v_result := v_result || jsonb_build_object('address', v_target.address);
        ELSE NULL;
      END CASE;
    END IF;
  END LOOP;

  -- View log (only if not self)
  IF v_viewer_id IS NOT NULL AND v_viewer_id <> v_target.id THEN
    INSERT INTO profile_view_log (viewer_id, target_id, view_type)
    VALUES (v_viewer_id, v_target.id, 'profile');
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile_v2(text) TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════
-- 11. AGE BRACKET TRIGGER (STORED generated can't use current_date)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION compute_age_bracket()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.age_bracket := CASE
    WHEN NEW.date_of_birth IS NULL THEN NULL
    WHEN NEW.date_of_birth > current_date - interval '13 years' THEN 'minor_under_13'
    WHEN NEW.date_of_birth > current_date - interval '18 years' THEN 'minor_13_17'
    ELSE 'adult'
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_age_bracket ON profiles;
CREATE TRIGGER trg_compute_age_bracket
  BEFORE INSERT OR UPDATE OF date_of_birth ON profiles
  FOR EACH ROW EXECUTE FUNCTION compute_age_bracket();

-- ═══════════════════════════════════════════════════════════════════
-- 12. BACKFILL EXISTING DATA (safe — only fills NULLs)
-- ═══════════════════════════════════════════════════════════════════
UPDATE profiles SET age_bracket = CASE
    WHEN date_of_birth IS NULL THEN NULL
    WHEN date_of_birth > current_date - interval '13 years' THEN 'minor_under_13'
    WHEN date_of_birth > current_date - interval '18 years' THEN 'minor_13_17'
    ELSE 'adult'
  END
WHERE age_bracket IS NULL;

COMMIT;

-- =====================================================================
-- ROLLBACK (run manually if needed):
-- DROP TRIGGER IF EXISTS trg_compute_age_bracket ON profiles;
-- DROP FUNCTION IF EXISTS compute_age_bracket();
-- DROP FUNCTION IF EXISTS get_public_profile_v2(text);
-- DROP FUNCTION IF EXISTS authorize_profile_field(uuid, uuid, text);
-- DROP TABLE IF EXISTS profile_view_log;
-- DROP TABLE IF EXISTS consent_records;
-- DROP TABLE IF EXISTS verification_records;
-- DROP TABLE IF EXISTS profile_privacy_settings;
-- DROP TABLE IF EXISTS profile_field_registry;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS privacy_version;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS age_bracket;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS role_specific;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS profile_visibility;
-- DROP POLICY IF EXISTS "update own profile" ON profiles;
-- =====================================================================
