import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '서비스 소개',
  description: '팩트픽이 어떤 기준으로 약과 영양제 정보를 비교하고 설명하는지 소개합니다.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <main id="main-content" className="content-shell py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">팩트픽 소개</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          광고보다 연구 결과를 먼저 봅니다
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          팩트픽은 약과 영양제의 효과를 임상 연구를 바탕으로 비교하고, 어려운 수치를 일상적인 언어로 설명하는 건강 정보 서비스입니다.
        </p>
      </header>

      <section className="mt-12 grid gap-5 md:grid-cols-3" aria-label="팩트픽의 핵심 원칙">
        <article className="surface-card p-6">
          <span className="text-sm font-black text-emerald-700">01</span>
          <h2 className="mt-3 text-xl font-bold text-slate-950">같은 기준으로 비교</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">약과 영양제를 따로 보지 않고 효과 크기와 근거 수준이라는 공통 기준으로 살펴봅니다.</p>
        </article>
        <article className="surface-card p-6">
          <span className="text-sm font-black text-emerald-700">02</span>
          <h2 className="mt-3 text-xl font-bold text-slate-950">한계까지 함께 설명</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">좋은 결과만 강조하지 않고 연구 수, 참여자 수, 결과의 일관성과 주의사항을 함께 보여드립니다.</p>
        </article>
        <article className="surface-card p-6">
          <span className="text-sm font-black text-emerald-700">03</span>
          <h2 className="mt-3 text-xl font-bold text-slate-950">의료 판단은 의료진과</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">정보 탐색을 돕되 진단과 처방을 대신하지 않습니다. 치료 변경은 의료진과 상의해야 합니다.</p>
        </article>
      </section>

      <section className="mt-14 max-w-3xl border-t border-slate-200 pt-10">
        <h2 className="text-2xl font-bold text-slate-950">정보를 만드는 방식</h2>
        <p className="mt-4 text-base leading-8 text-slate-700">
          질환과 성분을 정한 뒤 체계적 문헌고찰, 메타분석, 무작위 대조시험 등 사람을 대상으로 한 연구를 확인합니다. 효과의 크기와 연구 품질을 분리해 평가하고, 실제 선택에 필요한 안전 정보도 함께 정리합니다.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href="/editorial-policy" className="button-primary">편집·검수 원칙 보기</Link>
          <Link href="/methodology" className="button-secondary">평가 방법 확인하기</Link>
        </div>
      </section>
    </main>
  );
}
