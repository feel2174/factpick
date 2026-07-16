import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSubstanceDetail } from '@/lib/queries';
import { getCatalogSubstance } from '@/lib/contentCatalog';

export const dynamic = 'force-dynamic';

interface SubstancePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: SubstancePageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = await getSubstanceDetail(slug).catch(() => null);
  const local = getCatalogSubstance(slug);
  const name = detail?.substance.name_ko ?? local?.nameKo;
  if (!name) return {};
  const hasEvidence = Boolean(detail?.conditions?.length);
  return {
    title: `${name} 효과, 근거, 관련 질환`,
    description: `${name}의 질환별 효과, 근거 수준, 안전 정보를 확인합니다.`,
    alternates: { canonical: `/substances/${slug}` },
    robots: hasEvidence ? undefined : { index: false, follow: true },
  };
}

export default async function SubstancePage({
  params,
}: SubstancePageProps) {
  const { slug } = await params;
  const detail = await getSubstanceDetail(slug).catch(() => null);
  const local = getCatalogSubstance(slug);
  if (!detail && !local) notFound();

  const name = detail?.substance.name_ko ?? local!.nameKo;
  const nameEn = detail?.substance.name_en ?? local?.nameEn;
  const description = detail?.substance.description_ko ?? local?.description;
  const conditions = detail?.conditions ?? [];
  const isDrug = detail?.substance.substance_type === 'drug' || local?.type === '의약품';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${name} 효과와 근거`,
    description,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://factpick.co.kr' },
        { '@type': 'ListItem', position: 2, name: '성분 데이터베이스', item: 'https://factpick.co.kr/substances' },
        { '@type': 'ListItem', position: 3, name },
      ],
    },
  };

  return (
    <main id="main-content" className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav className="flex items-center gap-2 text-xs text-slate-500" aria-label="현재 위치">
        <Link className="interactive-link" href="/">홈</Link>
        <span>/</span>
        <Link className="interactive-link" href="/substances">성분</Link>
        <span>/</span>
        <span>{name}</span>
      </nav>

      <header className="mt-7 border-b border-slate-200 pb-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {isDrug ? '의약품' : '영양 성분'}
          </span>
          <span className="text-xs text-slate-400">약사 검토 데이터</span>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {name}
        </h1>
        {nameEn && <p className="mt-2 text-sm font-medium text-slate-400">{nameEn}</p>}
        <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
      </header>

      <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/70 p-6">
        <p className="eyebrow">먼저 확인하세요</p>
        <h2 className="mt-2 text-xl font-bold text-slate-950">
          같은 성분도 목적에 따라 근거가 달라집니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          성분명만으로 효과를 판단하기 어렵습니다. 질환, 용량, 제형, 사용 기간에 따라 연구 결과가 달라질 수 있어
          아래 질환별 결과에서 효과 크기와 근거 수준을 함께 확인하는 것이 좋습니다.
        </p>
      </section>

      <section className="mt-12 text-center sm:text-left" aria-labelledby="condition-evidence">
        <h2 id="condition-evidence" className="text-2xl font-bold text-slate-950">
          질환별 효과와 근거
        </h2>
        {conditions.length > 0 ? (
          <div className="mt-5 space-y-3 text-left">
            {conditions.map((condition) => (
              <Link
                key={condition.condition_slug}
                href={`/conditions/${condition.condition_slug}`}
                className="link-card surface-card group flex items-center justify-between gap-5 p-5"
              >
                <div>
                  <h3 className="font-bold text-slate-950 group-hover:text-emerald-800">
                    {condition.condition_name_ko}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {condition.ai_summary_ko ??
                      `연구 ${condition.study_count_total}건을 바탕으로 평가했습니다.`}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="rounded-lg bg-slate-950 px-2.5 py-1.5 text-xs font-black text-white">
                    {condition.grade ?? 'I'}
                  </span>
                  <span className="link-arrow text-xl text-slate-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="surface-card mt-5 p-6">
            <h3 className="text-lg font-bold text-slate-950">아직 연결된 비교표가 없습니다</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              성분 설명은 준비되어 있지만 질환별 비교 데이터는 추가 검토 중입니다.
            </p>
          </div>
        )}
      </section>

      <aside className="mt-12 border-t border-slate-200 pt-8">
        <p className="text-sm leading-7 text-slate-500">
          처방약을 임의로 변경하거나 중단하지 마세요. 영양 성분도 질환과 복용 약에 따라 주의가 필요합니다.
        </p>
        <Link href="/safety" className="interactive-link mt-3 inline-flex text-sm font-bold text-slate-700">
          복용 전 안전 정보 보기 →
        </Link>
      </aside>
    </main>
  );
}
