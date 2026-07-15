import Link from 'next/link';
import ConditionCard from '@/components/ConditionCard';
import HomeConditionSearch from '@/components/HomeConditionSearch';
import { CONDITION_CATALOG } from '@/lib/contentCatalog';

const featured = CONDITION_CATALOG.slice(0, 6);

export default function Home() {
  return (
    <main id="main-content">
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.13),transparent_62%)]" />
        <div className="content-shell relative py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">약사가 연구 결과를 직접 확인했습니다</p>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-6xl sm:leading-[1.08]">
              내 증상에는 어떤 약과 영양제가<br className="hidden sm:block" /> 실제로 도움이 될까요?
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              광고나 후기 대신 임상시험 결과를 기준으로 비교했습니다. 건강 고민을 선택하면 효과가 얼마나 확인됐는지 쉬운 말로 알려드립니다.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/conditions" className="button-primary">내 건강 고민 선택하기 <span aria-hidden="true">→</span></Link>
              <Link href="/methodology" className="button-secondary">자료를 고른 기준 보기</Link>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600" aria-label="서비스 특징">
              <li>약사 검수</li><li aria-hidden="true">·</li><li>임상시험 근거</li><li aria-hidden="true">·</li><li>약과 영양제 함께 비교</li>
            </ul>
          </div>
        </div>
      </section>

      <HomeConditionSearch />

      <section className="content-shell py-14 sm:py-20" aria-labelledby="condition-heading">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">건강 고민별로 찾기</p>
            <h2 id="condition-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">어떤 건강 문제를 확인하고 싶으세요?</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">아래에서 가장 궁금한 건강 문제를 선택하세요.</p>
          </div>
          <Link href="/conditions" className="interactive-link hidden shrink-0 text-sm font-bold text-slate-700 sm:block">전체 16개 보기 →</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((condition) => (
            <ConditionCard key={condition.slug} slug={condition.slug} nameKo={condition.nameKo} description={condition.description} category={condition.category} cellCount={condition.count} />
          ))}
        </div>
        <Link href="/conditions" className="button-secondary mt-5 w-full sm:hidden">전체 질환 보기</Link>
      </section>

      <section className="border-y border-slate-200 bg-slate-950 text-white">
        <div className="content-shell grid gap-10 py-14 sm:py-20 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div>
            <p className="eyebrow !text-emerald-300">비교표를 읽는 방법</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">효과가 크다는 것과<br />믿을 만하다는 것은 다릅니다</h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-slate-200">‘효과’는 실제로 얼마나 좋아졌는지를, ‘근거’는 그 결과를 얼마나 믿을 수 있는지를 뜻합니다. 두 가지를 함께 봐야 올바르게 비교할 수 있습니다.</p>
            <Link href="/methodology" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:border-emerald-400 hover:text-emerald-300">평가 기준 자세히 보기 <span aria-hidden="true">→</span></Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-bold text-emerald-300">EFFECT</p><h3 className="mt-2 text-xl font-bold">효과 크기</h3><p className="mt-2 text-sm leading-6 text-slate-400">실제로 증상이 얼마나 개선됐는지를 표준화한 수치입니다.</p></article>
            <article className="rounded-2xl border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-bold text-sky-300">EVIDENCE</p><h3 className="mt-2 text-xl font-bold">근거 수준</h3><p className="mt-2 text-sm leading-6 text-slate-400">연구 규모·품질·일관성과 편향 가능성을 함께 평가합니다.</p></article>
          </div>
        </div>
      </section>

      <section className="content-shell py-14 sm:py-20" aria-labelledby="deep-dive-heading">
        <p className="eyebrow">성분을 더 자세히 보기</p>
        <h2 id="deep-dive-heading" className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">성분은 이름보다 제형이 중요할 때가 있습니다</h2>
        <Link href="/magnesium" className="link-card surface-card group mt-7 flex flex-col justify-between gap-7 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">제형 비교</span>
            <h3 className="mt-4 text-2xl font-bold text-slate-950 group-hover:text-emerald-800">마그네슘 종류 비교</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">산화·구연산·글리시네이트·L-트레오네이트의 함량, 흡수, 위장 부담과 용도를 한눈에 비교합니다.</p>
          </div>
          <span className="link-arrow shrink-0 text-2xl text-slate-400" aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="content-shell py-14 sm:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">팩트픽의 약속</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">쉽게 설명하되, 중요한 내용은 빼지 않습니다</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">효과만 강조하지 않고 근거의 한계와 복용 시 주의사항까지 함께 보여드립니다.</p>
          </div>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            <article className="surface-card p-6"><span className="text-sm font-black text-emerald-700">01</span><h3 className="mt-3 text-lg font-bold text-slate-950">약사가 직접 확인</h3><p className="mt-3 text-base leading-7 text-slate-600">논문 수치와 실제 복용 시 고려할 내용을 함께 검토합니다.</p></article>
            <article className="surface-card p-6"><span className="text-sm font-black text-emerald-700">02</span><h3 className="mt-3 text-lg font-bold text-slate-950">효과 없음과 자료 부족을 구분</h3><p className="mt-3 text-base leading-7 text-slate-600">연구가 적다는 이유만으로 효과가 없다고 단정하지 않습니다.</p></article>
            <article className="surface-card p-6"><span className="text-sm font-black text-emerald-700">03</span><h3 className="mt-3 text-lg font-bold text-slate-950">안전 정보를 함께 안내</h3><p className="mt-3 text-base leading-7 text-slate-600">처방약, 질환과 함께 확인해야 할 주의사항을 놓치지 않습니다.</p></article>
          </div>
          <Link href="/methodology" className="interactive-link mt-6 inline-flex text-base font-bold text-slate-800">자료 선정 기준 자세히 보기 →</Link>
        </div>
      </section>
    </main>
  );
}
