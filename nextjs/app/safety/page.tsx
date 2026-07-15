import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "의료정보 및 복용 안전 안내",
  description:
    "팩트픽 정보의 이용 범위와 약·영양제 복용 전 확인해야 할 안전수칙을 안내합니다.",
  alternates: { canonical: "/safety" },
};

export default function SafetyPage() {
  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16"
    >
      <header>
        <p className="eyebrow">복용 전 확인</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          비교 정보보다 안전이 먼저입니다
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
          팩트픽은 일반적인 정보 제공 서비스이며, 개인의 진단·처방이나 의료진
          상담을 대신하지 않습니다.
        </p>
      </header>
      <section className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="font-bold text-amber-950">
          처방약을 임의로 중단하지 마세요
        </h2>
        <p className="mt-2 text-sm leading-7 text-amber-900/80">
          영양제의 효과가 커 보이더라도 현재 복용하는 약을 임의로 줄이거나
          중단해서는 안 됩니다. 변경 전 의사 또는 약사와 상담하세요.
        </p>
      </section>
      <section className="mt-12 space-y-8">
        <div>
          <h2 className="text-xl font-bold text-slate-950">
            상담이 특히 필요한 경우
          </h2>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-slate-600 sm:grid-cols-2">
            <li className="surface-card p-4">
              임신·수유 중이거나 임신을 준비하는 경우
            </li>
            <li className="surface-card p-4">간·신장 기능이 저하된 경우</li>
            <li className="surface-card p-4">
              항응고제 등 처방약을 복용하는 경우
            </li>
            <li className="surface-card p-4">
              수술이나 시술을 앞두고 있는 경우
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-950">응급 증상</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            호흡곤란, 의식 변화, 심한 흉통, 갑작스러운 마비·언어장애, 심한
            알레르기 반응 등 응급 증상이 있다면 웹 정보를 확인하는 대신 즉시 119
            또는 의료기관의 도움을 받으세요.
          </p>
        </div>
      </section>
      <Link href="/conditions" className="button-primary mt-12">
        질환별 데이터로 돌아가기 →
      </Link>
    </main>
  );
}
