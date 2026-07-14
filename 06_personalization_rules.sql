-- ============================================================================
-- 06_personalization_rules.sql — 환자 프로파일 기반 맞춤 추천 룰
-- ============================================================================
-- 영선의 비전: 환자가 입력한 정보(BMI/동반질환/복용약)에 따라 약사 권고 메시지 +
--   추천 영양제·약 + 주의해야 할 영양제·약을 표시.
--
-- 사용 방법: Supabase Dashboard > SQL Editor > 통째로 붙여넣고 Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS personalization_rules (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condition_id    UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,

  -- 매칭 조건 (JSONB, 모두 AND. 조건 부재시 모든 사람에게 매칭)
  -- 예: {"bmi_min": 27}
  --     {"diabetes": true}
  --     {"anticoagulant": true}
  --     {"age_min": 65}
  --     {"liver_impaired": true, "drug_class_avoid": ["NSAID"]}
  match_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- 표시 우선순위 (1=최우선/금기/안전, 2=경고/대안, 3=참고/보완)
  rank            INT NOT NULL CHECK (rank IN (1, 2, 3)),
  icon            TEXT,  -- "🥇" / "⚠" / "✓" / "💊"
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,

  -- 강조할 substance (산점도/표에 ✨ 표시) + 그 verified_id (variant 특정)
  highlight_substance_ids UUID[] DEFAULT ARRAY[]::UUID[],
  highlight_verified_ids  TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 비추천/주의 substance (산점도/표에 회색 처리 또는 경고)
  avoid_substance_ids UUID[] DEFAULT ARRAY[]::UUID[],
  avoid_verified_ids  TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- 메타
  rule_code       TEXT UNIQUE,  -- "oa_bmi_high", "oa_diabetes" 등
  is_active       BOOLEAN DEFAULT TRUE,
  display_order   INT DEFAULT 0,
  authored_by     TEXT DEFAULT '영선(약사)',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rules_condition ON personalization_rules(condition_id);
CREATE INDEX IF NOT EXISTS idx_rules_active    ON personalization_rules(is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS idx_rules_rank      ON personalization_rules(rank);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_rules_updated_at ON personalization_rules;
    CREATE TRIGGER trg_rules_updated_at BEFORE UPDATE ON personalization_rules
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- 검증 쿼리
-- SELECT rank, title, jsonb_pretty(match_conditions) FROM personalization_rules ORDER BY rank, display_order;
