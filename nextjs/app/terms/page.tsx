import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관',
  description: '팩트픽 서비스 이용 조건과 건강 정보 이용 시 유의사항을 안내합니다.',
  alternates: { canonical: '/terms' },
};

const sections = [
  {
    title: '1. 서비스의 목적',
    body: '팩트픽은 공개된 연구 자료를 바탕으로 약과 영양제에 관한 일반적인 건강 정보를 제공합니다. 서비스의 정보는 특정 이용자를 위한 의료행위, 진단, 처방 또는 치료 권고가 아닙니다.',
  },
  {
    title: '2. 이용자의 판단과 책임',
    body: '이용자는 자신의 건강 상태와 복용 중인 약을 고려해 정보를 이용해야 합니다. 약의 시작·중단·용량 변경 또는 영양제 복용 결정 전에는 의사·약사 등 의료전문가와 상담해야 합니다.',
  },
  {
    title: '3. 정보의 정확성과 변경',
    body: '팩트픽은 신뢰할 수 있는 정보를 제공하기 위해 노력하지만 모든 정보의 완전성, 최신성 또는 특정 목적에 대한 적합성을 보장하지 않습니다. 새로운 연구나 안전성 정보에 따라 내용이 변경될 수 있습니다.',
  },
  {
    title: '4. 외부 서비스와 링크',
    body: '서비스에는 논문, 공공기관 또는 외부 서비스로 연결되는 링크가 포함될 수 있습니다. 외부 서비스의 내용과 개인정보 처리 방식은 해당 운영자의 정책을 따릅니다.',
  },
  {
    title: '5. 콘텐츠 이용',
    body: '서비스의 구성, 해설과 편집물은 관련 법령의 보호를 받을 수 있습니다. 출처를 오인하게 하거나 내용을 변형해 의료적 보증처럼 사용하는 행위를 금지합니다.',
  },
  {
    title: '6. 약관의 변경',
    body: '서비스 운영 또는 관련 기준의 변경이 필요한 경우 이 약관을 수정할 수 있으며, 중요한 변경 내용은 서비스 내에서 알립니다.',
  },
];

export default function TermsPage() {
  return (
    <main id="main-content" className="content-shell py-12 sm:py-20">
      <header className="max-w-3xl">
        <p className="eyebrow">서비스 정책</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">이용약관</h1>
        <p className="mt-5 text-base text-slate-500">시행일: 2026년 7월 14일</p>
      </header>

      <div className="mt-10 max-w-3xl divide-y divide-slate-200 border-y border-slate-200">
        {sections.map((section) => (
          <section key={section.title} className="py-7 sm:py-8">
            <h2 className="text-xl font-bold text-slate-950">{section.title}</h2>
            <p className="mt-3 text-base leading-8 text-slate-700">{section.body}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
