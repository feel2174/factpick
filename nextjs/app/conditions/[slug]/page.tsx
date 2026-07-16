import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConditionView from '@/components/ConditionView';
import AffiliateDisclosure from '@/components/AffiliateDisclosure';
import {
  getCellsForCondition,
  getConditionBySlug,
  getEffectsForCondition,
  getKoreaProducts,
  getPersonalizationRules,
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

const HOOK_BY_CONDITION: Record<string, { tag: string; hook: string }> = {
  osteoarthritis: {
    tag: '관절·통증 비교',
    hook: '무릎 통증과 관절 건강에 쓰이는 약·영양제를 효과 크기와 근거 수준으로 나누어 비교합니다.',
  },
  cognitive_decline: {
    tag: '뇌·인지 비교',
    hook: '기억력과 인지기능에 도움을 주장하는 성분들이 실제 연구에서 어떤 결과를 보였는지 정리합니다.',
  },
  insomnia: {
    tag: '수면 비교',
    hook: '멜라토닌, 마그네슘 등 수면에 자주 언급되는 선택지를 효과와 근거로 비교합니다.',
  },
  immune_support: {
    tag: '면역 비교',
    hook: '비타민, 아연, 프로바이오틱스 등 면역 관리 성분의 근거를 차분히 확인합니다.',
  },
  depression_mild: {
    tag: '마음 건강 비교',
    hook: '가벼운 우울감에 언급되는 보조 성분과 약물의 근거를 구분해 보여드립니다.',
  },
  anxiety: {
    tag: '마음 건강 비교',
    hook: '불안 완화를 위해 찾는 성분들의 효과 크기와 연구 신뢰도를 함께 비교합니다.',
  },
  migraine: {
    tag: '편두통 예방 비교',
    hook: '마그네슘, CoQ10 등 편두통 예방 목적으로 쓰이는 성분의 근거를 확인합니다.',
  },
  hyperlipidemia: {
    tag: '심혈관 비교',
    hook: '콜레스테롤과 중성지방 관리에 언급되는 성분들의 실제 연구 결과를 비교합니다.',
  },
  hypertension: {
    tag: '혈압 비교',
    hook: '혈압 개선을 기대하고 찾는 성분들이 연구에서 어느 정도의 차이를 보였는지 정리합니다.',
  },
  skin_aging: {
    tag: '피부 건강 비교',
    hook: '콜라겐과 항산화 성분 등 피부 건강 성분의 임상 근거와 한계를 함께 봅니다.',
  },
  eye_health: {
    tag: '눈 건강 비교',
    hook: '루테인, AREDS, 오메가3 등 눈 건강 성분을 목적과 근거 수준별로 비교합니다.',
  },
  liver_health: {
    tag: '간 건강 비교',
    hook: '밀크시슬, 비타민 E 등 간 건강 관련 성분의 연구 결과를 확인합니다.',
  },
  menopause: {
    tag: '갱년기 비교',
    hook: '홍조와 수면 등 갱년기 증상에 쓰이는 성분과 약물의 근거를 비교합니다.',
  },
  constipation: {
    tag: '장 건강 비교',
    hook: '식이섬유, 마그네슘, 유산균 등 변비 관리 선택지를 근거 중심으로 정리합니다.',
  },
  diarrhea: {
    tag: '장 건강 비교',
    hook: '지사제, 아연, 유산균 등 설사 관리 선택지의 근거와 주의점을 확인합니다.',
  },
  gut_health: {
    tag: '장 건강 비교',
    hook: '프로바이오틱스와 프리바이오틱스를 균주와 근거 수준별로 비교합니다.',
  },
};

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

export async function generateMetadata({
  params,
}: ConditionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const condition = await getConditionBySlug(slug).catch(() => null);
  const catalog = getCatalogCondition(slug);
  if (!condition && !catalog) return {};
  const hook = HOOK_BY_CONDITION[slug];
  const nameKo = condition?.name_ko ?? catalog!.nameKo;
  const title = `${nameKo} 약·영양제 효과 비교`;
  const description =
    hook?.hook ??
    `${nameKo}에 쓰이는 약과 영양제를 효과 크기, 근거 수준, 안전 정보로 비교합니다.`;
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

  const loaded = await Promise.all([
    getCellsForCondition(slug),
    getEffectsForCondition(slug),
    getVerifiedEffects(slug),
    getKoreaProducts(),
    getPersonalizationRules(slug),
  ]).catch((): [
    EvidenceCellRow[],
    EffectsBySubstance,
    VerifiedEffect[],
    ProductsBySubstance,
    PersonalizationRule[],
  ] => [[], {}, [], {}, []]);
  const [allCells, effects, verified, products, rules] = loaded;
  const hasCoupangLinks = verified.some((item) => item.substance_type === 'supplement');
  const verifiedSubIds = new Set(
    verified.map((v) => v.substance_id).filter((x): x is string => !!x),
  );
  const healthyCells = sortCells(
    allCells.filter(
      (c) => c.population.slug === 'healthy_adult' && verifiedSubIds.has(c.substance.id),
    ),
  );

  const hook = HOOK_BY_CONDITION[slug];
  const topCells = healthyCells.slice(0, 5);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: `${conditionName} 약·영양제 효과 비교`,
    description: hook?.hook ?? catalog?.description,
    dateModified: '2026-07-16',
    reviewedBy: { '@type': 'Person', name: '약사 검수', jobTitle: 'Pharmacist' },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <nav aria-label="현재 위치" className="flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:text-sm">
        <Link href="/" className="interactive-link">홈</Link><span aria-hidden="true">/</span><Link href="/conditions" className="interactive-link">질환별 비교</Link><span aria-hidden="true">/</span><span aria-current="page" className="text-slate-700">{conditionName}</span>
      </nav>

      {hasCoupangLinks && <AffiliateDisclosure className="mt-5" />}

      <header className="mt-7 border-b border-slate-200 pb-8 sm:pb-10">
        {hook && (
          <div className="mb-2 inline-block rounded-md bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {hook.tag}
          </div>
        )}
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{conditionName} 약·영양제 효과 비교</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{hook?.hook ?? catalog?.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span>약사 검수</span><span>최종 검토 2026.07</span><span>{catalog?.count ?? verified.length}개 비교 항목</span></div>
      </header>

      <section className="mt-8 rounded-lg border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7" aria-labelledby="quick-answer-heading">
        <p className="eyebrow">먼저 확인하세요</p>
        <h2 id="quick-answer-heading" className="mt-2 text-xl font-bold text-slate-950">효과와 근거를 따로 봐야 합니다</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">효과가 커 보이는 선택지가 항상 가장 믿을 만한 것은 아닙니다. 팩트픽은 개선 정도와 연구 신뢰도를 나누어 보여주고, 원료·제형·사용 기간 차이도 함께 확인합니다.</p>
        {topCells.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{topCells.map((cell) => <a key={cell.id} href="#comparison" className="rounded-md border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:border-emerald-400">{cell.substance.name_ko}</a>)}</div>}
      </section>

      {verified.length > 0 && (
        <div className="mt-10" id="comparison">
          <ConditionView conditionSlug={slug} cells={healthyCells} effects={effects} verified={verified} products={products} rules={rules} />
        </div>
      )}

      <aside className="mt-12 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2" aria-label="관련 정보">
        <Link href="/methodology" className="link-card surface-card p-5"><p className="text-sm font-bold text-slate-950">평가 기준이 궁금하신가요?</p><p className="mt-2 text-xs leading-5 text-slate-500">효과 크기와 근거 수준을 어떻게 나누어 보는지 설명합니다.</p><span className="link-arrow mt-4 inline-block text-slate-400">→</span></Link>
        <Link href="/safety" className="link-card surface-card p-5"><p className="text-sm font-bold text-slate-950">복용 전 안전 정보</p><p className="mt-2 text-xs leading-5 text-slate-500">처방약과 영양제를 함께 복용하기 전 확인할 내용을 정리했습니다.</p><span className="link-arrow mt-4 inline-block text-slate-400">→</span></Link>
      </aside>
    </main>
  );
}
