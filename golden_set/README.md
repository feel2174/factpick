# FactPick Golden Set (검증 정답지)

> 사람(약사 영선) + AI가 **Cochrane 원문 forest plot에서 직접 추출·검증한** 관절통 데이터.
> 신규 자동 추출 파이프라인의 정확도를 대조하는 **정답지(ground truth)**로 사용.
> 조사 방법론은 상위 폴더 `../RESEARCH_SOP.md` 참조.

---

## 구성

```
golden_set/
├── README.md                      # 이 파일
├── verified_osteoarthritis.json   # 검증된 관절통 SMD 정답 41개
└── references/
    ├── CD002946*.pdf              # Cochrane 글루코사민 (Towheed 2009)
    ├── CD005614*.pdf              # Cochrane 콘드로이친 (Singh 2015)
    ├── CD005328*.pdf              # Cochrane 관절강내 스테로이드 (Jüni 2015)
    ├── CD004257*.pdf              # Cochrane 아세트아미노펜 (Towheed 2006)
    ├── CD002947*.pdf              # Cochrane 약초/조인스 (Cameron 2014)
    ├── glucosamine_forest.txt     # 위 PDF에서 추출한 forest plot 텍스트
    ├── chondroitin_forest.txt
    ├── steroid_forest.txt
    ├── acetaminophen_forest.txt
    ├── herbal_joins_forest.txt
    ├── Safety_and_Efficacy_of_Turmeri*.pdf  # 강황 (Doyle 2023 — ⚠️ 저자 펀딩 편향)
    ├── doyle2023_turmeric_meta.txt
    ├── s10787*.pdf / madhu2013_turmacin_rct.txt  # Turmacin 단일 RCT
    └── turmacin_lecture*.pdf/.txt # ⚠️ 회사 강의자료 (결론 신뢰 X)
```

---

## `verified_osteoarthritis.json` 사용법

각 항목 구조:
```jsonc
{
  "substance_id": "glucosamine_rotta",
  "name_ko": "글루코사민 Rotta/Dona®",
  "smd": -1.11,                  // 정답 SMD (forest plot 직접 추출)
  "ci_lower": -1.66,
  "ci_upper": -0.57,
  "smd_source": "direct",        // direct=forest plot 직접 / NNT_converted 등
  "is_estimated": false,
  "studies_count": 8,
  "patients_count": 940,
  "evidence_grade": "low",
  "funding_bias": true,          // 펀딩 편향 여부
  "source_code": "CD002946",
  "warnings": ["핵심 3개 trial 미출판 Rottapharm 자체보고서 — 출판 편향"]
}
```

## 검증 절차 (신규 파이프라인 평가)

1. 신규 파이프라인으로 동일 성분의 관절통 SMD를 추출.
2. 이 정답지와 대조:
   - **SMD 차이 ≤ 0.1** → 통과 ✅
   - **0.1 초과** → 재검수 ⚠️ (대개 초록만 보고 추출했거나 다른 outcome을 잡은 경우)
   - **정답엔 있는데 신규에선 누락** → 풀텍스트 미확보 가능성
   - **정답은 `grade: I/없음`인데 신규엔 수치 있음** → ⚠️ **할루시네이션 의심**
3. `funding_bias: true` 항목을 신규 파이프라인이 잡아내는지 확인 (이해상충 탐지 능력 검증).

## 핵심 대조 포인트 (이것부터 맞춰라)

| 성분 | 정답 SMD | 함정 |
|---|---|---|
| 글루코사민 Rotta | **-1.11** | 효과 크지만 펀딩 편향 (출판 편향) → grade low |
| 글루코사민 Non-Rotta | **-0.05** | 위약 수준. Rotta와 22배 차이 — 묶으면 안 됨 |
| 콘드로이친 일반등급 | **-0.08** | 위약 수준 |
| MSM | **0.0** | 통계 비유의 |
| 관절강내 스테로이드 (6개월) | **-0.07** | 1-2주(-0.48)→6개월 효과 소멸 (시점별 분리 필수) |
| 강황 강화제형 | **-0.82** | Meriva/Theracurmin 등 *흡수강화 제형만*. 일반 분말 ≠ |
| 디클로페낙 패치 | **-0.81** | 외용 최강. NNT→SMD 환산 (Zeng 2018) |

> 같은 "글루코사민"이라도 원료(Rotta/Non-Rotta), 같은 스테로이드라도 시점(1주/6개월)에 따라 SMD가 완전히 다르다. **성분명만으로 묶으면 틀린다.**
