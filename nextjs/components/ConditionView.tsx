'use client';

import { useState } from 'react';
import ErrorBoundary from './ErrorBoundary';
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

export default function ConditionView({
  cells,
  effects,
  verified,
  products,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <ErrorBoundary>
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-sm font-bold text-slate-950">자료를 읽는 기준</p>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          이 페이지는 구매 유도나 특정 제품 추천이 아니라, 공개된 임상 연구에서 확인된 효과 크기와 근거 수준을 정리한 참고 자료입니다.
          개인의 질환, 복용 중인 약, 임신 여부에 따라 판단이 달라질 수 있으므로 치료 변경 전에는 의사 또는 약사와 상담하세요.
        </p>
      </section>

      <section id="detail" className="mt-8">
        <button
          type="button"
          onClick={() => setDetailOpen((value) => !value)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 text-left transition hover:border-slate-300"
        >
          <div>
            <div className="text-sm font-semibold text-slate-900">
              전체 근거와 성분 비교 보기
            </div>
            <div className="mt-0.5 text-xs text-slate-500">
              {detailOpen
                ? '접기'
                : '효과 크기, 근거 수준, 연구 출처, 주의사항을 함께 확인합니다.'}
            </div>
          </div>
          <span className="text-2xl text-slate-500">{detailOpen ? '-' : '+'}</span>
        </button>

        {detailOpen && (
          <>
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-500">
                효과와 근거 수준
              </h2>
              <ScatterChart
                verified={verified}
                products={products}
                highlightVerifiedIds={new Set()}
                avoidVerifiedIds={new Set()}
              />
            </div>

            <div className="mt-8">
              <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-slate-500">
                전체 성분 비교
              </h2>
              <SubstanceTable
                cells={cells}
                effects={effects}
                verified={verified}
                products={products}
                highlightVerifiedIds={new Set()}
                avoidVerifiedIds={new Set()}
              />
            </div>
          </>
        )}
      </section>
    </ErrorBoundary>
  );
}
