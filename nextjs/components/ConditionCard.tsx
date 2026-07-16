import Link from 'next/link';

interface Props {
  slug: string;
  nameKo: string;
  description?: string;
  category?: string;
  cellCount?: number;
}

export default function ConditionCard({ slug, nameKo, description, category, cellCount }: Props) {
  return (
    <Link
      href={`/conditions/${slug}`}
      prefetch
      className="link-card surface-card group flex min-h-48 flex-col justify-between p-5 motion-safe:hover:scale-[1.015]"
      aria-label={`${nameKo} 효과와 근거 비교 보기`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 transition-colors group-hover:bg-emerald-100">
            {category ?? '근거 비교'}
          </span>
          <span className="shrink-0 text-xs font-semibold text-slate-500">
            {cellCount ?? 0}개 항목
          </span>
        </div>
        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950 transition-colors group-hover:text-emerald-800">
          {nameKo}
        </h3>
        {description && (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-bold text-slate-800">
        <span>효과와 근거 보기</span>
        <span className="link-arrow text-base text-slate-400" aria-hidden="true">
          →
        </span>
      </div>
    </Link>
  );
}
