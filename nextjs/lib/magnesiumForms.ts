// 마그네슘 제형 비교 데이터 — 약사 영선 검수용 1차 초안
// 흡수율/위장장애는 문헌 consensus 기반의 상대 등급(개인차·용량차 큼).
// elemental %는 화학식 기준 이론치(수화물·버퍼 처리에 따라 실제 제품은 달라짐).
// absorptionPct는 경구 생체이용률 대략 추정치 — 연구마다 편차 크고 상대 비교용. 영선 재확인 필요.
// 직구 제품·가격은 아이허브 기준 대략치(시점·환율에 따라 변동) — 가격은 영선 재확인 필요.

export type MgCategory = '무기염' | '유기염' | '아미노산 킬레이트';

// 5단계 상대 등급
export type Level = 'very_low' | 'low' | 'mid' | 'high' | 'very_high';

export type PriceTier = '저가' | '저~중가' | '중가' | '중~고가' | '고가';

export type KoreaAvailability =
  | '약국 일반약'
  | '국내 건기식'
  | '국내+직구'
  | '주로 직구';

// 직구(아이허브 등) 적합도
export type DirectBuyFit = 'high' | 'mid' | 'low';

export interface DirectBuyProduct {
  brand: string;
  name: string;
  /** 개수 · 1회분 원소 마그네슘 · 대략 가격 등 */
  spec: string;
}

export interface DirectBuyInfo {
  fit: DirectBuyFit;
  note?: string;
  products: DirectBuyProduct[];
}

export interface MagnesiumForm {
  slug: string;
  nameKo: string;
  nameEn: string;
  formula?: string;
  category: MgCategory;
  /** 화학식 기준 이론적 elemental 마그네슘 비율(%) */
  elementalPct: number;
  elementalNote?: string;
  /** 경구 생체이용률(상대 등급) */
  absorption: Level;
  /** 경구 생체이용률 대략 추정치(%) — 연구마다 큰 차이, 상대 비교용 교육치 */
  absorptionPct: number;
  absorptionNote?: string;
  /** 위장장애(주로 무름변·설사) 잘 생기는 정도. 높을수록 부담 큼 */
  giIssue: Level;
  giNote?: string;
  priceTier: PriceTier;
  /** 용도 태그(필터용) */
  uses: UseTag[];
  koreaAvailability: KoreaAvailability;
  /** 국내 대표 제품(약국·건기식) */
  exampleProducts: string[];
  /** 직구(아이허브 등) 대표 제품·가격 */
  directBuy: DirectBuyInfo;
  /** 정·캡슐·포당 함량 감각 잡아주는 메모 */
  unitDoseNote?: string;
  /** 약사 한 줄 평 */
  verdict: string;
}

export type UseTag =
  | '보충'
  | '수면·불안'
  | '변비'
  | '제산'
  | '편두통'
  | '근육·피로'
  | '인지·뇌'
  | '심혈관';

export const USE_TAGS: { tag: UseTag; label: string }[] = [
  { tag: '보충', label: '결핍 보충' },
  { tag: '수면·불안', label: '수면·불안' },
  { tag: '근육·피로', label: '근육·피로' },
  { tag: '변비', label: '변비' },
  { tag: '편두통', label: '편두통' },
  { tag: '인지·뇌', label: '인지·뇌' },
  { tag: '심혈관', label: '심혈관' },
  { tag: '제산', label: '제산(위산)' },
];

export const LEVEL_LABEL: Record<Level, string> = {
  very_low: '매우 낮음',
  low: '낮음',
  mid: '보통',
  high: '높음',
  very_high: '매우 높음',
};

// 흡수율은 높을수록 좋고(초록 쪽), 위장장애는 높을수록 나쁨(빨강 쪽).
export const LEVEL_RANK: Record<Level, number> = {
  very_low: 0,
  low: 1,
  mid: 2,
  high: 3,
  very_high: 4,
};

export const DIRECT_FIT_LABEL: Record<DirectBuyFit, string> = {
  high: '직구 추천',
  mid: '직구 가능',
  low: '국내가 유리',
};

export const CATEGORY_NOTE: Record<MgCategory, string> = {
  무기염: '값싸고 함량(%)은 높지만 흡수가 낮은 편. 변비약·제산제로 많이 쓰임.',
  유기염: '산(구연산·젖산 등)에 결합. 흡수가 무난~좋고 가성비 보충에 적합.',
  '아미노산 킬레이트':
    '아미노산으로 감싼 형태. 흡수 좋고 위장 부담이 가장 적음. 대체로 비쌈.',
};

export interface MagnesiumMeta {
  dailyReferenceKo: string;
  upperLimitKo: string;
  labelTrap: string;
  absorptionCaveat: string;
  absorbedNote: string;
  directBuyTip: string;
}

export const MG_META: MagnesiumMeta = {
  dailyReferenceKo:
    '식약처 1일 영양성분 기준치 315mg(원소 마그네슘 기준). 권장섭취량은 성인 남성 350~370mg, 여성 280~320mg 수준.',
  upperLimitKo:
    '식품 외 보충제로 추가 섭취하는 마그네슘의 상한은 약 350mg/일. 그 이상은 설사 위험이 커짐(식품으로 먹는 양은 상한에 포함 안 함).',
  labelTrap:
    '한국 건강기능식품은 보통 "원소 마그네슘" 함량으로 표기합니다. 하지만 변비약·제산제(산화·수산화마그네슘)는 "염(소금) 무게"로 표기돼요. 예: 산화마그네슘 500mg ≈ 원소 마그네슘 300mg. 광고에서 큰 숫자가 곧 흡수량은 아닙니다.',
  absorbedNote:
    '"실제 흡수량"은 제제(염) 100mg을 먹었다고 할 때 = 원소 비율 × 흡수율로 계산한 대략치입니다. 산화마그네슘은 원소 비율은 최고(60%)지만 흡수가 낮아(~4%) 실제 흡수량은 오히려 적어요. 흡수율 자체가 용량·공복/식후·개인차로 변동이 커서 표의 값은 정확한 수치가 아니라 상대 비교용 추정치입니다.',
  absorptionCaveat:
    '흡수율은 용량·공복/식후·개인 위장 상태에 따라 달라집니다. 한 번에 많이보다 나눠서, 식후에 먹는 편이 흡수에 유리합니다.',
  directBuyTip:
    '마그네슘은 직구(아이허브 등) 비중이 큰 성분입니다. 글리시네이트·말산·타우레이트·L-트레오네이트는 국내보다 직구 선택지가 훨씬 다양하고, 1정당 함량·가성비도 좋은 경우가 많아요. 건강기능식품 직구는 자가사용 기준(통상 6병 이내), 1회 미화 $150(미국발 $200) 이하 면세, 개인통관고유부호가 필요합니다. (통관 기준은 변동되니 최신 기준 확인 권장)',
};

// 표시 순서: 흡수·위장 친화 좋은 순(킬레이트 → 유기염 → 무기염)으로 정렬.
export const MAGNESIUM_FORMS: MagnesiumForm[] = [
  {
    slug: 'glycinate',
    nameKo: '글리시네이트 (비스글리시네이트)',
    nameEn: 'Magnesium glycinate / bisglycinate',
    formula: 'Mg(C₂H₄NO₂)₂',
    category: '아미노산 킬레이트',
    elementalPct: 14,
    elementalNote: '순수 킬레이트 기준 ~14%. "버퍼드(buffered)" 제품은 산화마그네슘을 섞어 함량을 올린 경우가 많아 표기 확인 필요.',
    absorption: 'very_high',
    absorptionPct: 30,
    absorptionNote: '흡수율 추정 25~35%. 소장에서 킬레이트 그대로 흡수.',
    giIssue: 'very_low',
    giNote: '위장 부담이 가장 적어 위가 예민한 사람에게 1순위.',
    priceTier: '중~고가',
    uses: ['수면·불안', '보충', '근육·피로'],
    koreaAvailability: '국내+직구',
    exampleProducts: ['국내 글리시네이트 단일제 (다수)'],
    directBuy: {
      fit: 'high',
      note: '직구 선택지가 가장 풍부. 순수 킬레이트(산화Mg 미혼합)를 고르려면 표기 확인.',
      products: [
        {
          brand: "Doctor's Best",
          name: '고흡수 마그네슘 (라이세이트·글리시네이트, Albion TRAACS)',
          spec: '120·240정 · 1회 2정 200mg · 아이허브 최장수 베스트셀러',
        },
        {
          brand: 'NOW Foods',
          name: '마그네슘 글리시네이트',
          spec: '180정 · 1회 2정 200mg · 약 ₩29,000대 (★4.8, 리뷰 1,000건+)',
        },
        {
          brand: 'California Gold Nutrition',
          name: '마그네슘 킬레이트',
          spec: '1회 2정 420mg · 가성비',
        },
        {
          brand: 'Lake Avenue / 21st Century',
          name: '비스글리시네이트 (TRAACS)',
          spec: '1회 2정 400mg · 저가 라인',
        },
      ],
    },
    unitDoseNote:
      '1정/캡슐 원소 마그네슘 100mg 안팎(킬레이트 염으로는 ~700mg). 권장량 맞추려 보통 2~3정.',
    verdict: '수면·불안·근육이완 목적과 위장 약한 사람에게 1순위. 함량(%)은 낮아도 흡수·내약성이 최고. 단가는 높은 편.',
  },
  {
    slug: 'l_threonate',
    nameKo: 'L-트레오네이트',
    nameEn: 'Magnesium L-threonate (Magtein)',
    formula: 'Mg(C₄H₇O₅)₂',
    category: '아미노산 킬레이트',
    elementalPct: 8,
    elementalNote: '원소 비율 ~8%로 낮음. 권장량 맞추려면 염 기준 다량 필요.',
    absorption: 'high',
    absorptionPct: 25,
    absorptionNote: '혈중뇌장벽(BBB)을 통과해 뇌 마그네슘을 올린다는 주장은 주로 동물실험. 사람 입증은 빈약.',
    giIssue: 'low',
    priceTier: '고가',
    uses: ['인지·뇌'],
    koreaAvailability: '주로 직구',
    exampleProducts: ['국내 정식 유통 드묾'],
    directBuy: {
      fit: 'high',
      note: '국내엔 거의 없어 사실상 직구 전용. 원료는 대부분 Magtein®.',
      products: [
        {
          brand: 'Life Extension',
          name: 'Neuro-Mag 마그네슘 L-트레오네이트',
          spec: '90캡슐 · 1회 3캡슐 원소 144mg(Magtein 2,000mg) · 분말·구미도 있음',
        },
        {
          brand: 'Protocol for Life Balance',
          name: 'Magtein 마그네슘 L-트레오네이트',
          spec: '90캡슐 · Neuro-Mag와 동일 원료',
        },
        {
          brand: 'Double Wood',
          name: '마그네슘 L-트레오네이트',
          spec: '저가 직구 대안',
        },
      ],
    },
    unitDoseNote:
      '연구 용량 1일 원소 마그네슘 ~144mg(트레온산염 약 2,000mg, 보통 3캡슐 분할).',
    verdict: '인지·뇌 목적으로 유명하나 사람 근거는 약하고 제조사 주도. 함량 낮고 비싸 일반 결핍 보충용으론 비효율적.',
  },
  {
    slug: 'taurate',
    nameKo: '타우레이트',
    nameEn: 'Magnesium taurate',
    formula: 'Mg(C₂H₆NO₃S)₂',
    category: '아미노산 킬레이트',
    elementalPct: 9,
    absorption: 'high',
    absorptionPct: 25,
    giIssue: 'low',
    priceTier: '중~고가',
    uses: ['심혈관', '보충'],
    koreaAvailability: '주로 직구',
    exampleProducts: ['국내 단일제 드묾'],
    directBuy: {
      fit: 'high',
      note: '국내 유통 적어 직구 위주. "타우레이트+"류는 산화Mg가 섞인 버퍼드일 수 있어 표기 확인.',
      products: [
        {
          brand: 'Cardiovascular Research',
          name: '마그네슘 타우레이트 (순수)',
          spec: '180캡슐 · 1캡슐 125mg · 1일 2회',
        },
        {
          brand: 'KAL',
          name: '마그네슘 타우레이트+',
          spec: '90·180정 · 1회 2정 400mg (타우레이트+산화Mg 혼합)',
        },
      ],
    },
    unitDoseNote: '순수 타우레이트는 1캡슐 원소 마그네슘 100~125mg 안팎.',
    verdict: '타우린 동반으로 혈압·심혈관 목적에서 거론. 근거는 제한적이고 국내 유통은 적어 직구 위주.',
  },
  {
    slug: 'citrate',
    nameKo: '구연산마그네슘 (시트레이트)',
    nameEn: 'Magnesium citrate',
    formula: 'Mg₃(C₆H₅O₇)₂',
    category: '유기염',
    elementalPct: 16,
    elementalNote: '무수물 기준 ~16%. 수화물 제품은 더 낮을 수 있음.',
    absorption: 'high',
    absorptionPct: 25,
    absorptionNote: '흡수율 추정 20~30%. 가성비 보충의 표준.',
    giIssue: 'mid',
    giNote: '고용량에선 무름변·설사. 변비 개선 목적으로도 사용.',
    priceTier: '저~중가',
    uses: ['보충', '변비', '편두통'],
    koreaAvailability: '국내+직구',
    exampleProducts: ['국내 구연산마그네슘 제품 다수(GNM·뉴트리코어·솔가 등)'],
    directBuy: {
      fit: 'mid',
      note: '국내에도 흔해 굳이 직구 아니어도 됨. 분말·드링크 형태가 직구에 다양.',
      products: [
        {
          brand: 'Natural Vitality',
          name: 'CALM (구연산마그네슘 분말·드링크)',
          spec: '분말/30포 · 1회 350mg · 수면·이완용 대형 베스트셀러',
        },
        {
          brand: 'NOW Foods',
          name: '마그네슘 시트레이트',
          spec: '정·분말 · 1회 200~400mg',
        },
      ],
    },
    unitDoseNote: '1정/포 원소 마그네슘 100~200mg 표기가 흔함.',
    verdict: '가성비 일반 보충 1순위. 흡수 좋고 국내 제품 풍부. 단 용량 높이면 변이 무를 수 있음.',
  },
  {
    slug: 'malate',
    nameKo: '말산마그네슘 (말레이트)',
    nameEn: 'Magnesium malate',
    formula: 'MgC₄H₄O₅',
    category: '유기염',
    elementalPct: 6.5,
    elementalNote: '상업용(다이마그네슘 말레이트 수화물) 기준 ~6.5%로 낮은 편. 무수물은 더 높음.',
    absorption: 'high',
    absorptionPct: 25,
    giIssue: 'low',
    giNote: '위장 부담이 적은 편.',
    priceTier: '중가',
    uses: ['근육·피로', '보충'],
    koreaAvailability: '주로 직구',
    exampleProducts: ['국내 단일제 드묾'],
    directBuy: {
      fit: 'high',
      note: '국내 단일제가 드물어 직구 위주. 피로·근육통 목적으로 직구 수요 큼.',
      products: [
        {
          brand: 'NOW Foods',
          name: '마그네슘 말레이트',
          spec: '정 1,000mg·1회 2정 원소 113mg / 캡슐 1캡 원소 95mg(180캡)',
        },
        {
          brand: 'Source Naturals',
          name: '마그네슘 말레이트',
          spec: '180정·200캡 · 1캡 말산마그네슘 625mg',
        },
      ],
    },
    unitDoseNote: '함량(%)이 낮아 권장량 맞추려면 염 기준 다량(캡슐 수 많아짐).',
    verdict: '피로·근육통·섬유근통 맥락에서 인기. 흡수 좋고 순하지만 함량 낮아 캡슐 수가 늘고 국내 유통 적음.',
  },
  {
    slug: 'lactate',
    nameKo: '젖산마그네슘 (락테이트)',
    nameEn: 'Magnesium lactate',
    formula: 'Mg(C₃H₅O₃)₂',
    category: '유기염',
    elementalPct: 12,
    absorption: 'high',
    absorptionPct: 25,
    giIssue: 'low',
    giNote: '위장 자극이 적어 민감한 사람에게 무난.',
    priceTier: '중가',
    uses: ['보충'],
    koreaAvailability: '국내+직구',
    exampleProducts: ['젖산마그네슘 함유 보충제(일부 국내)'],
    directBuy: {
      fit: 'mid',
      note: '단일제는 흔치 않고 복합제 성분으로 자주 들어감.',
      products: [
        {
          brand: '직구 일반',
          name: '마그네슘 락테이트 함유 제품',
          spec: '단일제 적음 · 복합제 성분으로 흔함',
        },
      ],
    },
    unitDoseNote: '1정 원소 마그네슘 80~100mg 안팎.',
    verdict: '위가 약한 사람의 무난한 보충용. 특별한 장점은 적지만 내약성이 좋음.',
  },
  {
    slug: 'aspartate',
    nameKo: '아스파르트산마그네슘',
    nameEn: 'Magnesium aspartate',
    formula: 'Mg(C₄H₆NO₄)₂',
    category: '유기염',
    elementalPct: 10,
    absorption: 'high',
    absorptionPct: 25,
    giIssue: 'low',
    priceTier: '중가',
    uses: ['보충', '근육·피로'],
    koreaAvailability: '주로 직구',
    exampleProducts: ['국내 단일제 드묾'],
    directBuy: {
      fit: 'mid',
      note: '단일제는 적고 칼륨·아연 등과의 복합제(전해질)로 자주 나옴.',
      products: [
        {
          brand: '직구 일반',
          name: '마그네슘 아스파르트산(복합 포함)',
          spec: '전해질 복합제 형태가 흔함',
        },
      ],
    },
    verdict: '흡수 좋은 유기염. 과거 피로 회복 목적으로 쓰였으나 국내 단일제는 드묾.',
  },
  {
    slug: 'gluconate',
    nameKo: '글루콘산마그네슘 (글루코네이트)',
    nameEn: 'Magnesium gluconate',
    formula: 'Mg(C₆H₁₁O₇)₂',
    category: '유기염',
    elementalPct: 5.4,
    elementalNote: '원소 비율 ~5.4%로 가장 낮은 축. 목표 용량 맞추려면 양이 많이 필요.',
    absorption: 'high',
    absorptionPct: 28,
    absorptionNote: '동물연구 등에서 생체이용률이 높게 보고된 편. 위장 자극이 적음.',
    giIssue: 'low',
    giNote: '위장 부담이 적어 순한 편.',
    priceTier: '중가',
    uses: ['보충'],
    koreaAvailability: '국내+직구',
    exampleProducts: ['글루콘산마그네슘 함유 보충제(일부 국내)'],
    directBuy: {
      fit: 'mid',
      note: '단일제는 흔치 않음. 순한 보충 목적으로 일부 사용.',
      products: [
        {
          brand: '직구 일반',
          name: '마그네슘 글루코네이트',
          spec: '순함 강조 · 원소 비율 낮아 다정 필요',
        },
      ],
    },
    unitDoseNote: '원소 비율이 낮아 1정당 원소 마그네슘이 적음(다정 필요).',
    verdict: '위에 순한 유기염. 다만 원소 비율이 낮아 효율이 떨어지고 국내 단일제는 적은 편.',
  },
  {
    slug: 'orotate',
    nameKo: '오로트산마그네슘 (오로테이트)',
    nameEn: 'Magnesium orotate',
    category: '유기염',
    elementalPct: 7,
    absorption: 'mid',
    absorptionPct: 18,
    giIssue: 'low',
    priceTier: '중~고가',
    uses: ['심혈관', '보충'],
    koreaAvailability: '주로 직구',
    exampleProducts: ['국내 유통 드묾'],
    directBuy: {
      fit: 'mid',
      note: '취급 브랜드가 적은 편. 함량 낮아 캡슐 수가 많음.',
      products: [
        {
          brand: '직구 일반',
          name: '마그네슘 오로테이트',
          spec: '소수 브랜드 · 1캡 원소 함량 낮음',
        },
      ],
    },
    unitDoseNote: '함량 낮아 고용량/다정 필요.',
    verdict: '심부전·운동수행 일부 연구로 거론되나 단일·미재현 근거. 함량 낮고 비싸 일반 보충엔 비효율적.',
  },
  {
    slug: 'chloride',
    nameKo: '염화마그네슘',
    nameEn: 'Magnesium chloride',
    formula: 'MgCl₂·6H₂O',
    category: '무기염',
    elementalPct: 12,
    elementalNote: '6수화물 기준 ~12%(무수물은 ~25%).',
    absorption: 'mid',
    absorptionPct: 25,
    absorptionNote: '무기염 중에선 흡수가 무난한 편.',
    giIssue: 'mid',
    priceTier: '저~중가',
    uses: ['보충'],
    koreaAvailability: '국내+직구',
    exampleProducts: ['염화마그네슘 보충제(일부 국내)'],
    directBuy: {
      fit: 'mid',
      note: '경구 캡슐보다 "마그네슘 오일/플레이크"(경피·목욕용)로 직구 수요가 많음.',
      products: [
        {
          brand: 'Life-flo',
          name: '퓨어 마그네슘 오일 (경피 스프레이)',
          spec: '염화마그네슘 외용 · 경피 흡수 근거는 약함',
        },
        {
          brand: 'Trace Minerals',
          name: '액상 이온 마그네슘 / 플레이크',
          spec: '드롭·목욕용',
        },
      ],
    },
    verdict: '경구 보충은 무난. 짠맛·흡습성이 단점. "경피(피부) 흡수" 마케팅은 근거가 약함.',
  },
  {
    slug: 'carbonate',
    nameKo: '탄산마그네슘',
    nameEn: 'Magnesium carbonate',
    formula: 'MgCO₃',
    category: '무기염',
    elementalPct: 28,
    absorption: 'low',
    absorptionPct: 10,
    absorptionNote: '위산과 만나 일부 염화물로 전환돼 흡수됨. 산성도 의존적이고 자료가 적음.',
    giIssue: 'mid',
    giNote: '제산 과정에서 가스·트림. 고용량 완하 작용.',
    priceTier: '저가',
    uses: ['제산', '보충'],
    koreaAvailability: '약국 일반약',
    exampleProducts: ['제산제 복합제 성분(다수)'],
    directBuy: {
      fit: 'low',
      note: '제산제 성격이라 직구 메리트 적음. (Natural Vitality CALM의 원료로는 쓰임)',
      products: [],
    },
    verdict: '주로 제산제 성분. 보충 목적의 흡수 효율은 낮은 편.',
  },
  {
    slug: 'hydroxide',
    nameKo: '수산화마그네슘',
    nameEn: 'Magnesium hydroxide',
    formula: 'Mg(OH)₂',
    category: '무기염',
    elementalPct: 42,
    absorption: 'very_low',
    absorptionPct: 4,
    giIssue: 'very_high',
    giNote: '강한 삼투성 완하 작용 → 변비약. 보충 목적엔 부적합.',
    priceTier: '저가',
    uses: ['변비', '제산'],
    koreaAvailability: '약국 일반약',
    exampleProducts: ['마그밀정 (수산화마그네슘 500mg, 삼남제약)'],
    directBuy: {
      fit: 'low',
      note: '변비·제산용 일반약. 국내 약국이 훨씬 싸고 빠름 — 직구 비추천.',
      products: [],
    },
    unitDoseNote: '마그밀정 1정 = 수산화마그네슘 500mg(원소 마그네슘 약 208mg). 변비엔 1일 1~2g.',
    verdict: '제산·변비용 일반의약품(마그밀). 흡수가 거의 안 돼 결핍 보충용으로는 쓰지 않음.',
  },
  {
    slug: 'oxide',
    nameKo: '산화마그네슘',
    nameEn: 'Magnesium oxide',
    formula: 'MgO',
    category: '무기염',
    elementalPct: 60,
    elementalNote: '함량(%)은 모든 제형 중 최고지만, 그게 곧 흡수량은 아님.',
    absorption: 'very_low',
    absorptionPct: 4,
    absorptionNote: '흡수율 추정 4~5%. 대부분 흡수되지 않고 장으로 내려가 삼투성 완하 작용.',
    giIssue: 'very_high',
    giNote: '무름변·설사 흔함. 그래서 변비약으로도 사용.',
    priceTier: '저가',
    uses: ['변비', '제산', '보충'],
    koreaAvailability: '약국 일반약',
    exampleProducts: ['산화마그네슘 변비약(약국)', '저가 마그네슘 건강기능식품 다수'],
    directBuy: {
      fit: 'low',
      note: '어디에나 있고 국내가 더 쌈. 흡수 기대 어려워 굳이 직구할 이유 적음.',
      products: [],
    },
    unitDoseNote:
      '변비약 1정 = 산화마그네슘 250~500mg(원소 150~300mg). 건기식은 보통 원소 마그네슘으로 환산 표기.',
    verdict: '라벨 함량은 최고, 실제 흡수는 최저. 가성비로 가장 흔하지만 흡수를 기대하긴 어려움. 변비·제산엔 유용.',
  },
];

/** 제제(염) 100mg 기준 실제 흡수되는 원소 마그네슘 추정량(mg) = 원소비율% × 흡수율% / 100 */
export function absorbedPer100mg(f: MagnesiumForm): number {
  return Math.round(((f.elementalPct * f.absorptionPct) / 100) * 10) / 10;
}
