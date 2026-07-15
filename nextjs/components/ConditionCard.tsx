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
      className="link-card surface-card group flex min-h-52 flex-col justify-between p-5 sm:p-6"
      aria-label={`${nameKo} 약·영양제 근거 비교 보기`}
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
            {category ?? '근거 비교'}
          </span>
          <span className="text-sm font-semibold text-slate-500">비교 항목 {cellCount ?? 0}개</span>
        </div>
        <h3 className="mt-5 text-xl font-bold tracking-tight text-slate-950 group-hover:text-emerald-800">
          {nameKo}
        </h3>
        {description && <p className="mt-3 text-base leading-7 text-slate-700">{description}</p>}
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-base font-bold text-slate-800">
        <span>약과 영양제 비교하기</span>
        <span className="link-arrow text-lg text-slate-400" aria-hidden="true">→</span>
      </div>
    </Link>
  );
}
