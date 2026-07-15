import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '데이터 관리 원칙',
  description: '팩트픽이 임상 연구를 검토하고 약·영양제 비교 정보에 반영하는 기준을 안내합니다.',
  alternates: { canonical: '/updates' },
};

const standards = [
  { number: '01', title: '원문을 먼저 확인합니다', body: '홍보 자료나 요약 기사보다 메타분석과 임상시험 원문에 기재된 결과를 우선합니다.' },
  { number: '02', title: '숫자의 조건을 함께 봅니다', body: '효과 수치만 떼어내지 않고 대상자, 용량, 기간, 원료와 제형을 함께 확인합니다.' },
  { number: '03', title: '약사가 마지막으로 검토합니다', body: '실제 복용에서 중요한 안전성, 상호작용과 한국 시판 환경을 함께 살펴봅니다.' },
];

export default function DataStandardsPage() {
  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <header>
        <p className="eyebrow">데이터 관리 원칙</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">새로운 정보보다 믿을 수 있는 정보를 우선합니다</h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">팩트픽은 자료의 양을 늘리는 것보다, 사용자가 잘못 이해하지 않도록 확인하고 설명하는 과정을 중요하게 생각합니다.</p>
      </header>
      <section className="mt-12 space-y-4" aria-label="데이터 검토 기준">
        {standards.map((item) => (
          <article key={item.number} className="surface-card grid gap-3 p-6 sm:grid-cols-[48px_1fr] sm:p-7">
            <span className="text-lg font-black text-emerald-700">{item.number}</span>
            <div><h2 className="text-xl font-bold text-slate-950">{item.title}</h2><p className="mt-3 text-base leading-7 text-slate-700">{item.body}</p></div>
          </article>
        ))}
      </section>
      <div className="mt-12 flex flex-col gap-3 sm:flex-row"><Link href="/conditions" className="button-primary">질환별 효과 비교하기 →</Link><Link href="/methodology" className="button-secondary">평가 방법 자세히 보기</Link></div>
    </main>
  );
}
