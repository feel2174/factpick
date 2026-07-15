/**
 * Affiliate / 외부 사이트 deep-link + 한국 의약품 분류별 안내.
 *
 * 한국 약사법 규정:
 * - 일반의약품 (OTC) → 약국에서만 (안전상비의약품 13종 제외, 쿠팡 X)
 * - 전문의약품 → 약사 처방 + 약국 (광고 제한)
 * - 건강기능식품 → 쿠팡/온라인 자유
 * - 직구 영양제 → iHerb 등
 * - 한국 미수입 → 정보만, 대안 제시
 * - 시술 (관절강내 주사 등) → 구매 X, 의원 안내
 *
 * 환경 변수:
 *   COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY — 서버 상품 검색 API 인증
 *   IHERB_RCODE    — iHerb Rewards 코드
 */

export type ExternalLinkType =
  | 'coupang'
  | 'iherb'
  | 'healthkr'
  | 'nedrug'
  | 'pharmacy_rx'      // 전문의약품 = 약국 처방
  | 'pharmacy_otc'     // 일반의약품 = 약국 구입
  | 'procedure'        // 시술 = 의원
  | 'unavailable_kr';  // 한국 미수입

export interface ExternalLink {
  type: ExternalLinkType;
  url?: string;     // 클릭 가능한 URL이 있는 경우
  label: string;
  note?: string;    // 추가 안내 (예: "처방 필요", "의원 시술")
}

const IHERB_RCODE = process.env.IHERB_RCODE;

export function coupangSearchUrl(keyword: string, label?: string): string {
  const params = new URLSearchParams({ keyword });
  if (label && label !== keyword) params.set('label', label);
  return `/coupang?${params.toString()}`;
}

/** 쿠팡 제품 페이지 URL에 affiliate subId 자동 추가. */
export function coupangProductUrl(directUrl: string): string {
  return directUrl;
}

export function iherbSearchUrl(keyword: string): string {
  const q = encodeURIComponent(keyword);
  const rcode = IHERB_RCODE ? `&rcode=${encodeURIComponent(IHERB_RCODE)}` : '';
  return `https://kr.iherb.com/search?kw=${q}${rcode}`;
}

/** iHerb 제품 페이지 URL에 rcode 자동 추가. */
export function iherbProductUrl(directUrl: string): string {
  if (!IHERB_RCODE) return directUrl;
  const sep = directUrl.includes('?') ? '&' : '?';
  return `${directUrl}${sep}rcode=${encodeURIComponent(IHERB_RCODE)}`;
}

export function healthKrSearchUrl(keyword: string): string {
  const q = encodeURIComponent(keyword);
  return `https://www.health.kr/searchDrug/search_total_result.asp?drug_name=${q}`;
}

export function nedrugSearchUrl(keyword: string): string {
  const q = encodeURIComponent(keyword);
  return `https://nedrug.mfds.go.kr/searchDrug?searchYn=true&itemName=${q}`;
}

/** 한국 시판 분류 판정 */
function classifyProductCategory(productType: string | null | undefined): {
  isRx: boolean;          // 전문의약품
  isOtc: boolean;         // 일반의약품
  isHealthFood: boolean;  // 건강기능식품
  isDirect: boolean;      // 직구 전용
  isUnavailable: boolean; // 한국 미수입
} {
  const t = (productType ?? '').toLowerCase();
  return {
    isRx: t.includes('전문의약품') || t.includes('전문약') || t.includes('처방'),
    isOtc:
      t.includes('일반의약품') ||
      (t.includes('의약품') && !t.includes('전문')) ||
      t.includes('otc'),
    isHealthFood: t.includes('건강기능식품') || t.includes('건기식'),
    isDirect: t.includes('직구'),
    isUnavailable: t.includes('미수입') || t.includes('한국 미') || t.includes('수입 X'),
  };
}

function isProcedure(substanceType: string | null | undefined): boolean {
  return substanceType === 'injection_rx' || substanceType === 'procedure';
}

/**
 * 제품 정보로 가장 적절한 외부 링크/안내를 자동 결정.
 */
export function buildExternalLinks(opts: {
  productName?: string | null;
  productNameEn?: string | null;
  productType?: string | null;
  substanceType?: string | null;
  substanceNameKo?: string | null;
  substanceNameEn?: string | null;
  // 직접 제품 페이지 URL — 있으면 검색 페이지 대신 우선 사용
  coupangDirectUrl?: string | null;
  iherbDirectUrl?: string | null;
}): ExternalLink[] {
  const {
    productName,
    productNameEn,
    productType,
    substanceType,
    substanceNameKo,
    substanceNameEn,
    coupangDirectUrl,
    iherbDirectUrl,
  } = opts;

  // 시술류는 구매 불가, 정보만
  if (isProcedure(substanceType)) {
    return [
      {
        type: 'procedure',
        label: '시술 (의원)',
        note: '정형외과·통증의학과에서 시술',
      },
    ];
  }

  const cat = classifyProductCategory(productType);
  const koreaKeyword = productName ?? substanceNameKo ?? '';
  const coupangKeyword = productNameEn ?? substanceNameEn ?? productName ?? substanceNameKo ?? '';
  const directKeyword = productNameEn ?? productName ?? substanceNameEn ?? substanceNameKo ?? '';

  // 한국 미수입 — 정보만
  if (cat.isUnavailable) {
    const out: ExternalLink[] = [
      { type: 'unavailable_kr', label: '한국 미수입', note: '국내 구입 불가' },
    ];
    if (directKeyword) {
      out.push({ type: 'iherb', url: iherbSearchUrl(directKeyword), label: 'iHerb 직구' });
    }
    return out;
  }

  // 전문의약품 — 약국 처방 안내
  if (cat.isRx) {
    const out: ExternalLink[] = [
      {
        type: 'pharmacy_rx',
        label: '약국 (처방)',
        note: '의사 처방 후 약국에서 조제',
      },
    ];
    if (koreaKeyword) {
      out.push({ type: 'healthkr', url: healthKrSearchUrl(koreaKeyword), label: '약학정보원' });
    }
    return out;
  }

  // 일반의약품 OTC — 약국 구입 안내 (쿠팡 X)
  if (cat.isOtc) {
    const out: ExternalLink[] = [
      {
        type: 'pharmacy_otc',
        label: '약국 구입',
        note: '약사 상담 후 구입 가능',
      },
    ];
    if (koreaKeyword) {
      out.push({ type: 'healthkr', url: healthKrSearchUrl(koreaKeyword), label: '약학정보원' });
    }
    return out;
  }

  // 직구 전용 → iHerb 우선
  if (cat.isDirect) {
    const out: ExternalLink[] = [];
    if (iherbDirectUrl) {
      out.push({
        type: 'iherb',
        url: iherbProductUrl(iherbDirectUrl),
        label: 'iHerb 제품 보기',
        note: '제품 페이지로 바로 이동',
      });
    } else if (directKeyword) {
      out.push({ type: 'iherb', url: iherbSearchUrl(directKeyword), label: 'iHerb' });
    }
    if (coupangDirectUrl) {
      out.push({
        type: 'coupang',
        url: coupangProductUrl(coupangDirectUrl),
        label: '쿠팡 제품 보기',
        note: '제품 페이지로 바로 이동',
      });
    } else if (coupangKeyword) {
      out.push({ type: 'coupang', url: coupangSearchUrl(coupangKeyword, koreaKeyword), label: '쿠팡 상품' });
    }
    return out;
  }

  // 건강기능식품 (기본) — 쿠팡 + iHerb 모두
  const out: ExternalLink[] = [];
  if (coupangDirectUrl) {
    out.push({
      type: 'coupang',
      url: coupangProductUrl(coupangDirectUrl),
      label: '쿠팡 제품 보기',
      note: '제품 페이지로 바로 이동',
    });
  } else if (coupangKeyword) {
    out.push({ type: 'coupang', url: coupangSearchUrl(coupangKeyword, koreaKeyword), label: '쿠팡 상품' });
  }
  if (iherbDirectUrl) {
    out.push({
      type: 'iherb',
      url: iherbProductUrl(iherbDirectUrl),
      label: 'iHerb 제품 보기',
      note: '제품 페이지로 바로 이동',
    });
  } else if (directKeyword && directKeyword !== koreaKeyword) {
    out.push({ type: 'iherb', url: iherbSearchUrl(directKeyword), label: 'iHerb' });
  }
  return out;
}

export function affiliateStatus(): { coupangActive: boolean; iherbActive: boolean } {
  return {
    coupangActive: !!(
      process.env.COUPANG_ACCESS_KEY && process.env.COUPANG_SECRET_KEY
    ),
    iherbActive: !!IHERB_RCODE,
  };
}
