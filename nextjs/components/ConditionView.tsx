'use client';

import { useCallback, useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
import QuizFunnel from './QuizFunnel';
import ScatterChart from './ScatterChart';
import SubstanceTable from './SubstanceTable';
import type {
  EffectsBySubstance,
  EvidenceCellRow,
  PersonalizationRule,
  ProductsBySubstance,
  VerifiedEffect,
} from '@/lib/types';

interface Props {
  conditionSlug: string;
  cells: EvidenceCellRow[];
  effects: EffectsBySubstance;
  verified: VerifiedEffect[];
  products: ProductsBySubstance;
  rules: PersonalizationRule[];
}

function sameSet(a: Set<string>, b: Set<string>): boolean {
  if (a === b) return true;
  if (a.size !== b.size) return false;
  let same = true;
  a.forEach((x) => {
    if (!b.has(x)) same = false;
  });
  return same;
}

export default function ConditionView({
  conditionSlug,
  cells,
  effects,
  verified,
  products,
  rules,
}: Props) {
  const [highlightVerifiedIds, setHighlight] = useState<Set<string>>(new Set());
  const [avoidVerifiedIds, setAvoid] = useState<Set<string>>(new Set());
  const [detailOpen, setDetailOpen] = useState(false);

  const handleHighlightChange = useCallback(
    ({
      highlightVerifiedIds: hi,
      avoidVerifiedIds: av,
    }: {
      highlightVerifiedIds: Set<string>;
      avoidVerifiedIds: Set<string>;
    }) => {
      setHighlight((prev) => (sameSet(prev, hi) ? prev : hi));
      setAvoid((prev) => (sameSet(prev, av) ? prev : av));
    },
    [],
  );

  return (
    <ErrorBoundary>
      {/* 메인 흐름: Quiz funnel → 결과 → 강한 CTA */}
      <QuizFunnel
        conditionSlug={conditionSlug}
        rules={rules}
        verified={verified}
        products={products}
        onHighlightChange={handleHighlightChange}
      />

      {/* 더 자세히 보기 (펼침) */}
      <section id="detail" className="mt-12">
        <button
          type="button"
          onClick={() => setDetailOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-slate-300"
        >
          <div>
            <div className="text-sm font-semibold text-slate-900">
              📊 모든 데이터 — 산점도 + 전체 성분 비교표
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {detailOpen
                ? '닫기'
                : '효과 vs 근거 산점도, 전체 검증 항목 SMD, 출처(Cochrane 등) 확인'}
            </div>
          </div>
          <span className="text-2xl text-slate-500">{detailOpen ? '−' : '+'}</span>
        </button>

        {detailOpen && (
          <>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-500">
                효능 vs 근거
              </h2>
              <ScatterChart
                verified={verified}
                products={products}
                highlightVerifiedIds={highlightVerifiedIds}
                avoidVerifiedIds={avoidVerifiedIds}
              />
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-500">
                전체 성분 비교표
              </h2>
              <SubstanceTable
                cells={cells}
                effects={effects}
                verified={verified}
                products={products}
                highlightVerifiedIds={highlightVerifiedIds}
                avoidVerifiedIds={avoidVerifiedIds}
              />
            </div>
          </>
        )}
      </section>
    </ErrorBoundary>
  );
}
