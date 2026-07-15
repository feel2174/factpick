import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "임상 근거 검증 방법",
  description:
    "팩트픽이 논문을 선정하고 효과 크기와 근거 수준을 평가하는 방법을 설명합니다.",
  alternates: { canonical: "/methodology" },
};

const principles = [
  [
    "원문 우선",
    "요약 기사보다 메타분석·임상시험 원문과 forest plot의 수치를 우선합니다.",
  ],
  [
    "효과와 근거 분리",
    "효과가 커 보여도 연구가 작거나 편향 가능성이 높으면 근거 수준을 낮게 표시합니다.",
  ],
  [
    "자료 부족을 정직하게",
    "연구가 부족한 상태를 효과 없음으로 단정하지 않고 별도로 구분합니다.",
  ],
  [
    "이해상충 표시",
    "제조사 후원과 특정 원료 편향 가능성을 결과와 함께 확인합니다.",
  ],
];

export default function MethodologyPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16"
    >
      <header>
        <p className="eyebrow">자료 선정 기준</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          좋다는 말보다, 얼마나 믿을 수 있는지를 봅니다
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
          팩트픽은 약과 영양제의 효과를 같은 기준에서 비교하되, 수치의 크기와
          연구의 신뢰도를 분리해 평가합니다.
        </p>
      </header>
      <section
        className="mt-12 grid gap-4 sm:grid-cols-2"
        aria-label="검증 원칙"
      >
        {principles.map(([title, body], index) => (
          <article key={title} className="surface-card p-6">
            <span className="text-xs font-black text-emerald-700">
              기준 0{index + 1}
            </span>
            <h2 className="mt-3 text-lg font-bold text-slate-950">{title}</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">{body}</p>
          </article>
        ))}
      </section>
      <section className="mt-14 border-t border-slate-200 pt-10">
        <h2 className="text-2xl font-bold text-slate-950">
          효과 크기와 근거 수준
        </h2>
        <div className="mt-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900">효과 크기</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              서로 다른 척도의 연구 결과를 비교할 수 있도록 SMD와 같은 표준화
              지표를 사용합니다. 숫자가 크더라도 적용 대상과 측정 시점을 함께
              봐야 합니다.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">근거 수준</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              연구 설계, 표본 규모, 결과의 일관성, 이질성과 편향 가능성을 검토해
              높음·보통·낮음·매우 낮음으로 설명합니다.
            </p>
          </div>
        </div>
      </section>
      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link href="/conditions" className="button-primary">
          비교 데이터 보기 →
        </Link>
        <Link href="/safety" className="button-secondary">
          안전 안내 읽기
        </Link>
      </div>
    </main>
  );
}
