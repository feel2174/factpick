import Link from 'next/link';
import ConditionCard from '@/components/ConditionCard';
import {
  getAllConditions,
  getConditionSubstanceCounts,
  isBetaCondition,
} from '@/lib/queries';

export const revalidate = 60;

export default async function Home() {
  const [conditions, counts] = await Promise.all([
    getAllConditions(),
    getConditionSubstanceCounts(),
  ]);
  const beta = conditions.filter((c) => isBetaCondition(c.slug));
  const comingSoon = conditions.filter((c) => !isBetaCondition(c.slug));

  return (
    <main className="mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-16">
      <header className="mb-10 text-center sm:mb-14">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">팩트픽</h1>
        <p className="mt-3 text-base text-slate-500 sm:text-lg">
          효능 vs 근거 — 약과 영양제를 한눈에
        </p>
      </header>

      {/* 왜 만들었나 — 영선의 진짜 동기 */}
      <section className="mx-auto mb-12 max-w-2xl rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-white p-6 sm:mb-16 sm:p-8">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
          왜 만들었나
        </div>

        <div className="space-y-2 text-base leading-relaxed text-slate-800 sm:text-lg">
          <p className="text-slate-500">
            <span className="text-slate-700">&ldquo;몸에 좋다는 게 이렇게 많은데, 진짜 다 좋은 거 맞아?&rdquo;</span>
          </p>
          <p className="text-slate-500">
            <span className="text-slate-700">&ldquo;약이 나아, 영양제가 나아?&rdquo;</span>
          </p>
          <p className="text-slate-500">
            <span className="text-slate-700">&ldquo;어떤 게 진짜로 효과 있는 거야?&rdquo;</span>
          </p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-slate-700 sm:text-base">
          약국에서 매일 듣는 질문이고, 사실 <strong className="text-slate-900">약사인 저도
          답이 막막했던 질문</strong>입니다. 광고와 후기는 많은데, 진짜 데이터로 정리된 자료는 없더라고요.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-base">
          그래서 <strong className="text-emerald-700">&ldquo;나중에 내가 그 병에 걸리면 진짜로 뭘 먹어야 할까?&rdquo;</strong>
          를 기준으로, Cochrane 메타분석과 임상시험 데이터를 직접 정리했습니다.
          광고가 아닌 <strong className="text-slate-900">효과 크기(SMD) 수치</strong>로 약과 영양제를 비교합니다.
        </p>
        <p className="mt-3 text-xs italic text-slate-500">— 시시약사 영선</p>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-2 text-center text-xl font-bold text-slate-900 sm:text-2xl">
          어디가 고민이세요?
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          관심 있는 곳을 선택하면 약·영양제를 효과 크기로 비교해드려요
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {beta.map((c) => (
            <ConditionCard
              key={c.slug}
              slug={c.slug}
              nameKo={c.name_ko}
              cellCount={counts[c.slug] ?? 0}
            />
          ))}
        </div>
      </section>

      <section className="mb-12 sm:mb-16">
        <h2 className="mb-2 text-center text-xl font-bold text-slate-900 sm:text-2xl">
          성분 깊이 보기
        </h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          같은 성분도 제형마다 함량·흡수율이 천차만별 — 약사가 정리해드려요
        </p>
        <Link href="/magnesium" className="block">
          <div className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-emerald-300 hover:bg-emerald-50/40">
            <div>
              <div className="mb-1 text-[11px] font-medium uppercase tracking-wider text-emerald-600">
                제형 비교
              </div>
              <h3 className="text-xl font-semibold text-slate-900">마그네슘 종류 비교</h3>
              <p className="mt-1 text-sm text-slate-500">
                산화·구연산·글리시네이트… 함량·흡수율·위장부담·가격 한눈에
              </p>
            </div>
            <span className="shrink-0 text-sm text-slate-400 transition group-hover:text-emerald-700">
              비교하기 →
            </span>
          </div>
        </Link>
      </section>

      <section>
        <h2 className="mb-6 text-sm font-medium uppercase tracking-widest text-slate-500">
          준비 중
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {comingSoon.map((c) => (
            <ConditionCard key={c.slug} slug={c.slug} nameKo={c.name_ko} comingSoon />
          ))}
        </div>
      </section>

      <footer className="mt-20 border-t border-slate-200 pt-6 text-center text-xs text-slate-500 sm:mt-24">
        약사 검수 · Cochrane 메타분석 · 효과 크기(SMD) 기반 비교
      </footer>
    </main>
  );
}
