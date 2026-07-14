/**
 * 적응증별 퀴즈 설정.
 * intro 카피 / body(BMI) 노출 / 동반질환 항목 / "이미 시도해본 치료" 목록이
 * 적응증마다 다르다. OA 전용 하드코딩을 적응증별 config로 분리.
 *
 * previous_treatments(이미 시도해본 치료)는 결과 화면 비교 막대에만 쓰이고
 * personalization_rules 매칭에는 쓰이지 않으므로, 적응증별로 자유롭게 정의해도
 * 룰이 깨지지 않는다. smdAbs는 published verified_effects와 같은 스케일(효과 크기 절댓값).
 */

export interface PreviousTreatmentOption {
  key: string;
  label: string;
  shortLabel: string;
  smdAbs: number | null; // 효과 크기 절댓값. null이면 수치화 어려운 치료
  note?: string;
  emoji: string;
}

// 동반질환 마스터 — UserProfile의 boolean key와 1:1. 적응증별로 부분집합만 노출.
export type ComorbidityKey =
  | 'diabetes'
  | 'hypertension'
  | 'dyslipidemia'
  | 'gout'
  | 'anticoagulant'
  | 'nsaid_allergy'
  | 'gi_history'
  | 'nsaid_gi_side_effect'
  | 'current_nsaid'
  | 'regular_steroid_injection';

// 모든 적응증 공통 동반질환 블록. 각 config의 comorbidityKeys는 여기에 얹는 "추가" 항목.
export const COMMON_COMORBIDITIES: ComorbidityKey[] = [
  'diabetes',
  'hypertension',
  'dyslipidemia',
  'gout',
  'anticoagulant',
];

export const COMORBIDITY_MASTER: Record<ComorbidityKey, { label: string; emoji: string }> = {
  diabetes: { label: '당뇨', emoji: '💉' },
  hypertension: { label: '고혈압', emoji: '💗' },
  dyslipidemia: { label: '고지혈증', emoji: '🩺' },
  gout: { label: '통풍', emoji: '🦶' },
  anticoagulant: { label: '항응고제 복용', emoji: '🩸' },
  nsaid_allergy: { label: 'NSAID 알레르기', emoji: '🚫' },
  gi_history: { label: '위궤양·위염', emoji: '🍽️' },
  nsaid_gi_side_effect: { label: 'NSAID 먹으면 속 쓰림', emoji: '🧴' },
  current_nsaid: { label: '현재 NSAID 처방 중', emoji: '💊' },
  regular_steroid_injection: { label: '정형외과 주사 정기적', emoji: '💉' },
};

export interface QuizConfig {
  intro: { headline: string; body: string; sub?: string };
  showBody: boolean; // 키/몸무게(BMI) 단계 노출 여부
  bodyTitle?: string;
  bodyHint?: string;
  comorbidityKeys: ComorbidityKey[]; // CONFIGS에선 "공통 외 추가" 항목, getQuizConfig가 공통과 병합
  prevTitle?: string;
  prevSubtitle?: string;
  prevTreatments: PreviousTreatmentOption[]; // 비어있으면 이전치료 단계 생략
  outcomeWord: string; // 비교 막대 설명용 ("통증·기능", "혈압" 등)
}

const DEFAULT_PREV_TITLE = '지금까지 무엇을 시도해보셨나요?';
const DEFAULT_PREV_SUBTITLE =
  '결과 화면에서 추천이 그동안 시도해본 것보다 얼마나 효과 큰지 비교해드려요';

const CONFIGS: Record<string, QuizConfig> = {
  osteoarthritis: {
    intro: {
      headline: '매번 주사 맞고, 맞을 때뿐이셨나요?',
      body: '관절강내 스테로이드 주사는 1-2주엔 효과 크지만, 6개월 지나면 SMD −0.07로 위약 수준으로 떨어집니다.',
      sub: '“관절에 좋다는 게 이렇게 많은데, 진짜 뭐가 좋은 거지?” — 약사인 저도 답이 막막했던 질문. Cochrane 메타분석으로 직접 정리했습니다.',
    },
    showBody: true,
    bodyTitle: '키와 몸무게 알려주세요',
    bodyHint: '체중은 무릎 통증과 관계가 가장 깊습니다',
    // 공통 외 OA 특이 — 진통제 안전성/치료맥락
    comorbidityKeys: [
      'nsaid_allergy',
      'gi_history',
      'nsaid_gi_side_effect',
      'current_nsaid',
      'regular_steroid_injection',
    ],
    outcomeWord: '통증·기능',
    prevTreatments: [
      { key: 'steroid_recent', label: '관절강내 스테로이드 주사 (맞은 직후 며칠~2주만 좋음)', shortLabel: '관절 주사 (직후)', smdAbs: 0.48, emoji: '💉' },
      { key: 'steroid_long', label: '관절강내 스테로이드 주사 (3-6개월 지나면 효과 거의 없음)', shortLabel: '관절 주사 (6개월 후)', smdAbs: 0.07, note: '주사 효과가 시간 갈수록 빠르게 감소', emoji: '💉' },
      { key: 'hyaluronic_injection', label: '히알루론산 관절강내 주사', shortLabel: '히알루론산 주사', smdAbs: 0.04, note: '위약 수준', emoji: '💉' },
      { key: 'nsaid_oral', label: '정형외과 NSAID 처방 (셀레브렉스·아콕시아 등 먹는 약)', shortLabel: 'NSAID 처방약', smdAbs: 0.22, emoji: '💊' },
      { key: 'tylenol', label: '타이레놀 (아세트아미노펜)', shortLabel: '타이레놀', smdAbs: 0.24, emoji: '💊' },
      { key: 'topical_nsaid', label: '외용 NSAID 패치 (케토톱·디클로페낙 패치 등)', shortLabel: '외용 패치', smdAbs: 0.45, emoji: '🧴' },
      { key: 'glucosamine_supp', label: '일반 글루코사민 영양제 (영양제 등급, Rotta/오스테민 아닌 것)', shortLabel: '일반 글루코사민', smdAbs: 0.06, note: '영양제 등급은 위약 수준', emoji: '🍃' },
      { key: 'chondroitin_supp', label: '일반 콘드로이친 영양제', shortLabel: '일반 콘드로이친', smdAbs: 0.08, emoji: '🍃' },
      { key: 'msm_supp', label: 'MSM 영양제', shortLabel: 'MSM', smdAbs: 0.0, note: '통계 비유의', emoji: '🍃' },
      { key: 'boswellia_supp', label: '보스웰리아 영양제', shortLabel: '보스웰리아', smdAbs: 0.24, note: '표준화 추출물 한정', emoji: '🍃' },
      { key: 'plain_turmeric', label: '일반 강황 분말 (커큐민 강화제형 아닌 것)', shortLabel: '일반 강황', smdAbs: 0.1, note: '생체이용률 낮아 효과 작음', emoji: '🍃' },
      { key: 'curcumin_supp', label: '커큐민 (생체이용률 강화 제형)', shortLabel: '커큐민', smdAbs: 0.34, note: '영양제 중 근거 가장 나음', emoji: '🍃' },
      { key: 'collagen_supp', label: '콜라겐 영양제 (저분자 펩타이드)', shortLabel: '콜라겐', smdAbs: null, note: '관절엔 근거 약함', emoji: '🍃' },
      { key: 'physiotherapy', label: '물리치료·재활', shortLabel: '물리치료', smdAbs: null, emoji: '🏃' },
      { key: 'weight_loss', label: '체중 감량 시도', shortLabel: '체중 감량', smdAbs: null, emoji: '⚖️' },
      { key: 'acupuncture', label: '침 / 한방 치료', shortLabel: '침·한방', smdAbs: null, emoji: '🪡' },
    ],
  },

  cognitive_decline: {
    intro: {
      headline: '깜빡임이 늘었을 때, 뭘 먹어야 진짜 도움이 될까요?',
      body: '은행잎·오메가-3 같은 ‘뇌 영양제’ 상당수는 예방 효과의 근거가 약합니다. 단계(예방·경도인지장애·치매)에 따라 답이 다릅니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '인지',
    prevTreatments: [
      { key: 'chei_drug', label: '치매약 (도네페질·리바스티그민 등)', shortLabel: '치매약(ChEI)', smdAbs: 0.4, note: '치매 단계 치료약', emoji: '💊' },
      { key: 'ginkgo', label: '은행잎 추출물 (기넥신 등)', shortLabel: '은행잎', smdAbs: 0.0, note: '예방 효과 없음(GEM)·원료 의존', emoji: '🍃' },
      { key: 'omega3_cog', label: '오메가-3', shortLabel: '오메가-3', smdAbs: 0.1, note: '예방 효과 비일관', emoji: '🐟' },
      { key: 'ginseng_cog', label: '인삼·홍삼', shortLabel: '인삼', smdAbs: 0.19, note: '기억 일부', emoji: '🌿' },
      { key: 'vitb_cog', label: '비타민 B군', shortLabel: '비타민B', smdAbs: 0.15, note: '비치매·조기만', emoji: '💊' },
      { key: 'curcumin_cog', label: '커큐민', shortLabel: '커큐민', smdAbs: 0.0, note: '사람 인지엔 무효', emoji: '🍃' },
      { key: 'brain_training', label: '두뇌 훈련·운동', shortLabel: '두뇌훈련·운동', smdAbs: null, emoji: '🧩' },
    ],
  },

  insomnia: {
    intro: {
      headline: '잠 못 드는 밤, 수면제 말고 방법이 있을까요?',
      body: '멜라토닌·마그네슘은 효과가 제한적이고, 처방 수면제는 단기엔 효과적이나 의존 위험이 있습니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '수면',
    prevTreatments: [
      { key: 'rx_hypnotic', label: '처방 수면제 (졸피뎀 등)', shortLabel: '처방 수면제', smdAbs: 0.5, note: '단기 효과·의존 주의', emoji: '💊' },
      { key: 'melatonin', label: '멜라토닌', shortLabel: '멜라토닌', smdAbs: 0.2, note: '일반 불면엔 약함, 시차·일주기엔 유용', emoji: '🌙' },
      { key: 'magnesium_sleep', label: '마그네슘', shortLabel: '마그네슘', smdAbs: 0.2, note: '입면 −17분(저질)', emoji: '🍃' },
      { key: 'valerian', label: '발레리안(쥐오줌풀)', shortLabel: '발레리안', smdAbs: 0.1, note: '주관적 소효과·이질성', emoji: '🌿' },
      { key: 'chamomile', label: '캐모마일', shortLabel: '캐모마일', smdAbs: null, note: '근거 얇음', emoji: '🌼' },
      { key: 'theanine_sleep', label: 'L-테아닌·글리신', shortLabel: '테아닌·글리신', smdAbs: null, note: '근거 얇음', emoji: '🍵' },
      { key: 'sleep_hygiene', label: '수면 위생·CBT-I', shortLabel: '수면위생', smdAbs: null, emoji: '🛏️' },
    ],
  },

  immune_support: {
    intro: {
      headline: '환절기 감기, 영양제로 막을 수 있을까요?',
      body: '비타민C는 일반인 예방엔 효과가 없고, 비타민D 정도가 호흡기 감염을 소폭 줄입니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '면역',
    prevTreatments: [
      { key: 'vitd_imm', label: '비타민 D', shortLabel: '비타민D', smdAbs: 0.2, note: '호흡기 감염 소폭 예방(고품질)', emoji: '☀️' },
      { key: 'vitc_imm', label: '비타민 C', shortLabel: '비타민C', smdAbs: 0.0, note: '일반 예방 무효·극한운동만', emoji: '🍊' },
      { key: 'zinc_imm', label: '아연', shortLabel: '아연', smdAbs: 0.1, note: '예방 무효·기간 단축은 이질성 큼', emoji: '🪨' },
      { key: 'elderberry', label: '엘더베리', shortLabel: '엘더베리', smdAbs: null, note: '소규모 근거', emoji: '🫐' },
      { key: 'probiotics_imm', label: '프로바이오틱스', shortLabel: '프로바이오틱스', smdAbs: 0.0, note: '발생 예방 무의', emoji: '🦠' },
    ],
  },

  depression_mild: {
    intro: {
      headline: '기분이 가라앉을 때, 약 말고 도움이 될 게 있을까요?',
      body: '우울은 드물게 영양제가 약에 근접하는 분야입니다(세인트존스워트·EPA 오메가-3). 단 약물 상호작용에 주의가 필요합니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '기분',
    prevTreatments: [
      { key: 'antidepressant', label: '항우울제 (SSRI·SNRI 등)', shortLabel: '항우울제', smdAbs: 0.5, note: '표준 치료', emoji: '💊' },
      { key: 'sjw', label: '세인트존스워트', shortLabel: '세인트존스워트', smdAbs: 0.4, note: '경도~중등도 SSRI 동등·약물상호작용 위험', emoji: '🌼' },
      { key: 'omega3_epa', label: '오메가-3 (EPA형)', shortLabel: '오메가-3 EPA', smdAbs: 0.4, note: 'EPA형만 효과, DHA 무효', emoji: '🐟' },
      { key: 'saffron', label: '사프란', shortLabel: '사프란', smdAbs: 0.4, note: '소규모서 SSRI 동등', emoji: '🌺' },
      { key: 'same', label: 'SAMe', shortLabel: 'SAMe', smdAbs: 0.3, note: '단독·병용 보조', emoji: '💊' },
    ],
  },

  anxiety: {
    intro: {
      headline: '불안할 때, 신경안정제 말고는 없을까요?',
      body: '라벤더(Silexan)는 경구로 항불안제에 근접한 데이터가 있습니다. 다만 표준 치료는 약입니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '불안',
    prevTreatments: [
      { key: 'anxiolytic', label: '항불안제 (SSRI·벤조디아제핀 등)', shortLabel: '항불안제', smdAbs: 0.5, note: '표준 치료·벤조 의존 주의', emoji: '💊' },
      { key: 'lavender', label: '라벤더 (Silexan 경구)', shortLabel: '라벤더', smdAbs: 0.4, note: '항불안제에 근접', emoji: '💜' },
      { key: 'ashwagandha', label: '아슈와간다', shortLabel: '아슈와간다', smdAbs: 0.4, note: '이질성 큼', emoji: '🌿' },
      { key: 'theanine_anx', label: 'L-테아닌', shortLabel: '테아닌', smdAbs: null, note: '근거 얇음', emoji: '🍵' },
      { key: 'chamomile_anx', label: '캐모마일', shortLabel: '캐모마일', smdAbs: null, note: '근거 얇음', emoji: '🌼' },
    ],
  },

  migraine: {
    intro: {
      headline: '두통약은 그때뿐, 예방은 안 될까요?',
      body: '마그네슘·리보플라빈·CoQ10은 편두통 ‘예방’에 가이드라인이 권고하는, 영양제가 통하는 드문 분야입니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '두통',
    prevTreatments: [
      { key: 'preventive_drug', label: '편두통 예방약 (토피라메이트·프로프라놀롤 등)', shortLabel: '예방약', smdAbs: 0.4, note: '표준 예방', emoji: '💊' },
      { key: 'magnesium_mig', label: '마그네슘', shortLabel: '마그네슘', smdAbs: 0.3, note: '가이드라인 권고', emoji: '🍃' },
      { key: 'riboflavin', label: '리보플라빈 (비타민 B2)', shortLabel: '리보플라빈', smdAbs: 0.25, note: '예방 근거', emoji: '💊' },
      { key: 'coq10_mig', label: '코엔자임 Q10', shortLabel: 'CoQ10', smdAbs: 0.3, note: '예방 근거', emoji: '🍃' },
      { key: 'butterbur', label: '버터버', shortLabel: '버터버', smdAbs: 0.3, note: '효과 있으나 간독성 주의', emoji: '🌿' },
    ],
  },

  hyperlipidemia: {
    intro: {
      headline: '콜레스테롤, 약 없이 영양제로 잡힐까요?',
      body: '‘천연’ 홍국은 사실상 저용량 스타틴입니다. LDL·심혈관은 스타틴이 압도적이고, 영양제는 보조에 가깝습니다.',
    },
    showBody: true,
    bodyTitle: '키와 몸무게 알려주세요',
    bodyHint: '체중·복부비만은 지질 수치와 관련이 큽니다',
    comorbidityKeys: [],
    outcomeWord: 'LDL·지질',
    prevTreatments: [
      { key: 'statin', label: '스타틴 (아토르바·로수바 등)', shortLabel: '스타틴', smdAbs: 0.7, note: 'LDL·사건 예방 입증', emoji: '💊' },
      { key: 'ryr', label: '홍국 (Red Yeast Rice)', shortLabel: '홍국', smdAbs: 0.55, note: '사실상 저용량 스타틴·품질 주의', emoji: '🍚' },
      { key: 'berberine', label: '베르베린', shortLabel: '베르베린', smdAbs: 0.35, note: 'LDL −19mg/dL(위약대조)', emoji: '🌿' },
      { key: 'phytosterol', label: '식물스테롤·식이섬유', shortLabel: '식물스테롤·섬유', smdAbs: 0.25, note: 'LDL ~10%↓ 안전', emoji: '🌾' },
      { key: 'omega3_lipid', label: '오메가-3', shortLabel: '오메가-3', smdAbs: 0.2, note: '중성지방용(LDL 아님)', emoji: '🐟' },
    ],
  },

  hypertension: {
    intro: {
      headline: '혈압, 영양제로 낮출 수 있을까요?',
      body: '마늘·비트가 약간 도움되지만 혈압은 약이 압도적입니다. CoQ10은 과대광고에 주의하세요.',
    },
    showBody: true,
    bodyTitle: '키와 몸무게 알려주세요',
    bodyHint: '체중 감량은 혈압을 낮추는 데 도움이 됩니다',
    comorbidityKeys: [],
    outcomeWord: '혈압',
    prevTreatments: [
      { key: 'antihypertensive', label: '강압제 (ACE·ARB·CCB·이뇨제)', shortLabel: '강압약', smdAbs: 0.6, note: '−10~20mmHg·사건 예방', emoji: '💊' },
      { key: 'garlic', label: '마늘', shortLabel: '마늘', smdAbs: 0.35, note: '고혈압자 −5~8.7mmHg', emoji: '🧄' },
      { key: 'beetroot', label: '비트·식이 질산염', shortLabel: '비트/질산염', smdAbs: 0.3, note: '−5.3mmHg(근거 낮음)', emoji: '🥬' },
      { key: 'magnesium_bp', label: '마그네슘', shortLabel: '마그네슘', smdAbs: 0.2, note: '결핍 보정 효과', emoji: '🍃' },
      { key: 'omega3_bp', label: '오메가-3', shortLabel: '오메가-3', smdAbs: 0.2, note: '소폭', emoji: '🐟' },
      { key: 'coq10_bp', label: '코엔자임 Q10', shortLabel: 'CoQ10', smdAbs: 0.1, note: '근거 약함(과대광고 주의)', emoji: '🍃' },
    ],
  },

  skin_aging: {
    intro: {
      headline: '바르는 것 말고, 먹는 게 피부에 도움될까요?',
      body: '주름의 표준은 외용 레티노이드입니다. 먹는 콜라겐·아스타잔틴은 수분·탄력에 보조적 효과가 있습니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '피부',
    prevTreatments: [
      { key: 'topical_retinoid', label: '외용 레티노이드 (트레티노인·레티놀)', shortLabel: '외용 레티노이드', smdAbs: 0.5, note: '주름·광노화 표준', emoji: '🧴' },
      { key: 'collagen_skin', label: '경구 콜라겐 펩타이드', shortLabel: '경구 콜라겐', smdAbs: 0.4, note: '수분·탄력·주름', emoji: '🍃' },
      { key: 'astaxanthin', label: '아스타잔틴', shortLabel: '아스타잔틴', smdAbs: 0.4, note: '수분 0.53·탄력 0.77', emoji: '🦐' },
      { key: 'vitc_skin', label: '경구 비타민 C', shortLabel: '비타민C(경구)', smdAbs: null, note: '외용이 핵심', emoji: '🍊' },
    ],
  },

  eye_health: {
    intro: {
      headline: '루테인·빌베리, 눈에 진짜 도움이 될까요?',
      body: '루테인은 황반(AMD)에 근거가 있는 편이고, 빌베리는 원료(표준화)가 핵심입니다. 안구건조는 점안약이 먼저입니다.',
    },
    showBody: false,
    comorbidityKeys: [], // 공통(당뇨=당뇨망막병증·고혈압)만으로 충분
    outcomeWord: '눈 건강',
    prevTreatments: [
      { key: 'artificial_tears', label: '인공눈물 (히알루론산 점안)', shortLabel: '인공눈물', smdAbs: 0.4, note: '안구건조 1차', emoji: '💧' },
      { key: 'rx_eyedrops', label: '처방 안약 (사이클로스포린·디쿠아포솔 등)', shortLabel: '처방 안약', smdAbs: 0.35, note: '중등도 안구건조', emoji: '💊' },
      { key: 'lutein', label: '루테인·지아잔틴 영양제', shortLabel: '루테인', smdAbs: 0.35, note: '황반·AMD 근거', emoji: '🌽' },
      { key: 'omega3_eye', label: '오메가-3 (안구건조)', shortLabel: '오메가-3', smdAbs: 0.18, note: 'DREAM 시험 음성·논란', emoji: '🐟' },
      { key: 'bilberry', label: '빌베리/안토시아닌 영양제', shortLabel: '빌베리', smdAbs: 0.2, note: '원료(표준화)가 핵심·근거 약함', emoji: '🫐' },
      { key: 'astaxanthin_eye', label: '아스타잔틴 (눈 피로)', shortLabel: '아스타잔틴', smdAbs: 0.25, note: '눈 조절력 소규모', emoji: '🦐' },
      { key: 'eye_rest', label: '눈 휴식·온찜질·인공눈물 외 생활관리', shortLabel: '생활관리', smdAbs: null, emoji: '🧘' },
    ],
  },

  liver_health: {
    intro: {
      headline: '밀크씨슬·헛개, 간에 진짜 도움이 될까요?',
      body: '간 영양제 상당수는 근거가 약합니다. NASH(지방간염)엔 신약·비타민E가, 숙취/헛개는 근거가 제한적입니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '간 수치',
    prevTreatments: [
      { key: 'milk_thistle', label: '밀크씨슬(실리마린)', shortLabel: '밀크씨슬', smdAbs: 0.25, note: 'ALT 소폭·조직 근거 제한', emoji: '🌿' },
      { key: 'hovenia', label: '헛개나무(숙취/간)', shortLabel: '헛개', smdAbs: 0.15, note: '인체 근거 약함', emoji: '🍵' },
      { key: 'vite_liver', label: '비타민 E', shortLabel: '비타민E', smdAbs: 0.3, note: '비당뇨 NASH 조직 개선', emoji: '💊' },
      { key: 'omega3_liver', label: '오메가-3', shortLabel: '오메가-3', smdAbs: 0.25, note: '간지방 소폭', emoji: '🐟' },
      { key: 'curcumin_liver', label: '커큐민', shortLabel: '커큐민', smdAbs: 0.3, note: '지방간 개선', emoji: '🍃' },
      { key: 'abstain', label: '금주·체중감량', shortLabel: '금주·체중', smdAbs: null, emoji: '🚭' },
    ],
  },

  menopause: {
    intro: {
      headline: '안면홍조, 호르몬약 말고 방법이 있을까요?',
      body: '호르몬요법이 가장 효과적이고, 비호르몬약(페졸리네탄트·SSRI)도 있습니다. 영양제는 효과가 제한적이며, 백수오는 원료 진위 주의.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '갱년기 증상',
    prevTreatments: [
      { key: 'hrt', label: '호르몬요법(HRT)', shortLabel: '호르몬요법', smdAbs: 0.6, note: '가장 효과적·위험 고려', emoji: '💊' },
      { key: 'isoflavone', label: '이소플라본(대두/레드클로버)', shortLabel: '이소플라본', smdAbs: 0.25, note: '소폭·일관성 낮음', emoji: '🌱' },
      { key: 'baeksuo', label: '백수오', shortLabel: '백수오', smdAbs: 0.2, note: '원료 진위 주의(가짜 사태)', emoji: '🌿' },
      { key: 'black_cohosh', label: '블랙코호시', shortLabel: '블랙코호시', smdAbs: 0.2, note: '근거 혼재', emoji: '🌼' },
      { key: 'epo_meno', label: '감마리놀렌산(달맞이꽃)', shortLabel: '달맞이꽃', smdAbs: 0.15, note: '근거 약함', emoji: '🌸' },
    ],
  },

  constipation: {
    intro: {
      headline: '변비, 뭐가 제일 효과적일까요?',
      body: '차전자피·마그네슘은 근거가 있는 편이고, 유산균은 균주에 따라 다릅니다. 심하면 하제·처방약이 효과적입니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '배변',
    prevTreatments: [
      { key: 'peg', label: '폴리에틸렌글리콜(마크롤 등)', shortLabel: 'PEG 하제', smdAbs: 0.5, note: '표준·강함', emoji: '💊' },
      { key: 'psyllium_con', label: '차전자피', shortLabel: '차전자피', smdAbs: 0.3, note: '가용성 섬유', emoji: '🌾' },
      { key: 'mag_con', label: '산화마그네슘', shortLabel: '마그네슘', smdAbs: 0.3, note: '삼투성', emoji: '🍃' },
      { key: 'prune_kiwi', label: '프룬·키위', shortLabel: '프룬·키위', smdAbs: 0.3, note: '식품, 배변 개선', emoji: '🥝' },
      { key: 'probiotic_con', label: '유산균(변비)', shortLabel: '유산균', smdAbs: 0.25, note: '균주특이', emoji: '🦠' },
      { key: 'stimulant_lax', label: '자극성 하제(센나·비사코딜)', shortLabel: '자극성 하제', smdAbs: 0.35, note: '단기 효과적', emoji: '💊' },
    ],
  },

  diarrhea: {
    intro: {
      headline: '설사, 유산균이 도움이 될까요?',
      body: '지사제(로페라마이드)가 빠르고, 유산균·아연은 기간을 줄여줍니다(특히 소아·항생제 설사). 탈수 보충이 우선.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '설사',
    prevTreatments: [
      { key: 'loperamide', label: '로페라마이드(지사제)', shortLabel: '로페라마이드', smdAbs: 0.45, note: '빠름·감염성엔 주의', emoji: '💊' },
      { key: 'sboulardii', label: '사카로마이세스 불라디/유산균', shortLabel: '유산균', smdAbs: 0.3, note: '기간 단축', emoji: '🦠' },
      { key: 'zinc_dia', label: '아연(소아)', shortLabel: '아연', smdAbs: 0.35, note: '소아 급성설사(WHO)', emoji: '🪨' },
      { key: 'smectite', label: '스멕타이트(흡착제)', shortLabel: '스멕타', smdAbs: 0.3, note: '소아 기간 단축', emoji: '💊' },
      { key: 'ors', label: '경구수분보충(ORS)', shortLabel: 'ORS', smdAbs: null, note: '탈수 보충 우선', emoji: '🧂' },
    ],
  },

  gut_health: {
    intro: {
      headline: '유산균, 장 건강에 진짜 통할까요?',
      body: '과민성대장(IBS)엔 페퍼민트오일·가용성 섬유가 근거 있는 편이고, 유산균은 균주에 따라 효과가 갈립니다.',
    },
    showBody: false,
    comorbidityKeys: [],
    outcomeWord: '장 증상',
    prevTreatments: [
      { key: 'peppermint', label: '페퍼민트 오일(IBS)', shortLabel: '페퍼민트오일', smdAbs: 0.35, note: 'IBS 복통 개선', emoji: '🌿' },
      { key: 'probiotic_gut', label: '유산균(프로바이오틱스)', shortLabel: '유산균', smdAbs: 0.3, note: '균주특이', emoji: '🦠' },
      { key: 'soluble_fiber', label: '가용성 식이섬유(차전자)', shortLabel: '가용성 섬유', smdAbs: 0.25, note: '불용성은 악화 가능', emoji: '🌾' },
      { key: 'prebiotic', label: '프리바이오틱스(이눌린/FOS)', shortLabel: '프리바이오틱스', smdAbs: 0.2, note: '소폭', emoji: '🧅' },
      { key: 'glutamine_gut', label: 'L-글루타민', shortLabel: '글루타민', smdAbs: 0.2, note: '장 점막·투과성', emoji: '💪' },
    ],
  },
};

const GENERIC: QuizConfig = {
  intro: {
    headline: '내게 맞는 약·영양제를 찾아보세요',
    body: '광고가 아닌 Cochrane 메타분석·임상시험 데이터(효과 크기)로 비교합니다.',
  },
  showBody: false,
  comorbidityKeys: [],
  outcomeWord: '증상',
  prevTreatments: [],
};

export function getQuizConfig(slug: string): QuizConfig {
  const c = CONFIGS[slug] ?? GENERIC;
  return {
    prevTitle: DEFAULT_PREV_TITLE,
    prevSubtitle: DEFAULT_PREV_SUBTITLE,
    ...c,
    comorbidityKeys: Array.from(new Set([...COMMON_COMORBIDITIES, ...c.comorbidityKeys])),
  };
}

export function findPrevTreatment(
  options: PreviousTreatmentOption[],
  key: string,
): PreviousTreatmentOption | undefined {
  return options.find((p) => p.key === key);
}

