# FactPick Scripts

Mac Mini M4 Pro에서 돌릴 데이터 수집 스크립트.

## 1. 설치

```bash
cd ~/factpick/scripts

# Python 가상환경 (권장)
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
nano .env  # SUPABASE_URL, SUPABASE_SERVICE_KEY 입력
```

## 2. Supabase 키 받기

Supabase Dashboard → Project Settings → API → service_role key 복사.
⚠️ service_role 키는 RLS 우회하므로 절대 클라이언트에 노출 금지.

## 3. NCBI API 키 (선택)

[NCBI 계정 만들기](https://www.ncbi.nlm.nih.gov/account/) → Settings → API Key 발급.
없어도 동작하지만 속도 3배 느림 (3 req/s vs 10 req/s).

## 4. JCR 데이터 (선택)

와이프 ID로:
1. [Web of Science](https://www.webofscience.com) 로그인
2. Journal Citation Reports 접속
3. 모든 저널 리스트 CSV 다운로드
4. `data/jcr_2024.csv`에 저장
5. `.env`의 `JCR_CSV_PATH` 지정

없어도 동작함 (IF 필터만 비활성화).

## 5. 실행

### 처음 (드라이런)

```bash
# DB에 저장 안 하고 동작만 확인 (MSM 1개 성분만)
python pubmed_collector.py --initial --substance msm --dry-run
```

콘솔에 로그 잘 찍히는지 확인.

### 초기 시드 수집

```bash
# 모든 성분 × 모든 적응증 (예상 1~3시간)
python pubmed_collector.py --initial 2>&1 | tee logs/initial_$(date +%Y%m%d).log
```

성분 20개 × 적응증 10개 = 200 조합. 조합당 평균 3~10초 소요.
PubMed API 키 있으면 ~1시간, 없으면 ~3시간.

### 일일 증분 (cron 등록)

```bash
# 수동 테스트
python pubmed_collector.py --daily

# cron 등록 (매일 새벽 3시)
crontab -e
# 추가:
# 0 3 * * * cd ~/factpick/scripts && source venv/bin/activate && python pubmed_collector.py --daily >> logs/cron.log 2>&1
```

## 6. 결과 확인

Supabase SQL Editor:

```sql
-- 수집된 논문 개수
SELECT COUNT(*) FROM studies;

-- 연구 디자인별 분포
SELECT study_type, COUNT(*) 
FROM studies 
GROUP BY study_type 
ORDER BY 2 DESC;

-- 성분별 수집 현황
SELECT s.name_ko, COUNT(DISTINCT se.study_id) AS papers
FROM study_extractions se
JOIN substances s ON s.id = se.substance_id
GROUP BY s.name_ko
ORDER BY 2 DESC;

-- AI 추출 대기 중인 논문 (다음 단계 입력)
SELECT COUNT(*) FROM study_extractions WHERE extracted_at IS NULL;
```

## 7. 트러블슈팅

### "Too Many Requests" 에러
PubMed rate limit. API 키 발급 권장. 코드 안에서 자동 재시도 3회 있음.

### 메타데이터 누락
일부 오래된 논문은 abstract/year 없을 수 있음. 정상.

### XML 파싱 에러
간헐적으로 발생. 로그에 `article 파싱 실패`로 찍히고 그 논문만 건너뜀.

### 표본 크기가 안 잡힘
abstract에서 "N=숫자" 정규식 매칭. 못 찾으면 NULL 저장 → AI 추출 단계(다음 스크립트)에서 보강.

## 8. 다음 단계

수집 끝나면 `claude_cli_extractor.py` (다음 작업)로 abstract → PICO 추출.
이 단계가 Claude CLI 활용해서 비용 0원으로 처리.
