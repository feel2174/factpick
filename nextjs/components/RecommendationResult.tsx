'use client';

import { matchRules } from '@/lib/personalization';
import {
  buildExternalLinks,
  coupangProductUrl,
  coupangSearchUrl,
  healthKrSearchUrl,
  iherbProductUrl,
  iherbSearchUrl,
} from '@/lib/affiliate';
import { findPrevTreatment, type PreviousTreatmentOption } from '@/lib/conditionQuiz';
import { isHeadlineEligible } from '@/lib/evidence';
import { ConfidenceChip, EvidenceNote } from './EvidenceTags';
import MedsAnalysis from './MedsAnalysis';
import type {
  PersonalizationRule,
  ProductsBySubstance,
  UserProfile,
  VerifiedEffect,
} from '@/lib/types';

interface Props {
  profile: UserProfile;
  rules: PersonalizationRule[];
  verified: VerifiedEffect[];
  products: ProductsBySubstance;
  prevTreatments: PreviousTreatmentOption[];
  outcomeWord: string;
  onReset: () => void;
  onEdit: () => void;
}

interface RecommendedItem {
  verifiedId: string;
  v: VerifiedEffect;
  productName?: string;
  productManufacturer?: string;
  productType?: string;
  productNote?: string;
  category: 'coupang' | 'iherb' | 'otc' | 'rx' | 'unavailable' | 'procedure';
  primaryUrl?: string;
  isDirect?: boolean; // primaryUrl이 실제 제품 페이지인지 (검색 페이지가 아닌)
  ingredient?: string; // 약국 안내용 일반 성분명
}

const STRENGTH_LABEL: Array<[number, string, string]> = [
  [0.8, '효과 큼', 'text-emerald-600'],
  [0.5, '효과 중간', 'text-lime-600'],
  [0.2, '효과 작음', 'text-yellow-600'],
  [0, '미미', 'text-orange-600'],
];

function strengthOf(smd: number | null): { label: string; color: string } {
  if (smd === null) return { label: '데이터 부족', color: 'text-slate-500' };
  const abs = Math.abs(smd);
  for (const [t, label, color] of STRENGTH_LABEL) {
    if (abs >= t) return { label, color };
  }
  return { label: '효과 없음', color: 'text-slate-500' };
}

// 근거 등급 순위 (낮을수록 강함). 처방/시술이라도 근거·효과로 정직하게 줄 세운다.
const GRADE_RANK: Record<string, number> = { high: 0, moderate: 1, low: 2, very_low: 3 };
function gradeRank(g: string | null | undefined): number {
  return g ? (GRADE_RANK[g] ?? 4) : 4;
}

function classifyCategory(
  v: VerifiedEffect,
  productType: string | undefined,
): RecommendedItem['category'] {
  if (v.substance_type === 'injection_rx') return 'procedure';
  const t = (productType ?? '').toLowerCase();
  if (t.includes('한국 미') || t.includes('미수입')) return 'unavailable';
  if (t.includes('직구')) return 'iherb';
  if (t.includes('전문의약품') || t.includes('전문약') || t.includes('처방')) return 'rx';
  if (t.includes('일반의약품') || (t.includes('의약품') && !t.includes('전문'))) return 'otc';
  if (t.includes('건강기능식품') || t.includes('건기식')) return 'coupang';
  // 기본
  if (v.substance_type === 'supplement') return 'coupang';
  return 'rx';
}

function buildItems(
  highlightIds: Set<string>,
  verified: VerifiedEffect[],
  products: ProductsBySubstance,
): RecommendedItem[] {
  const items: RecommendedItem[] = [];
  for (const v of verified) {
    if (!highlightIds.has(v.verified_id)) continue;
    if (v.smd === null) continue; // SMD 없으면 추천 정렬 어려움
    const bundle = v.substance_id ? products[v.substance_id] : undefined;
    let product = bundle?.top;
    if (bundle) {
      if (bundle.top.matches_verified_id === v.verified_id) product = bundle.top;
      else {
        const o = bundle.others?.find((x) => x.matches_verified_id === v.verified_id);
        if (o) product = o;
      }
    }
    const cat = classifyCategory(v, product?.type);
    let primaryUrl: string | undefined;
    let isDirect = false;
    const keyword = product?.name ?? v.name_ko;
    const directKeyword = product?.name ?? v.name_en ?? v.name_ko;
    if (cat === 'coupang') {
      if (product?.coupang_url) {
        primaryUrl = coupangProductUrl(product.coupang_url);
        isDirect = true;
      } else {
        primaryUrl = coupangSearchUrl(v.name_en ?? keyword, keyword);
      }
    } else if (cat === 'iherb') {
      if (product?.iherb_url) {
        primaryUrl = iherbProductUrl(product.iherb_url);
        isDirect = true;
      } else {
        primaryUrl = iherbSearchUrl(directKeyword);
      }
    } else if (cat === 'otc' || cat === 'rx') {
      primaryUrl = healthKrSearchUrl(keyword);
    }

    items.push({
      verifiedId: v.verified_id,
      v,
      productName: product?.name,
      productManufacturer: product?.manufacturer,
      productType: product?.type,
      productNote: product?.note,
      category: cat,
      primaryUrl,
      isDirect,
      ingredient: v.name_ko,
    });
  }
  // 정렬 철학: 근거·효과가 먼저다. 처방/시술이라 수익이 안 나도 정직하게 위로 올린다.
  //   1) 효과 크기(|SMD|) — 뚜렷이 다르면(>0.15) 효과 우선
  //   2) 효과 비슷하면 근거 등급 높은 순
  //   3) 그래도 동률이면 구매 가능한(직구/약국) 쪽 — 사용자 편의 차원의 최후 동률 처리
  const catRank: Record<RecommendedItem['category'], number> = {
    coupang: 1,
    iherb: 2,
    otc: 3,
    rx: 4,
    unavailable: 5,
    procedure: 6,
  };
  items.sort((a, b) => {
    // 0) 원문 검증된 효과를 먼저 (추정·2차인용은 뒤로)
    const elA = isHeadlineEligible(a.v) ? 0 : 1;
    const elB = isHeadlineEligible(b.v) ? 0 : 1;
    if (elA !== elB) return elA - elB;
    const ea = Math.abs(a.v.smd ?? 0);
    const eb = Math.abs(b.v.smd ?? 0);
    if (Math.abs(ea - eb) > 0.15) return eb - ea;
    const ga = gradeRank(a.v.evidence_grade);
    const gb = gradeRank(b.v.evidence_grade);
    if (ga !== gb) return ga - gb;
    return catRank[a.category] - catRank[b.category];
  });
  return items;
}

export default function RecommendationResult({
  profile,
  rules,
  verified,
  products,
  prevTreatments,
  outcomeWord,
  onReset,
  onEdit,
}: Props) {
  const matched = matchRules(rules, profile);
  const highlights = new Set<string>();
  for (const r of matched) r.highlight_verified_ids?.forEach((id) => highlights.add(id));

  const items = buildItems(highlights, verified, products);
  const top = items[0];
  const alternatives = items.slice(1, 4);

  // 매칭 안 됐을 때 fallback: 효과 큰 영양제 1위 (건강한 성인 룰 결과)
  const summary: string[] = [];
  const bmi = profile.height_cm && profile.weight_kg
    ? profile.weight_kg / Math.pow(profile.height_cm / 100, 2)
    : null;
  if (bmi !== null) summary.push(`BMI ${bmi.toFixed(1)}`);
  if (profile.age) summary.push(`${profile.age}세`);
  const comorbs: string[] = [];
  if (profile.diabetes) comorbs.push('당뇨');
  if (profile.hypertension) comorbs.push('고혈압');
  if (profile.dyslipidemia) comorbs.push('고지혈');
  if (profile.gout) comorbs.push('통풍');
  if (profile.liver_severity) comorbs.push(`간기능 ${profile.liver_severity}`);
  if (profile.kidney_severity) comorbs.push(`신기능 ${profile.kidney_severity}`);
  if (profile.anticoagulant) comorbs.push('항응고제');
  if (profile.nsaid_allergy) comorbs.push('NSAID 알레르기');

  return (
    <div className="py-2">
      {/* 헤더 */}
      <div className="mb-5 text-center sm:mb-6">
        <div className="mb-2 text-2xl sm:text-3xl">✨</div>
        <h2 className="text-lg font-bold text-slate-900 sm:text-2xl">
          Cochrane 데이터 기반 추천
        </h2>
        {(summary.length > 0 || comorbs.length > 0) && (
          <p className="mt-2 text-xs text-slate-500 sm:text-sm">
            {summary.join(' · ')}
            {comorbs.length > 0 && (
              <span className="ml-2 text-slate-500">— {comorbs.join(', ')}</span>
            )}
          </p>
        )}
      </div>

      {/* 룰 카드들 */}
      {matched.length > 0 && (
        <div className="mb-6 space-y-2">
          {matched.slice(0, 3).map((r) => (
            <RuleBanner key={r.id} rule={r} />
          ))}
        </div>
      )}

      {/* 비교 차트 — 이전 시도 vs 추천 */}
      {top && (profile.previous_treatments?.length ?? 0) > 0 && (
        <ComparisonChart
          previousKeys={profile.previous_treatments ?? []}
          prevTreatments={prevTreatments}
          outcomeWord={outcomeWord}
          topItem={top}
        />
      )}

      {/* 1위 추천 */}
      {top ? (
        <TopRecommendation item={top} />
      ) : (
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-700">
            입력하신 조건으로 매칭되는 1순위 추천이 없습니다. 아래 일반 데이터를 참고하세요.
          </p>
        </div>
      )}

      {/* 차선책 */}
      {alternatives.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-slate-500">
            함께 고려하면 좋은 옵션
          </h3>
          <div className="space-y-2">
            {alternatives.map((it) => (
              <AltOption key={it.verifiedId} item={it} />
            ))}
          </div>
        </div>
      )}

      {/* 복용 중인 약 분석 */}
      <MedsAnalysis
        currentMeds={profile.current_meds ?? ''}
        verified={verified}
        products={products}
      />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-slate-300"
          >
            ✏️ 처음부터 다시
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:border-slate-300"
          >
            초기화
          </button>
        </div>
        <a
          href="#detail"
          className="text-sm text-emerald-600 hover:text-emerald-700"
        >
          모든 데이터·산점도 보기 ↓
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// 부분 컴포넌트
// ============================================================================

function RuleBanner({ rule }: { rule: PersonalizationRule }) {
  const colors =
    rule.rank === 1
      ? 'border-rose-300 bg-rose-50 text-rose-700'
      : rule.rank === 2
        ? 'border-amber-300 bg-amber-50 text-amber-700'
        : 'border-emerald-500 bg-emerald-50 text-emerald-700';
  return (
    <div className={`rounded-xl border p-3 sm:p-4 ${colors}`}>
      <div className="mb-1 flex items-center gap-2 text-sm font-semibold">
        <span>{rule.icon ?? '•'}</span>
        <span>{rule.title}</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-800 sm:text-sm">{rule.message}</p>
    </div>
  );
}

function TopRecommendation({ item }: { item: RecommendedItem }) {
  const s = strengthOf(item.v.smd);
  return (
    <div className="mb-6 overflow-hidden rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50 to-white shadow-xl">
      <div className="bg-emerald-50 px-5 py-2 text-center text-[11px] font-semibold uppercase tracking-widest text-emerald-600 sm:px-6">
        🥇 1위 추천
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-2 text-xs text-slate-500">
          {item.productManufacturer && <span>{item.productManufacturer} · </span>}
          {item.productType ?? '제품 정보'}
        </div>
        <h3 className="mb-1 text-xl font-bold text-slate-900 sm:text-2xl">
          {item.productName ?? item.v.name_ko}
        </h3>
        <p className="text-sm text-slate-500">
          성분: <span className="text-slate-700">{item.v.name_ko}</span>
        </p>
        {item.productNote && (
          <p className="mt-2 text-[11px] italic text-amber-600 sm:text-xs">{item.productNote}</p>
        )}

        <div className="mt-4 flex flex-wrap items-baseline gap-3 sm:gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">SMD</div>
            <div className="tabular-nums text-2xl font-bold text-slate-900">
              {item.v.smd! >= 0 ? '+' : ''}
              {item.v.smd!.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">강도</div>
            <div className={`text-base font-semibold ${s.color}`}>{s.label}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[10px] uppercase tracking-wider text-slate-500">근거</span>
          <ConfidenceChip v={item.v} />
        </div>
        <EvidenceNote v={item.v} />

        <CTA item={item} />
      </div>
    </div>
  );
}

function CTA({ item }: { item: RecommendedItem }) {
  if (item.category === 'coupang' && item.primaryUrl) {
    return (
      <div className="mt-5 space-y-2">
        <a
          href={item.primaryUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full rounded-xl bg-amber-400 px-6 py-4 text-center text-base font-bold text-amber-950 shadow-lg transition hover:bg-amber-500 sm:text-lg"
        >
          🛒 {item.isDirect ? '쿠팡에서 이 제품 보기' : '쿠팡에서 검색하기'}
        </a>
        <p className="text-center text-[11px] text-slate-500">
          쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.
        </p>
      </div>
    );
  }
  if (item.category === 'iherb' && item.primaryUrl) {
    return (
      <div className="mt-5 space-y-2">
        <a
          href={item.primaryUrl}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block w-full rounded-xl bg-emerald-600 px-6 py-4 text-center text-base font-bold text-white shadow-lg transition hover:bg-emerald-700 sm:text-lg"
        >
          🌍 {item.isDirect ? 'iHerb에서 이 제품 보기' : 'iHerb에서 검색하기'}
        </a>
        <p className="text-center text-[11px] text-slate-500">
          iHerb 추천 코드로 첫 구매 5% 할인 받으실 수 있어요.
        </p>
      </div>
    );
  }
  if (item.category === 'rx') {
    return (
      <div className="mt-5 rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm leading-relaxed text-slate-800">
        <div className="mb-1 font-semibold text-rose-700">🏥 의사 처방 후 약국에서 조제</div>
        <p className="text-xs sm:text-sm">
          이 약은 <strong className="text-rose-700">전문의약품</strong>이라 약국에서 처방전이 필요합니다.
          가까운 정형외과/통증의학과에서 진료받으시고,
          <strong> &ldquo;{item.v.name_ko} 성분의 약을 처방해주세요&rdquo;</strong> 라고 말씀하시면
          제품명이 다르더라도 같은 성분으로 받으실 수 있어요.
        </p>
        {item.primaryUrl && (
          <a
            href={item.primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-emerald-600 hover:underline"
          >
            약학정보원에서 자세히 보기 →
          </a>
        )}
      </div>
    );
  }
  if (item.category === 'otc') {
    return (
      <div className="mt-5 rounded-xl border border-indigo-300 bg-indigo-50 p-4 text-sm leading-relaxed text-slate-800">
        <div className="mb-1 font-semibold text-indigo-700">💊 가까운 약국에서 구입</div>
        <p className="text-xs sm:text-sm">
          이 약은 <strong className="text-indigo-700">일반의약품</strong>이라 약국에서만 구입 가능합니다.
          약사님께 <strong>&ldquo;{item.v.name_ko} 성분 약이 있나요?&rdquo;</strong> 라고 문의하시면
          제품 이름이 다르더라도 같은 성분으로 안내해드릴 거예요.
          {item.productName && (
            <>
              {' '}예: <strong>{item.productName}</strong>
              {item.productManufacturer && ` (${item.productManufacturer})`}.
            </>
          )}
        </p>
        {item.primaryUrl && (
          <a
            href={item.primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-emerald-600 hover:underline"
          >
            약학정보원에서 자세히 보기 →
          </a>
        )}
      </div>
    );
  }
  if (item.category === 'procedure') {
    return (
      <div className="mt-5 rounded-xl border border-violet-300 bg-violet-50 p-4 text-sm text-slate-800">
        <div className="mb-1 font-semibold text-violet-700">🩺 의원에서 시술</div>
        <p className="text-xs sm:text-sm">
          정형외과·통증의학과에서 시술받으실 수 있어요. 효과 지속 기간을 의사와 상담하세요.
        </p>
      </div>
    );
  }
  if (item.category === 'unavailable') {
    return (
      <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <div className="mb-1 font-semibold text-slate-800">🚫 한국에서 구입 불가</div>
        <p className="text-xs sm:text-sm">
          이 제품은 국내에 정식 수입되지 않습니다. 대안 성분으로 다른 옵션을 고려하세요.
        </p>
      </div>
    );
  }
  return null;
}

function AltOption({ item }: { item: RecommendedItem }) {
  const s = strengthOf(item.v.smd);
  const catLabel: Record<RecommendedItem['category'], string> = {
    coupang: '🛒 쿠팡',
    iherb: '🌍 iHerb',
    otc: '💊 약국',
    rx: '🏥 약국 처방',
    procedure: '🩺 시술',
    unavailable: '🚫 미수입',
  };
  return (
    <a
      href={item.primaryUrl ?? '#'}
      target={item.primaryUrl ? '_blank' : undefined}
      rel={item.primaryUrl ? 'noopener noreferrer sponsored' : undefined}
      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-500 sm:p-4"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">
          {item.productName ?? item.v.name_ko}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-slate-500">
          {item.v.name_ko !== item.productName && <span>{item.v.name_ko} · </span>}
          SMD {item.v.smd! >= 0 ? '+' : ''}
          {item.v.smd!.toFixed(2)} · <span className={s.color}>{s.label}</span>{' '}
          <ConfidenceChip v={item.v} />
        </div>
      </div>
      <span className="shrink-0 text-[11px] text-slate-500">{catLabel[item.category]}</span>
    </a>
  );
}

// ============================================================================
// 비교 차트 — 이전에 시도한 치료의 SMD vs 추천의 SMD를 막대로 시각화
// ============================================================================

function ComparisonChart({
  previousKeys,
  prevTreatments,
  outcomeWord,
  topItem,
}: {
  previousKeys: string[];
  prevTreatments: PreviousTreatmentOption[];
  outcomeWord: string;
  topItem: RecommendedItem;
}) {
  const prevItems = previousKeys
    .map((k) => findPrevTreatment(prevTreatments, k))
    .filter((p): p is NonNullable<typeof p> => !!p && p.smdAbs !== null);

  if (prevItems.length === 0) return null;

  const topAbs = Math.abs(topItem.v.smd ?? 0);
  const maxAbs = Math.max(topAbs, ...prevItems.map((p) => p.smdAbs ?? 0));
  if (maxAbs === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 sm:p-6">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-amber-600">
        지금까지 시도한 것 vs 추천
      </div>
      <h3 className="mb-4 text-base font-semibold text-slate-900 sm:text-lg">
        효과 크기(SMD 절댓값)로 한눈에 비교
      </h3>

      <div className="space-y-2">
        {prevItems
          .sort((a, b) => (a.smdAbs ?? 0) - (b.smdAbs ?? 0))
          .map((p) => (
            <ComparisonBar
              key={p.key}
              label={p.shortLabel}
              note={p.note}
              smdAbs={p.smdAbs ?? 0}
              maxAbs={maxAbs}
              color="bg-slate-400"
              textColor="text-slate-700"
            />
          ))}

        {/* 구분선 */}
        <div className="my-2 flex items-center gap-2 text-[10px] uppercase tracking-wider text-emerald-600">
          <span className="h-px flex-1 bg-emerald-100" />
          <span>당신을 위한 추천</span>
          <span className="h-px flex-1 bg-emerald-100" />
        </div>

        <ComparisonBar
          label={topItem.productName ?? topItem.v.name_ko}
          note={`성분: ${topItem.v.name_ko}`}
          smdAbs={topAbs}
          maxAbs={maxAbs}
          color="bg-emerald-600"
          textColor="text-emerald-700"
          highlight
        />
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
        효과 크기는 임상시험에서 개선 정도를 비교하는 표준 지표입니다. 막대가 길수록 {outcomeWord} 개선
        효과가 큽니다. <strong className="text-slate-800">0.5↑ 중간, 0.8↑ 큼, 0.2↓ 위약 수준.</strong>
      </p>
    </div>
  );
}

function ComparisonBar({
  label,
  note,
  smdAbs,
  maxAbs,
  color,
  textColor,
  highlight,
}: {
  label: string;
  note?: string;
  smdAbs: number;
  maxAbs: number;
  color: string;
  textColor: string;
  highlight?: boolean;
}) {
  const pct = Math.max(2, (smdAbs / maxAbs) * 100);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <div className="min-w-0 flex-1 truncate text-xs sm:text-sm">
          <span className={`font-medium ${textColor}`}>{label}</span>
          {note && <span className="ml-1 text-[10px] text-slate-500 sm:text-[11px]">· {note}</span>}
        </div>
        <span className={`shrink-0 tabular-nums text-xs font-semibold sm:text-sm ${textColor}`}>
          {smdAbs.toFixed(2)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 sm:h-2.5">
        <div
          className={`h-full rounded-full transition-all ${color} ${highlight ? 'shadow-lg shadow-emerald-200' : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
