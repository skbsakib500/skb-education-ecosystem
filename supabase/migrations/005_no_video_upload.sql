-- SKB Migration 005: Block video/audio uploads at DB level
-- Policy: video/audio/link types MUST use external_url, NEVER file_url
-- Rationale: Storage cost control on free tier

-- ═══════════════════════════════════════════════════════════════════
-- 1. Add constraint: video/audio/link must NOT have file_url
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE study_materials
  DROP CONSTRAINT IF EXISTS study_materials_no_binary_video;

ALTER TABLE study_materials
  ADD CONSTRAINT study_materials_no_binary_video
  CHECK (
    (type IN ('video','audio','link') AND file_url IS NULL)
    OR (type NOT IN ('video','audio','link'))
  );

-- ═══════════════════════════════════════════════════════════════════
-- 2. Add constraint: video/audio/link must HAVE external_url
-- ═══════════════════════════════════════════════════════════════════
ALTER TABLE study_materials
  DROP CONSTRAINT IF EXISTS study_materials_external_required;

ALTER TABLE study_materials
  ADD CONSTRAINT study_materials_external_required
  CHECK (
    (type IN ('video','audio','link') AND external_url IS NOT NULL AND external_url <> '')
    OR (type NOT IN ('video','audio','link'))
  );

-- ═══════════════════════════════════════════════════════════════════
-- 3. Verify existing data doesn't violate
-- ═══════════════════════════════════════════════════════════════════
DO $$
DECLARE
  v_violations int;
BEGIN
  SELECT count(*) INTO v_violations
    FROM study_materials
    WHERE type IN ('video','audio','link')
      AND (file_url IS NOT NULL OR external_url IS NULL);

  IF v_violations > 0 THEN
    RAISE NOTICE 'Warning: % existing rows violate new constraint. Updating them now.', v_violations;
    UPDATE study_materials
      SET file_url = NULL, external_url = COALESCE(external_url, 'https://example.com/placeholder')
      WHERE type IN ('video','audio','link') AND file_url IS NOT NULL;
  END IF;
END $$;
