import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white">
      <div className="content-shell py-12 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr]">
          <div>
            <Link href="/" className="interactive-link inline-flex items-center gap-2.5" aria-label="Factpick 홈">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-950 text-sm font-black text-white">F</span>
              <span className="text-xl font-black tracking-tight text-slate-950">Factpick</span>
            </Link>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
              임상 연구와 약사 검토 기준으로 건강 정보를 정리합니다. 개인의 진단이나 처방을 대신하지 않으며,
              복용 변경 전에는 의사 또는 약사와 상담하세요.
            </p>
          </div>

          <nav aria-labelledby="footer-service-heading">
            <h2 id="footer-service-heading" className="text-sm font-bold text-slate-950">서비스</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link className="interactive-link" href="/about">소개</Link></li>
              <li><Link className="interactive-link" href="/editorial-policy">편집 정책</Link></li>
              <li><Link className="interactive-link" href="/methodology">평가 기준</Link></li>
              <li><Link className="interactive-link" href="/safety">안전 정보</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-policy-heading">
            <h2 id="footer-policy-heading" className="text-sm font-bold text-slate-950">정책</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li><Link className="interactive-link" href="/terms">이용약관</Link></li>
              <li><Link className="interactive-link" href="/privacy">개인정보처리방침</Link></li>
              <li><Link className="interactive-link" href="/updates">업데이트</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 text-sm leading-6 text-slate-500">
          <p>© {new Date().getFullYear()} Factpick. 건강 정보는 의료진의 진료를 대체하지 않습니다.</p>
        </div>
      </div>
    </footer>
  );
}
