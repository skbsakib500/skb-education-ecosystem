-- SKB Migration 003: Verification System
-- Adds helpers + updates get_public_profile_v2 to include verification badges

BEGIN;

-- ═══════════════════════════════════════════════════════════════════
-- 1. CAN VERIFY? (admin/owner of shared institution)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION can_verify(
  p_verifier_id uuid,
  p_target_id uuid
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  IF p_verifier_id IS NULL OR p_target_id IS NULL THEN RETURN false; END IF;
  IF p_verifier_id = p_target_id THEN RETURN false; END IF;

  RETURN EXISTS (
    SELECT 1
    FROM memberships m_verif
    JOIN memberships m_target ON m_verif.institution_id = m_target.institution_id
    WHERE m_verif.user_id = p_verifier_id
      AND m_verif.role IN ('admin','owner')
      AND m_verif.status = 'active'
      AND m_target.user_id = p_target_id
      AND m_target.status = 'active'
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 2. GRANT VERIFICATION (admin-only via can_verify check)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION grant_verification(
  p_target_id uuid,
  p_verification_type text DEFAULT 'institution',
  p_evidence_url text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_record_id uuid;
  v_existing uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT can_verify(v_me, p_target_id) THEN
    RAISE EXCEPTION 'Not authorized to verify this user';
  END IF;

  IF p_verification_type NOT IN ('identity','institution','credential','achievement') THEN
    RAISE EXCEPTION 'Invalid verification type';
  END IF;

  -- Check existing active
  SELECT id INTO v_existing
    FROM verification_records
    WHERE subject_type = p_verification_type
      AND subject_id = p_target_id
      AND status = 'verified'
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1;

  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('id', v_existing, 'status', 'already_verified');
  END IF;

  INSERT INTO verification_records (
    subject_type, subject_id, verification_type, issuer_id, status, evidence_url, verified_at
  ) VALUES (
    p_verification_type, p_target_id, p_verification_type, v_me, 'verified', p_evidence_url, now()
  )
  RETURNING id INTO v_record_id;

  -- Log to audit
  INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_me, 'verification.granted', 'profile', p_target_id,
    jsonb_build_object('type', p_verification_type, 'record_id', v_record_id)
  );

  RETURN jsonb_build_object('id', v_record_id, 'status', 'verified');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 3. REVOKE VERIFICATION
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION revoke_verification(
  p_record_id uuid,
  p_reason text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_target uuid;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT subject_id INTO v_target FROM verification_records WHERE id = p_record_id;
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'Verification record not found';
  END IF;

  IF NOT (can_verify(v_me, v_target) OR is_platform_admin()) THEN
    RAISE EXCEPTION 'Not authorized to revoke this verification';
  END IF;

  UPDATE verification_records
  SET status = 'revoked',
      revoked_at = now(),
      revoked_reason = p_reason
  WHERE id = p_record_id;

  INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_me, 'verification.revoked', 'profile', v_target,
    jsonb_build_object('record_id', p_record_id, 'reason', p_reason)
  );

  RETURN jsonb_build_object('status', 'revoked');
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 4. GET BADGES FOR A USER (public, safe info only)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_verification_badges(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', vr.id,
    'type', vr.verification_type,
    'verified_at', vr.verified_at,
    'issuer_id', vr.issuer_id
  ) ORDER BY vr.verified_at DESC), '[]'::jsonb) INTO v_result
  FROM verification_records vr
  WHERE vr.subject_id = p_user_id
    AND vr.status = 'verified'
    AND (vr.expires_at IS NULL OR vr.expires_at > now());

  RETURN v_result;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 5. PENDING VERIFICATIONS FOR MY INSTITUTIONS (admin view)
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION my_verifiable_members()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  avatar_url text,
  username text,
  primary_role text,
  institution_id uuid,
  institution_name text,
  institution_slug text,
  is_verified boolean,
  verification_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
BEGIN
  IF v_me IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.full_name,
    p.avatar_url,
    p.username,
    p.primary_role,
    i.id AS institution_id,
    i.name AS institution_name,
    i.slug AS institution_slug,
    EXISTS (
      SELECT 1 FROM verification_records vr
      WHERE vr.subject_id = p.id
        AND vr.status = 'verified'
        AND (vr.expires_at IS NULL OR vr.expires_at > now())
    ) AS is_verified,
    (
      SELECT vr.id FROM verification_records vr
      WHERE vr.subject_id = p.id
        AND vr.status = 'verified'
        AND (vr.expires_at IS NULL OR vr.expires_at > now())
      LIMIT 1
    ) AS verification_id
  FROM memberships m_me
  JOIN memberships m_target ON m_me.institution_id = m_target.institution_id
  JOIN profiles p ON p.id = m_target.user_id
  JOIN institutions i ON i.id = m_me.institution_id
  WHERE m_me.user_id = v_me
    AND m_me.role IN ('admin','owner')
    AND m_me.status = 'active'
    AND m_target.user_id <> v_me
    AND m_target.status = 'active'
    AND m_target.role IN ('teacher','staff')
  ORDER BY i.name, p.full_name;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- 6. UPDATE get_public_profile_v2 — include verification badges
-- ═══════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_public_profile_v2(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_target       profiles;
  v_result       jsonb := '{}'::jsonb;
  v_field        record;
  v_viewer_id    uuid := auth.uid();
  v_is_following boolean := false;
  v_recent_insts jsonb := '[]'::jsonb;
  v_posts        jsonb := '[]'::jsonb;
  v_badges       jsonb := '[]'::jsonb;
  v_is_admin     boolean := false;
BEGIN
  SELECT * INTO v_target FROM profiles
    WHERE username = p_slug OR id::text = p_slug
    LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  IF v_viewer_id IS NOT NULL AND v_viewer_id <> v_target.id THEN
    SELECT EXISTS (
      SELECT 1 FROM memberships
      WHERE user_id = v_viewer_id
        AND role IN ('admin','owner')
        AND status = 'active'
        AND institution_id IN (
          SELECT institution_id FROM memberships
          WHERE user_id = v_target.id AND status = 'active'
        )
    ) INTO v_is_admin;
  END IF;

  IF v_target.profile_visibility = 'restricted'
     AND v_viewer_id IS DISTINCT FROM v_target.id
     AND NOT v_is_admin THEN
    IF v_viewer_id IS NOT NULL THEN
      INSERT INTO profile_view_log (viewer_id, target_id, view_type)
      VALUES (v_viewer_id, v_target.id, 'profile');
    END IF;
    RETURN jsonb_build_object(
      'id', v_target.id,
      'is_me', false,
      'locked', true,
      'username', v_target.username
    );
  END IF;

  v_result := jsonb_build_object(
    'id', v_target.id,
    'is_me', (v_viewer_id IS NOT NULL AND v_viewer_id = v_target.id),
    'locked', false,
    'followers_count', COALESCE(v_target.followers_count, 0),
    'following_count', COALESCE(v_target.following_count, 0),
    'created_at', v_target.created_at
  );

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

  -- Verification badges (always safe to show)
  v_badges := get_verification_badges(v_target.id);
  v_result := v_result || jsonb_build_object('verification_badges', v_badges);

  IF v_viewer_id IS NOT NULL AND v_viewer_id <> v_target.id THEN
    SELECT EXISTS (
      SELECT 1 FROM social_follows
      WHERE follower_id = v_viewer_id AND following_id = v_target.id
    ) INTO v_is_following;
  END IF;
  v_result := v_result || jsonb_build_object('is_following', v_is_following);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'name', i.name, 'slug', i.slug, 'emoji', i.emoji, 'role', m.role
  )), '[]'::jsonb) INTO v_recent_insts
  FROM (
    SELECT institution_id, role FROM memberships
    WHERE user_id = v_target.id AND status = 'active'
    LIMIT 10
  ) m
  JOIN institutions i ON i.id = m.institution_id
  WHERE i.status = 'active';

  v_result := v_result || jsonb_build_object('recent_institutions', v_recent_insts);

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', sp.id, 'content', sp.content, 'post_type', sp.post_type,
    'visibility', sp.visibility, 'likes_count', sp.likes_count,
    'comments_count', sp.comments_count, 'created_at', sp.created_at,
    'institution_id', sp.institution_id
  ) ORDER BY sp.created_at DESC), '[]'::jsonb) INTO v_posts
  FROM (
    SELECT * FROM social_posts
    WHERE user_id = v_target.id AND visibility = 'public'
    ORDER BY created_at DESC LIMIT 20
  ) sp;

  v_result := v_result || jsonb_build_object('posts', v_posts);

  IF v_viewer_id IS NOT NULL AND v_viewer_id <> v_target.id THEN
    INSERT INTO profile_view_log (viewer_id, target_id, view_type)
    VALUES (v_viewer_id, v_target.id, 'profile');
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION can_verify(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION grant_verification(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_verification(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_verification_badges(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION my_verifiable_members() TO authenticated;
GRANT EXECUTE ON FUNCTION get_public_profile_v2(text) TO authenticated, anon;

COMMIT;
