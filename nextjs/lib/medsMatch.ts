import type { ProductsBySubstance, VerifiedEffect } from './types';

export interface MatchedMed {
  query: string; // 사용자가 입력한 토큰
  matchedName: string; // 매칭된 DB 이름(성분 또는 제품명)
  effect: VerifiedEffect; // 그 성분의 대표 검증 효과
}

export interface MedsMatchResult {
  matched: MatchedMed[];
  unmatched: string[];
}

// 용량·제형 표기 제거용 (예: "500mg", "1정", "캡슐")
const DOSE =
  /\d+(\.\d+)?\s*(mg|mcg|µg|㎎|g|iu|밀리그램|ml|cc|정|캡슐|포|환|앰플|시럽)/gi;

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(DOSE, ' ')
    .replace(/[0-9]+/g, ' ')
    .replace(/[^a-z가-힣ㄱ-ㅎㅏ-ㅣ]/g, ''); // 한글·영문만 남기고 공백·기호 제거
}

function splitTokens(input: string): string[] {
  return input
    .split(/[,\n;·/]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function better(a: VerifiedEffect, b: VerifiedEffect): boolean {
  const av = a.variant_label ? 1 : 0;
  const bv = b.variant_label ? 1 : 0;
  if (av !== bv) return av < bv; // variant 없는 대표를 우선
  const as = a.studies_count ?? 0;
  const bs = b.studies_count ?? 0;
  if (as !== bs) return as > bs; // 연구 수 많은 쪽
  return Math.abs(a.smd ?? 0) > Math.abs(b.smd ?? 0);
}

/** 성분별 대표 검증효과 1개씩. */
export function representativeEffects(verified: VerifiedEffect[]): VerifiedEffect[] {
  const bySub = new Map<string, VerifiedEffect>();
  for (const v of verified) {
    if (!v.substance_id) continue;
    const cur = bySub.get(v.substance_id);
    if (!cur || better(v, cur)) bySub.set(v.substance_id, v);
  }
  return Array.from(bySub.values());
}

interface IndexEntry {
  norm: string;
  display: string;
  substanceId: string;
}

function buildIndex(
  verified: VerifiedEffect[],
  products: ProductsBySubstance,
): IndexEntry[] {
  const entries: IndexEntry[] = [];
  const push = (name: string | null | undefined, sid: string) => {
    if (!name) return;
    const n = norm(name);
    if (n.length >= 2) entries.push({ norm: n, display: name, substanceId: sid });
  };
  for (const v of verified) {
    if (!v.substance_id) continue;
    push(v.name_ko, v.substance_id);
    push(v.name_en, v.substance_id);
  }
  // 한국 시판 제품명(약봉투에 찍히는 상품명) → 성분 매핑
  for (const [sid, bundle] of Object.entries(products)) {
    push(bundle.top?.name, sid);
    for (const o of bundle.others ?? []) push(o.name, sid);
  }
  return entries;
}

export function matchMeds(
  input: string,
  verified: VerifiedEffect[],
  products: ProductsBySubstance,
): MedsMatchResult {
  const index = buildIndex(verified, products);
  const reps = new Map(
    representativeEffects(verified).map((v) => [v.substance_id as string, v]),
  );

  const matched: MatchedMed[] = [];
  const unmatched: string[] = [];
  const seen = new Set<string>();

  for (const token of splitTokens(input)) {
    const nt = norm(token);
    if (nt.length < 2) {
      unmatched.push(token);
      continue;
    }
    // 1) 정확 일치 우선, 2) 포함 관계는 가장 긴 이름 우선
    let hit: IndexEntry | null = null;
    for (const e of index) {
      if (e.norm === nt) {
        hit = e;
        break;
      }
      if (nt.includes(e.norm) || e.norm.includes(nt)) {
        if (!hit || e.norm.length > hit.norm.length) hit = e;
      }
    }
    if (!hit) {
      unmatched.push(token);
      continue;
    }
    if (seen.has(hit.substanceId)) continue; // 같은 성분 중복 제거
    const effect = reps.get(hit.substanceId);
    if (!effect) {
      unmatched.push(token);
      continue;
    }
    seen.add(hit.substanceId);
    matched.push({ query: token, matchedName: hit.display, effect });
  }

  return { matched, unmatched };
}
