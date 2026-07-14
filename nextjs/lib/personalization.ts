import type { MatchConditions, PersonalizationRule, UserProfile } from './types';

const STORAGE_KEY = 'factpick.profile.v1';

export function loadProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // Migration: liver_impaired/kidney_impaired (boolean) → severity (string)
    const migrated: UserProfile = { ...(parsed as UserProfile) };
    if ('liver_impaired' in parsed) {
      if (parsed.liver_impaired === true && !migrated.liver_severity) {
        migrated.liver_severity = 'moderate';
      }
      delete (migrated as Record<string, unknown>).liver_impaired;
    }
    if ('kidney_impaired' in parsed) {
      if (parsed.kidney_impaired === true && !migrated.kidney_severity) {
        migrated.kidney_severity = 'moderate';
      }
      delete (migrated as Record<string, unknown>).kidney_impaired;
    }
    // Remove pregnant field (no longer used for OA)
    if ('pregnant' in parsed) {
      delete (migrated as Record<string, unknown>).pregnant;
    }
    return migrated;
  } catch {
    // Corrupted data — wipe so user can re-enter cleanly
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
    return null;
  }
}

export function saveProfile(p: UserProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function computeBMI(p: UserProfile): number | null {
  if (!p.height_cm || !p.weight_kg) return null;
  const h = p.height_cm / 100;
  if (h <= 0) return null;
  return p.weight_kg / (h * h);
}

export function hasComorbidity(p: UserProfile): boolean {
  return !!(
    p.diabetes ||
    p.hypertension ||
    p.dyslipidemia ||
    p.gout ||
    p.liver_severity ||
    p.kidney_severity ||
    p.anticoagulant ||
    p.nsaid_allergy ||
    p.gi_history
  );
}

function matchesRule(rule: PersonalizationRule, p: UserProfile): boolean {
  const c: MatchConditions = rule.match_conditions ?? {};
  const bmi = computeBMI(p);

  if (c.bmi_min !== undefined) {
    if (bmi === null || bmi < c.bmi_min) return false;
  }
  if (c.bmi_max !== undefined) {
    if (bmi === null || bmi > c.bmi_max) return false;
  }
  if (c.age_min !== undefined) {
    if (!p.age || p.age < c.age_min) return false;
  }
  if (c.age_max !== undefined) {
    if (!p.age || p.age > c.age_max) return false;
  }
  if (c.diabetes !== undefined && !!p.diabetes !== c.diabetes) return false;
  if (c.hypertension !== undefined && !!p.hypertension !== c.hypertension) return false;
  if (c.dyslipidemia !== undefined && !!p.dyslipidemia !== c.dyslipidemia) return false;
  if (c.gout !== undefined && !!p.gout !== c.gout) return false;
  if (c.liver_severity !== undefined && p.liver_severity !== c.liver_severity) return false;
  if (c.kidney_severity !== undefined && p.kidney_severity !== c.kidney_severity) return false;
  if (c.anticoagulant !== undefined && !!p.anticoagulant !== c.anticoagulant) return false;
  if (c.nsaid_allergy !== undefined && !!p.nsaid_allergy !== c.nsaid_allergy) return false;
  if (c.gi_history !== undefined && !!p.gi_history !== c.gi_history) return false;
  if (
    c.nsaid_gi_side_effect !== undefined &&
    !!p.nsaid_gi_side_effect !== c.nsaid_gi_side_effect
  )
    return false;
  if (c.current_nsaid !== undefined && !!p.current_nsaid !== c.current_nsaid) return false;
  if (
    c.regular_steroid_injection !== undefined &&
    !!p.regular_steroid_injection !== c.regular_steroid_injection
  )
    return false;
  if (c.no_comorbidity === true && hasComorbidity(p)) return false;

  return true;
}

export function matchRules(
  rules: PersonalizationRule[],
  profile: UserProfile,
): PersonalizationRule[] {
  return rules.filter((r) => matchesRule(r, profile));
}

/**
 * 매칭된 룰들의 highlight/avoid verified_id 집합.
 * 산점도/표에서 ✨ 또는 ⚠ 표시용.
 */
export function aggregateHighlights(matched: PersonalizationRule[]): {
  highlightVerifiedIds: Set<string>;
  avoidVerifiedIds: Set<string>;
} {
  const highlight = new Set<string>();
  const avoid = new Set<string>();
  for (const r of matched) {
    r.highlight_verified_ids?.forEach((id) => highlight.add(id));
    r.avoid_verified_ids?.forEach((id) => avoid.add(id));
  }
  return { highlightVerifiedIds: highlight, avoidVerifiedIds: avoid };
}
