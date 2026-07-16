import Link from 'next/link';
import ConditionCard from '@/components/ConditionCard';
import HomeConditionSearch from '@/components/HomeConditionSearch';
import { CONDITION_CATALOG } from '@/lib/contentCatalog';

const featured = CONDITION_CATALOG.slice(0, 6);

export default function Home() {
  return (
    <main id="main-content">
      <section className="border-b border-slate-200 bg-white">
        <div className="content-shell py-14 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">약사 검수 기반 근거 비교</p>
            <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-6xl sm:leading-[1.08]">
              약과 영양제, 실제로 도움이 되는지 근거로 비교하세요
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              광고 문구 대신 임상 연구 결과를 기준으로 효과 크기, 근거 수준, 복용 전 주의사항을 한눈에 정리합니다.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/conditions" className="button-primary">건강 고민 선택하기</Link>
              <Link href="/methodology" className="button-secondary">평가 기준 보기</Link>
            </div>
            <ul className="mt-8 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-600" aria-label="서비스 특징">
              <li>약사 검수</li><li aria-hidden="true">·</li><li>임상 근거 중심</li><li aria-hidden="true">·</li><li>효과와 안전성 분리</li>
            </ul>
          </div>
        </div>
      </section>

      <HomeConditionSearch />

      <section className="content-shell py-14 sm:py-20" aria-labelledby="condition-heading">
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">건강 고민별로 찾기</p>
            <h2 id="condition-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">어떤 문제를 먼저 확인할까요?</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">자주 찾는 건강 고민부터 근거를 비교해 보세요.</p>
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
            <p className="eyebrow !text-emerald-300">비교표를 읽는 법</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">효과가 크다는 말과<br />믿을 만하다는 말은 다릅니다</h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-slate-200">
              팩트픽은 증상이 얼마나 개선됐는지와 그 결과를 얼마나 믿을 수 있는지를 나누어 보여줍니다.
            </p>
            <Link href="/methodology" className="mt-7 inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-4 text-sm font-bold text-white transition hover:border-emerald-400 hover:text-emerald-300">평가 기준 자세히 보기 →</Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-lg border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-bold text-emerald-300">EFFECT</p><h3 className="mt-2 text-xl font-bold">효과 크기</h3><p className="mt-2 text-sm leading-6 text-slate-400">실제로 증상이 얼마나 개선됐는지에 가까운 지표입니다.</p></article>
            <article className="rounded-lg border border-slate-700 bg-slate-900 p-5"><p className="text-xs font-bold text-sky-300">EVIDENCE</p><h3 className="mt-2 text-xl font-bold">근거 수준</h3><p className="mt-2 text-sm leading-6 text-slate-400">연구 규모, 설계, 일관성, 편향 가능성을 함께 평가합니다.</p></article>
          </div>
        </div>
      </section>

      <section className="content-shell py-14 sm:py-20" aria-labelledby="deep-dive-heading">
        <p className="eyebrow">성분까지 자세히 보기</p>
        <h2 id="deep-dive-heading" className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">성분은 이름보다 제형과 용량이 중요할 때가 있습니다</h2>
        <Link href="/magnesium" className="link-card surface-card group mt-7 flex flex-col justify-between gap-7 p-6 sm:flex-row sm:items-center">
          <div>
            <span className="rounded-md bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">제형 비교</span>
            <h3 className="mt-4 text-2xl font-bold text-slate-950 group-hover:text-emerald-800">마그네슘 종류 비교</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">산화, 구연산, 글리시네이트 등 제형별 용량, 흡수, 위장 부담을 비교합니다.</p>
          </div>
          <span className="link-arrow shrink-0 text-2xl text-slate-400" aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
