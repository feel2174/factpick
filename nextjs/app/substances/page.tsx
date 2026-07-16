import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllSubstances } from '@/lib/queries';
import { SUBSTANCE_CATALOG } from '@/lib/contentCatalog';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '성분 데이터베이스',
  description:
    '마그네슘, 오메가-3, 글루코사민, 진통제 등 주요 성분을 질환별 근거와 함께 탐색합니다.',
  alternates: { canonical: '/substances' },
};

export default async function SubstancesPage() {
  const remote = await getAllSubstances().catch(() => []);
  const substances =
    remote.length > 0
      ? remote.map((item) => ({
          slug: item.slug,
          nameKo: item.name_ko,
          nameEn: item.name_en ?? '',
          category: item.category ?? '기타',
          type: item.substance_type === 'drug' ? '의약품' : '영양제',
          description: '',
        }))
      : [...SUBSTANCE_CATALOG];
  const categories = Array.from(
    new Set(substances.map((item) => item.category)),
  );

  return (
    <main id="main-content" className="content-shell py-10 sm:py-16">
      <header className="max-w-3xl">
        <p className="eyebrow">성분별로 찾기</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          성분 데이터베이스
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
          성분 이름만 보지 않고 질환별 효과, 근거 수준, 원료와 제형 차이를 함께 확인합니다.
        </p>
      </header>
      <div className="mt-8 flex flex-wrap gap-2">
        {categories.map((category) => (
          <a
            key={category}
            href={`#substance-${category}`}
            className="interactive-link rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"
          >
            {category}
          </a>
        ))}
      </div>
      <div className="mt-12 space-y-12">
        {categories.map((category) => (
          <section key={category} id={`substance-${category}`} className="scroll-mt-24">
            <div className="mb-4 flex flex-col items-center gap-2 border-b border-slate-200 pb-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <h2 className="text-xl font-bold text-slate-950">{category}</h2>
              <span className="text-xs text-slate-400">
                {substances.filter((item) => item.category === category).length}개 성분
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {substances
                .filter((item) => item.category === category)
                .map((item) => (
                  <Link
                    key={item.slug}
                    href={`/substances/${item.slug}`}
                    className="link-card surface-card group flex items-center justify-between gap-5 p-5"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-950 group-hover:text-emerald-800">
                          {item.nameKo}
                        </h3>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                          {item.type}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{item.nameEn}</p>
                      {item.description && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <span className="link-arrow shrink-0 text-xl text-slate-400">→</span>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
