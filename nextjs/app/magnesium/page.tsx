import type { Metadata } from 'next';
import Link from 'next/link';
import MagnesiumCompare from '@/components/MagnesiumCompare';

const title = '마그네슘 종류 비교 — 산화·구연산·글리시네이트 함량·흡수율';
const description =
  '마그네슘 제형별 원소 함량, 흡수율, 위장장애, 가격, 정·캡슐당 용량을 약사가 한눈에 정리. 산화·구연산·글리시네이트·L-트레오네이트 등 어떤 종류를 골라야 할지 목적별로 비교합니다.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/magnesium' },
  robots: { index: false, follow: false },
  openGraph: { title, description, url: '/magnesium', type: 'article' },
  twitter: { card: 'summary_large_image', title, description },
};

export default function MagnesiumPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:max-w-4xl sm:px-6 sm:py-10">
      <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 sm:text-sm">
        ← 홈
      </Link>

      <header className="mt-3 mb-6 sm:mt-4 sm:mb-8">
        <div className="mb-2 inline-block rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-600 sm:text-[11px]">
          마그네슘 제형 비교
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-4xl">
          마그네슘, 어떤 종류를 골라야 할까
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500 sm:text-base">
          시장에 마그네슘 제품은 넘치는데 산화·구연산·글리시네이트… 이름만 다른 게 아닙니다. 제형마다 실제 들어간 마그네슘 양도, 흡수율도, 위장 부담도 크게 달라요. 약사가 함량·흡수·가격·용량을 한 표로 정리했습니다.
        </p>
      </header>

      <MagnesiumCompare />

      <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs leading-relaxed text-slate-400">
        본 페이지는 일반 정보 제공 목적이며 진단·처방을 대신하지 않습니다. 신장 질환이 있거나 약을 복용 중이라면 마그네슘 보충 전 약사·의사와 상의하세요. · 약사 검수
      </footer>
    </main>
  );
}
