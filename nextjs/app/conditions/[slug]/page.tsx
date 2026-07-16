import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConditionView from '@/components/ConditionView';
import {
  getCellsForCondition,
  getConditionBySlug,
  getEffectsForCondition,
  getVerifiedEffects,
} from '@/lib/queries';
import type {
  EffectsBySubstance,
  EvidenceCellRow,
  Grade,
  PersonalizationRule,
  ProductsBySubstance,
  VerifiedEffect,
} from '@/lib/types';
import { CONDITION_CATALOG, getCatalogCondition } from '@/lib/contentCatalog';

export const revalidate = 3600;

const GRADE_ORDER: Record<Grade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4, I: 5 };

interface ConditionPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return CONDITION_CATALOG.map((condition) => ({ slug: condition.slug }));
}

function sortCells(cells: EvidenceCellRow[]): EvidenceCellRow[] {
  return [...cells].sort((a, b) => {
    const ga = a.ai_grade ? GRADE_ORDER[a.ai_grade] : 99;
    const gb = b.ai_grade ? GRADE_ORDER[b.ai_grade] : 99;
    if (ga !== gb) return ga - gb;
    return (b.ai_efficacy_score ?? 0) - (a.ai_efficacy_score ?? 0);
  });
}

function descriptionFor(name: string, fallback?: string | null) {
  return fallback ?? `${name} 관리에 자주 언급되는 성분과 치료 선택지를 임상 연구 근거 중심으로 비교합니다.`;
}

export async function generateMetadata({
  params,
}: ConditionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const condition = await getConditionBySlug(slug).catch(() => null);
  const catalog = getCatalogCondition(slug);
  if (!condition && !catalog) return {};

  const nameKo = condition?.name_ko ?? catalog!.nameKo;
  const title = `${nameKo} 효과 근거 비교`;
  const description = descriptionFor(nameKo, catalog?.description);
  const url = `/conditions/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ConditionPage({ params }: ConditionPageProps) {
  const { slug } = await params;
  const catalog = getCatalogCondition(slug);
  const condition = await getConditionBySlug(slug).catch(() => null);
  if (!condition && !catalog) notFound();

  const conditionName = condition?.name_ko ?? catalog!.nameKo;
  const description = descriptionFor(conditionName, catalog?.description);

  const loaded = await Promise.all([
    getCellsForCondition(slug),
    getEffectsForCondition(slug),
    getVerifiedEffects(slug),
  ]).catch((): [
    EvidenceCellRow[],
    EffectsBySubstance,
    VerifiedEffect[],
  ] => [[], {}, []]);

  const [allCells, effects, verified] = loaded;
  const verifiedSubIds = new Set(
    verified.map((v) => v.substance_id).filter((x): x is string => Boolean(x)),
  );
  const healthyCells = sortCells(
    allCells.filter(
      (cell) => cell.population.slug === 'healthy_adult' && verifiedSubIds.has(cell.substance.id),
    ),
  );
  const topCells = healthyCells.slice(0, 5);
  const products: ProductsBySubstance = {};
  const rules: PersonalizationRule[] = [];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${conditionName} 효과 근거 비교`,
    description,
    dateModified: '2026-07-16',
    reviewedBy: { '@type': 'Person', name: '약사 검토', jobTitle: 'Pharmacist' },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: 'https://factpick.co.kr' },
        { '@type': 'ListItem', position: 2, name: '질환별 비교', item: 'https://factpick.co.kr/conditions' },
        { '@type': 'ListItem', position: 3, name: conditionName },
      ],
    },
  };

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
        <Link href="/" className="interactive-link">홈</Link>
        <span aria-hidden="true">/</span>
        <Link href="/conditions" className="interactive-link">질환별 비교</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="text-slate-700">{conditionName}</span>
      </nav>

      <header className="mt-7 border-b border-slate-200 pb-8 sm:pb-10">
        <div className="mb-2 inline-block rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          근거 기반 비교
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          {conditionName} 효과 근거 비교
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
          {description}
        </p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
          <span>약사 검토</span>
          <span>최종 업데이트 2026.07</span>
          <span>{catalog?.count ?? verified.length}개 비교 항목</span>
        </div>
      </header>

      <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7" aria-labelledby="quick-answer-heading">
        <p className="eyebrow">먼저 확인하세요</p>
        <h2 id="quick-answer-heading" className="mt-2 text-xl font-bold text-slate-950">
          효과 크기와 근거 수준을 함께 봐야 합니다
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
          어떤 성분은 연구 결과가 좋아 보여도 대상자 수가 적거나 연구 품질이 낮을 수 있습니다.
          Factpick은 효과 크기, 근거 등급, 주의사항을 함께 보여주어 사용자가 더 차분하게 판단할 수 있도록 돕습니다.
        </p>
        {topCells.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {topCells.map((cell) => (
              <a
                key={cell.id}
                href="#comparison"
                className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:border-emerald-400"
              >
                {cell.substance.name_ko}
              </a>
            ))}
          </div>
        )}
      </section>

      {verified.length > 0 && (
        <div className="mt-10" id="comparison">
          <ConditionView
            conditionSlug={slug}
            cells={healthyCells}
            effects={effects}
            verified={verified}
            products={products}
            rules={rules}
          />
        </div>
      )}

      <aside className="mt-12 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2" aria-label="관련 정보">
        <Link href="/methodology" className="link-card surface-card p-5">
          <p className="text-sm font-bold text-slate-950">평가 기준이 궁금하신가요?</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            효과 크기와 근거 수준을 어떤 기준으로 나누는지 설명합니다.
          </p>
          <span className="link-arrow mt-4 inline-block text-slate-400">→</span>
        </Link>
        <Link href="/safety" className="link-card surface-card p-5">
          <p className="text-sm font-bold text-slate-950">복용 전 안전 정보</p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            처방약과 영양 성분을 함께 복용하기 전 확인할 내용을 정리했습니다.
          </p>
          <span className="link-arrow mt-4 inline-block text-slate-400">→</span>
        </Link>
      </aside>
    </main>
  );
}
