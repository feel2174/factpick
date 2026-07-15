export interface ConditionCatalogItem {
  slug: string;
  nameKo: string;
  nameEn: string;
  category: string;
  description: string;
  count: number;
  accent: string;
}

export const CONDITION_CATALOG: ConditionCatalogItem[] = [
  { slug: 'osteoarthritis', nameKo: '골관절염', nameEn: 'Osteoarthritis', category: '관절·통증', description: '무릎 통증에 쓰이는 약·주사·영양제를 효과 크기와 근거로 비교합니다.', count: 41, accent: '관절' },
  { slug: 'cognitive_decline', nameKo: '인지기능 저하', nameEn: 'Cognitive decline', category: '뇌·신경', description: '기억력과 인지기능 관련 약·영양제의 실제 연구 결과를 살펴봅니다.', count: 30, accent: '인지' },
  { slug: 'depression_mild', nameKo: '경증 우울', nameEn: 'Mild depression', category: '마음 건강', description: '항우울제와 보조 성분을 효과와 근거 수준으로 함께 비교합니다.', count: 23, accent: '우울' },
  { slug: 'anxiety', nameKo: '불안 증상', nameEn: 'Anxiety', category: '마음 건강', description: '불안 증상에 사용되는 약과 보조 성분의 근거를 정리했습니다.', count: 21, accent: '불안' },
  { slug: 'insomnia', nameKo: '불면증', nameEn: 'Insomnia', category: '수면', description: '수면제와 멜라토닌·마그네슘 등 수면 성분을 비교합니다.', count: 16, accent: '수면' },
  { slug: 'migraine', nameKo: '편두통 예방', nameEn: 'Migraine prevention', category: '뇌·신경', description: '편두통 예방약과 마그네슘·CoQ10 등 보조 성분을 비교합니다.', count: 18, accent: '편두통' },
  { slug: 'hypertension', nameKo: '고혈압', nameEn: 'Hypertension', category: '심혈관', description: '혈압약과 마늘·비트·마그네슘 등의 혈압 개선 근거를 비교합니다.', count: 28, accent: '혈압' },
  { slug: 'hyperlipidemia', nameKo: '이상지질혈증', nameEn: 'Dyslipidemia', category: '심혈관', description: '스타틴과 홍국·베르베린·차전자피의 지질 개선 근거를 비교합니다.', count: 25, accent: '지질' },
  { slug: 'immune_support', nameKo: '면역력 저하', nameEn: 'Immune support', category: '면역', description: '비타민·아연·프로바이오틱스 등 면역 성분의 근거를 확인합니다.', count: 18, accent: '면역' },
  { slug: 'skin_aging', nameKo: '피부 노화', nameEn: 'Skin aging', category: '피부', description: '레티노이드와 콜라겐·아스타잔틴 등 피부 성분을 비교합니다.', count: 17, accent: '피부' },
  { slug: 'eye_health', nameKo: '눈 건강', nameEn: 'Eye health', category: '눈', description: '루테인·AREDS·오메가3와 안과 치료 선택지의 근거를 비교합니다.', count: 14, accent: '눈' },
  { slug: 'liver_health', nameKo: '간 건강', nameEn: 'Liver health', category: '간', description: '밀크씨슬·헛개·비타민 E 등 간 관련 성분의 근거를 정리했습니다.', count: 9, accent: '간' },
  { slug: 'menopause', nameKo: '갱년기', nameEn: 'Menopause', category: '여성 건강', description: '호르몬요법과 이소플라본·백수오 등 갱년기 선택지를 비교합니다.', count: 10, accent: '갱년기' },
  { slug: 'constipation', nameKo: '변비', nameEn: 'Constipation', category: '장 건강', description: '하제와 차전자피·마그네슘·유산균의 배변 개선 근거를 비교합니다.', count: 13, accent: '변비' },
  { slug: 'diarrhea', nameKo: '설사', nameEn: 'Diarrhea', category: '장 건강', description: '지사제·아연·유산균 등 설사 관리 선택지의 근거를 확인합니다.', count: 6, accent: '설사' },
  { slug: 'gut_health', nameKo: '장 건강', nameEn: 'Gut health', category: '장 건강', description: '과민성대장과 장 증상에 쓰이는 약·유산균·식이섬유를 비교합니다.', count: 8, accent: '장' },
];

export const NEXT_UPDATES = [
  { title: '잇몸 건강', stage: '연구 데이터 정리 중', progress: 42, detail: '치은염·치주염 관련 성분과 국내 일반의약품을 선별하고 있습니다.' },
  { title: '약물·영양제 상호작용', stage: '약사 검수 기준 설계 중', progress: 28, detail: '복용약 입력 결과를 더 안전하게 설명하기 위한 기준을 준비합니다.' },
  { title: '성분 상세 데이터베이스', stage: '페이지 구조 구축 중', progress: 64, detail: '제형·용량·질환별 근거를 한 페이지에서 탐색하도록 확장합니다.' },
];

export const SUBSTANCE_CATALOG = [
  { slug: 'magnesium', nameKo: '마그네슘', nameEn: 'Magnesium', category: '미네랄', type: '영양제', description: '근육과 신경 기능에 관여하는 미네랄로, 제형별 함량과 흡수 특성이 다릅니다.' },
  { slug: 'vitamin_d', nameKo: '비타민 D', nameEn: 'Vitamin D', category: '비타민', type: '영양제', description: '칼슘 이용과 뼈 건강, 면역 기능과 관련해 연구되는 지용성 비타민입니다.' },
  { slug: 'omega3', nameKo: '오메가-3', nameEn: 'Omega-3 fatty acids', category: '지방산', type: '영양제', description: 'EPA와 DHA를 중심으로 심혈관·인지·염증 관련 결과가 연구된 지방산입니다.' },
  { slug: 'glucosamine', nameKo: '글루코사민', nameEn: 'Glucosamine', category: '관절', type: '영양제', description: '원료와 제형에 따라 연구 결과가 달라 구분해서 확인해야 하는 관절 성분입니다.' },
  { slug: 'chondroitin', nameKo: '콘드로이친', nameEn: 'Chondroitin', category: '관절', type: '영양제', description: '의약품 등급과 일반 영양제 등급의 차이를 함께 살펴봐야 하는 관절 성분입니다.' },
  { slug: 'curcumin', nameKo: '커큐민', nameEn: 'Curcumin', category: '허브', type: '영양제', description: '강황의 주요 성분으로 흡수율을 높인 제형과 일반 제형을 구분해 평가합니다.' },
  { slug: 'ashwagandha', nameKo: '아슈와간다', nameEn: 'Ashwagandha', category: '허브', type: '영양제', description: '스트레스·불안·수면 영역에서 연구되지만 적용 대상과 근거 수준 확인이 필요합니다.' },
  { slug: 'melatonin', nameKo: '멜라토닌', nameEn: 'Melatonin', category: '수면', type: '영양제', description: '수면-각성 리듬과 관련된 성분으로 목적과 복용 시점에 따라 해석이 달라집니다.' },
  { slug: 'probiotics', nameKo: '프로바이오틱스', nameEn: 'Probiotics', category: '장 건강', type: '영양제', description: '질환과 균주가 다르면 결과도 달라지므로 제품명보다 균주 단위 확인이 중요합니다.' },
  { slug: 'coq10', nameKo: '코엔자임 Q10', nameEn: 'Coenzyme Q10', category: '항산화', type: '영양제', description: '에너지 대사에 관여하며 심혈관·편두통 등 여러 영역에서 연구된 성분입니다.' },
  { slug: 'ibuprofen', nameKo: '이부프로펜', nameEn: 'Ibuprofen', category: '진통제', type: '의약품', description: '통증과 염증 완화에 사용하는 NSAID 계열 의약품입니다.' },
  { slug: 'acetaminophen', nameKo: '아세트아미노펜', nameEn: 'Acetaminophen', category: '진통제', type: '의약품', description: '통증과 발열에 사용하는 의약품으로 용량과 간 안전성을 함께 확인해야 합니다.' },
] as const;

export function getCatalogCondition(slug: string) {
  return CONDITION_CATALOG.find((condition) => condition.slug === slug);
}

export function getCatalogSubstance(slug: string) {
  return SUBSTANCE_CATALOG.find((substance) => substance.slug === slug);
}
