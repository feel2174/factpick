export default function ConditionLoading() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12" aria-label="비교표를 불러오는 중">
      <div className="h-4 w-48 rounded bg-slate-200" />
      <div className="mt-8 border-b border-slate-200 pb-8">
        <div className="h-7 w-28 rounded bg-emerald-100" />
        <div className="mt-5 h-11 w-3/4 rounded bg-slate-200" />
        <div className="mt-4 h-5 w-full max-w-2xl rounded bg-slate-100" />
        <div className="mt-2 h-5 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="mt-8 rounded-lg border border-emerald-100 bg-emerald-50/60 p-6">
        <div className="h-4 w-24 rounded bg-emerald-100" />
        <div className="mt-4 h-6 w-52 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" />
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-card p-5">
            <div className="h-5 w-24 rounded bg-slate-100" />
            <div className="mt-4 h-7 w-40 rounded bg-slate-200" />
            <div className="mt-3 h-4 w-full rounded bg-slate-100" />
            <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </main>
  );
}
