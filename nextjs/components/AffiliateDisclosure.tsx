interface AffiliateDisclosureProps {
  className?: string;
}

export default function AffiliateDisclosure({ className = '' }: AffiliateDisclosureProps) {
  return (
    <aside
      className={`rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950 ${className}`}
      aria-label="광고 및 제휴 안내"
    >
      <strong>이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</strong>
    </aside>
  );
}
