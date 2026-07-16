import { getCatalogCondition } from './contentCatalog';

const CATEGORY_LABELS: Record<string, string> = {
  musculoskeletal: '관절·통증',
  sleep: '수면',
  cardiovascular: '심혈관',
  metabolic: '대사 건강',
  mental_health: '마음 건강',
  cognitive: '뇌·인지',
  immune: '면역',
  dermatologic: '피부',
  neurologic: '뇌·신경',
  other: '기타 건강',
};

export function getConditionCategoryLabel(condition: { slug: string; category: string | null }) {
  return CATEGORY_LABELS[condition.category ?? '']
    ?? getCatalogCondition(condition.slug)?.category
    ?? '건강 정보';
}
