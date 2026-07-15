interface ConditionSearchFormProps {
  defaultValue?: string;
  className?: string;
}

export default function ConditionSearchForm({
  defaultValue = '',
  className = '',
}: ConditionSearchFormProps) {
  return (
    <form
      action="/conditions"
      method="get"
      role="search"
      className={`surface-card p-4 sm:p-5 ${className}`}
    >
      <label htmlFor="condition-search" className="block text-base font-bold text-slate-950">
        어떤 증상이 불편하신가요?
      </label>
      <p id="condition-search-help" className="mt-1 text-sm leading-6 text-slate-600">
        예: 잠이 안 와요, 기억력이 떨어져요, 고혈압, 관절 통증
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          id="condition-search"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="증상 또는 질환명 입력"
          aria-describedby="condition-search-help"
          className="min-h-14 w-full rounded-xl border border-slate-300 bg-white px-4 text-lg text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
        />
        <button type="submit" className="button-primary min-h-14 shrink-0 px-6 text-base">
          검색하기
        </button>
      </div>
    </form>
  );
}
