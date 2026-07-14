import type { VerifiedEffect } from './types';

/**
 * 헤드라인("최선"·"처방에 근접") 자격: 효과 수치가 원문에서 직접 검증돼야 함.
 * 추정값이거나 2차 인용(강의자료 등 원문 미확보)이면 헤드라인에서 제외.
 */
export function isHeadlineEligible(v: VerifiedEffect): boolean {
  return !v.is_estimated && v.smd_source !== 'secondary_citation';
}

/** 효과는 커 보여도 신뢰도가 낮은 경우 (추정·2차인용 / GRADE 낮음 / 펀딩 편향). */
export function isLowConfidence(v: VerifiedEffect): boolean {
  return (
    v.is_estimated ||
    v.smd_source === 'secondary_citation' ||
    v.evidence_grade === 'low' ||
    v.evidence_grade === 'very_low' ||
    v.funding_bias
  );
}

export type ConfidenceTone = 'good' | 'mid' | 'low';

/** 근거 신뢰도 태그 — 사실(GRADE) 그대로. */
export function confidenceTag(v: VerifiedEffect): { label: string; tone: ConfidenceTone } {
  switch (v.evidence_grade) {
    case 'high':
      return { label: '근거 강함', tone: 'good' };
    case 'moderate':
      return { label: '근거 보통', tone: 'mid' };
    case 'low':
      return { label: '근거 낮음', tone: 'low' };
    case 'very_low':
      return { label: '근거 매우 낮음', tone: 'low' };
    default:
      return { label: '근거 미상', tone: 'mid' };
  }
}

/** 효과 크기 → 소비자용 한 단어. */
export function effectWord(smd: number | null): string {
  if (smd === null) return '효과 데이터 부족';
  const a = Math.abs(smd);
  if (a >= 0.8) return '효과 큼';
  if (a >= 0.5) return '효과 중간';
  if (a >= 0.2) return '효과 작음';
  if (a >= 0.1) return '효과 미미';
  return '효과 거의 없음';
}

/**
 * 소비자용 쉬운 요약 한 줄 — 구조화 데이터(효과·근거·플래그)에서 자동 생성.
 * (기술적 숫자 없이 직관적으로. 상세는 evidenceNote에서 별도 표시.)
 */
export function plainSummary(v: VerifiedEffect): string {
  const eff = effectWord(v.smd);
  const conf = confidenceTag(v).label; // 근거 강함/보통/낮음/매우 낮음
  const caveats: string[] = [];
  if (v.funding_bias) caveats.push('제조사 후원 연구가 많아요');
  if (v.is_estimated) caveats.push('효과 수치는 대략적인 추정치예요');
  let s = `${eff} · ${conf}`;
  if (caveats.length) s += ` — ${caveats.join(', ')}`;
  return s;
}

/**
 * 근거 메모 — 해석·결론 없이 '사실'만. 판단은 보는 사람 몫.
 * 큐레이션된 notes가 있으면 그대로, 없으면 플래그 기반 사실 한 줄.
 */
export function evidenceNote(v: VerifiedEffect): string | null {
  if (v.notes && v.notes.trim()) return v.notes.trim();
  if (v.is_estimated || v.smd_source === 'secondary_citation') {
    return '효과 수치가 원문 메타분석이 아닌 2차 자료·추정값.';
  }
  if (v.funding_bias) {
    return '효과 시험 다수가 제조사(후원) 주도.';
  }
  if (v.evidence_grade === 'low' || v.evidence_grade === 'very_low') {
    return '소규모·연구 간 편차로 근거 등급 낮음.';
  }
  return null;
}
