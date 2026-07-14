-- ============================================================================
-- 05_verified_effects.sql — Golden Set 검증 정답 테이블
-- ============================================================================
-- 영선의 비전 (RESEARCH_SOP.md):
--   - SMD는 Cochrane/메타분석 풀텍스트 forest plot에서 직접 추출
--   - 같은 성분이라도 variant 다르면 SMD 다름 (Rotta vs Non-Rotta, 시점별, 용량별)
--   - 출처 신뢰도 명시 (smd_source)
--   - 이해상충(funding_bias) 별도 표시
--   - 추정 금지 — 못 찾으면 보류 (smd NULL OK)
--
-- 사용 방법:
--   Supabase Dashboard > SQL Editor > New Query > 통째 붙여넣고 Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS verified_effects (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- 식별
  verified_id       TEXT NOT NULL,    -- golden_set의 substance_id (예: 'glucosamine_rotta')
  condition_id      UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  substance_id      UUID REFERENCES substances(id) ON DELETE SET NULL,  -- 매칭 안 되면 NULL

  -- 표시명
  name_ko           TEXT NOT NULL,
  name_en           TEXT,
  variant_label     TEXT,             -- "Rotta/Crystalline", "6개월", "200mg/day", "강화제형" 등
  substance_type    TEXT,             -- supplement / prescription / topical_rx / injection_rx / OTC

  -- 수치
  smd               NUMERIC,
  ci_lower          NUMERIC,
  ci_upper          NUMERIC,
  studies_count     INTEGER,
  patients_count    INTEGER,

  -- 출처 신뢰도 (RESEARCH_SOP §4)
  smd_source        TEXT NOT NULL CHECK (
    smd_source IN (
      'direct',                       -- forest plot 직접 추출
      'MD_converted',                 -- MD + SD → SMD 환산
      'NNT_converted',                -- NNT → Cohen's d 환산
      'single_RCT_estimated',         -- 단일 trial 기반 추정
      'active_comparator_equivalence',-- 활성 대조군 비열등
      'secondary_citation',           -- 강의/리뷰가 인용 (원본 미확보)
      'alternative_metric_only'       -- SMD 없고 다른 지표만
    )
  ),
  is_estimated      BOOLEAN DEFAULT FALSE,

  -- 등급 (Cochrane GRADE 그대로)
  evidence_grade    TEXT CHECK (
    evidence_grade IN ('high','moderate','low','very_low') OR evidence_grade IS NULL
  ),

  -- 안전 / 편향
  funding_bias      BOOLEAN DEFAULT FALSE,
  warnings          TEXT[],            -- ["출판 편향 의심: ...", "위약 수준", ...]

  -- 출처
  source_code       TEXT,              -- "CD002946", "Zeng 2018" 등
  source_url        TEXT,              -- DOI 또는 PMC URL

  -- 추가 컨텍스트
  notes             TEXT,
  effect_direction  TEXT DEFAULT 'pain_reduction',  -- "pain_reduction" 또는 "function_improvement" 등

  -- 검수
  verified_by       TEXT DEFAULT '영선(약사) + AI',
  verified_at       TIMESTAMPTZ DEFAULT NOW(),

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (verified_id, condition_id)
);

CREATE INDEX IF NOT EXISTS idx_ve_condition ON verified_effects(condition_id);
CREATE INDEX IF NOT EXISTS idx_ve_substance ON verified_effects(substance_id) WHERE substance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ve_funding   ON verified_effects(funding_bias) WHERE funding_bias;

-- updated_at trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_ve_updated_at ON verified_effects;
    CREATE TRIGGER trg_ve_updated_at BEFORE UPDATE ON verified_effects
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;

-- 검증
-- SELECT COUNT(*) AS verified_count FROM verified_effects;
-- SELECT name_ko, smd, smd_source, evidence_grade, funding_bias FROM verified_effects WHERE condition_id = (SELECT id FROM conditions WHERE slug='osteoarthritis') ORDER BY smd NULLS LAST;
