# FactPick (팩트픽) 데이터베이스

한국형 Examine.com — 약사 검수 기반 의약품/영양제 증거 등급화 시스템

## 실행 순서

Supabase Dashboard > SQL Editor에서 순서대로 실행:

1. `01_schema.sql` — 테이블, 인덱스, 트리거, RLS 정책
2. `02_seed_data.sql` — 인구집단 9개, 질환 10개, 성분 20개, 경고 룰 12개
3. `03_helper_functions.sql` — RPC 함수 (프론트엔드용)

또는 psql:
```bash
psql $SUPABASE_DB_URL -f 01_schema.sql
psql $SUPABASE_DB_URL -f 02_seed_data.sql
psql $SUPABASE_DB_URL -f 03_helper_functions.sql
```

## 핵심 데이터 흐름

```
PubMed/OpenAlex API
    ↓ (cron, 새벽 3시)
studies (raw 메타데이터)
    ↓ (Claude API 배치)
study_extractions (PICO + 효과 크기 추출)
    ↓
evidence_studies ↔ evidence_cells (substance × condition × population)
    ↓ (calculate_evidence_grade 함수)
ai_grade, ai_efficacy_score, ai_evidence_score 자동 산출
    ↓ (영선님 검토)
reviewed_grade 확정 → is_published = TRUE
    ↓
condition_scatter_data (materialized view)
    ↓
프론트엔드 (Next.js)
```

## 인구집단 fallback 로직

- 디폴트: `healthy_adult`
- 사용자가 `diabetes` 클릭 → 당뇨 전용 데이터 있으면 그것, 없으면 healthy_adult fallback
- fallback인 경우 `is_fallback = TRUE`로 표시 → UI에서 점선 처리

`get_condition_scatter()` 함수가 이 로직을 자동 처리합니다.

## 자동 경고 시스템

`population_warning_rules` 테이블이 (인구집단 × 성분 카테고리) → 경고 메시지 매핑.

예: "임신부 + 허브" → 자동으로 "사용 전 상담" 경고 표시.
영선님이 룰만 관리하면 새 성분 추가 시에도 자동 적용됨.

## 주요 RPC 함수

### `get_condition_scatter(condition_slug, population_slug)`
산점도 + 표 한 번에. 프론트엔드 메인 페이지용.
```js
const { data } = await supabase.rpc('get_condition_scatter', {
  p_condition_slug: 'osteoarthritis',
  p_population_slug: 'healthy_adult'  // 또는 'diabetes' 등
});
```

### `get_substance_detail(substance_slug)`
성분 상세 페이지 (모든 적응증, 프로파일, 약사 코멘트).
```js
const { data } = await supabase.rpc('get_substance_detail', {
  p_substance_slug: 'msm'
});
```

### `get_substance_timeline(substance_slug, condition_slug)`
타임라인 차트 — 연도별 누적 증거.

### `get_pending_reviews(limit)`
영선님 검토 큐 — 등급 변경된 cell 우선.

### `calculate_evidence_grade(cell_id)`
AI 파이프라인이 호출. SMD/RCT 개수 기반으로 등급 자동 산출.

## 등급 산출 알고리즘

**evidence_score (0~5)**:
- 메타분석 1건 = +1.5 (최대 3)
- RCT 1건 = +0.3 (최대 1.5)
- 관찰연구 1건 = +0.1 (최대 0.5)
- 일관성(positive 비율) × 1
- I² > 75 시 -0.5

**efficacy_score (0~5)**: `|SMD_pooled| × 2.5` (5에서 cap)

**grade**:
- A: evidence ≥ 4 AND efficacy ≥ 3
- B: evidence ≥ 3 AND efficacy ≥ 2
- C: evidence ≥ 2 AND efficacy ≥ 1
- D: evidence ≥ 1
- F: consistency < 0.3 (효과 없음)

이 알고리즘은 `03_helper_functions.sql`의 `calculate_evidence_grade` 함수에 있고, 추후 영선님 피드백으로 조정 가능.

## 데이터 소스

- **PubMed E-utilities API** — 무료, 의학 논문 표준
- **OpenAlex API** — 무료, 무제한, FWCI 지표 제공
- **Semantic Scholar API** — 무료, AI 친화적
- **식약처 의약품안전나라** — 한국 허가 정보
- **JCR (수동)** — IF는 연 1회 와이프 ID로 다운로드 → 매핑 테이블

## 보안

- `studies`, `study_extractions`, `evidence_revisions` → 비공개 (service_role만)
- 그 외 마스터/공개 데이터 → 모두 읽기 가능
- 쓰기는 service_role API key가 있는 Mac Mini 서버에서만

## 확장성 고려

- 모든 텍스트 필드 `_ko` `_en` `_zh` 접미사 → 다국어 즉시 확장
- 모든 핵심 테이블에 `extra JSONB` → 마이그레이션 없이 새 필드 추가
- `slug` 기반 URL → SEO 친화, 다국어 라우팅 가능
