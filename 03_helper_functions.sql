-- ============================================================================
-- FactPick (팩트픽) — 헬퍼 함수 (RPC)
-- ============================================================================
-- 프론트엔드에서 supabase.rpc('함수명', {...})으로 호출
-- 
-- 핵심 함수:
--   1. get_condition_scatter(condition_slug, population_slug)
--      → 산점도 + 표 데이터 (인구집단 fallback 자동 처리)
--   2. get_substance_detail(substance_slug)
--      → 성분 상세 페이지 (모든 적응증, 프로파일, 코멘트)
--   3. get_pending_reviews()
--      → 영선님 검토 대기 큐
--   4. calculate_evidence_grade(...)
--      → 등급 산출 알고리즘 (재사용 가능)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. get_condition_scatter
-- 산점도 + 표 데이터 (fallback 로직 포함)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_condition_scatter(
  p_condition_slug TEXT,
  p_population_slug TEXT DEFAULT 'healthy_adult'
)
RETURNS TABLE (
  cell_id           UUID,
  substance_slug    TEXT,
  substance_name_ko TEXT,
  substance_type    TEXT,
  category          TEXT,
  efficacy_score    NUMERIC,
  evidence_score    NUMERIC,
  grade             CHAR(1),
  total_sample_size INT,
  study_count_meta  INT,
  study_count_rct   INT,
  is_fallback       BOOLEAN,
  monthly_cost_min  INT,
  monthly_cost_max  INT,
  korean_status     TEXT,
  ai_summary_ko     TEXT,
  warnings          JSONB
) AS $$
DECLARE
  v_population_id   UUID;
  v_default_pop_id  UUID;
BEGIN
  -- 선택 인구집단 ID
  SELECT id INTO v_population_id FROM populations WHERE slug = p_population_slug;
  -- 기본 인구집단 ID (healthy_adult)
  SELECT id INTO v_default_pop_id FROM populations WHERE is_default = TRUE;
  
  RETURN QUERY
  WITH ranked AS (
    SELECT 
      ec.id AS cell_id,
      s.slug AS substance_slug,
      s.name_ko AS substance_name_ko,
      s.substance_type,
      s.category,
      ec.efficacy_score,
      ec.evidence_score,
      ec.grade,
      ec.total_sample_size,
      ec.study_count_meta,
      ec.study_count_rct,
      (ec.population_id != v_population_id) AS is_fallback,
      sp.monthly_cost_min,
      sp.monthly_cost_max,
      CASE 
        WHEN kr.prescription_only THEN '전문약'
        WHEN kr.mfds_drug_approved AND NOT kr.prescription_only THEN '일반약'
        WHEN kr.mfds_functional THEN '건기식'
        ELSE '일반'
      END AS korean_status,
      ec.ai_summary_ko,
      -- 인구집단 경고 룰 매칭
      COALESCE(
        (SELECT jsonb_agg(jsonb_build_object(
          'type', pwr.warning_type,
          'message', pwr.warning_ko
        ))
         FROM population_warning_rules pwr
         WHERE pwr.is_active 
           AND pwr.population_id = v_population_id
           AND (pwr.substance_id = s.id 
                OR pwr.substance_category = s.category
                OR pwr.substance_category = 'all')),
        '[]'::jsonb
      ) AS warnings,
      -- specific population 데이터 우선
      ROW_NUMBER() OVER (
        PARTITION BY ec.substance_id 
        ORDER BY 
          CASE WHEN ec.population_id = v_population_id THEN 0 ELSE 1 END,
          ec.efficacy_score DESC NULLS LAST
      ) AS rn
    FROM evidence_cells ec
    JOIN substances s ON s.id = ec.substance_id
    JOIN conditions c ON c.id = ec.condition_id
    LEFT JOIN korean_regulatory kr ON kr.substance_id = s.id
    LEFT JOIN substance_profiles sp ON sp.substance_id = s.id
    WHERE c.slug = p_condition_slug
      AND ec.is_published = TRUE
      AND ec.population_id IN (v_population_id, v_default_pop_id)
  )
  SELECT 
    r.cell_id, r.substance_slug, r.substance_name_ko, r.substance_type, r.category,
    r.efficacy_score, r.evidence_score, r.grade,
    r.total_sample_size, r.study_count_meta, r.study_count_rct, r.is_fallback,
    r.monthly_cost_min, r.monthly_cost_max,
    r.korean_status, r.ai_summary_ko, r.warnings
  FROM ranked r
  WHERE r.rn = 1
  ORDER BY r.efficacy_score DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 2. get_substance_detail
-- 성분 상세 페이지 (모든 적응증, 레이더, 코멘트 한 번에)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_substance_detail(
  p_substance_slug TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_substance_id UUID;
BEGIN
  SELECT id INTO v_substance_id FROM substances WHERE slug = p_substance_slug;
  IF v_substance_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  SELECT jsonb_build_object(
    'substance', (
      SELECT to_jsonb(s.*) FROM substances s WHERE s.id = v_substance_id
    ),
    'regulatory', (
      SELECT to_jsonb(kr.*) FROM korean_regulatory kr 
      WHERE kr.substance_id = v_substance_id
    ),
    'profile', (
      SELECT to_jsonb(sp.*) FROM substance_profiles sp 
      WHERE sp.substance_id = v_substance_id
    ),
    'conditions', (
      SELECT jsonb_agg(jsonb_build_object(
        'condition_slug', c.slug,
        'condition_name_ko', c.name_ko,
        'category', c.category,
        'efficacy_score', ec.efficacy_score,
        'evidence_score', ec.evidence_score,
        'grade', ec.grade,
        'study_count_total', ec.study_count_meta + ec.study_count_rct + ec.study_count_obs,
        'ai_summary_ko', ec.ai_summary_ko
      ) ORDER BY ec.efficacy_score DESC NULLS LAST)
      FROM evidence_cells ec
      JOIN conditions c ON c.id = ec.condition_id
      JOIN populations p ON p.id = ec.population_id
      WHERE ec.substance_id = v_substance_id
        AND ec.is_published = TRUE
        AND p.is_default = TRUE  -- 기본은 healthy_adult만
    ),
    'pharmacist_notes', (
      SELECT jsonb_agg(jsonb_build_object(
        'note_ko', pn.note_ko,
        'note_type', pn.note_type,
        'updated_at', pn.updated_at
      ) ORDER BY pn.display_order, pn.updated_at DESC)
      FROM pharmacist_notes pn
      WHERE pn.scope_type = 'substance' 
        AND pn.scope_id = v_substance_id
        AND pn.is_published = TRUE
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3. get_substance_timeline
-- 타임라인 차트용 (성분 × 적응증 연도별 등급 변화)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_substance_timeline(
  p_substance_slug TEXT,
  p_condition_slug TEXT
)
RETURNS TABLE (
  year          INT,
  cumulative_studies INT,
  positive_ratio NUMERIC,
  sample_size_total INT,
  best_study_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH yearly AS (
    SELECT 
      st.year,
      COUNT(*) AS new_studies,
      SUM(CASE WHEN se.effect_direction = 'positive' THEN 1 ELSE 0 END) AS positives,
      SUM(COALESCE(st.sample_size, 0)) AS sample_total,
      MIN(CASE st.study_type
        WHEN 'meta_analysis' THEN 1
        WHEN 'systematic_review' THEN 2
        WHEN 'rct' THEN 3
        WHEN 'cohort' THEN 4
        WHEN 'case_control' THEN 5
        ELSE 6
      END) AS best_type_rank
    FROM studies st
    JOIN study_extractions se ON se.study_id = st.id
    JOIN substances s ON s.id = se.substance_id
    JOIN conditions c ON c.id = se.condition_id
    WHERE s.slug = p_substance_slug
      AND c.slug = p_condition_slug
      AND se.is_valid = TRUE
      AND st.year IS NOT NULL
    GROUP BY st.year
  )
  SELECT 
    y.year,
    SUM(y.new_studies) OVER (ORDER BY y.year)::INT AS cumulative_studies,
    ROUND(SUM(y.positives) OVER (ORDER BY y.year) * 1.0 
          / NULLIF(SUM(y.new_studies) OVER (ORDER BY y.year), 0), 2) AS positive_ratio,
    SUM(y.sample_total) OVER (ORDER BY y.year)::INT AS sample_size_total,
    CASE MIN(y.best_type_rank) OVER (ORDER BY y.year)
      WHEN 1 THEN 'meta_analysis'
      WHEN 2 THEN 'systematic_review'
      WHEN 3 THEN 'rct'
      WHEN 4 THEN 'cohort'
      WHEN 5 THEN 'case_control'
      ELSE 'other'
    END AS best_study_type
  FROM yearly y
  ORDER BY y.year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 4. get_pending_reviews
-- 영선님 검토 대기 큐
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_pending_reviews(
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  cell_id           UUID,
  substance_name_ko TEXT,
  condition_name_ko TEXT,
  population_name_ko TEXT,
  current_grade     CHAR(1),
  proposed_grade    CHAR(1),
  grade_changed     BOOLEAN,
  new_studies_count INT,
  ai_summary_ko     TEXT,
  ai_calculated_at  TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ec.id,
    s.name_ko,
    c.name_ko,
    p.name_ko,
    ec.reviewed_grade,
    ec.ai_grade,
    (ec.reviewed_grade IS DISTINCT FROM ec.ai_grade) AS grade_changed,
    ec.study_count_meta + ec.study_count_rct AS new_studies_count,
    ec.ai_summary_ko,
    ec.ai_calculated_at
  FROM evidence_cells ec
  JOIN substances s ON s.id = ec.substance_id
  JOIN conditions c ON c.id = ec.condition_id
  JOIN populations p ON p.id = ec.population_id
  WHERE ec.review_status = 'pending'
  ORDER BY 
    (ec.reviewed_grade IS DISTINCT FROM ec.ai_grade) DESC,  -- 등급 바뀐 것 우선
    ec.ai_calculated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 5. calculate_evidence_grade
-- 등급 산출 알고리즘 (AI 파이프라인이 호출)
-- 
-- 입력: cell_id
-- 출력: efficacy_score (0~5), evidence_score (0~5), grade (A~F)
-- 
-- 알고리즘:
--   evidence_score = 가중치 합산
--     - 메타분석 1건당 +1.5 (최대 3)
--     - RCT 1건당 +0.3 (최대 1.5)
--     - 관찰연구 1건당 +0.1 (최대 0.5)
--     - 일관성 × 1
--     - 이질성(I²) 패널티: I² > 75면 -0.5
--   efficacy_score = |SMD_pooled| × 2.5 (cap at 5)
--     - SMD 0.2 (small) → 0.5
--     - SMD 0.5 (medium) → 1.25
--     - SMD 0.8 (large) → 2.0
--     - SMD 2.0+ → 5.0
--   grade:
--     A: evidence ≥ 4 AND efficacy ≥ 3
--     B: evidence ≥ 3 AND efficacy ≥ 2
--     C: evidence ≥ 2 AND efficacy ≥ 1
--     D: evidence ≥ 1
--     F: 효과 없음 (consistency < 0.3) 또는 안전성 문제
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION calculate_evidence_grade(
  p_cell_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_cell            evidence_cells%ROWTYPE;
  v_evidence_score  NUMERIC;
  v_efficacy_score  NUMERIC;
  v_grade           CHAR(1);
  v_consistency     NUMERIC;
  v_smd_abs         NUMERIC;
BEGIN
  SELECT * INTO v_cell FROM evidence_cells WHERE id = p_cell_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'cell not found');
  END IF;
  
  -- 일관성 계산 (study_extractions에서 positive 비율)
  SELECT 
    COALESCE(
      SUM(CASE WHEN se.effect_direction = 'positive' THEN 1 ELSE 0 END)::NUMERIC 
      / NULLIF(COUNT(*), 0),
      0
    )
  INTO v_consistency
  FROM evidence_studies es
  JOIN study_extractions se ON se.id = es.extraction_id
  WHERE es.cell_id = p_cell_id AND se.is_valid = TRUE;
  
  -- evidence_score 계산
  v_evidence_score := LEAST(
    LEAST(v_cell.study_count_meta * 1.5, 3.0) +
    LEAST(v_cell.study_count_rct * 0.3, 1.5) +
    LEAST(v_cell.study_count_obs * 0.1, 0.5) +
    COALESCE(v_consistency, 0) * 1.0 -
    CASE WHEN v_cell.i_squared > 75 THEN 0.5 ELSE 0 END,
    5.0
  );
  v_evidence_score := GREATEST(v_evidence_score, 0);
  
  -- efficacy_score 계산
  v_smd_abs := ABS(COALESCE(v_cell.smd_pooled, 0));
  v_efficacy_score := LEAST(v_smd_abs * 2.5, 5.0);
  
  -- grade 결정
  v_grade := CASE
    WHEN v_consistency < 0.3 AND v_cell.study_count_meta + v_cell.study_count_rct >= 3 THEN 'F'
    WHEN v_evidence_score >= 4 AND v_efficacy_score >= 3 THEN 'A'
    WHEN v_evidence_score >= 3 AND v_efficacy_score >= 2 THEN 'B'
    WHEN v_evidence_score >= 2 AND v_efficacy_score >= 1 THEN 'C'
    WHEN v_evidence_score >= 1 THEN 'D'
    ELSE 'D'
  END;
  
  -- 결과 업데이트
  UPDATE evidence_cells SET
    ai_efficacy_score = v_efficacy_score,
    ai_evidence_score = v_evidence_score,
    ai_grade = v_grade,
    consistency = v_consistency,
    ai_calculated_at = NOW(),
    review_status = CASE 
      WHEN reviewed_grade IS DISTINCT FROM v_grade THEN 'pending'
      ELSE review_status
    END
  WHERE id = p_cell_id;
  
  RETURN jsonb_build_object(
    'efficacy_score', v_efficacy_score,
    'evidence_score', v_evidence_score,
    'grade', v_grade,
    'consistency', v_consistency
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. refresh_scatter_view
-- Materialized view 갱신 (cron으로 호출)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION refresh_scatter_view()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY condition_scatter_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 헬퍼 함수 끝
-- 
-- 사용 예시 (프론트엔드):
--   const { data } = await supabase.rpc('get_condition_scatter', {
--     p_condition_slug: 'osteoarthritis',
--     p_population_slug: 'diabetes'
--   });
-- ============================================================================
