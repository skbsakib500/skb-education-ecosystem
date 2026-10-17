-- SKB Migration 002: Enrich get_public_profile_v2 with counts, posts, institutions, lock status
-- Idempotent: CREATE OR REPLACE

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
  v_is_admin     boolean := false;
BEGIN
  SELECT * INTO v_target FROM profiles
    WHERE username = p_slug OR id::text = p_slug
    LIMIT 1;

  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Admin check (viewer admin of any of target's institutions?)
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

  -- LOCKED profile — not self, not admin
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

  -- Base (always safe)
  v_result := jsonb_build_object(
    'id', v_target.id,
    'is_me', (v_viewer_id IS NOT NULL AND v_viewer_id = v_target.id),
    'locked', false,
    'followers_count', COALESCE(v_target.followers_count, 0),
    'following_count', COALESCE(v_target.following_count, 0),
    'created_at', v_target.created_at
  );

  -- Field-by-field authorization
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

  -- Follow status
  IF v_viewer_id IS NOT NULL AND v_viewer_id <> v_target.id THEN
    SELECT EXISTS (
      SELECT 1 FROM social_follows
      WHERE follower_id = v_viewer_id AND following_id = v_target.id
    ) INTO v_is_following;
  END IF;
  v_result := v_result || jsonb_build_object('is_following', v_is_following);

  -- Recent institutions (public metadata)
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

  -- Recent public posts
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', sp.id,
    'content', sp.content,
    'post_type', sp.post_type,
    'visibility', sp.visibility,
    'likes_count', sp.likes_count,
    'comments_count', sp.comments_count,
    'created_at', sp.created_at,
    'institution_id', sp.institution_id
  ) ORDER BY sp.created_at DESC), '[]'::jsonb) INTO v_posts
  FROM (
    SELECT * FROM social_posts
    WHERE user_id = v_target.id AND visibility = 'public'
    ORDER BY created_at DESC
    LIMIT 20
  ) sp;

  v_result := v_result || jsonb_build_object('posts', v_posts);

  -- View log
  IF v_viewer_id IS NOT NULL AND v_viewer_id <> v_target.id THEN
    INSERT INTO profile_view_log (viewer_id, target_id, view_type)
    VALUES (v_viewer_id, v_target.id, 'profile');
  END IF;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_profile_v2(text) TO authenticated, anon;
