import type { Grade } from '@/lib/types';

const STYLES: Record<Grade, { bg: string; label: string; help: string }> = {
  A: { bg: 'bg-grade-a text-slate-950', label: '근거 강함', help: '근거 강함 — 큰·일관된 연구로 잘 뒷받침됨' },
  B: { bg: 'bg-grade-b text-slate-950', label: '근거 보통', help: '근거 보통 — 어느 정도 뒷받침되나 한계 있음' },
  C: { bg: 'bg-grade-c text-slate-950', label: '근거 낮음', help: '근거 낮음 — 연구가 적거나 편차가 큼' },
  D: { bg: 'bg-grade-d text-slate-950', label: '근거 매우 낮음', help: '근거 매우 낮음 — 효과가 있다고 보기 어려움' },
  F: { bg: 'bg-grade-f text-white', label: '효과 없음', help: '효과 없음으로 평가됨' },
  I: { bg: 'bg-grade-i text-white', label: '근거 부족', help: '판단할 자료가 부족함' },
};

interface Props {
  grade: Grade | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function GradeBadge({ grade, size = 'md', showLabel = false }: Props) {
  if (!grade) return null;
  const s = STYLES[grade];
  const sizeClass =
    size === 'sm'
      ? 'h-6 w-6 text-xs'
      : size === 'lg'
        ? 'h-12 w-12 text-2xl'
        : 'h-8 w-8 text-base';
  return (
    <span className="inline-flex items-center gap-2" title={s.help}>
      <span
        className={`inline-flex items-center justify-center rounded-md font-bold ${sizeClass} ${s.bg}`}
      >
        {grade}
      </span>
      {showLabel && <span className="text-sm text-slate-700">{s.label}</span>}
    </span>
  );
}
