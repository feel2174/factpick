'use client';

import { useState } from 'react';
import GradeBadge from './GradeBadge';
import type {
  EffectRecord,
  EffectsBySubstance,
  EvidenceCellRow,
  Grade,
  KoreaProduct,
  ProductsBySubstance,
  StudyTypeBucket,
  VerifiedEffect,
} from '@/lib/types';
import {
  buildTimelineNarrative,
  groupVerified,
  trendComment,
} from '@/lib/verifiedUtils';

interface Props {
  cells: EvidenceCellRow[];
  effects: EffectsBySubstance;
  verified: VerifiedEffect[];
  products: ProductsBySubstance;
  highlightVerifiedIds?: Set<string>;
  avoidVerifiedIds?: Set<string>;
}

/**
 * |SMD|를 환자 친화적인 강도 단어 + 색상으로 변환.
 * SOP Cohen 기준:
 *   |SMD| >= 0.8: 큼 / 0.5~0.8: 중간 / 0.2~0.5: 작음 / 0.1~0.2: 매우 작음 / < 0.1: 없음
 */
function smdStrength(smd: number | null): {
  label: string;
  className: string;
} {
  if (smd === null) return { label: '—', className: 'text-slate-500' };
  const abs = Math.abs(smd);
  if (abs >= 0.8) return { label: '효과 큼', className: 'text-emerald-600' };
  if (abs >= 0.5) return { label: '효과 중간', className: 'text-lime-600' };
  if (abs >= 0.2) return { label: '효과 작음', className: 'text-yellow-600' };
  if (abs >= 0.1) return { label: '미미함', className: 'text-orange-600' };
  return { label: '효과 없음', className: 'text-slate-500' };
}

function findProduct(
  products: ProductsBySubstance,
  substanceId: string | null,
  verifiedId?: string | null,
): KoreaProduct | null {
  if (!substanceId) return null;
  const bundle = products[substanceId];
  if (!bundle) return null;
  if (verifiedId) {
    if (bundle.top.matches_verified_id === verifiedId) return bundle.top;
    for (const o of bundle.others ?? []) {
      if (o.matches_verified_id === verifiedId) return o;
    }
  }
  return bundle.top;
}

const BUCKET_LABEL: Record<StudyTypeBucket, string> = {
  meta: '메타분석 · SR',
  rct: 'RCT',
  obs: '관찰연구',
};

const CATEGORY_KO: Record<string, string> = {
  large: 'large',
  moderate: 'moderate',
  small: 'small',
  null_effect: 'null',
  negative: 'negative',
  unclear: '-',
};

const CATEGORY_COLOR: Record<string, string> = {
  large: 'bg-emerald-100 text-emerald-700',
  moderate: 'bg-lime-50 text-lime-700',
  small: 'bg-yellow-50 text-yellow-700',
  null_effect: 'bg-slate-200 text-slate-700',
  negative: 'bg-rose-50 text-rose-700',
  unclear: 'bg-slate-100 text-slate-500',
};

const GRADE_GRADE_MAP: Record<string, Grade> = {
  high: 'A',
  moderate: 'B',
  low: 'C',
  very_low: 'D',
};

const SMD_SOURCE_LABEL: Record<string, string> = {
  direct: '직접',
  MD_converted: 'MD환산',
  NNT_converted: 'NNT환산',
  single_RCT_estimated: '단일 RCT',
  active_comparator_equivalence: '대조군 추정',
  secondary_citation: '2차 인용',
  alternative_metric_only: '대체 지표',
};

const SMD_SOURCE_COLOR: Record<string, string> = {
  direct: 'bg-emerald-50 text-emerald-600 border-emerald-500',
  MD_converted: 'bg-lime-50 text-lime-600 border-lime-300',
  NNT_converted: 'bg-yellow-50 text-yellow-600 border-yellow-300',
  single_RCT_estimated: 'bg-amber-50 text-amber-600 border-amber-300',
  active_comparator_equivalence: 'bg-amber-50 text-amber-600 border-amber-300',
  secondary_citation: 'bg-rose-50 text-rose-600 border-rose-300',
  alternative_metric_only: 'bg-slate-100 text-slate-700 border-slate-300',
};

function pubmedUrl(pmid: string | null): string | null {
  return pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : null;
}

function cochraneUrl(code: string | null): string | null {
  if (!code) return null;
  if (code.startsWith('CD')) return `https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.${code}/full`;
  return null;
}

function formatSmd(smd: number | null): string {
  if (smd === null || smd === undefined) return '—';
  return (smd >= 0 ? '+' : '') + smd.toFixed(2);
}

function formatCI(lo: number | null, hi: number | null): string | null {
  if (lo === null || hi === null) return null;
  return `[${lo.toFixed(2)}, ${hi.toFixed(2)}]`;
}

// ============================================================================
// Tooltip components
// ============================================================================

function EffectList({ items, bucket }: { items: EffectRecord[]; bucket: StudyTypeBucket }) {
  if (!items.length) {
    return <div className="px-3 py-2 text-xs text-slate-500">논문 없음</div>;
  }
  const visible = items.slice(0, 10);
  const hidden = items.length - visible.length;
  return (
    <div className="max-h-80 overflow-y-auto">
      <div className="sticky top-0 border-b border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {BUCKET_LABEL[bucket]} · {items.length}편
      </div>
      <ul className="divide-y divide-slate-800">
        {visible.map((e, i) => {
          const url = pubmedUrl(e.pubmed_id);
          const valStr = e.effect_value !== null
            ? `${e.effect_metric ?? '?'} ${(e.effect_value >= 0 ? '+' : '') + e.effect_value.toFixed(2)}`
            : null;
          const ciStr = e.ci_lower !== null && e.ci_upper !== null
            ? `[${e.ci_lower.toFixed(2)}, ${e.ci_upper.toFixed(2)}]`
            : null;
          const inner = (
            <div className="px-3 py-2">
              <div className="line-clamp-2 text-xs text-slate-900">{e.title}</div>
              <div className="mt-1 text-[11px] text-slate-500">
                {e.journal ?? '저널 미상'}
                {e.year ? ` · ${e.year}` : ''}
                {e.pubmed_id ? ` · PMID ${e.pubmed_id}` : ''}
              </div>
              {(valStr || e.effect_size_category) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                  {valStr && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-900">
                      {valStr} {ciStr}
                    </span>
                  )}
                  {e.effect_size_category && (
                    <span
                      className={`rounded px-1.5 py-0.5 ${CATEGORY_COLOR[e.effect_size_category] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {CATEGORY_KO[e.effect_size_category] ?? e.effect_size_category}
                    </span>
                  )}
                  {e.p_value !== null && (
                    <span className="text-slate-500">p={e.p_value}</span>
                  )}
                </div>
              )}
              {e.narrative && (
                <p className="mt-1 line-clamp-2 text-[11px] italic text-slate-500">
                  &ldquo;{e.narrative}&rdquo;
                </p>
              )}
            </div>
          );
          return (
            <li key={`${e.study_id}-${i}`}>
              {url ? (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block hover:bg-slate-100">
                  {inner}
                </a>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
      {hidden > 0 && (
        <div className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-500">+ {hidden}편 더</div>
      )}
    </div>
  );
}

function CountCell({
  count,
  items,
  bucket,
  cellKey,
  hoverKey,
  setHoverKey,
}: {
  count: number;
  items: EffectRecord[];
  bucket: StudyTypeBucket;
  cellKey: string;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
}) {
  const active = hoverKey === cellKey;
  const interactive = count > 0 && items.length > 0;
  return (
    <span
      className={`relative inline-flex tabular-nums ${
        interactive
          ? 'cursor-help text-slate-800 underline decoration-dotted underline-offset-2'
          : 'text-slate-500'
      }`}
      onMouseEnter={() => interactive && setHoverKey(cellKey)}
      onMouseLeave={() => interactive && setHoverKey(null)}
    >
      {count}
      {active && interactive && (
        <span className="absolute right-0 top-full z-20 mt-2 w-96 rounded-lg border border-slate-200 bg-white text-left shadow-xl">
          <EffectList items={items} bucket={bucket} />
        </span>
      )}
    </span>
  );
}

// ============================================================================
// Row types: 통합 표
// ============================================================================

type UnifiedRow =
  | {
      kind: 'verified';
      key: string;
      verified: VerifiedEffect;
      // 같은 substance의 v3 cell이 있다면 같이 보유 (참고용 카운트)
      v3Cell?: EvidenceCellRow;
      v3Effects?: { meta: EffectRecord[]; rct: EffectRecord[]; obs: EffectRecord[] };
    }
  | {
      kind: 'verified_group';
      key: string;
      baseName: string;
      rep: VerifiedEffect;
      timeline: VerifiedEffect[]; // 시간 순 정렬
    }
  | {
      kind: 'v3_only';
      key: string;
      cell: EvidenceCellRow;
      effects: { meta: EffectRecord[]; rct: EffectRecord[]; obs: EffectRecord[] };
    };


const GRADE_ORDER: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, F: 4, I: 5 };

/**
 * 같은 효과 구간 안에서 영선의 수익 가능성 순으로 tiebreaker.
 * 윤리: 효과 우선 그대로 두되, SMD가 동등하면 수익 가능한 쪽 우선.
 */
function getAffiliateRank(r: UnifiedRow, products: ProductsBySubstance): number {
  let substanceId: string | null = null;
  let substanceType: string | null = null;
  let verifiedId: string | null = null;

  if (r.kind === 'verified') {
    substanceId = r.verified.substance_id;
    substanceType = r.verified.substance_type;
    verifiedId = r.verified.verified_id;
  } else if (r.kind === 'verified_group') {
    substanceId = r.rep.substance_id;
    substanceType = r.rep.substance_type;
    verifiedId = r.rep.verified_id;
  } else {
    substanceId = r.cell.substance.id;
    substanceType = r.cell.substance.substance_type;
  }

  // 시술 = 구매 불가, 가장 뒤로
  if (substanceType === 'injection_rx') return 6;

  const product = findProduct(products, substanceId, verifiedId);
  if (!product) return 5; // 매핑 정보 없음 = 한국 시판 정보 부재

  const t = (product.type ?? '').toLowerCase();
  if (t.includes('한국 미') || t.includes('미수입')) return 5;
  if (t.includes('직구')) return 2;
  if (t.includes('전문의약품') || t.includes('전문약') || t.includes('처방')) return 4;
  if (t.includes('일반의약품') || (t.includes('의약품') && !t.includes('전문'))) return 3;
  if (t.includes('건강기능식품') || t.includes('건기식')) return 1;
  return 5;
}

/**
 * sort key: [smdBucket, accessRank, rawSmd]
 * - smdBucket: |SMD| 0.1 단위로 묶음
 * - accessRank: 1=국내 건강기능식품 ... 6=시술
 * - rawSmd: 같은 bucket+accessRank면 정확한 SMD 순
 */
function rowSortKey(r: UnifiedRow, products: ProductsBySubstance): [number, number, number] {
  let smd: number | null = null;
  if (r.kind === 'verified') smd = r.verified.smd;
  else if (r.kind === 'verified_group') smd = r.rep.smd;
  else smd = r.cell.smd_pooled;

  if (smd === null) {
    // SMD 없으면 ai_grade로 대체 (v3_only)
    if (r.kind === 'v3_only') {
      const g = r.cell.ai_grade ? GRADE_ORDER[r.cell.ai_grade] ?? 99 : 99;
      return [99, g, 0];
    }
    return [99, getAffiliateRank(r, products), 0];
  }
  const abs = Math.abs(smd);
  // bucket: 큰 SMD → 작은 bucket 숫자. 0.1 단위 묶음.
  const bucket = Math.round((5 - abs) * 10);
  return [bucket, getAffiliateRank(r, products), abs];
}

function rowGradeOrder(r: UnifiedRow): number {
  let grade: Grade | null = null;
  if (r.kind === 'verified') {
    grade = r.verified.evidence_grade ? GRADE_GRADE_MAP[r.verified.evidence_grade] : null;
  } else if (r.kind === 'verified_group') {
    grade = r.rep.evidence_grade ? GRADE_GRADE_MAP[r.rep.evidence_grade] : null;
  } else {
    grade = r.cell.ai_grade;
  }
  return grade ? GRADE_ORDER[grade] ?? 99 : 99;
}

function rowEffectAbs(r: UnifiedRow): number {
  let smd: number | null = null;
  if (r.kind === 'verified') smd = r.verified.smd;
  else if (r.kind === 'verified_group') smd = r.rep.smd;
  else smd = r.cell.smd_pooled;
  return smd === null ? -1 : Math.abs(smd);
}

// ============================================================================
// Main
// ============================================================================

export default function SubstanceTable({
  cells,
  effects,
  verified,
  products,
  highlightVerifiedIds,
  avoidVerifiedIds,
}: Props) {
  const [hoverKey, setHoverKey] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'all' | 'supplement' | 'drug'>('all');
  // 큐레이션한 verified(골든셋)만 표시. 옛 AI 자동추출(evidence_cells)은 성분↔논문
  // 오연결·과대 효능(예: 불면에 셀레늄 A등급)이 많아 verified-only로 신뢰성 확보.
  // (verified 행에 붙는 연구수 카운트는 substance_id 매칭으로 유지)
  const showV3 = false;
  const [detail, setDetail] = useState(false);

  // verified에 매칭된 substance_id 집합 — abstract v3에서는 그 substance를 숨길지 결정
  const verifiedSubIds = new Set(
    verified.map((v) => v.substance_id).filter((x): x is string => !!x),
  );

  // 시점별 variant 그룹핑 (스테로이드 1-2주/6개월 같은)
  const { groups: timeGroups, singles } = groupVerified(verified);

  // 1) verified rows (시점 그룹이 아닌 singles만)
  const verifiedRows: UnifiedRow[] = singles.map((v) => {
    const cell = v.substance_id ? cells.find((c) => c.substance.id === v.substance_id) : undefined;
    const eff = cell ? effects[cell.substance.id] : undefined;
    return {
      kind: 'verified',
      key: `v-${v.id}`,
      verified: v,
      v3Cell: cell,
      v3Effects: eff,
    };
  });

  // 1b) verified_group rows (시점별 묶음)
  const groupRows: UnifiedRow[] = timeGroups.map((g) => ({
    kind: 'verified_group' as const,
    key: `g-${g.baseName}`,
    baseName: g.baseName,
    rep: g.rep,
    timeline: g.timeline,
  }));

  // 2) v3_only rows (verified와 매칭되지 않은 substance만)
  const v3OnlyRows: UnifiedRow[] = showV3
    ? cells
        .filter((c) => !verifiedSubIds.has(c.substance.id))
        .map((c) => ({
          kind: 'v3_only' as const,
          key: `c-${c.id}`,
          cell: c,
          effects: effects[c.substance.id] ?? { meta: [], rct: [], obs: [] },
        }))
    : [];

  // 3) 타입 필터
  const typeOf = (r: UnifiedRow): string | null => {
    if (r.kind === 'verified') return r.verified.substance_type;
    if (r.kind === 'verified_group') return r.rep.substance_type;
    return r.cell.substance.substance_type;
  };
  const matchesType = (r: UnifiedRow): boolean => {
    if (typeFilter === 'all') return true;
    const t = typeOf(r);
    if (typeFilter === 'supplement') return t === 'supplement';
    // drug = prescription / topical_rx / injection_rx / OTC / drug
    return t !== null && t !== 'supplement';
  };

  const merged = [...groupRows, ...verifiedRows, ...v3OnlyRows].filter(matchesType);

  // 추천 룰 매칭된 row를 맨 위로
  const isHighlighted = (r: UnifiedRow): boolean => {
    if (!highlightVerifiedIds || highlightVerifiedIds.size === 0) return false;
    if (r.kind === 'verified') return highlightVerifiedIds.has(r.verified.verified_id);
    if (r.kind === 'verified_group') return r.timeline.some((v) => highlightVerifiedIds.has(v.verified_id));
    return false;
  };
  const isAvoided = (r: UnifiedRow): boolean => {
    if (!avoidVerifiedIds || avoidVerifiedIds.size === 0) return false;
    if (r.kind === 'verified') return avoidVerifiedIds.has(r.verified.verified_id);
    if (r.kind === 'verified_group') return r.timeline.some((v) => avoidVerifiedIds.has(v.verified_id));
    return false;
  };

  merged.sort((a, b) => {
    // 1) 추천 > 일반 > 비추천 순
    const ha = isHighlighted(a) ? 0 : isAvoided(a) ? 2 : 1;
    const hb = isHighlighted(b) ? 0 : isAvoided(b) ? 2 : 1;
    if (ha !== hb) return ha - hb;
    const ga = rowGradeOrder(a);
    const gb = rowGradeOrder(b);
    if (ga !== gb) return ga - gb;
    return rowEffectAbs(b) - rowEffectAbs(a);
    const [ka1, ka2, ka3] = rowSortKey(a, products);
    const [kb1, kb2, kb3] = rowSortKey(b, products);
    if (ka1 !== kb1) return ka1 - kb1;
    if (ka2 !== kb2) return ka2 - kb2;
    return kb3 - ka3; // 같은 접근성 그룹이면 정확한 SMD 큰 순
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        {(['all', 'supplement', 'drug'] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setTypeFilter(k)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              typeFilter === k
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 text-slate-500 hover:border-slate-300'
            }`}
          >
            {k === 'all' ? '전체' : k === 'supplement' ? '영양제만' : '약만'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDetail((v) => !v)}
          className={`ml-2 rounded-full border px-3 py-1 text-xs transition ${
            detail
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
          title="신뢰도/CI/근거수/경고 등 전문가용 세부 정보"
        >
          {detail ? '✓ 상세 정보' : '+ 상세 정보 보기'}
        </button>
      </div>

      <div className="overflow-visible rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-white text-left text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-3 w-16">등급</th>
              <th className="px-3 py-3">성분</th>
              <th className="px-3 py-3 text-right">효과</th>
              <th className="px-3 py-3">비고</th>
              {detail && <th className="px-3 py-3">출처 종류</th>}
              {detail && <th className="px-3 py-3">구분</th>}
              {detail && <th className="px-3 py-3">오차 범위</th>}
              {detail && <th className="px-3 py-3">참고 논문</th>}
              {detail && <th className="px-3 py-3">주의</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {merged.map((r) => {
              const hi = isHighlighted(r);
              const av = isAvoided(r);
              if (r.kind === 'verified') {
                return (
                  <VerifiedRow
                    key={r.key}
                    row={r}
                    hoverKey={hoverKey}
                    setHoverKey={setHoverKey}
                    products={products}
                    detail={detail}
                    highlighted={hi}
                    avoided={av}
                  />
                );
              }
              if (r.kind === 'verified_group') {
                return (
                  <VerifiedGroupRow
                    key={r.key}
                    row={r}
                    products={products}
                    detail={detail}
                    highlighted={hi}
                    avoided={av}
                  />
                );
              }
              return (
                <V3OnlyRow
                  key={r.key}
                  row={r}
                  hoverKey={hoverKey}
                  setHoverKey={setHoverKey}
                  products={products}
                  detail={detail}
                />
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        <strong>효과</strong> = 임상시험에서 측정된 개선 정도(클수록 좋음).{' '}
        <strong>등급</strong> = 그 효과를 얼마나 믿을 수 있는지(근거의 탄탄함). 등급 글자에 마우스를 올리면 설명이 나와요.
      </p>
    </div>
  );
}

// ============================================================================
// Row renderers
// ============================================================================

function SourceBadge({ source, isEstimated }: { source: string; isEstimated: boolean }) {
  const colors = SMD_SOURCE_COLOR[source] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  const label = SMD_SOURCE_LABEL[source] ?? source;
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${colors}`}>
      {label}
      {isEstimated && <span className="ml-1 opacity-70">~</span>}
    </span>
  );
}

function VerifiedRow({
  row,
  hoverKey,
  setHoverKey,
  products,
  detail,
  highlighted,
  avoided,
}: {
  row: Extract<UnifiedRow, { kind: 'verified' }>;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  products: ProductsBySubstance;
  detail: boolean;
  highlighted?: boolean;
  avoided?: boolean;
}) {
  const v = row.verified;
  const ourGrade: Grade | null = v.evidence_grade ? GRADE_GRADE_MAP[v.evidence_grade] : null;
  const ci = formatCI(v.ci_lower, v.ci_upper);
  const sourceUrl = v.source_url || cochraneUrl(v.source_code);
  const product = findProduct(products, v.substance_id, v.verified_id);
  const isVariantMatch = product?.matches_verified_id === v.verified_id;
  const strength = smdStrength(v.smd);

  const rowBg = highlighted
    ? 'bg-emerald-50 hover:bg-emerald-700/15 border-l-2 border-emerald-500'
    : avoided
      ? 'bg-rose-50 hover:bg-rose-50 border-l-2 border-rose-300 opacity-70'
      : 'hover:bg-slate-50';

  return (
    <tr className={rowBg}>
      {/* 등급 */}
      <td className="px-3 py-3 align-top">
        <GradeBadge grade={ourGrade} size="md" />
      </td>
      {/* 성분 · 한국 시판 */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          {highlighted && <span className="text-emerald-600" title="당신에게 추천">✨</span>}
          {avoided && <span className="text-rose-500" title="당신에게 주의">⚠</span>}
          <span>{v.name_ko}</span>
        </div>
        {v.variant_label && (
          <div className="mt-0.5 text-[11px] text-slate-500">{v.variant_label}</div>
        )}
        {product && (
          <div className="mt-1 text-[11px]">
            <span className={`mr-1 ${isVariantMatch ? 'text-amber-600' : 'text-slate-500'}`}>
              {isVariantMatch ? '⚡' : '📦'}
            </span>
            <span className={isVariantMatch ? 'text-amber-700' : 'text-slate-700'}>{product.name}</span>
            {product.manufacturer && (
              <span className="ml-1 text-slate-500">({product.manufacturer})</span>
            )}
          </div>
        )}
        {v.funding_bias && !detail && (
          <div className="mt-1 inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">
            ⚠ 펀딩 편향
          </div>
        )}
      </td>
      {/* 효과 (SMD + 강도) */}
      <td className="px-3 py-3 text-right align-top">
        <div className="tabular-nums text-base font-semibold text-slate-900">
          {formatSmd(v.smd)}
        </div>
        <div className={`mt-0.5 text-[11px] font-medium ${strength.className}`}>
          {strength.label}
        </div>
      </td>
      {/* 비고 */}
      <td className="px-3 py-3 align-top">
        <span className="text-xs text-slate-400">근거 비교</span>
      </td>
      {/* 상세 모드 컬럼들 */}
      {detail && (
        <td className="px-3 py-3 align-top">
          <SourceBadge source={v.smd_source} isEstimated={v.is_estimated} />
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top">
          <span className={v.substance_type === 'supplement' ? 'text-emerald-600' : 'text-rose-500'}>
            {v.substance_type === 'supplement'
              ? '영양제'
              : v.substance_type === 'prescription'
                ? '약(처방)'
                : v.substance_type === 'topical_rx'
                  ? '외용약'
                  : v.substance_type === 'injection_rx'
                    ? '주사'
                    : v.substance_type ?? '-'}
          </span>
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top tabular-nums text-xs text-slate-500">
          {ci ?? '—'}
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top text-[11px] tabular-nums text-slate-500">
          {v.studies_count !== null && <div>{v.studies_count}편</div>}
          {v.patients_count !== null && <div>n={v.patients_count.toLocaleString()}</div>}
          {sourceUrl && v.source_code && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 hover:underline"
            >
              {v.source_code}
            </a>
          )}
          {v.studies_count === null && v.patients_count === null && !v.source_code && '—'}
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top">
          <div className="flex flex-col gap-1">
            {v.funding_bias && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">
                ⚠ 펀딩 편향
              </span>
            )}
            {v.warnings?.map((w, i) => (
              <span key={i} className="line-clamp-2 text-[10px] text-amber-600" title={w}>
                · {w}
              </span>
            ))}
          </div>
        </td>
      )}
    </tr>
  );
}

function V3OnlyRow({
  row,
  hoverKey,
  setHoverKey,
  products,
  detail,
}: {
  row: Extract<UnifiedRow, { kind: 'v3_only' }>;
  hoverKey: string | null;
  setHoverKey: (k: string | null) => void;
  products: ProductsBySubstance;
  detail: boolean;
}) {
  const c = row.cell;
  const eff = row.effects;
  const nSmd = c.extra?.n_smd_extracts ?? 0;
  const product = findProduct(products, c.substance.id);
  const strength = smdStrength(c.smd_pooled);

  return (
    <tr className="hover:bg-slate-50">
      {/* 등급 */}
      <td className="px-3 py-3 align-top">
        <GradeBadge grade={c.ai_grade} size="md" />
      </td>
      {/* 성분 · 한국 시판 */}
      <td className="px-3 py-3 align-top">
        <div className="font-medium text-slate-900">{c.substance.name_ko}</div>
        {product && (
          <div className="mt-1 text-[11px]">
            <span className="mr-1 text-slate-500">📦</span>
            <span className="text-slate-700">{product.name}</span>
            {product.manufacturer && (
              <span className="ml-1 text-slate-500">({product.manufacturer})</span>
            )}
          </div>
        )}
      </td>
      {/* 효과 */}
      <td className="px-3 py-3 text-right align-top">
        <div className="tabular-nums text-base font-semibold text-slate-900">
          {formatSmd(c.smd_pooled)}
        </div>
        <div className={`mt-0.5 text-[11px] font-medium ${strength.className}`}>
          {strength.label}
        </div>
      </td>
      {/* 비고 */}
      <td className="px-3 py-3 align-top">
        <span className="text-xs text-slate-400">근거 비교</span>
      </td>
      {/* 상세 */}
      {detail && <td className="px-3 py-3 align-top text-[10px] text-slate-500">메타분석 종합</td>}
      {detail && (
        <td className="px-3 py-3 align-top">
          <span className={c.substance.substance_type === 'drug' ? 'text-rose-500' : 'text-emerald-600'}>
            {c.substance.substance_type === 'drug' ? '약' : '영양제'}
          </span>
        </td>
      )}
      {detail && <td className="px-3 py-3 align-top text-xs text-slate-500">—</td>}
      {detail && (
        <td className="px-3 py-3 align-top text-[11px] tabular-nums text-slate-500">
          <CountCell
            count={c.study_count_meta}
            items={eff.meta}
            bucket="meta"
            cellKey={`${c.id}-meta`}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
          />{' '}
          <span className="text-slate-400">메타</span>
          {' · '}
          <CountCell
            count={c.study_count_rct}
            items={eff.rct}
            bucket="rct"
            cellKey={`${c.id}-rct`}
            hoverKey={hoverKey}
            setHoverKey={setHoverKey}
          />{' '}
          <span className="text-slate-400">RCT</span>
          {nSmd > 0 && (
            <div className="text-[10px] text-slate-500">SMD {nSmd}편 합산</div>
          )}
        </td>
      )}
      {detail && <td className="px-3 py-3 align-top text-[10px] text-slate-500">—</td>}
    </tr>
  );
}

function VerifiedGroupRow({
  row,
  products,
  detail,
  highlighted,
  avoided,
}: {
  row: Extract<UnifiedRow, { kind: 'verified_group' }>;
  products: ProductsBySubstance;
  detail: boolean;
  highlighted?: boolean;
  avoided?: boolean;
}) {
  const rep = row.rep;
  const ourGrade: Grade | null = rep.evidence_grade ? GRADE_GRADE_MAP[rep.evidence_grade] : null;
  const ci = formatCI(rep.ci_lower, rep.ci_upper);
  const sourceUrl = rep.source_url || cochraneUrl(rep.source_code);
  const trend = trendComment(row.timeline);
  const timelineStr = buildTimelineNarrative(row.timeline);
  const product = findProduct(products, rep.substance_id, rep.verified_id);
  const strength = smdStrength(rep.smd);

  const rowBg = highlighted
    ? 'bg-emerald-50 hover:bg-emerald-700/15 border-l-2 border-emerald-500'
    : avoided
      ? 'bg-rose-50 hover:bg-rose-50 border-l-2 border-rose-300 opacity-70'
      : 'hover:bg-slate-50';

  return (
    <tr className={rowBg}>
      {/* 등급 */}
      <td className="px-3 py-3 align-top">
        <GradeBadge grade={ourGrade} size="md" />
      </td>
      {/* 성분 · 한국 시판 */}
      <td className="px-3 py-3 align-top">
        <div className="flex items-center gap-2 font-medium text-slate-900">
          {highlighted && <span className="text-emerald-600">✨</span>}
          {avoided && <span className="text-rose-500">⚠</span>}
          <span>{row.baseName}</span>
        </div>
        <div className="mt-0.5 text-[10px] text-slate-500">시점 {row.timeline.length}개 통합 (대표 {rep.variant_label ?? ''})</div>
        {product && (
          <div className="mt-1 text-[11px]">
            <span className="mr-1 text-slate-500">📦</span>
            <span className="text-slate-700">{product.name}</span>
            {product.manufacturer && (
              <span className="ml-1 text-slate-500">({product.manufacturer})</span>
            )}
          </div>
        )}
        {trend && !detail && (
          <div className="mt-1 inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
            ⏱ {trend}
          </div>
        )}
      </td>
      {/* 효과 */}
      <td className="px-3 py-3 text-right align-top">
        <div className="tabular-nums text-base font-semibold text-slate-900">
          {formatSmd(rep.smd)}
        </div>
        <div className={`mt-0.5 text-[11px] font-medium ${strength.className}`}>
          {strength.label}
        </div>
      </td>
      {/* 비고 */}
      <td className="px-3 py-3 align-top">
        <span className="text-xs text-slate-400">근거 비교</span>
      </td>
      {/* 상세 */}
      {detail && (
        <td className="px-3 py-3 align-top">
          <SourceBadge source={rep.smd_source} isEstimated={rep.is_estimated} />
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top">
          <span className={rep.substance_type === 'supplement' ? 'text-emerald-600' : 'text-rose-500'}>
            {rep.substance_type === 'supplement'
              ? '영양제'
              : rep.substance_type === 'prescription'
                ? '약(처방)'
                : rep.substance_type === 'topical_rx'
                  ? '외용약'
                  : rep.substance_type === 'injection_rx'
                    ? '주사'
                    : rep.substance_type ?? '-'}
          </span>
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top tabular-nums text-xs text-slate-500">
          {ci ?? '—'}
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top text-[11px] tabular-nums text-slate-500">
          {sourceUrl && rep.source_code ? (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-blue-600 hover:underline"
            >
              {rep.source_code}
            </a>
          ) : (
            rep.source_code ?? '—'
          )}
        </td>
      )}
      {detail && (
        <td className="px-3 py-3 align-top">
          <div className="flex flex-col gap-1">
            {trend && (
              <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-600">
                ⏱ {trend}
              </span>
            )}
            <span className="text-[10px] text-slate-500" title={timelineStr}>
              {timelineStr}
            </span>
            {rep.funding_bias && (
              <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] text-rose-600">
                ⚠ 펀딩 편향
              </span>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
