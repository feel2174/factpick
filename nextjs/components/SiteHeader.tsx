import Link from 'next/link';

const nav = [
  { href: '/conditions', label: '질환별 비교' },
  { href: '/substances', label: '성분별 보기' },
  { href: '/methodology', label: '평가 기준' },
  { href: '/safety', label: '안전 정보' },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f6f8fb]/92 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-5 px-4 sm:px-6">
        <Link href="/" className="interactive-link flex items-center gap-2.5 rounded-md py-2" aria-label="팩트픽 홈">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">F</span>
          <span className="text-lg font-bold tracking-tight text-slate-950">팩트픽</span>
        </Link>
        <nav aria-label="주요 메뉴" className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="interactive-link rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/conditions" className="button-primary text-sm">비교 시작</Link>
      </div>
    </header>
  );
}
