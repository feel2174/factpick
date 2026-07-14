-- ============================================================================
-- FactPick (팩트픽) — 한국형 Examine.com 데이터베이스 스키마
-- ============================================================================
-- 약사 검수 기반 의약품/영양제 증거 등급화 시스템
-- 
-- 실행 방법:
--   Supabase Dashboard > SQL Editor > New Query > 전체 붙여넣기 > Run
--   또는: psql -h <host> -U postgres -d postgres -f 01_schema.sql
--
-- 구조 개요:
--   [1] 마스터 데이터: substances, conditions, populations, korean_regulatory
--   [2] 논문 데이터: studies, study_extractions
--   [3] 증거 매트릭스: evidence_cells, evidence_studies, evidence_revisions
--   [4] 표시용: substance_profiles, pharmacist_notes, population_warning_rules
--   [5] 성능: materialized view (condition_scatter_data)
-- ============================================================================

-- 확장 모듈 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- 텍스트 검색용

-- ============================================================================
-- [1] 마스터 데이터
-- ============================================================================

-- ----------------------------------------------------------------------------
-- substances: 성분/약물 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE substances (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  name_ko         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_zh         TEXT,
  aliases         TEXT[] DEFAULT '{}',
  
  category        TEXT NOT NULL,           -- vitamin/mineral/herb/amino_acid/probiotic/drug_nsaid 등
  substance_type  TEXT NOT NULL,           -- 'supplement' / 'drug' / 'both'
  
  description_ko  TEXT,
  description_en  TEXT,
  
  pubmed_mesh     TEXT[] DEFAULT '{}',     -- PubMed 검색 키워드
  cas_number      TEXT,                    -- 화학물질 식별번호
  
  extra           JSONB DEFAULT '{}'::jsonb,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_substances_category ON substances(category);
CREATE INDEX idx_substances_type ON substances(substance_type);
CREATE INDEX idx_substances_name_trgm ON substances USING gin (name_ko gin_trgm_ops);

-- ----------------------------------------------------------------------------
-- conditions: 질환/적응증 마스터 (계층 구조 지원)
-- ----------------------------------------------------------------------------
CREATE TABLE conditions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  name_ko       TEXT NOT NULL,
  name_en       TEXT NOT NULL,
  name_zh       TEXT,
  
  icd10         TEXT,
  category      TEXT NOT NULL,             -- musculoskeletal/cardiovascular/metabolic/cognitive 등
  parent_id     UUID REFERENCES conditions(id),  -- 관절염 > 골관절염 계층
  
  description_ko  TEXT,
  search_terms    TEXT[] DEFAULT '{}',     -- PubMed 검색용
  
  display_order   INT DEFAULT 0,
  is_published    BOOLEAN DEFAULT FALSE,
  
  extra           JSONB DEFAULT '{}'::jsonb,
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conditions_category ON conditions(category);
CREATE INDEX idx_conditions_parent ON conditions(parent_id);
CREATE INDEX idx_conditions_published ON conditions(is_published) WHERE is_published;

-- ----------------------------------------------------------------------------
-- populations: 인구집단 마스터
-- ----------------------------------------------------------------------------
CREATE TABLE populations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug            TEXT UNIQUE NOT NULL,
  name_ko         TEXT NOT NULL,
  name_en         TEXT NOT NULL,
  name_zh         TEXT,
  
  is_default      BOOLEAN DEFAULT FALSE,   -- 'healthy_adult'만 true
  display_order   INT DEFAULT 0,
  
  description_ko  TEXT,
  icon            TEXT,                    -- UI 칩 아이콘 이름 (Tabler icon)
  
  parent_id       UUID REFERENCES populations(id),  -- 당뇨 > 1형/2형 계층
  
  extra           JSONB DEFAULT '{}'::jsonb,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_populations_one_default 
  ON populations(is_default) WHERE is_default = TRUE;

-- ----------------------------------------------------------------------------
-- korean_regulatory: 한국 허가/규제 정보
-- ----------------------------------------------------------------------------
CREATE TABLE korean_regulatory (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  substance_id        UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
  
  -- 허가 상태
  mfds_drug_approved  BOOLEAN DEFAULT FALSE,   -- 식약처 의약품 허가
  mfds_functional     BOOLEAN DEFAULT FALSE,   -- 건강기능식품 인정
  prescription_only   BOOLEAN DEFAULT FALSE,   -- 전문의약품
  
  -- 식약처 인정 기능성 (건기식)
  approved_functions  TEXT[] DEFAULT '{}',
  
  -- DUR 정보 (요약)
  has_dur_warnings    BOOLEAN DEFAULT FALSE,
  
  -- 데이터 출처
  mfds_url            TEXT,
  last_synced_at      TIMESTAMPTZ,
  
  extra               JSONB DEFAULT '{}'::jsonb,
  
  UNIQUE(substance_id)
);

CREATE INDEX idx_korean_reg_substance ON korean_regulatory(substance_id);

-- ============================================================================
-- [2] 논문 데이터 (AI 수집 + 추출)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- studies: 논문 메타데이터 (raw, AI 수집)
-- ----------------------------------------------------------------------------
CREATE TABLE studies (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  pubmed_id       TEXT UNIQUE,
  doi             TEXT,
  openalex_id     TEXT,
  
  title           TEXT NOT NULL,
  abstract        TEXT,
  
  journal         TEXT,
  journal_if      NUMERIC,                 -- JCR 매핑 테이블 참조
  year            INT,
  
  -- AI 자동 분류
  study_type      TEXT,                    -- meta_analysis/systematic_review/rct/cohort/case_control/case_report
  sample_size     INT,
  duration_weeks  INT,
  
  -- 원본 메타데이터 (확장성)
  raw_metadata    JSONB DEFAULT '{}'::jsonb,
  
  source_api      TEXT,                    -- 'pubmed'/'openalex'/'semantic_scholar'
  fetched_at      TIMESTAMPTZ DEFAULT NOW(),
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_studies_pubmed ON studies(pubmed_id);
CREATE INDEX idx_studies_doi ON studies(doi);
CREATE INDEX idx_studies_year ON studies(year);
CREATE INDEX idx_studies_type ON studies(study_type);

-- ----------------------------------------------------------------------------
-- study_extractions: AI가 추출한 PICO + 결과
-- (논문 한 편이 여러 substance × condition 조합에 매핑될 수 있음)
-- ----------------------------------------------------------------------------
CREATE TABLE study_extractions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id        UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  
  substance_id    UUID NOT NULL REFERENCES substances(id),
  condition_id    UUID NOT NULL REFERENCES conditions(id),
  population_id   UUID REFERENCES populations(id),  -- NULL이면 fallback to default
  
  -- 효과 데이터
  effect_direction  TEXT,                  -- positive/null/negative/mixed
  effect_metric     TEXT,                  -- SMD/MD/RR/OR/HR
  effect_value      NUMERIC,
  ci_lower          NUMERIC,
  ci_upper          NUMERIC,
  p_value           NUMERIC,
  
  -- 용량
  dose_value      NUMERIC,
  dose_unit       TEXT,
  duration_weeks  INT,
  
  -- 품질 평가 (AI 자동)
  rob_score       TEXT,                    -- low/some/high (Risk of Bias)
  
  -- AI 메타
  ai_confidence   NUMERIC,                 -- 0~1 (AI 자신의 추출 신뢰도)
  ai_model        TEXT DEFAULT 'claude-opus-4-7',
  ai_notes        TEXT,
  extracted_at    TIMESTAMPTZ DEFAULT NOW(),
  
  -- 사람 검토
  reviewed        BOOLEAN DEFAULT FALSE,
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  is_valid        BOOLEAN DEFAULT TRUE,    -- 잘못 추출된 경우 false
  
  extra           JSONB DEFAULT '{}'::jsonb,
  
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extractions_study ON study_extractions(study_id);
CREATE INDEX idx_extractions_triple 
  ON study_extractions(substance_id, condition_id, population_id);
CREATE INDEX idx_extractions_valid ON study_extractions(is_valid) WHERE is_valid;

-- ============================================================================
-- [3] 증거 매트릭스 (★ 핵심 테이블)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- evidence_cells: substance × condition × population 매트릭스
-- 산점도의 점 하나 = 이 테이블의 행 하나
-- ----------------------------------------------------------------------------
CREATE TABLE evidence_cells (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  substance_id      UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
  condition_id      UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  population_id     UUID NOT NULL REFERENCES populations(id),
  
  -- ★ 산점도 좌표 (자동 계산)
  efficacy_score    NUMERIC(3,2),          -- Y축: 0~5 (SMD 절댓값 정규화)
  evidence_score    NUMERIC(3,2),          -- X축: 0~5 (근거 신뢰도)
  grade             CHAR(1),                -- A/B/C/D/F (최종)
  safety_grade      CHAR(1),                -- 안전성 별도 등급
  
  -- 산출 근거 (투명성)
  smd_pooled        NUMERIC,                -- 합산 효과 크기
  ci_lower          NUMERIC,
  ci_upper          NUMERIC,
  i_squared         NUMERIC,                -- 이질성 (메타분석 지표)
  study_count_meta  INT DEFAULT 0,
  study_count_rct   INT DEFAULT 0,
  study_count_obs   INT DEFAULT 0,
  total_sample_size INT DEFAULT 0,          -- 산점도 점 크기에 사용
  consistency       NUMERIC(3,2),           -- 0~1 (positive 비율)
  
  -- 용량 권장 (AI 추정)
  dose_min          NUMERIC,
  dose_max          NUMERIC,
  dose_unit         TEXT,
  
  -- AI 출력 (raw, 매일 재계산)
  ai_grade          CHAR(1),
  ai_efficacy_score NUMERIC(3,2),
  ai_evidence_score NUMERIC(3,2),
  ai_summary_ko     TEXT,
  ai_summary_en     TEXT,
  ai_summary_zh     TEXT,
  ai_calculated_at  TIMESTAMPTZ,
  
  -- 사람 검토 (영선님)
  reviewed_grade    CHAR(1),
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  review_status     TEXT DEFAULT 'pending', -- pending/approved/rejected/needs_update
  review_notes      TEXT,
  
  -- 표시 제어
  is_published      BOOLEAN DEFAULT FALSE,
  display_priority  INT DEFAULT 0,
  
  -- fallback 플래그 (이 cell이 healthy_adult 데이터를 다른 인구집단에 적용 중인지)
  is_fallback       BOOLEAN DEFAULT FALSE,
  
  extra             JSONB DEFAULT '{}'::jsonb,
  
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(substance_id, condition_id, population_id)
);

CREATE INDEX idx_cells_substance ON evidence_cells(substance_id);
CREATE INDEX idx_cells_condition ON evidence_cells(condition_id);
CREATE INDEX idx_cells_population ON evidence_cells(population_id);
CREATE INDEX idx_cells_published ON evidence_cells(is_published) WHERE is_published;
CREATE INDEX idx_cells_grade ON evidence_cells(grade) WHERE is_published;
CREATE INDEX idx_cells_review ON evidence_cells(review_status) WHERE review_status = 'pending';

-- ----------------------------------------------------------------------------
-- evidence_studies: cell ↔ study 연결 (m:n)
-- ----------------------------------------------------------------------------
CREATE TABLE evidence_studies (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cell_id             UUID NOT NULL REFERENCES evidence_cells(id) ON DELETE CASCADE,
  study_id            UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
  extraction_id       UUID REFERENCES study_extractions(id),
  
  weight              NUMERIC,             -- 가중치 (메타분석 우선)
  relevance_score     NUMERIC,             -- 0~1
  
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(cell_id, study_id)
);

CREATE INDEX idx_evstudies_cell ON evidence_studies(cell_id);
CREATE INDEX idx_evstudies_study ON evidence_studies(study_id);

-- ----------------------------------------------------------------------------
-- evidence_revisions: 등급 변경 이력 (감사 추적)
-- ----------------------------------------------------------------------------
CREATE TABLE evidence_revisions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cell_id       UUID NOT NULL REFERENCES evidence_cells(id) ON DELETE CASCADE,
  
  old_grade     CHAR(1),
  new_grade     CHAR(1),
  old_efficacy  NUMERIC(3,2),
  new_efficacy  NUMERIC(3,2),
  old_evidence  NUMERIC(3,2),
  new_evidence  NUMERIC(3,2),
  
  reason        TEXT,                      -- new_meta_analysis/new_rct/reviewer_override/algorithm_update
  triggered_by  TEXT,                      -- ai_pipeline/pharmacist/system
  notes         TEXT,
  
  changed_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_revisions_cell ON evidence_revisions(cell_id, changed_at DESC);

-- ============================================================================
-- [4] 표시용 데이터
-- ============================================================================

-- ----------------------------------------------------------------------------
-- substance_profiles: 5축 레이더 차트용 점수
-- ----------------------------------------------------------------------------
CREATE TABLE substance_profiles (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  substance_id        UUID NOT NULL REFERENCES substances(id) ON DELETE CASCADE,
  
  -- 5축 (각 0~5)
  efficacy_overall    NUMERIC(3,2),        -- 효과 강도 (전체 cell 평균)
  evidence_quality    NUMERIC(3,2),        -- 증거 품질
  safety              NUMERIC(3,2),        -- 안전성
  cost_efficiency     NUMERIC(3,2),        -- 비용 효율성
  korean_accessibility NUMERIC(3,2),       -- 한국 접근성
  
  -- 비용 정보
  monthly_cost_min    INT,                 -- 월 비용 (원)
  monthly_cost_max    INT,
  
  calculated_at       TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(substance_id)
);

-- ----------------------------------------------------------------------------
-- pharmacist_notes: 약사 코멘트 (영선님 인사이트)
-- ----------------------------------------------------------------------------
CREATE TABLE pharmacist_notes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- 어디에 붙는 노트인지
  scope_type      TEXT NOT NULL,           -- substance/cell/condition
  scope_id        UUID NOT NULL,
  
  note_ko         TEXT NOT NULL,
  note_en         TEXT,
  note_zh         TEXT,
  
  -- 노트 유형
  note_type       TEXT DEFAULT 'insight',  -- insight/warning/recommendation/clarification
  
  is_published    BOOLEAN DEFAULT FALSE,
  display_order   INT DEFAULT 0,
  
  author          TEXT DEFAULT '시시약사',
  
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_scope ON pharmacist_notes(scope_type, scope_id) WHERE is_published;

-- ----------------------------------------------------------------------------
-- population_warning_rules: 인구집단 × 카테고리 자동 경고 룰
-- ----------------------------------------------------------------------------
CREATE TABLE population_warning_rules (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  population_id      UUID NOT NULL REFERENCES populations(id) ON DELETE CASCADE,
  
  -- 어떤 성분에 적용할지
  substance_category TEXT,                 -- 'all'/'herb'/'vitamin' 등 (null이면 전체)
  substance_id       UUID REFERENCES substances(id),  -- 특정 성분만이면 지정
  
  warning_type       TEXT NOT NULL,        -- avoid/caution/dose_adjust/monitor
  warning_ko         TEXT NOT NULL,
  warning_en         TEXT,
  warning_zh         TEXT,
  
  reference_url      TEXT,
  
  is_active          BOOLEAN DEFAULT TRUE,
  
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_warnings_pop ON population_warning_rules(population_id) WHERE is_active;
CREATE INDEX idx_warnings_substance ON population_warning_rules(substance_id) WHERE is_active;

-- ============================================================================
-- [5] 자동 업데이트 트리거
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_substances_updated BEFORE UPDATE ON substances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_conditions_updated BEFORE UPDATE ON conditions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_studies_updated BEFORE UPDATE ON studies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_cells_updated BEFORE UPDATE ON evidence_cells
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON pharmacist_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ----------------------------------------------------------------------------
-- 등급 변경 자동 이력 기록 트리거
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_evidence_revision()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.grade IS DISTINCT FROM NEW.grade) 
     OR (OLD.efficacy_score IS DISTINCT FROM NEW.efficacy_score)
     OR (OLD.evidence_score IS DISTINCT FROM NEW.evidence_score) THEN
    INSERT INTO evidence_revisions (
      cell_id, old_grade, new_grade,
      old_efficacy, new_efficacy,
      old_evidence, new_evidence,
      reason, triggered_by
    ) VALUES (
      NEW.id, OLD.grade, NEW.grade,
      OLD.efficacy_score, NEW.efficacy_score,
      OLD.evidence_score, NEW.evidence_score,
      COALESCE(NEW.review_notes, 'automatic_recalculation'),
      CASE WHEN NEW.reviewed_at > OLD.reviewed_at OR OLD.reviewed_at IS NULL 
           THEN 'pharmacist' ELSE 'ai_pipeline' END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cells_revision AFTER UPDATE ON evidence_cells
  FOR EACH ROW EXECUTE FUNCTION log_evidence_revision();

-- ============================================================================
-- [6] Materialized View — 산점도/표 프론트엔드용
-- ============================================================================

CREATE MATERIALIZED VIEW condition_scatter_data AS
SELECT 
  c.slug              AS condition_slug,
  c.name_ko           AS condition_name_ko,
  
  p.slug              AS population_slug,
  p.name_ko           AS population_name_ko,
  p.is_default        AS is_default_population,
  
  s.slug              AS substance_slug,
  s.name_ko           AS substance_name_ko,
  s.name_en           AS substance_name_en,
  s.category          AS substance_category,
  s.substance_type    AS substance_type,
  
  ec.id               AS cell_id,
  ec.efficacy_score,
  ec.evidence_score,
  ec.grade,
  ec.safety_grade,
  ec.total_sample_size,
  ec.study_count_meta,
  ec.study_count_rct,
  ec.study_count_obs,
  ec.smd_pooled,
  ec.ci_lower,
  ec.ci_upper,
  ec.dose_min,
  ec.dose_max,
  ec.dose_unit,
  ec.is_fallback,
  ec.ai_summary_ko,
  
  kr.mfds_drug_approved,
  kr.mfds_functional,
  kr.prescription_only,
  
  sp.monthly_cost_min,
  sp.monthly_cost_max,
  
  ec.updated_at       AS last_updated
FROM evidence_cells ec
JOIN substances s     ON s.id = ec.substance_id
JOIN conditions c     ON c.id = ec.condition_id
JOIN populations p    ON p.id = ec.population_id
LEFT JOIN korean_regulatory kr ON kr.substance_id = s.id
LEFT JOIN substance_profiles sp ON sp.substance_id = s.id
WHERE ec.is_published = TRUE
  AND c.is_published = TRUE;

CREATE UNIQUE INDEX idx_scatter_unique 
  ON condition_scatter_data(condition_slug, population_slug, substance_slug);
CREATE INDEX idx_scatter_condition ON condition_scatter_data(condition_slug);
CREATE INDEX idx_scatter_population ON condition_scatter_data(population_slug);

-- ============================================================================
-- [7] Row Level Security (Supabase)
-- ============================================================================

-- 공개 데이터: 모두 읽기 가능, 쓰기는 service_role만
ALTER TABLE substances ENABLE ROW LEVEL SECURITY;
ALTER TABLE conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE populations ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacist_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE korean_regulatory ENABLE ROW LEVEL SECURITY;
ALTER TABLE substance_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE population_warning_rules ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (published만)
CREATE POLICY "public_read_substances" ON substances FOR SELECT USING (true);
CREATE POLICY "public_read_conditions" ON conditions FOR SELECT USING (is_published);
CREATE POLICY "public_read_populations" ON populations FOR SELECT USING (true);
CREATE POLICY "public_read_cells" ON evidence_cells FOR SELECT USING (is_published);
CREATE POLICY "public_read_notes" ON pharmacist_notes FOR SELECT USING (is_published);
CREATE POLICY "public_read_korean" ON korean_regulatory FOR SELECT USING (true);
CREATE POLICY "public_read_profiles" ON substance_profiles FOR SELECT USING (true);
CREATE POLICY "public_read_warnings" ON population_warning_rules FOR SELECT USING (is_active);

-- 논문/추출 데이터는 비공개 (service_role만 접근)
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_revisions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 끝
-- 다음: 02_seed_data.sql 실행
-- ============================================================================
