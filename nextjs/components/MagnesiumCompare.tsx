'use client';

import { useMemo, useState } from 'react';
import {
  absorbedPer100mg,
  CATEGORY_NOTE,
  DIRECT_FIT_LABEL,
  LEVEL_LABEL,
  LEVEL_RANK,
  MAGNESIUM_FORMS,
  MG_META,
  USE_TAGS,
  type DirectBuyFit,
  type Level,
  type MagnesiumForm,
  type PriceTier,
  type UseTag,
} from '@/lib/magnesiumForms';

type SortKey = 'absorbed' | 'absorption' | 'gi' | 'elemental' | 'price';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'absorbed', label: '실제 흡수량순' },
  { key: 'absorption', label: '흡수율순' },
  { key: 'gi', label: '위장 편한순' },
  { key: 'elemental', label: '함량(%)순' },
  { key: 'price', label: '저렴한순' },
];

const PRICE_RANK: Record<PriceTier, number> = {
  저가: 0,
  '저~중가': 1,
  중가: 2,
  '중~고가': 3,
  고가: 4,
};

// 흡수율: 높을수록 좋음(초록). 위장부담: 높을수록 나쁨(빨강).
function absorptionColor(level: Level) {
  if (LEVEL_RANK[level] >= 3) return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
  if (LEVEL_RANK[level] === 2) return 'text-amber-700 bg-amber-50 ring-amber-200';
  return 'text-rose-700 bg-rose-50 ring-rose-200';
}
function giColor(level: Level) {
  if (LEVEL_RANK[level] <= 1) return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
  if (LEVEL_RANK[level] === 2) return 'text-amber-700 bg-amber-50 ring-amber-200';
  return 'text-rose-700 bg-rose-50 ring-rose-200';
}
// 실제 흡수량(100mg 제제당 mg): 많을수록 좋음(초록).
function absorbedColor(mg: number) {
  if (mg >= 3.5) return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
  if (mg >= 2) return 'text-amber-700 bg-amber-50 ring-amber-200';
  return 'text-rose-700 bg-rose-50 ring-rose-200';
}

const CATEGORY_BADGE: Record<MagnesiumForm['category'], string> = {
  무기염: 'bg-slate-100 text-slate-600',
  유기염: 'bg-sky-50 text-sky-700',
  '아미노산 킬레이트': 'bg-emerald-50 text-emerald-700',
};

const FIT_BADGE: Record<DirectBuyFit, string> = {
  high: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  mid: 'bg-amber-50 text-amber-700 ring-amber-200',
  low: 'bg-slate-100 text-slate-500 ring-slate-200',
};

const QUICK_PICKS: { use: UseTag; label: string; pick: string; slug: string }[] = [
  { use: '수면·불안', label: '수면·불안·위가 예민', pick: '글리시네이트', slug: 'glycinate' },
  { use: '보충', label: '가성비 일반 보충', pick: '구연산마그네슘', slug: 'citrate' },
  { use: '근육·피로', label: '근육·피로', pick: '말산마그네슘', slug: 'malate' },
  { use: '인지·뇌', label: '인지·뇌', pick: 'L-트레오네이트', slug: 'l_threonate' },
  { use: '변비', label: '변비', pick: '산화·수산화마그네슘', slug: 'oxide' },
];

function Dots({ level, kind }: { level: Level; kind: 'absorption' | 'gi' }) {
  const filled = LEVEL_RANK[level] + 1; // 1~5
  const good = kind === 'absorption' ? LEVEL_RANK[level] >= 3 : LEVEL_RANK[level] <= 1;
  const mid = LEVEL_RANK[level] === 2;
  const dot = good ? 'bg-emerald-500' : mid ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <span className="inline-flex gap-0.5" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${i < filled ? dot : 'bg-slate-200'}`}
        />
      ))}
    </span>
  );
}

export default function MagnesiumCompare() {
  const [activeUse, setActiveUse] = useState<UseTag | 'all'>('all');
  const [sort, setSort] = useState<SortKey>('absorbed');

  const forms = useMemo(() => {
    const filtered =
      activeUse === 'all'
        ? MAGNESIUM_FORMS
        : MAGNESIUM_FORMS.filter((f) => f.uses.includes(activeUse));
    const sorted = [...filtered].sort((a, b) => {
      switch (sort) {
        case 'absorbed':
          return absorbedPer100mg(b) - absorbedPer100mg(a);
        case 'absorption':
          return LEVEL_RANK[b.absorption] - LEVEL_RANK[a.absorption];
        case 'gi':
          return LEVEL_RANK[a.giIssue] - LEVEL_RANK[b.giIssue];
        case 'elemental':
          return b.elementalPct - a.elementalPct;
        case 'price':
          return PRICE_RANK[a.priceTier] - PRICE_RANK[b.priceTier];
      }
    });
    return sorted;
  }, [activeUse, sort]);

  return (
    <div>
      {/* 핵심 함정: 라벨 숫자 ≠ 흡수량 */}
      <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-amber-700">
          가장 헷갈리는 점
        </div>
        <p className="text-sm leading-relaxed text-slate-800 sm:text-base">
          {MG_META.labelTrap}
        </p>
      </section>

      {/* 용도별 빠른 추천 */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">용도별 빠른 선택</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {QUICK_PICKS.map((q) => (
            <button
              key={q.slug}
              onClick={() => setActiveUse(q.use)}
              className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-300 hover:bg-emerald-50/40"
            >
              <div className="text-[11px] text-slate-500">{q.label}</div>
              <div className="mt-1 text-sm font-semibold text-emerald-700">{q.pick}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 필터 + 정렬 */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={activeUse === 'all'} onClick={() => setActiveUse('all')}>
            전체
          </Chip>
          {USE_TAGS.map((u) => (
            <Chip
              key={u.tag}
              active={activeUse === u.tag}
              onClick={() => setActiveUse(u.tag)}
            >
              {u.label}
            </Chip>
          ))}
        </div>
        <div className="flex shrink-0 gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                sort === s.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-500 ring-1 ring-slate-200 hover:text-slate-800'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 카드 그리드 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {forms.map((f) => (
          <FormCard key={f.slug} form={f} />
        ))}
      </div>

      {forms.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">
          해당 용도로 분류된 제형이 없습니다.
        </p>
      )}

      {/* 전체 비교 표 */}
      <section className="mt-12">
        <h2 className="mb-3 text-base font-semibold text-slate-900">전체 한눈에 보기</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                <th className="px-3 py-2.5 font-medium">제형</th>
                <th className="px-3 py-2.5 font-medium">분류</th>
                <th className="px-3 py-2.5 font-medium">원소 Mg<br /><span className="font-normal text-slate-400">(100mg당)</span></th>
                <th className="px-3 py-2.5 font-medium">흡수율</th>
                <th className="px-3 py-2.5 font-medium text-emerald-700">실제 흡수량<br /><span className="font-normal text-emerald-600/70">(100mg당)</span></th>
                <th className="px-3 py-2.5 font-medium">위장부담</th>
                <th className="px-3 py-2.5 font-medium">가격</th>
                <th className="px-3 py-2.5 font-medium">직구</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => (
                <tr key={f.slug} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{f.nameKo}</td>
                  <td className="px-3 py-2.5 text-slate-500">{f.category}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-700">
                    {f.elementalPct}mg
                    <span className="text-slate-400"> ({f.elementalPct}%)</span>
                  </td>
                  <td className="px-3 py-2.5 tabular-nums">
                    <span className="text-slate-700">{LEVEL_LABEL[f.absorption]}</span>
                    <span className="text-slate-400"> ~{f.absorptionPct}%</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ring-1 ${absorbedColor(absorbedPer100mg(f))}`}
                    >
                      ~{absorbedPer100mg(f)}mg
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-slate-700">{LEVEL_LABEL[f.giIssue]}</span>
                  </td>
                  <td className="px-3 py-2.5 text-slate-700">{f.priceTier}</td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ${FIT_BADGE[f.directBuy.fit]}`}
                    >
                      {DIRECT_FIT_LABEL[f.directBuy.fit]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
          실제 흡수량 = 제제(염) 100mg당 원소 마그네슘 × 흡수율(추정). 원소 함량(%)은 화학식 기준 이론치(수화물·버퍼 처리에 따라 달라짐), 흡수율은 문헌 기반 추정치로 개인차·용량차가 큽니다. 정확한 수치가 아니라 상대 비교용입니다.
        </p>
      </section>

      {/* 섭취량 기준 */}
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard
          title="'실제 흡수량'이 핵심인 이유"
          className="border-emerald-200 bg-emerald-50/40 sm:col-span-2"
        >
          {MG_META.absorbedNote}
        </InfoCard>
        <InfoCard
          title="직구로 살 때 (아이허브 등)"
          className="sm:col-span-2"
        >
          {MG_META.directBuyTip}
        </InfoCard>
        <InfoCard title="하루 얼마나?">{MG_META.dailyReferenceKo}</InfoCard>
        <InfoCard title="상한선·설사 주의">{MG_META.upperLimitKo}</InfoCard>
        <InfoCard title="흡수를 높이려면">{MG_META.absorptionCaveat}</InfoCard>
        <InfoCard title="분류별 한 줄 정리">
          <span className="block">
            <b className="text-slate-700">무기염</b> — {CATEGORY_NOTE['무기염']}
          </span>
          <span className="mt-1 block">
            <b className="text-slate-700">유기염</b> — {CATEGORY_NOTE['유기염']}
          </span>
          <span className="mt-1 block">
            <b className="text-slate-700">킬레이트</b> — {CATEGORY_NOTE['아미노산 킬레이트']}
          </span>
        </InfoCard>
      </section>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
        active
          ? 'bg-slate-900 text-white'
          : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900'
      }`}
    >
      {children}
    </button>
  );
}

function InfoCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}>
      <div className="mb-1.5 text-xs font-semibold text-slate-900">{title}</div>
      <div className="text-xs leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

function FormCard({ form: f }: { form: MagnesiumForm }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{f.nameKo}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            {f.nameEn}
            {f.formula ? ` · ${f.formula}` : ''}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${CATEGORY_BADGE[f.category]}`}
        >
          {f.category}
        </span>
      </div>

      {/* 실제 흡수량 — 핵심 숫자 */}
      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5">
        <div className="text-[11px] text-slate-400">100mg 제제(염) 기준 실제 흡수량</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="text-slate-500">100mg</span>
          <span className="text-slate-300">→</span>
          <span className="text-slate-600">원소 {f.elementalPct}mg</span>
          <span className="text-slate-300">→</span>
          <span
            className={`rounded-md px-2 py-0.5 text-sm font-bold ring-1 ${absorbedColor(absorbedPer100mg(f))}`}
          >
            흡수 ~{absorbedPer100mg(f)}mg
          </span>
        </div>
      </div>

      {/* 함량 + 흡수율 대비 */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Metric label="원소 마그네슘 함량">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold tabular-nums text-slate-900">
              {f.elementalPct}
            </span>
            <span className="text-xs text-slate-400">%</span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-slate-400"
              style={{ width: `${Math.min(f.elementalPct, 60) / 60 * 100}%` }}
            />
          </div>
        </Metric>
        <Metric label="흡수율(생체이용률)">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${absorptionColor(f.absorption)}`}
            >
              {LEVEL_LABEL[f.absorption]}
            </span>
            <span className="text-xs tabular-nums text-slate-400">~{f.absorptionPct}%</span>
          </div>
        </Metric>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metric label="위장부담(설사 경향)">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${giColor(f.giIssue)}`}
            >
              {LEVEL_LABEL[f.giIssue]}
            </span>
            <Dots level={f.giIssue} kind="gi" />
          </div>
        </Metric>
        <Metric label="가격대(한국)">
          <span className="text-sm font-semibold text-slate-800">{f.priceTier}</span>
        </Metric>
      </div>

      {/* 용도 칩 */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {f.uses.map((u) => (
          <span
            key={u}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
          >
            {u}
          </span>
        ))}
      </div>

      {/* 정/캡슐당 + 한국 제품 */}
      {f.unitDoseNote && (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
          <b className="text-slate-700">정·캡슐당</b> {f.unitDoseNote}
        </p>
      )}

      {/* 국내 / 직구 구입 정보 */}
      <div className="mt-3 space-y-2">
        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed">
          <span className="mr-1.5 inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
            국내
          </span>
          <span className="font-medium text-slate-600">{f.koreaAvailability}</span>
          {f.exampleProducts.length > 0 && (
            <span className="text-slate-500"> · {f.exampleProducts.join(', ')}</span>
          )}
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed">
          <div className="flex items-center gap-1.5">
            <span className="inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200">
              직구
            </span>
            <span
              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ring-1 ${FIT_BADGE[f.directBuy.fit]}`}
            >
              {DIRECT_FIT_LABEL[f.directBuy.fit]}
            </span>
          </div>
          {f.directBuy.note && <p className="mt-1.5 text-slate-500">{f.directBuy.note}</p>}
          {f.directBuy.products.length > 0 && (
            <ul className="mt-1.5 space-y-1">
              {f.directBuy.products.map((p, i) => (
                <li key={i} className="text-slate-600">
                  <span className="font-medium text-slate-700">{p.brand}</span> {p.name}
                  <span className="block text-[11px] text-slate-400">{p.spec}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 약사 한 줄 */}
      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="text-sm leading-relaxed text-slate-700">
          <span className="mr-1.5 inline-block rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
            약사 한 줄
          </span>
          {f.verdict}
        </p>
      </div>
    </div>
  );
}

function Metric({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] text-slate-400">{label}</div>
      {children}
    </div>
  );
}
