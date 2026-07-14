# FactPick — 한국형 Examine 프로젝트 컨텍스트

> Claude Code/Desktop이 이 프로젝트 작업을 이어갈 때 먼저 이 문서를 읽어주세요.

## 한 줄 요약

**약사 영선이 직접 쓰려고 만드는, 한국형 Examine.com**  
영양제 + 약을 같은 축에서 효과/근거 비교하는 사이트  
6/1일 베타 론칭 목표

## 영선 (사용자) 소개

- 직업: 약사, 약국 운영 (주 3일)
- 자녀 5명, 짬짬이 작업 가능
- YouTube 채널: 시시약사 / 西西药师
- 코딩 비전공자 — Claude에게 작업 위임이 핵심 운영 방식
- 약사 직감으로 알고리즘 버그 여러 번 정확히 발견함 (검수 가치 큼)

## 핵심 비전

영선의 진짜 동기: **"나중에 내가 그 병 걸렸을 때, 진짜 뭘 먹을지 알고 싶다"**

차별화 포인트:
1. **약 vs 영양제 동시 비교** — 다른 사이트엔 없음
2. **"데이터 부족 ≠ 효과 없음"** 분별 (I 등급)
3. **약사 직접 검수** (마지막 라인 방어)
4. **한국 + 외국 영양제 모두** (직구 관심자용)

## 인프라

### Mac Mini M4 Pro 환경
- macOS, Node 설치됨, Python venv 사용
- 작업 위치: `~/Documents/Claude/Projects/factpick/`
- 24/7 서버처럼 운영 (잠자기 비활성화)

### 폴더 구조
```
~/Documents/Claude/Projects/factpick/
├── scripts/              # Python 자동화
│   ├── venv/             # Python 가상환경
│   ├── pubmed_collector.py
│   ├── build_extraction_queue.py
│   ├── claude_extractor.py
│   ├── calculate_grades.py
│   ├── diagnose.py
│   └── .env              # SUPABASE_URL, SUPABASE_SERVICE_KEY
├── nextjs/               # Next.js 14 프론트엔드
│   ├── app/              # App Router
│   ├── components/       # ScatterChart, GradeBadge, ConditionCard
│   ├── lib/              # supabase.ts, types.ts
│   └── .env.local        # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY
├── CONTEXT.md            # 이 파일
└── VARIANT_PLAN.md       # 원료사/제형별 분류 작업 계획
```

### Supabase
- Project ID: `futeytcxkotijzlnhqfj`
- Region: ap-southeast-1 (Singapore)
- Free 플랜
- Key 형식: `sb_secret_...` (신형, BYPASSRLS 자동)

## 데이터베이스 스키마 (12개 테이블)

### 메인 테이블
- **substances** — 영양제/약 성분 (29+ 개, slug 기준)
- **conditions** — 적응증 (10개: 골관절염, 불면증, 고혈압, 이상지질혈증, 인지기능 저하, 경증 우울, 불안 증상, 피부 노화, 면역력 저하, 편두통 예방)
- **populations** — 인구집단 (9개: healthy_adult 디폴트, elderly, pregnant, diabetic 등)
- **studies** — PubMed 논문 (약 10,000편 고유, 12,484개 매핑)
- **study_extractions** — 성분×적응증×논문 매핑 + PICO 추출
- **evidence_cells** — 성분×적응증×인구집단 등급 (158개 셀)

### 메타 테이블
- **substance_profiles** — 성분 상세 (한국 시장 정보 등)
- **korean_regulatory** — 식약처 정보
- **evidence_studies** — 셀-논문 연결 (캐싱용)
- **evidence_revisions** — 등급 변경 이력
- **pharmacist_notes** — 약사 코멘트
- **population_warning_rules** — 인구집단 경고 규칙 (12개)

## 알고리즘 — 등급 산출

### Tier 게이트 (PubMed 수집)
- 메타분석: 무제한
- RCT: 셀당 최대 100편
- 관찰연구: 셀당 최대 30편

### 옵션 A3 (PICO 추출 큐)
- 셀당 메타분석/SR 상위 3편 (인용수 기준)
- ~500편 처리 (Claude Opus 4.7로 PICO 추출)

### 등급 (A~F + I)
```
A: 강력 추천 (메타 다수 + 효과 명확)
B: 추천 (RCT 다수 + 일관성)
C: 가능성 있음 (RCT 일부, 효과 작거나 일관성 부족)
D: 근거 부족 (관찰연구 수준)
F: 효과 없음 (메타/RCT 5편+ 일관성<0.3 + negative 1편+)
I: 데이터 부족 (영선이 신설, 정직한 답)
```

추가 안전장치:
- 유효 추출 < 2개 → I
- 메타+RCT < 3편이면 최대 C
- relevance < 0.3 자동 필터 (is_valid=FALSE)

## 현재 진행 상황 (2026-05-25)

### 데이터
- PubMed 수집: 9,980편 고유 논문
- 성분 29개 (영양제 23 + 약 등 6)
- PICO 추출: 약 226 + 추가 진행 중
- 등급 산출: 158개 셀 (A:15, B:11, C:29, D:23, I:80)

### 마지막 작업
- 9개 새 성분 추가: SAM-e, 히알루론산(경구), ASU, AKBA, 녹색입홍합, UC-II 콜라겐, CMO, 상어연골, 칼슘
- 148개 추출 작업 완료
- 등급 산출 후 발견: **셀레늄 × 불면증 (건강한 성인) 여전히 A등급 - 가짜 의심**

### 다음 할 일
1. 셀레늄 × 불면증 A등급 원인 진단 (논문 확인)
2. 잇몸 (치은염/치주염) 적응증 추가
3. 인지/뇌 적응증 추가
4. 인지용 영양제 6-8개 추가 (은행잎, 포스파티딜세린, 바코파, 사프란, 후페르진 A, 아세틸-L-카르니틴)
5. 약 데이터 추가 (영선이 골관절염/잇몸/인지 약 선별)
6. 프론트엔드 본격 작업

## 발견된 알고리즘 버그들 (해결됨)

영선이 약사 직감으로 발견:

### 버그 1: 가짜 A등급 (셀레늄/비타민D × 불면증)
- 원인: relevance < 0.3 추출이 is_valid=TRUE인 상태로 등급 산출에 포함
- 해결: SQL UPDATE로 일괄 is_valid=FALSE 처리
- 코드 보강: claude_extractor.py에서 relevance < 0.3 자동 필터

### 버그 2: study_type 잘못 분류
- "pilot study", "safety analysis"가 RCT로 분류
- 해결: SQL UPDATE로 observational로 정정

### 버그 3: 셀당 적은 논문 수로 A등급
- 셀레늄 × 불면증 메타 2편으로 A
- 해결: 알고리즘 보강 — 메타+RCT < 3편이면 최대 C, I 등급 신설

### 버그 4: 고아 셀 (유효 추출 0개)
- 해결: 자동 정리 로직 추가 — calculate_grades.py에 통합

## 베타 (6/1) 범위

### 적응증 3개
1. **골관절염** (깊게) — 영양제 + 약 통합 산점도
2. **잇몸 (치은염/치주염)** — 영양제 중심 + 약국 OTC
3. **인지/뇌** — 영양제 + 약

### 핵심 시각화 (산점도)
- X축: 근거 (얼마나 믿을만한가)
- Y축: 효능 (얼마나 효과 있나)
- ●: 약 / ◯: 영양제
- 우상단 = 최강 옵션

### UI 구조
```
메인 페이지: 적응증 카드 3개 (다른 7개는 "Coming Soon")
적응증 상세: 산점도 + 표 (영양제+약 통합)
성분 상세: 레이더 차트 + 타임라인 + 약사 코멘트
```

### 디자인
- 팩트픽 v3 스타일: 검정 배경 (#0f172a), 미니멀
- 한국어 폰트: Pretendard
- 신호등 색: A 초록 / B 연두 / C 노랑 / D 주황 / F 빨강 / I 회색

### 수익화 방향성 (베타에는 X, 구조만)
- 쿠팡 파트너스 / 아이허브 affiliate
- substances 테이블에 `purchase_links` JSONB 컬럼 미리 준비
- 베타 후 3개월에 활성화 결정

### 도메인 (미정)
- factpick.co.kr / factpick.kr / factpick.ai 중

## 시각화 — 영선 핵심 비전

### 골관절염 페이지 산점도 예시
```
효능 (Y) ↑
        │  ● 세레콕시브       ● 메토트렉세이트
        │
        │      ◯ 커큐민
        │              ● 멜록시캄
        │  ◯ 보스웰리아
        │
        │              ◯ 글루코사민
        │      ◯ MSM
        │
        └────────────────────→ 근거 (X)

● = 약, ◯ = 영양제
```

### 인구집단 필터
- 디폴트: healthy_adult
- 칩 클릭으로 elderly, pregnant, diabetic 등으로 변경
- 인구집단마다 등급 다르게 표시 가능

## 운영 원칙

1. **영선이 병목이 되면 안 됨** — Claude에게 위임
2. **데이터 보강은 매일 5-10분 짬짬이** — "벽돌 미리 만들기"
3. **약사 검수가 신뢰도의 마지막 라인** — 시간 들여서
4. **신뢰도 우선, 수익화 나중**

## Claude Code 작업 시 주의사항

### 절대 금지
- `~/.openclaw/workspace/` 폴더 사용 금지 (이전에 한 번 사고)
- 영선의 `.env` 파일 내용 화면에 출력 금지
- evidence_cells UPDATE 시 RLS 트리거 충돌 주의 (BYPASSRLS 키 사용 중)
- sudo 사용 금지

### 권장
- 데이터 변경 작업 전 미리 SELECT로 영향 범위 확인
- 진단 시 단계별 확인 (DB 권한 → 코드 로직 → 트리거 순)
- 영선에게 결과 보고 시 캡처 X, 직접 분석해서 결론만

### MCP 도구 사용
Supabase MCP 연결되어 있으면:
- `mcp__supabase__execute_sql` 사용해서 직접 쿼리
- `mcp__supabase__list_tables` 로 스키마 확인
- read-only 모드일 경우 SELECT만 가능 (Python 스크립트로 INSERT/UPDATE)

## 주요 파일 라인 참조

### scripts/calculate_grades.py
- 등급 산출 알고리즘 함수: `calculate_grade` (line ~220)
- 고아 셀 정리 로직: main 함수 끝 (line ~410)
- DB upsert: `upsert_evidence_cell` (line ~280)

### scripts/claude_extractor.py
- PICO 추출 프롬프트: `PICO_PROMPT` 상수
- Claude CLI 호출: `call_claude` (line ~150)
- relevance < 0.3 필터: `save_extraction` (line ~310)

### scripts/build_extraction_queue.py
- 큐 빌더 메인: `ALLOWED_STUDY_TYPES = ["meta_analysis", "systematic_review"]`
- 셀당 N편 선정: `TOP_PER_CELL_DEFAULT = 3`

## 이전 대화 핵심 결정

(2026-05-23 ~ 2026-05-25 새벽까지 진행)

- Anthropic Max 20x 플랜 사용 (Claude Code, Opus 4.7)
- API 비용 0원 전략 (Claude CLI subprocess 호출)
- 6/1 베타 일정 (1주일)
- 약 데이터 포함 결정 (영선 비전 핵심)
- 도메인 결정 보류 (factpick.kr 후보)

## 컨택트

- 작업하다 막히면: 영선에게 "이 부분 약사 직감으로 확인 필요" 요청
- 학술 데이터 의문: 메타분석/RCT 우선
- 한국 시장 정보: 영선의 약사 경험 활용
