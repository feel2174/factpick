import type { VerifiedEffect } from './types';

const TIME_RE = /\d+[-~]?\d*\s*(주|개월|년|week|weeks|month|months|year|years)/i;

export function isTimeVariant(label: string | null): boolean {
  if (!label) return false;
  return TIME_RE.test(label);
}

export function extractBaseName(nameKo: string): string {
  const lastParen = nameKo.lastIndexOf('(');
  if (lastParen === -1) return nameKo.trim();
  return nameKo.slice(0, lastParen).trim();
}

export function timeToWeeks(label: string | null): number {
  if (!label) return 9999;
  const m = label.match(/(\d+)[-~]?(\d+)?\s*(주|개월|년|week|month|year)/i);
  if (!m) return 9999;
  const n1 = parseInt(m[1], 10);
  const n2 = m[2] ? parseInt(m[2], 10) : n1;
  const avg = (n1 + n2) / 2;
  const unit = m[3].toLowerCase();
  if (unit.startsWith('주') || unit.startsWith('week')) return avg;
  if (unit.startsWith('개월') || unit.startsWith('month')) return avg * 4;
  if (unit.startsWith('년') || unit.startsWith('year')) return avg * 52;
  return 9999;
}

export interface VerifiedTimeGroup {
  baseName: string;
  rep: VerifiedEffect;
  timeline: VerifiedEffect[];
}

/**
 * 같은 base name(괄호 앞)을 공유하며 variant가 시간 패턴인 entries를 묶음.
 * 대표 = 절댓값 가장 큰 SMD (가장 강한 효과 시점).
 */
export function groupVerified(verified: VerifiedEffect[]): {
  groups: VerifiedTimeGroup[];
  singles: VerifiedEffect[];
} {
  const byBase = new Map<string, VerifiedEffect[]>();
  for (const v of verified) {
    if (!isTimeVariant(v.variant_label)) continue;
    const base = extractBaseName(v.name_ko);
    const list = byBase.get(base) ?? [];
    list.push(v);
    byBase.set(base, list);
  }

  const groups: VerifiedTimeGroup[] = [];
  const groupedIds = new Set<string>();
  Array.from(byBase.entries()).forEach(
    ([base, list]: [string, VerifiedEffect[]]) => {
      if (list.length < 2) return;
      list.sort(
        (a: VerifiedEffect, b: VerifiedEffect) =>
          timeToWeeks(a.variant_label) - timeToWeeks(b.variant_label),
      );
      const rep = list.reduce(
        (a: VerifiedEffect, b: VerifiedEffect) =>
          Math.abs(a.smd ?? 0) > Math.abs(b.smd ?? 0) ? a : b,
      );
      groups.push({ baseName: base, rep, timeline: list });
      list.forEach((e: VerifiedEffect) => groupedIds.add(e.id));
    },
  );
  const singles = verified.filter((v) => !groupedIds.has(v.id));
  return { groups, singles };
}

export function buildTimelineNarrative(
  timeline: VerifiedEffect[],
): string {
  const parts = timeline
    .filter((e) => e.smd !== null)
    .map(
      (e) =>
        `${e.variant_label ?? ''} ${(e.smd! >= 0 ? '+' : '') + e.smd!.toFixed(2)}`,
    );
  return parts.join(' → ');
}

export function trendComment(timeline: VerifiedEffect[]): string | null {
  const vals = timeline.map((e) => e.smd).filter((x): x is number => x !== null);
  if (vals.length < 2) return null;
  const first = Math.abs(vals[0]);
  const last = Math.abs(vals[vals.length - 1]);
  if (first - last > 0.15) return '시간이 갈수록 효과가 감소합니다';
  if (last - first > 0.15) return '시간이 갈수록 효과가 강해집니다';
  return null;
}

/**
 * Golden Set entry의 근거 신뢰도를 산점도 X축 점수(0~5)로 변환.
 * - evidence_grade가 기본 축
 * - smd_source / funding_bias / is_estimated 보정
 */
export function evidenceXScore(v: VerifiedEffect): number {
  let score: number;
  if (v.evidence_grade === 'high') score = 5;
  else if (v.evidence_grade === 'moderate') score = 3.5;
  else if (v.evidence_grade === 'low') score = 2;
  else if (v.evidence_grade === 'very_low') score = 0.5;
  else score = 2; // 미상

  if (v.smd_source === 'direct') score += 0.3;
  else if (v.smd_source === 'MD_converted') score -= 0.2;
  else if (v.smd_source === 'NNT_converted') score -= 0.3;
  else if (v.smd_source === 'single_RCT_estimated') score -= 0.6;
  else if (v.smd_source === 'active_comparator_equivalence') score -= 0.5;
  else if (v.smd_source === 'secondary_citation') score -= 1.0;
  else if (v.smd_source === 'alternative_metric_only') score -= 1.5;

  if (v.funding_bias) score -= 0.8;
  if (v.is_estimated) score -= 0.2;

  return Math.max(0, Math.min(5, score));
}

/**
 * |SMD|를 산점도 Y축 점수(0~5)로 변환.
 * SOP 기준: |SMD| 0.8 이상 = 큼, 0.5~0.8 = 중간, 0.2~0.5 = 약함, < 0.2 = 미미.
 */
export function efficacyYScore(smd: number): number {
  return Math.max(0, Math.min(5, Math.abs(smd) * 2.5));
}
