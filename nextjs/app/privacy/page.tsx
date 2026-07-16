import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'Factpick의 개인정보 수집, 이용, 보관, 제3자 서비스 이용에 관한 방침입니다.',
  alternates: { canonical: '/privacy' },
};

const sections = [
  {
    title: '1. 수집하는 정보',
    body: 'Factpick은 회원가입 기능을 제공하지 않으며 이름, 주민등록번호, 결제 정보 같은 민감한 개인정보를 직접 요구하지 않습니다. 다만 서비스 안정성 확인을 위해 접속 로그, 브라우저 정보, 기기 정보, 방문 페이지, 대략적인 지역 정보가 자동으로 처리될 수 있습니다.',
  },
  {
    title: '2. 이용 목적',
    body: '수집 또는 처리되는 정보는 서비스 제공, 오류 분석, 보안 유지, 이용 현황 파악, 콘텐츠 개선, 법령상 의무 준수를 위해 사용됩니다.',
  },
  {
    title: '3. 쿠키와 분석 도구',
    body: 'Factpick은 Vercel Analytics 및 향후 Google AdSense 또는 Google Analytics 같은 제3자 서비스를 사용할 수 있습니다. 이 과정에서 쿠키나 유사 기술이 광고 성과 측정, 부정 이용 방지, 방문 통계 분석을 위해 사용될 수 있습니다.',
  },
  {
    title: '4. 제3자 제공 및 처리 위탁',
    body: '서비스 운영을 위해 호스팅, 분석, 광고 제공 사업자가 일부 정보를 처리할 수 있습니다. 각 사업자는 자신의 개인정보 처리방침과 보안 기준에 따라 정보를 처리합니다.',
  },
  {
    title: '5. 보관 기간',
    body: '서비스 운영 목적이 달성되거나 법령상 보관 의무가 없어진 정보는 합리적인 기간 내 삭제 또는 익명화합니다. 자동 로그와 분석 데이터의 보관 기간은 사용하는 서비스의 정책에 따라 달라질 수 있습니다.',
  },
  {
    title: '6. 이용자의 권리',
    body: '이용자는 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있습니다. 개인정보 관련 문의, 열람, 정정, 삭제 요청이 필요한 경우 서비스 운영자에게 문의할 수 있습니다.',
  },
  {
    title: '7. 방침 변경',
    body: '개인정보처리방침은 서비스 구조, 법령, 외부 서비스 변경에 따라 수정될 수 있습니다. 중요한 변경 사항은 이 페이지를 통해 안내합니다.',
  },
];

export default function PrivacyPage() {
  return (
    <main id="main-content" className="content-shell py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">서비스 정책</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
          개인정보처리방침
        </h1>
        <p className="mt-5 text-base leading-7 text-slate-600">
          시행일: 2026년 7월 16일
        </p>
      </header>

      <div className="mt-10 max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
        {sections.map((section) => (
          <section key={section.title} className="py-7 sm:py-8">
            <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">{section.body}</p>
          </section>
        ))}
      </div>

      <aside className="mt-10 max-w-3xl rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-950">문의</h2>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          개인정보와 서비스 정책에 관한 문의는 Factpick 운영자에게 전달해 주세요. 별도 문의 채널이 추가되면 이 페이지에 공개합니다.
        </p>
      </aside>
    </main>
  );
}
