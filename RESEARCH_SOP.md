# FactPick 임상근거 데이터 조사 방법론 (SOP)

> 이 문서는 영양제/약물의 효능을 **SMD(표준화 평균차) 기반**으로 조사·정리하는 표준 절차다.
> 목적: 산점도(X=근거 신뢰도, Y=효능) + 근거 등급 데이터 생성.
> 대상: 이 작업을 수행하는 모든 에이전트.

---

## 0. 핵심 원칙 (TL;DR — 가장 중요)

1. **SMD는 "초록(abstract)"이 아니라 "메타분석/Cochrane 풀텍스트의 forest plot"에 있다.**
   PubMed 초록만 모으면 정량 수치(SMD/CI)가 없어서 추출이 불가능하거나 *지어내게* 된다.
2. **출처 신뢰도 순서: 메타분석/Cochrane > 개별 RCT > 관찰연구 > 회사 자료.**
3. **수치를 못 찾으면 비워두고 `데이터 부족`으로 표시한다. 절대 추정/창작하지 않는다.**
4. **모든 수치엔 출처 + 추출 방법 꼬리표를 남긴다** (`source` + `smd_source`).
5. **이해상충(저자 펀딩/원료사 직원)을 항상 같이 본다.** 펀딩 편향이면 데이터 목록만 쓰고 결론은 버린다.

---

## 1. 출처 우선순위 (위에서부터 채택)

| 등급 | 출처 | 비고 |
|---|---|---|
| 1순위 | **Cochrane Systematic Review** | forest plot + GRADE + RoB 포함. 풀텍스트 필수 |
| 2순위 | **메타분석 / 체계적 고찰** (PubMed/PMC) | SMD pooled 직접 추출 |
| 3순위 | **임상 가이드라인** (NICE / ACR / KOA 등) | 권고 등급 |
| 4순위 | **개별 RCT** (무작위 대조시험) | 단일 trial은 근거 약함 표시 |
| 5순위 | **한국 식약처 / 약학정보원** | 한국 적응증·시판 정보 |
| 참고만 | **회사 자료 / 원료사 발간물** | ⚠️ 결론 신뢰 X, 데이터 목록만 |

**금지:** 블로그·쇼핑몰·마케팅 페이지·언론 기사를 1차 출처로 쓰지 말 것.

---

## 2. 절차 (단계별)

### Step 1. 후보 논문 검색 (스크리닝)
- PubMed E-utilities로 **검색만** 수행. 검색어 예:
  `"<성분> <적응증> meta-analysis SMD standardized mean difference Cochrane"`
- 우선 채택: **메타분석 / Cochrane / systematic review** 타입.
- 초록은 *후보 선별용*으로만 사용. SMD 추출용 아님.

### Step 2. 풀텍스트 확보 (핵심)
- 초록만 있으면 SMD 못 뽑는다. 풀텍스트를 확보한다:
  - **Cochrane Library** (기관/학교 DB 접근 — 영선이 PDF 공급 가능)
  - **PMC Open Access** (E-utilities `efetch` full-text XML)
  - **Unpaywall API** (DOI → OA 풀텍스트 링크)
- 풀텍스트 못 구하면 → 그 항목은 **`grade: I (데이터 부족)`** + `풀텍스트 필요` 플래그. **추정 금지.**

### Step 3. forest plot / 결과표에서 수치 추출
- PDF는 `pdftotext -layout`로 텍스트화 (poppler).
- forest plot / 결과 표에서 직접 읽는다:
  - **SMD (pooled effect)**
  - **95% CI (하한, 상한)**
  - **연구 수 (k)**, **총 표본 수 (N)**
  - **I² (이질성)**, **p-value**
- 추출 출처 꼬리표: `smd_source: "direct"`.

### Step 4. SMD 없으면 환산 (방법 명시) — §4 참조

### Step 5. 이해상충 체크 — §5 참조

### Step 6. 근거 등급 부여 — §6 참조

### Step 7. 한국 제품 매핑
- 식약처/약학정보원 → 시판명·제조사·일반/전문/건기식 구분.
- 직구(iHerb 등) 인기 제품 별도.

---

## 3. SMD 추출 규칙

- **부호 통일:** "개선 = 음수(-)"로 통일하거나, 적응증별 방향을 명시 (`effect_direction`).
  - 예: 통증 감소(좋음)는 SMD 음수. 골밀도 증가(좋음)는 양수일 수 있음 → 방향 라벨 필수.
- **효과 크기 해석 (절댓값 기준, Cohen):**
  - |SMD| ≥ 0.8 → 큼(강함) / 0.5~0.8 → 중간 / 0.2~0.5 → 약함 / < 0.2 → 미미(위약 수준)
- **pooled 우선:** 하위그룹/단일 trial보다 메타분석 pooled SMD를 메인으로.

---

## 4. 효과크기 환산 규칙 (SMD가 원문에 없을 때)

원문에 SMD가 없을 때만 환산하고, **반드시 방법 꼬리표를 남긴다.**

| 상황 | 방법 | `smd_source` |
|---|---|---|
| NNT만 있음 | NNT → Cohen's d 환산 (Furukawa 변환 등) | `NNT_converted` |
| MD(평균차) + SD 있음 | SMD = MD / pooled SD | `MD_converted` |
| 활성 대조군 비열등만 | "비열등" 명시 + 대조군 SMD 참조 | `active_comparator_equivalence` |
| 단일 RCT만 | 그 trial 효과크기로 추정 (근거 약함 표시) | `single_RCT_estimated` |
| 2차 인용(강의/리뷰가 인용) | 원본 미확보 표시 | `secondary_citation` ⚠️ |
| SMD/환산 모두 불가 | 비워둠 + 별도 지표만 기록 | `alternative_metric_only` |

> 환산은 *마지막 수단*. 환산값엔 `is_estimated: true` 플래그.

---

## 5. 이해상충(Conflict of Interest) 체크 — 필수

모든 논문에서 **저자 소속·펀딩**을 확인한다.

- 원료사/제조사 펀딩 또는 **저자가 회사 직원** → `funding_bias: true`.
- 이 경우 **데이터(숫자)는 참고하되 저자의 결론·해석은 채택하지 않는다.**
- 핵심 trial이 **미출판 자체 기술보고서**면 출판 편향 경고.
- 예시(실제 사례):
  - 글루코사민 Rotta: 핵심 3개 trial = 미출판 Rottapharm 자체보고서 → 출판 편향 플래그.
  - 강황 Doyle 2023 메타분석: 저자 전원 Nutriventia 직원 → 데이터 목록만, 결론 버림.

---

## 6. 근거 등급 기준

내부 등급(A~I) 또는 high/moderate/low. 산점도 X축(근거 신뢰도)에 매핑.

| 등급 | 기준 |
|---|---|
| **A (강력)** | Cochrane/대규모 메타분석 + 직접 SMD + 일관성 높음(I² 낮음) + 편향 없음 |
| **B (추천)** | 메타분석 있으나 이질성 크거나 표본 중간 |
| **C (가능성)** | 소규모 메타분석 / 환산값 / 일관성 부족 |
| **D (근거 부족)** | 단일 RCT, 작은 표본, 펀딩 편향 |
| **F (효과 없음)** | 근거는 탄탄한데 위약과 차이 없음 (예: 일반 글루코사민, MSM) |
| **I (데이터 부족)** | 풀텍스트/정량 수치 확보 실패 — **추정 금지, 보류** |

> "효과 없음(F)"과 "데이터 부족(I)"은 다르다. F는 *근거 있고 효과 없음*, I는 *근거 자체 부족*.

---

## 7. 안티-할루시네이션 규칙 (절대 규칙)

1. **수치를 못 찾으면 비운다.** 그럴듯한 SMD를 만들어내지 않는다.
2. 초록에 "유의하게 개선(significant)"만 있고 수치가 없으면 → **수치는 null, `grade: I`, `풀텍스트 필요` 플래그.**
3. 모든 SMD/CI/N은 **출처 문서의 어느 부분에서 왔는지** 추적 가능해야 한다.
4. 환산값은 **원시 지표 + 환산식**을 같이 기록한다.
5. 불확실하면 등급을 낮추거나 보류한다. **과장보다 보수가 낫다.**

---

## 8. 출력 데이터 스키마 (참고)

```jsonc
{
  "substance": "글루코사민 (Rotta/결정형)",
  "condition": "골관절염 통증",
  "smd": -1.11,                     // 음수 = 통증 개선
  "ci_lower": -1.66,
  "ci_upper": -0.57,
  "smd_source": "direct",           // §4 꼬리표
  "is_estimated": false,
  "study_count": 8,
  "sample_size": 940,
  "i_squared": null,
  "evidence_grade": "low",          // §6
  "funding_bias": true,             // §5
  "effect_direction": "통증 감소",
  "warnings": ["핵심 3개 trial 미출판 Rottapharm 자체보고서 — 출판 편향"],
  "source": {
    "type": "cochrane",
    "id": "CD002946",
    "doi": "10.1002/14651858.CD002946.pub2",
    "fulltext_obtained": true
  },
  "korea_products": [
    {"name": "오스테민캡슐", "manufacturer": "삼진제약", "type": "일반의약품"}
  ]
}
```

---

## 9. 검증 (Golden Set)

- 이미 사람이 검증한 관절통 데이터(아래)를 **정답지**로 두고, 새 파이프라인 결과를 대조한다:
  - Cochrane 원문 PDF 5개: CD002946, CD002947, CD004257, CD005328, CD005614
  - 추출된 forest plot 텍스트: glucosamine / chondroitin / steroid / acetaminophen / herbal_joins
- 신규 자동 추출 SMD가 golden set과 **±0.1 이내**면 통과, 벗어나면 재검수.

---

## 한 줄 요약

> **SMD는 forest plot(풀텍스트)에 있다. 초록만 긁으면 못 뽑는다. 못 뽑으면 비우고 `데이터 부족`으로 둔다 — 절대 지어내지 않는다.**
