import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '편집 및 검토 정책',
  description: 'Factpick 건강 정보의 자료 수집, 검토, 표현, 업데이트 원칙을 안내합니다.',
  alternates: { canonical: '/editorial-policy' },
};

const principles = [
  {
    title: '출처를 확인할 수 있게 합니다',
    body: '가능한 경우 연구 제목, 학술지, 발표 연도, 원문 링크를 제공해 이용자가 근거를 직접 확인할 수 있도록 합니다.',
  },
  {
    title: '효과와 근거 수준을 구분합니다',
    body: '효과가 크게 관찰되더라도 연구 수가 적거나 품질이 낮으면 이를 별도로 표시합니다. 자료 부족을 효과 없음으로 단정하지 않습니다.',
  },
  {
    title: '과장된 표현을 사용하지 않습니다',
    body: '치료, 완치, 보장처럼 연구 결과가 뒷받침하지 않는 단정 표현을 피하고 적용 대상과 연구의 한계를 함께 설명합니다.',
  },
  {
    title: '안전 정보를 함께 검토합니다',
    body: '복용 금기, 의약품 상호작용, 임신과 수유, 기존 질환 등 선택에 영향을 주는 주의사항을 효과 정보와 분리하지 않습니다.',
  },
  {
    title: '새 근거를 반영합니다',
    body: '새로운 연구나 안전 정보가 확인되면 기존 비교 결과를 다시 검토하고 필요한 경우 내용을 업데이트합니다.',
  },
];

export default function EditorialPolicyPage() {
  return (
    <main id="main-content" className="content-shell py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">편집 및 검토 정책</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          건강 정보를 다루는 기준
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          Factpick은 특정 제품을 권하기보다 이용자가 근거의 강점과 한계를 함께 이해하도록 돕는 것을 우선합니다.
        </p>
      </header>

      <div className="mt-12 max-w-4xl space-y-4">
        {principles.map((principle, index) => (
          <section key={principle.title} className="surface-card grid gap-3 p-6 sm:grid-cols-[3rem_1fr] sm:p-7">
            <span className="text-sm font-black text-emerald-700">{String(index + 1).padStart(2, '0')}</span>
            <div>
              <h2 className="text-xl font-bold text-slate-950">{principle.title}</h2>
              <p className="mt-2 text-base leading-7 text-slate-700">{principle.body}</p>
            </div>
          </section>
        ))}
      </div>

      <aside className="mt-12 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-7">
        <h2 className="text-xl font-bold text-slate-950">의료 정보 이용 시 유의사항</h2>
        <p className="mt-3 text-base leading-7 text-slate-700">
          Factpick의 정보는 일반적인 건강 정보이며 개인의 증상, 검사 결과, 복용 약을 반영한 진단이나 처방이 아닙니다.
          응급 증상이나 치료 결정은 의료기관과 상담하세요.
        </p>
        <Link href="/safety" className="interactive-link mt-4 inline-flex font-bold text-slate-800">
          안전 정보 자세히 보기 →
        </Link>
      </aside>
    </main>
  );
}
