-- ============================================================================
-- 04_study_substance_effects.sql — Multi-substance 추출 결과 테이블 (v3)
-- ============================================================================
-- 영선의 비전:
--   - 한 abstract = 한 번 읽음 (Claude 호출 절약)
--   - 거기 나오는 모든 성분 × 모든 효과 정보 보존
--   - 수치(SMD/CI/p) + 카테고리(large/small) + narrative 같이 저장
--   - "틀에 안 맞는 정보를 버리지 않기"
--
-- 사용 방법:
--   Supabase Dashboard > SQL Editor > New Query > 이 파일 통째로 붙여넣기 > Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- study_extractions_v2: abstract 한 편 = 한 row.
--   기존 study_extractions(트리플 단위)는 그대로 두고 병행.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_extractions_v2 (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  condition_id    UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,

  -- 추출 모드
  extraction_mode TEXT NOT NULL CHECK (extraction_mode IN ('meta_sr', 'rct')),

  -- meta/SR 공통 필드
  primary_condition         TEXT,
  study_design_summary      TEXT,
  n_studies_included        INTEGER,
  total_sample_size         INTEGER,
  evidence_grade_stated     TEXT,
  is_multi_substance        BOOLEAN,
  head_to_head_comparisons  JSONB,

  -- RCT 전용 필드
  substance_focus_id        UUID REFERENCES substances(id) ON DELETE SET NULL,
  comparator                TEXT,
  population_detail         TEXT,
  population_type           TEXT,
  sample_size_total         INTEGER,
  sample_size_treatment     INTEGER,
  sample_size_control       INTEGER,
  design_features           JSONB,
  dose_value                NUMERIC,
  dose_unit                 TEXT,
  duration_weeks            INTEGER,
  primary_outcome           JSONB,
  secondary_outcomes        JSONB,
  relevance_score           NUMERIC,
  extraction_confidence     NUMERIC,

  -- 공통: 서술/메타
  safety_notes              TEXT,
  limitations               TEXT,
  authors_conclusion        TEXT,
  extra_notes               TEXT,

  -- 원본/처리
  ai_model                  TEXT NOT NULL DEFAULT 'claude-opus-4-7',
  ai_raw_response           TEXT,
  extracted_at              TIMESTAMPTZ DEFAULT NOW(),
  is_valid                  BOOLEAN DEFAULT TRUE,
  reviewed                  BOOLEAN DEFAULT FALSE,
  reviewed_by               TEXT,
  reviewed_at               TIMESTAMPTZ,

  created_at                TIMESTAMPTZ DEFAULT NOW(),
  updated_at                TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (study_id, condition_id, extraction_mode, substance_focus_id)
);

CREATE INDEX IF NOT EXISTS idx_v2_study      ON study_extractions_v2(study_id);
CREATE INDEX IF NOT EXISTS idx_v2_condition  ON study_extractions_v2(condition_id);
CREATE INDEX IF NOT EXISTS idx_v2_mode       ON study_extractions_v2(extraction_mode);
CREATE INDEX IF NOT EXISTS idx_v2_valid      ON study_extractions_v2(is_valid) WHERE is_valid;
CREATE INDEX IF NOT EXISTS idx_v2_subfocus   ON study_extractions_v2(substance_focus_id) WHERE substance_focus_id IS NOT NULL;


-- ----------------------------------------------------------------------------
-- study_substance_effects: study_extractions_v2 안의 "한 성분 × 효과" 한 row.
--   예: PMID 29018060 (20개 성분 종합 리뷰) → v2 1행 + 이 테이블 20행
--   RCT의 경우: v2 1행 + 이 테이블 1행 (primary_outcome 복사 보관)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_substance_effects (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_v2_id    UUID NOT NULL REFERENCES study_extractions_v2(id) ON DELETE CASCADE,
  study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  condition_id        UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,

  -- 성분 매핑: AI가 뽑은 raw 이름 + 우리 DB substance에 매핑된 id (매칭 안 되면 NULL)
  substance_id        UUID REFERENCES substances(id) ON DELETE SET NULL,
  substance_name_raw  TEXT NOT NULL,

  -- 개입 상세
  intervention_detail TEXT,
  comparator          TEXT,
  outcome_measure     TEXT,
  timepoint           TEXT,  -- short_term / medium_term / long_term / unclear

  -- 효과 수치
  effect_metric       TEXT,  -- SMD / MD / Hedges_g / OR / RR / HR / percent / null
  effect_value        NUMERIC,
  ci_lower            NUMERIC,
  ci_upper            NUMERIC,
  p_value             NUMERIC,
  n_studies_for_substance INTEGER,

  -- 효과 카테고리 (수치 없어도 보존)
  effect_size_category TEXT CHECK (
    effect_size_category IN ('large','moderate','small','null_effect','negative','unclear') OR effect_size_category IS NULL
  ),
  clinical_importance  TEXT CHECK (
    clinical_importance IN ('clinically_important','not_clinically_important','unclear') OR clinical_importance IS NULL
  ),
  effect_direction     TEXT CHECK (
    effect_direction IN ('positive','null','negative','mixed') OR effect_direction IS NULL
  ),

  -- 서술 정보
  narrative           TEXT,
  quality_note        TEXT,

  -- 출처 표시 (메타/SR/RCT)
  source_study_type   TEXT,  -- meta_analysis / systematic_review / rct
  is_primary_outcome  BOOLEAN DEFAULT FALSE,  -- RCT의 경우 primary outcome인지

  -- 가중치 계산용 캐싱
  study_sample_size   INTEGER,
  study_year          INTEGER,

  is_valid            BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sse_study      ON study_substance_effects(study_id);
CREATE INDEX IF NOT EXISTS idx_sse_substance  ON study_substance_effects(substance_id) WHERE substance_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sse_condition  ON study_substance_effects(condition_id);
CREATE INDEX IF NOT EXISTS idx_sse_cell       ON study_substance_effects(substance_id, condition_id) WHERE substance_id IS NOT NULL AND is_valid;
CREATE INDEX IF NOT EXISTS idx_sse_metric     ON study_substance_effects(effect_metric) WHERE effect_value IS NOT NULL;


-- ----------------------------------------------------------------------------
-- updated_at trigger (이미 helper_functions에 set_updated_at 있다고 가정)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    DROP TRIGGER IF EXISTS trg_v2_updated_at ON study_extractions_v2;
    CREATE TRIGGER trg_v2_updated_at BEFORE UPDATE ON study_extractions_v2
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END$$;


-- ----------------------------------------------------------------------------
-- 검증 쿼리 (실행 후 확인용)
-- ----------------------------------------------------------------------------
-- SELECT COUNT(*) AS extractions_v2 FROM study_extractions_v2;
-- SELECT COUNT(*) AS substance_effects FROM study_substance_effects;
-- SELECT * FROM study_substance_effects LIMIT 3;
