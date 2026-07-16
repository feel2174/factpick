import type { Metadata } from 'next';
import Link from 'next/link';
import ConditionCard from '@/components/ConditionCard';
import ConditionSearchForm from '@/components/ConditionSearchForm';
import { getConditionCategoryLabel } from '@/lib/conditionCategories';
import { getCatalogCondition } from '@/lib/contentCatalog';
import {
  getConditionSubstanceCounts,
  getPublishedConditions,
  searchConditions,
} from '@/lib/queries';
import type { ConditionSearchResult } from '@/lib/types';

interface ConditionsPageProps {
  searchParams?: Promise<{ q?: string | string[] }>;
}

function readQuery(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 60) ?? '';
}

function categoryLabel(condition: ConditionSearchResult) {
  return getConditionCategoryLabel(condition);
}

export async function generateMetadata({ searchParams }: ConditionsPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const query = readQuery(resolvedSearchParams?.q);

  return {
    title: query ? `${query} 관련 건강 고민 검색 결과` : '질환별 약·영양제 근거 비교',
    description: query
      ? `${query}와 관련된 건강 고민을 찾고, 약과 영양제의 효과와 근거 수준을 비교합니다.`
      : '관절 통증, 불면, 혈압, 우울감 등 건강 고민별 약·영양제의 효과와 근거 수준을 비교합니다.',
    alternates: { canonical: '/conditions' },
    robots: query ? { index: false, follow: true } : undefined,
  };
}

export default async function ConditionsPage({ searchParams }: ConditionsPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = readQuery(resolvedSearchParams?.q);
  const [conditions, counts] = await Promise.all([
    query ? searchConditions(query) : getPublishedConditions(),
    getConditionSubstanceCounts(),
  ]);

  const grouped = conditions.reduce<Record<string, ConditionSearchResult[]>>((result, condition) => {
    const label = categoryLabel(condition);
    (result[label] ??= []).push(condition);
    return result;
  }, {});
  const groups = Object.entries(grouped);

  const jsonLd = !query ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '팩트픽 질환별 약·영양제 비교',
    itemListElement: conditions.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name_ko,
      url: `https://factpick.co.kr/conditions/${item.slug}`,
    })),
  } : null;

  return (
    <main id="main-content" className="content-shell py-10 sm:py-16">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}

      <header className="max-w-3xl">
        <p className="eyebrow">질환·증상으로 찾기</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          건강 고민을 고르면 근거를 비교해 드립니다
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-700">
          증상이나 질환명을 입력하면 관련 비교표를 찾을 수 있습니다. 효과 크기, 근거 수준, 복용 전 주의사항을 함께 확인하세요.
        </p>
      </header>

      <ConditionSearchForm defaultValue={query} className="mt-8 max-w-3xl" />

      {query ? (
        <section className="mt-10" aria-labelledby="search-results-heading" aria-live="polite">
          <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-700">검색 결과</p>
              <h2 id="search-results-heading" className="mt-1 text-2xl font-black text-slate-950 sm:text-3xl">
                ‘{query}’ 관련 {conditions.length}개 항목
              </h2>
            </div>
            <Link href="/conditions" className="interactive-link text-sm font-bold text-slate-600">
              전체 질환 보기
            </Link>
          </div>

          {conditions.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conditions.map((condition) => (
                <ConditionCard
                  key={condition.id}
                  slug={condition.slug}
                  nameKo={condition.name_ko}
                  description={condition.description_ko ?? getCatalogCondition(condition.slug)?.description}
                  category={categoryLabel(condition)}
                  cellCount={counts[condition.slug] ?? 0}
                />
              ))}
            </div>
          ) : (
            <div className="surface-card mt-6 max-w-3xl p-6 sm:p-8">
              <h3 className="text-xl font-bold text-slate-950">검색어를 조금 다르게 입력해 보세요</h3>
              <p className="mt-3 text-base leading-7 text-slate-700">
                증상은 짧은 단어로 입력하면 더 잘 찾을 수 있습니다. 예를 들어 “무릎”, “수면”, “혈압”처럼 검색해 보세요.
              </p>
            </div>
          )}
        </section>
      ) : (
        <>
          <nav className="mt-8 flex flex-wrap gap-2" aria-label="질환 분류 바로가기">
            {groups.map(([group]) => (
              <a key={group} href={`#${encodeURIComponent(group)}`} className="interactive-link rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-600 hover:border-emerald-300">
                {group}
              </a>
            ))}
          </nav>

          <div className="mt-12 space-y-14">
            {groups.map(([group, items]) => (
              <section key={group} id={group} className="scroll-mt-24" aria-labelledby={`${group}-heading`}>
                <div className="mb-5 flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 id={`${group}-heading`} className="text-xl font-bold text-slate-950">{group}</h2>
                  <span className="text-sm font-semibold text-slate-500">{items.length}개 질환</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((condition) => (
                    <ConditionCard
                      key={condition.id}
                      slug={condition.slug}
                      nameKo={condition.name_ko}
                      description={condition.description_ko ?? getCatalogCondition(condition.slug)?.description}
                      category={group}
                      cellCount={counts[condition.slug] ?? 0}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
