import Link from 'next/link';

interface Props {
  slug: string;
  nameKo: string;
  cellCount?: number;
  comingSoon?: boolean;
}

export default function ConditionCard({ slug, nameKo, cellCount, comingSoon }: Props) {
  const inner = (
    <div
      className={`group flex h-full flex-col justify-between rounded-2xl border p-6 transition ${
        comingSoon
          ? 'border-slate-200 bg-slate-50 text-slate-500'
          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div>
        <h3 className="text-xl font-semibold">{nameKo}</h3>
        {comingSoon ? (
          <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">Coming Soon</p>
        ) : (
          <p className="mt-2 text-xs uppercase tracking-wider text-slate-500">
            성분 {cellCount ?? 0}개 비교
          </p>
        )}
      </div>
      {!comingSoon && (
        <p className="mt-6 text-sm text-slate-500 transition group-hover:text-slate-800">
          산점도로 보기 →
        </p>
      )}
    </div>
  );

  if (comingSoon) return inner;
  return (
    <Link href={`/conditions/${slug}`} className="block h-full">
      {inner}
    </Link>
  );
}
