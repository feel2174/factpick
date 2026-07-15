import { supabase } from './supabase';
import type {
  Condition,
  ConditionSearchResult,
  EffectRecord,
  EffectsBySubstance,
  EvidenceCellRow,
  Grade,
  Population,
  ProductsBySubstance,
  StudiesBySubstance,
  StudyRef,
  StudyTypeBucket,
  Substance,
  VerifiedEffect,
} from './types';

const BETA_CONDITION_SLUGS = [
  'osteoarthritis',
  'cognitive_decline',
  'depression_mild',
  'anxiety',
  'insomnia',
  'migraine',
  'immune_support',
  'hyperlipidemia',
  'hypertension',
  'skin_aging',
  'eye_health',
  'liver_health',
  'menopause',
  'constipation',
  'diarrhea',
  'gut_health',
] as const;

export async function getAllConditions(): Promise<Condition[]> {
  const { data, error } = await supabase
    .from('conditions')
    .select('id, slug, name_ko, name_en, category')
    .order('name_ko');
  if (error) throw error;
  return data ?? [];
}

const SEARCH_STOP_WORDS = new Set([
  '내', '나', '저', '좀', '너무', '계속', '자주', '요즘', '증상', '때문',
  '안', '잘', '못', '것', '같아요', '있어요', '없어요', '아파요', '불편해요',
]);

function normalizeConditionSearchTerms(query: string): string[] {
  const normalized = query
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9가-힣ㄱ-ㅎㅏ-ㅣ\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);

  if (!normalized) return [];

  const particlePattern = /(으로|에서|에게|까지|부터|처럼|보다|하고|이며|이고|이나|거나|의|은|는|이|가|을|를|에|도|만)$/;
  const words = normalized.split(' ').flatMap((word) => {
    const stem = word.replace(particlePattern, '');
    return stem && stem !== word ? [word, stem] : [word];
  });

  return Array.from(new Set([normalized, ...words]))
    .filter((term) => term.length > 0 && !SEARCH_STOP_WORDS.has(term))
    .slice(0, 8);
}

const conditionSearchSelect =
  'id, slug, name_ko, name_en, category, description_ko, search_terms, display_order';

export async function getPublishedConditions(): Promise<ConditionSearchResult[]> {
  const { data, error } = await supabase
    .from('conditions')
    .select(conditionSearchSelect)
    .eq('is_published', true)
    .order('display_order')
    .order('name_ko');

  if (error) throw error;
  return (data ?? []) as ConditionSearchResult[];
}

export async function searchConditions(query: string): Promise<ConditionSearchResult[]> {
  const terms = normalizeConditionSearchTerms(query);
  if (terms.length === 0) return [];

  const filters = terms.flatMap((term) => [
    `name_ko.ilike.%${term}%`,
    `name_en.ilike.%${term}%`,
    `description_ko.ilike.%${term}%`,
    `category.ilike.%${term}%`,
    `slug.ilike.%${term}%`,
    `search_terms.cs.{"${term}"}`,
  ]);

  const { data, error } = await supabase
    .from('conditions')
    .select(conditionSearchSelect)
    .eq('is_published', true)
    .or(filters.join(','))
    .order('display_order')
    .order('name_ko')
    .limit(20);

  if (error) throw error;
  return (data ?? []) as ConditionSearchResult[];
}

export async function getAllSubstances(): Promise<Substance[]> {
  const { data, error } = await supabase
    .from('substances')
    .select('id, slug, name_ko, name_en, category, substance_type')
    .order('name_ko');
  if (error) throw error;
  return (data ?? []) as Substance[];
}

export interface SubstanceDetailResult {
  substance: Substance & { description_ko?: string | null };
  conditions: Array<{
    condition_slug: string;
    condition_name_ko: string;
    efficacy_score: number | null;
    evidence_score: number | null;
    grade: Grade | null;
    study_count_total: number;
    ai_summary_ko: string | null;
  }> | null;
  pharmacist_notes: Array<{ note_ko: string; note_type: string }> | null;
}

export async function getSubstanceDetail(slug: string): Promise<SubstanceDetailResult | null> {
  const { data, error } = await supabase.rpc('get_substance_detail', { p_substance_slug: slug });
  if (error) throw error;
  return data as SubstanceDetailResult | null;
}

export function isBetaCondition(slug: string): boolean {
  return (BETA_CONDITION_SLUGS as readonly string[]).includes(slug);
}

// 적응증별 커버 성분 수 (verified_effects 행 수) — 홈 카드 "성분 N개 비교"용.
export async function getConditionSubstanceCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase.from('verified_effects').select('condition_id');
  if (error) {
    if (error.code === '42P01') return {};
    throw error;
  }
  const conds = await getAllConditions();
  const idToSlug = new Map(conds.map((c) => [c.id, c.slug]));
  const out: Record<string, number> = {};
  for (const r of (data ?? []) as Array<{ condition_id: string }>) {
    const slug = idToSlug.get(r.condition_id);
    if (!slug) continue;
    out[slug] = (out[slug] ?? 0) + 1;
  }
  return out;
}

export async function getConditionBySlug(slug: string): Promise<Condition | null> {
  const { data, error } = await supabase
    .from('conditions')
    .select('id, slug, name_ko, name_en, category')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllPopulations(): Promise<Population[]> {
  const { data, error } = await supabase
    .from('populations')
    .select('id, slug, name_ko, name_en')
    .order('slug');
  if (error) throw error;
  return data ?? [];
}

export async function getCellsForCondition(
  conditionSlug: string,
): Promise<EvidenceCellRow[]> {
  const { data, error } = await supabase
    .from('evidence_cells')
    .select(
      `id, ai_grade, ai_efficacy_score, ai_evidence_score, ai_summary_ko,
       smd_pooled, study_count_meta, study_count_rct, study_count_obs,
       total_sample_size, consistency, extra,
       substance:substances!inner(id, slug, name_ko, name_en, category, substance_type),
       population:populations!inner(id, slug, name_ko, name_en),
       conditions!inner(slug)`,
    )
    .eq('conditions.slug', conditionSlug);
  if (error) throw error;
  type Raw = Omit<EvidenceCellRow, 'substance' | 'population'> & {
    substance: Substance | Substance[];
    population: Population | Population[];
  };
  const rows = (data ?? []) as unknown as Raw[];
  return rows.map((r) => ({
    ...r,
    substance: Array.isArray(r.substance) ? r.substance[0] : r.substance,
    population: Array.isArray(r.population) ? r.population[0] : r.population,
  })) as EvidenceCellRow[];
}

function bucketFor(studyType: string | null | undefined): StudyTypeBucket | null {
  if (!studyType) return null;
  if (studyType === 'meta_analysis' || studyType === 'systematic_review') return 'meta';
  if (studyType === 'rct') return 'rct';
  if (studyType === 'cohort' || studyType === 'case_control' || studyType === 'observational')
    return 'obs';
  return null;
}

export async function getStudiesForHealthyAdultCells(
  conditionSlug: string,
): Promise<StudiesBySubstance> {
  const condQ = await supabase
    .from('conditions')
    .select('id')
    .eq('slug', conditionSlug)
    .maybeSingle();
  if (condQ.error) throw condQ.error;
  if (!condQ.data) return {};

  const healthyQ = await supabase
    .from('populations')
    .select('id')
    .eq('slug', 'healthy_adult')
    .maybeSingle();
  if (healthyQ.error) throw healthyQ.error;
  const healthyId = healthyQ.data?.id ?? null;

  const { data, error } = await supabase
    .from('study_extractions')
    .select(
      `substance_id, population_id,
       study:studies!inner(id, pubmed_id, title, journal, year, study_type)`,
    )
    .eq('condition_id', condQ.data.id)
    .eq('is_valid', true);
  if (error) throw error;

  type Row = {
    substance_id: string;
    population_id: string | null;
    study: StudyRef | StudyRef[];
  };

  const out: StudiesBySubstance = {};
  const seen = new Set<string>();
  for (const raw of (data ?? []) as unknown as Row[]) {
    if (raw.population_id != null && raw.population_id !== healthyId) continue;
    const study = Array.isArray(raw.study) ? raw.study[0] : raw.study;
    if (!study) continue;
    const bucket = bucketFor(study.study_type);
    if (!bucket) continue;
    const dedupKey = `${raw.substance_id}|${bucket}|${study.id}`;
    if (seen.has(dedupKey)) continue;
    seen.add(dedupKey);
    const sub = (out[raw.substance_id] ??= { meta: [], rct: [], obs: [] });
    sub[bucket].push(study);
  }

  for (const sub of Object.values(out)) {
    for (const k of ['meta', 'rct', 'obs'] as StudyTypeBucket[]) {
      sub[k].sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    }
  }
  return out;
}

function bucketForSourceType(s: string | null | undefined): StudyTypeBucket | null {
  if (!s) return null;
  if (s === 'meta_analysis' || s === 'systematic_review') return 'meta';
  if (s === 'rct') return 'rct';
  if (s === 'cohort' || s === 'case_control' || s === 'observational') return 'obs';
  return null;
}

export async function getEffectsForCondition(
  conditionSlug: string,
): Promise<EffectsBySubstance> {
  const condQ = await supabase
    .from('conditions')
    .select('id')
    .eq('slug', conditionSlug)
    .maybeSingle();
  if (condQ.error) throw condQ.error;
  if (!condQ.data) return {};

  const { data, error } = await supabase
    .from('study_substance_effects')
    .select(
      `substance_id, substance_name_raw, source_study_type,
       effect_metric, effect_value, ci_lower, ci_upper, p_value,
       effect_size_category, effect_direction, narrative,
       outcome_measure, intervention_detail,
       study:studies!inner(id, pubmed_id, title, journal, year)`,
    )
    .eq('condition_id', condQ.data.id)
    .eq('is_valid', true)
    .not('substance_id', 'is', null);
  if (error) throw error;

  type StudyMeta = {
    id: string;
    pubmed_id: string | null;
    title: string;
    journal: string | null;
    year: number | null;
  };
  type Row = {
    substance_id: string;
    substance_name_raw: string;
    source_study_type: string;
    effect_metric: string | null;
    effect_value: number | null;
    ci_lower: number | null;
    ci_upper: number | null;
    p_value: number | null;
    effect_size_category: string | null;
    effect_direction: string | null;
    narrative: string | null;
    outcome_measure: string | null;
    intervention_detail: string | null;
    study: StudyMeta | StudyMeta[];
  };

  const out: EffectsBySubstance = {};
  for (const raw of (data ?? []) as unknown as Row[]) {
    const bucket = bucketForSourceType(raw.source_study_type);
    if (!bucket) continue;
    const study = Array.isArray(raw.study) ? raw.study[0] : raw.study;
    if (!study) continue;
    const sub = (out[raw.substance_id] ??= { meta: [], rct: [], obs: [] });
    sub[bucket].push({
      study_id: study.id,
      pubmed_id: study.pubmed_id,
      title: study.title,
      journal: study.journal,
      year: study.year,
      source_study_type: raw.source_study_type,
      effect_metric: raw.effect_metric,
      effect_value: raw.effect_value,
      ci_lower: raw.ci_lower,
      ci_upper: raw.ci_upper,
      p_value: raw.p_value,
      effect_size_category: raw.effect_size_category,
      effect_direction: raw.effect_direction,
      narrative: raw.narrative,
      outcome_measure: raw.outcome_measure,
      intervention_detail: raw.intervention_detail,
      substance_name_raw: raw.substance_name_raw,
    });
  }

  // 최신 + 수치 있는 거 우선 정렬
  for (const sub of Object.values(out)) {
    for (const k of ['meta', 'rct', 'obs'] as StudyTypeBucket[]) {
      sub[k].sort((a, b) => {
        const va = a.effect_value !== null ? 0 : 1;
        const vb = b.effect_value !== null ? 0 : 1;
        if (va !== vb) return va - vb;
        return (b.year ?? 0) - (a.year ?? 0);
      });
    }
  }
  return out;
}

export async function getKoreaProducts(): Promise<ProductsBySubstance> {
  const { data, error } = await supabase
    .from('substances')
    .select('id, extra');
  if (error) throw error;
  const out: ProductsBySubstance = {};
  for (const row of (data ?? []) as Array<{ id: string; extra: Record<string, unknown> | null }>) {
    const kp = row.extra?.korea_products as unknown;
    if (kp && typeof kp === 'object' && 'top' in (kp as Record<string, unknown>)) {
      out[row.id] = kp as ProductsBySubstance[string];
    }
  }
  return out;
}

export async function getVerifiedEffects(
  conditionSlug: string,
): Promise<VerifiedEffect[]> {
  const condQ = await supabase
    .from('conditions')
    .select('id')
    .eq('slug', conditionSlug)
    .maybeSingle();
  if (condQ.error) throw condQ.error;
  if (!condQ.data) return [];

  const { data, error } = await supabase
    .from('verified_effects')
    .select(
      `id, verified_id, substance_id, name_ko, name_en, variant_label,
       substance_type, smd, ci_lower, ci_upper, studies_count, patients_count,
       smd_source, is_estimated, evidence_grade, funding_bias, warnings,
       source_code, source_url, notes,
       substance:substances(name_en)`,
    )
    .eq('condition_id', condQ.data.id)
    .order('smd', { ascending: true, nullsFirst: false });
  if (error) {
    // 테이블이 없으면 (영선이 SQL 아직 안 돌렸으면) 빈 배열 fallback
    if (
      error.message?.includes('relation') ||
      error.code === '42P01'
    ) {
      return [];
    }
    throw error;
  }
  type VerifiedEffectWithSubstance = VerifiedEffect & {
    substance: { name_en: string | null } | Array<{ name_en: string | null }> | null;
  };
  return ((data ?? []) as unknown as VerifiedEffectWithSubstance[]).map((row) => {
    const substance = Array.isArray(row.substance) ? row.substance[0] : row.substance;
    const { substance: _substance, ...effect } = row;
    return {
      ...effect,
      name_en: effect.name_en ?? substance?.name_en ?? null,
    };
  });
}

export async function getPersonalizationRules(
  conditionSlug: string,
): Promise<import('./types').PersonalizationRule[]> {
  const condQ = await supabase
    .from('conditions')
    .select('id')
    .eq('slug', conditionSlug)
    .maybeSingle();
  if (condQ.error) throw condQ.error;
  if (!condQ.data) return [];

  const { data, error } = await supabase
    .from('personalization_rules')
    .select(
      `id, rule_code, rank, icon, title, message, match_conditions,
       highlight_substance_ids, highlight_verified_ids,
       avoid_substance_ids, avoid_verified_ids, display_order`,
    )
    .eq('condition_id', condQ.data.id)
    .eq('is_active', true)
    .order('rank', { ascending: true })
    .order('display_order', { ascending: true });
  if (error) {
    if (error.code === '42P01') return [];
    throw error;
  }
  return (data ?? []) as import('./types').PersonalizationRule[];
}
