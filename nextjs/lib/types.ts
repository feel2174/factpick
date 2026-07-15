export type Grade = 'A' | 'B' | 'C' | 'D' | 'F' | 'I';

export type SubstanceType = 'supplement' | 'drug';

export interface Condition {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  category: string | null;
}

export interface ConditionSearchResult extends Condition {
  description_ko: string | null;
  search_terms: string[];
  display_order: number;
}

export interface Population {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
}

export interface Substance {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  category: string | null;
  substance_type: SubstanceType;
}

export interface CellExtra {
  v3?: boolean;
  category_dist?: Record<string, number>;
  direction_dist?: Record<string, number>;
  clinical_importance_dist?: Record<string, number>;
  n_smd_extracts?: number;
  mds_sample?: Array<{
    value: number;
    outcome: string | null;
    ci_lower: number | null;
    ci_upper: number | null;
    narrative: string | null;
  }>;
  narratives?: string[];
}

export interface EvidenceCellRow {
  id: string;
  ai_grade: Grade | null;
  ai_efficacy_score: number | null;
  ai_evidence_score: number | null;
  ai_summary_ko: string | null;
  smd_pooled: number | null;
  study_count_meta: number;
  study_count_rct: number;
  study_count_obs: number;
  total_sample_size: number | null;
  consistency: number | null;
  extra: CellExtra | null;
  substance: Substance;
  population: Population;
}

export interface ConditionWithCounts extends Condition {
  cell_count: number;
}

export type StudyTypeBucket = 'meta' | 'rct' | 'obs';

export interface StudyRef {
  id: string;
  pubmed_id: string | null;
  title: string;
  journal: string | null;
  year: number | null;
  study_type: string;
}

export type StudiesBySubstance = Record<
  string,
  Record<StudyTypeBucket, StudyRef[]>
>;

export interface EffectRecord {
  // study 메타
  study_id: string;
  pubmed_id: string | null;
  title: string;
  journal: string | null;
  year: number | null;
  source_study_type: string; // meta_analysis / systematic_review / rct
  // 효과 수치
  effect_metric: string | null;
  effect_value: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  p_value: number | null;
  // 카테고리/방향
  effect_size_category: string | null;
  effect_direction: string | null;
  // 서술
  narrative: string | null;
  outcome_measure: string | null;
  intervention_detail: string | null;
  substance_name_raw: string;
}

export type EffectsBySubstance = Record<
  string,
  Record<StudyTypeBucket, EffectRecord[]>
>;

export type SmdSource =
  | 'direct'
  | 'MD_converted'
  | 'NNT_converted'
  | 'single_RCT_estimated'
  | 'active_comparator_equivalence'
  | 'secondary_citation'
  | 'alternative_metric_only';

export type EvidenceGradeGRADE = 'high' | 'moderate' | 'low' | 'very_low';

export interface KoreaProduct {
  name: string;
  manufacturer: string;
  type: string;
  note?: string;
  matches_verified_id?: string;
  // 직접 제품 페이지 URL — 있으면 검색 결과 페이지 대신 이걸 사용
  coupang_url?: string; // 쿠팡 제품 페이지 (affiliate 트래킹 자동 추가)
  iherb_url?: string;   // iHerb 제품 페이지
}

export interface KoreaProductBundle {
  top: KoreaProduct;
  others: KoreaProduct[];
}

// substance_id → KoreaProductBundle (페이지 로드 시 한 번 fetch)
export type ProductsBySubstance = Record<string, KoreaProductBundle>;

export type Severity = 'mild' | 'moderate' | 'severe';

// 개인화 룰 매칭용 사용자 프로파일 (LocalStorage 저장)
export interface UserProfile {
  height_cm?: number;
  weight_kg?: number;
  age?: number;
  diabetes?: boolean;
  hypertension?: boolean;
  dyslipidemia?: boolean;
  gout?: boolean;
  liver_severity?: Severity | null;
  kidney_severity?: Severity | null;
  anticoagulant?: boolean;
  nsaid_allergy?: boolean;
  gi_history?: boolean;
  nsaid_gi_side_effect?: boolean;
  current_nsaid?: boolean;
  regular_steroid_injection?: boolean;
  current_meds?: string;
  // 이미 시도해본 치료 (key 배열) — 결과 화면에서 효과 강도 비교용
  previous_treatments?: string[];
}

export interface MatchConditions {
  bmi_min?: number;
  bmi_max?: number;
  age_min?: number;
  age_max?: number;
  diabetes?: boolean;
  hypertension?: boolean;
  dyslipidemia?: boolean;
  gout?: boolean;
  liver_severity?: Severity;
  kidney_severity?: Severity;
  anticoagulant?: boolean;
  nsaid_allergy?: boolean;
  gi_history?: boolean;
  nsaid_gi_side_effect?: boolean;
  current_nsaid?: boolean;
  regular_steroid_injection?: boolean;
  no_comorbidity?: boolean;
}

export interface PersonalizationRule {
  id: string;
  rule_code: string | null;
  rank: 1 | 2 | 3;
  icon: string | null;
  title: string;
  message: string;
  match_conditions: MatchConditions;
  highlight_substance_ids: string[];
  highlight_verified_ids: string[];
  avoid_substance_ids: string[];
  avoid_verified_ids: string[];
  display_order: number;
}

export interface VerifiedEffect {
  id: string;
  verified_id: string;
  substance_id: string | null;
  name_ko: string;
  name_en: string | null;
  variant_label: string | null;
  substance_type: string | null;
  smd: number | null;
  ci_lower: number | null;
  ci_upper: number | null;
  studies_count: number | null;
  patients_count: number | null;
  smd_source: SmdSource;
  is_estimated: boolean;
  evidence_grade: EvidenceGradeGRADE | null;
  funding_bias: boolean;
  warnings: string[] | null;
  source_code: string | null;
  source_url: string | null;
  notes: string | null;
}
