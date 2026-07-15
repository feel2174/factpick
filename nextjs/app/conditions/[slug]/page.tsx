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
import { getCatalogCondition } from '@/lib/contentCatalog';

export const revalidate = 60;

const GRADE_ORDER: Record<Grade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4, I: 5 };

interface ConditionPageProps {
  params: Promise<{ slug: string }>;
}

function sortCells(cells: EvidenceCellRow[]): EvidenceCellRow[] {
  return [...cells].sort((a, b) => {
    const ga = a.ai_grade ? GRADE_ORDER[a.ai_grade] : 99;
    const gb = b.ai_grade ? GRADE_ORDER[b.ai_grade] : 99;
    if (ga !== gb) return ga - gb;
    return (b.ai_efficacy_score ?? 0) - (a.ai_efficacy_score ?? 0);
  });
}

const HOOK_BY_CONDITION: Record<string, { tag: string; hook: string }> = {
  osteoarthritis: {
    tag: '관절통 비교',
    hook: '정형외과·통증의학과 약·주사 맞아도 잘 안 풀리는 무릎 통증. 약사가 Cochrane SMD로 정리한 진짜 효과 있는 영양제와 약.',
  },
  cognitive_decline: {
    tag: '뇌 건강 비교',
    hook: '깜빡임이 늘어났을 때 진짜 효과 있는 영양제는 뭘까. 약사가 메타분석 데이터로 정리.',
  },
  insomnia: {
    tag: '수면 비교',
    hook: '수면제 말고 멜라토닌·마그네슘은 진짜 효과 있을까. 약사가 메타분석으로 약과 영양제를 비교.',
  },
  immune_support: {
    tag: '면역 비교',
    hook: '비타민C·아연·비타민D, 감기 예방에 진짜 효과 있는 건 뭘까. 약사가 메타분석으로 정리.',
  },
  depression_mild: {
    tag: '우울 비교',
    hook: '세인트존스워트·EPA 오메가-3는 약에 근접할까. 우울에 진짜 효과 있는 약·영양제를 비교.',
  },
  anxiety: {
    tag: '불안 비교',
    hook: '라벤더·아슈와간다는 신경안정제에 근접할까. 불안에 효과 있는 약·영양제를 메타분석으로 비교.',
  },
  migraine: {
    tag: '편두통 예방 비교',
    hook: '마그네슘·CoQ10·리보플라빈은 편두통 예방에 통할까. 가이드라인급 영양제와 예방약을 비교.',
  },
  hyperlipidemia: {
    tag: '콜레스테롤 비교',
    hook: '‘천연’ 홍국의 정체는 저용량 스타틴? 콜레스테롤에 진짜 효과 있는 약·영양제를 비교.',
  },
  hypertension: {
    tag: '혈압 비교',
    hook: '마늘·비트는 혈압을 낮출까. 약이 압도하는 고혈압에서 영양제의 실제 효과를 비교.',
  },
  skin_aging: {
    tag: '피부 비교',
    hook: '먹는 콜라겐·아스타잔틴은 피부에 통할까. 외용 레티노이드와 영양제를 데이터로 비교.',
  },
  eye_health: {
    tag: '눈 건강 비교',
    hook: '루테인·빌베리·오메가3, 눈에 진짜 효과 있을까. 황반·안구건조·눈피로별로 약·영양제를 비교(빌베리는 원료가 핵심).',
  },
  liver_health: {
    tag: '간 건강 비교',
    hook: '밀크씨슬·헛개, 간에 진짜 효과 있을까. NASH 신약부터 영양제까지 근거로 비교.',
  },
  menopause: {
    tag: '갱년기 비교',
    hook: '백수오·이소플라본은 안면홍조에 통할까. 호르몬요법·비호르몬약과 영양제를 비교(백수오 진위 주의).',
  },
  constipation: {
    tag: '변비 비교',
    hook: '차전자피·마그네슘·유산균, 변비에 뭐가 나을까. 하제·처방약과 영양제를 근거로 비교.',
  },
  diarrhea: {
    tag: '설사 비교',
    hook: '유산균·아연은 설사에 효과 있을까. 지사제와 영양제를 근거로 비교.',
  },
  gut_health: {
    tag: '장 건강 비교',
    hook: '유산균·페퍼민트오일, 과민성대장과 장 건강에 통할까. 균주·근거별로 비교.',
  },
};

export async function generateMetadata({
  params,
}: ConditionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const condition = await getConditionBySlug(slug).catch(() => null);
  const catalog = getCatalogCondition(slug);
  if (!condition && !catalog) return {};
  const hook = HOOK_BY_CONDITION[slug];
  const nameKo = condition?.name_ko ?? catalog!.nameKo;
  const title = `${nameKo} 영양제·약 효과 비교`;
  const description =
    hook?.hook ??
    `${nameKo}에 진짜 효과 있는 약·영양제를 약사가 Cochrane 메타분석 SMD로 비교했습니다.`;
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
  // 큐레이션한 verified 성분에 매칭되는 cell만 유지(verified 행의 연구수 카운트용).
  // 옛 AI 자동추출(미매칭 cell)은 오연결·과대 효능이 많아 표시·전송 모두 제외.
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
    dateModified: '2026-07-14',
    reviewedBy: { '@type': 'Person', name: '영선', jobTitle: '약사' },
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
          <div className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-600 sm:text-[11px]">
            {hook.tag}
          </div>
        )}
        <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{conditionName} 약·영양제 효과 비교</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{hook?.hook ?? catalog?.description}</p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500"><span>약사 검수</span><span>최종 검토 2026.07</span><span>{catalog?.count ?? verified.length}개 비교 항목</span></div>
      </header>

      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:p-7" aria-labelledby="quick-answer-heading">
        <p className="eyebrow">먼저 확인하세요</p>
        <h2 id="quick-answer-heading" className="mt-2 text-xl font-bold text-slate-950">먼저 알아야 할 결론</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">효과가 큰 선택지가 항상 가장 믿을 만한 것은 아닙니다. 팩트픽은 개선 정도와 연구의 신뢰도를 분리하고, 원료·제형·사용 기간의 차이까지 함께 보여드립니다.</p>
        {topCells.length > 0 && <div className="mt-5 flex flex-wrap gap-2">{topCells.map((cell) => <a key={cell.id} href="#comparison" className="rounded-full border border-emerald-200 bg-white px-3 py-2 text-xs font-bold text-emerald-800 hover:border-emerald-400">{cell.substance.name_ko}</a>)}</div>}
      </section>

      {verified.length > 0 && (
        <div className="mt-10" id="comparison">
          <ConditionView conditionSlug={slug} cells={healthyCells} effects={effects} verified={verified} products={products} rules={rules} />
        </div>
      )}

      <aside className="mt-12 grid gap-4 border-t border-slate-200 pt-8 sm:grid-cols-2" aria-label="관련 정보"><Link href="/methodology" className="link-card surface-card p-5"><p className="text-sm font-bold text-slate-950">이 수치는 어떻게 평가하나요?</p><p className="mt-2 text-xs leading-5 text-slate-500">효과 크기와 근거 수준의 차이를 확인하세요.</p><span className="link-arrow mt-4 inline-block text-slate-400">→</span></Link><Link href="/safety" className="link-card surface-card p-5"><p className="text-sm font-bold text-slate-950">복용 전 안전 확인</p><p className="mt-2 text-xs leading-5 text-slate-500">처방약과 영양제를 변경하기 전에 확인할 내용입니다.</p><span className="link-arrow mt-4 inline-block text-slate-400">→</span></Link></aside>
    </main>
  );
}
