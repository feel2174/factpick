import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConditionView from '@/components/ConditionView';
import {
  getCellsForCondition,
  getConditionBySlug,
  getEffectsForCondition,
  getKoreaProducts,
  getPersonalizationRules,
  getVerifiedEffects,
} from '@/lib/queries';
import type { EvidenceCellRow, Grade } from '@/lib/types';

export const revalidate = 60;

const GRADE_ORDER: Record<Grade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4, I: 5 };

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
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const condition = await getConditionBySlug(params.slug);
  if (!condition) return {};
  const hook = HOOK_BY_CONDITION[params.slug];
  const title = `${condition.name_ko} 영양제·약 효과 비교`;
  const description =
    hook?.hook ??
    `${condition.name_ko}에 진짜 효과 있는 약·영양제를 약사가 Cochrane 메타분석 SMD로 비교했습니다.`;
  const url = `/conditions/${params.slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ConditionPage({ params }: { params: { slug: string } }) {
  const condition = await getConditionBySlug(params.slug);
  if (!condition) notFound();

  const [allCells, effects, verified, products, rules] = await Promise.all([
    getCellsForCondition(params.slug),
    getEffectsForCondition(params.slug),
    getVerifiedEffects(params.slug),
    getKoreaProducts(),
    getPersonalizationRules(params.slug),
  ]);
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

  const hook = HOOK_BY_CONDITION[params.slug];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:max-w-4xl sm:px-6 sm:py-10">
      <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 sm:text-sm">
        ← 적응증 목록
      </Link>

      <header className="mt-3 mb-6 sm:mt-4 sm:mb-8">
        {hook && (
          <div className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-600 sm:text-[11px]">
            {hook.tag}
          </div>
        )}
        <h1 className="text-2xl font-bold sm:text-4xl">{condition.name_ko}</h1>
      </header>

      <ConditionView
        conditionSlug={params.slug}
        cells={healthyCells}
        effects={effects}
        verified={verified}
        products={products}
        rules={rules}
      />
    </main>
  );
}
