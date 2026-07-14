/**
 * Quiz funnel 공통 단계 정의 + helper.
 * 적응증별로 달라지는 부분(intro/body/동반질환/이전치료)은 lib/conditionQuiz.ts 참고.
 */

import type { Severity } from './types';

export type StepId =
  | 'intro'
  | 'body'
  | 'age'
  | 'comorbidity'
  | 'previous'
  | 'liver'
  | 'kidney'
  | 'meds'
  | 'result';

export const STEP_TITLES: Record<StepId, string> = {
  intro: '시작',
  body: '체형',
  age: '나이',
  comorbidity: '동반질환',
  previous: '이전 치료',
  liver: '간기능',
  kidney: '신기능',
  meds: '복용 약',
  result: '결과',
};

// 나이 그룹
export const AGE_GROUPS: Array<{ label: string; min: number; max: number; pick: number }> = [
  { label: '20–30대', min: 20, max: 39, pick: 30 },
  { label: '40–50대', min: 40, max: 59, pick: 50 },
  { label: '60–70대', min: 60, max: 79, pick: 65 },
  { label: '80대 이상', min: 80, max: 99, pick: 80 },
];

// 간/신 정도 옵션
export const SEVERITY_OPTIONS: Array<{
  value: Severity | 'none';
  label: string;
  hint: string;
}> = [
  { value: 'none', label: '없음', hint: '진단받은 적 없거나 정상' },
  { value: 'mild', label: '경도', hint: '가벼운 수치 상승' },
  { value: 'moderate', label: '중등도', hint: '관리 필요 (의사 추적)' },
  { value: 'severe', label: '중증', hint: '심함 (전문의 관리)' },
];
