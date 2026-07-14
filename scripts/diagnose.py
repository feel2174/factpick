#!/usr/bin/env python3
"""
FactPick Diagnosis Script
==========================
calculate_grades.py가 evidence_cells를 업데이트 못 하는 원인을 단계별로 진단합니다.

다음을 확인:
  1. 환경변수 정상 로드
  2. Supabase 연결
  3. service_role 권한 (직접 INSERT/UPDATE)
  4. on_conflict upsert 동작
  5. 명시적 SELECT → INSERT/UPDATE 동작
  6. 트리거 동작
  7. 실제 calculate_grades.py와 동일한 로직 시뮬레이션

사용법:
  cd ~/Documents/Claude/Projects/factpick/scripts
  source venv/bin/activate
  python diagnose.py
"""

import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# .env 경로 직접 지정
ENV_PATH = Path.home() / "Documents" / "Claude" / "Projects" / "factpick" / "scripts" / ".env"
load_dotenv(ENV_PATH)

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_KEY")

print("=" * 70)
print("FactPick 진단 시작")
print("=" * 70)

# 1. 환경변수
print("\n[1] 환경변수 확인")
print(f"  URL 로드됨: {bool(url)}")
print(f"  KEY 로드됨: {bool(key)}")
print(f"  KEY 형식: {key[:15] if key else 'NONE'}...")
if not url or not key:
    print("  ❌ .env 못 읽음. 종료")
    sys.exit(1)
print(f"  ✓ 환경변수 OK")

# 2. Supabase 연결
print("\n[2] Supabase 연결")
try:
    client = create_client(url, key)
    print(f"  ✓ 클라이언트 생성 OK")
except Exception as e:
    print(f"  ❌ 클라이언트 생성 실패: {e}")
    sys.exit(1)

# 3. evidence_cells 조회 (이건 잘 됐던 거)
print("\n[3] evidence_cells 조회")
try:
    cells = client.table("evidence_cells").select("id, substance_id, condition_id, population_id, ai_grade, updated_at").limit(3).execute()
    print(f"  ✓ 조회 OK ({len(cells.data)}개 row)")
    if cells.data:
        sample = cells.data[0]
        print(f"  샘플 row id: {sample['id']}")
        print(f"  샘플 ai_grade: {sample.get('ai_grade')}")
        print(f"  샘플 updated_at: {sample.get('updated_at')}")
        SAMPLE_CELL = sample
    else:
        print("  ⚠️  evidence_cells 비어있음")
        SAMPLE_CELL = None
except Exception as e:
    print(f"  ❌ 조회 실패: {e}")
    sys.exit(1)

# 4. 단순 UPDATE (이건 잘 됐던 거)
print("\n[4] 단순 UPDATE 테스트")
if SAMPLE_CELL:
    try:
        test_marker = f"DIAG_{os.getpid()}"
        result = client.table("evidence_cells").update({
            "ai_summary_ko": test_marker
        }).eq("id", SAMPLE_CELL["id"]).execute()
        
        # 다시 가져와서 확인
        after = client.table("evidence_cells").select("id, ai_summary_ko, updated_at").eq("id", SAMPLE_CELL["id"]).execute()
        if after.data and after.data[0].get("ai_summary_ko") == test_marker:
            print(f"  ✓ UPDATE 성공")
            print(f"  before updated_at: {SAMPLE_CELL.get('updated_at')}")
            print(f"  after  updated_at: {after.data[0].get('updated_at')}")
        else:
            print(f"  ❌ UPDATE 무시됨")
            print(f"     예상: {test_marker}")
            print(f"     실제: {after.data[0].get('ai_summary_ko') if after.data else 'EMPTY'}")
    except Exception as e:
        print(f"  ❌ UPDATE 실패: {e}")

# 5. UPSERT 테스트 (on_conflict)
print("\n[5] UPSERT 테스트 (on_conflict)")
if SAMPLE_CELL:
    try:
        test_marker = f"UPSERT_TEST_{os.getpid()}"
        data = {
            "substance_id": SAMPLE_CELL["substance_id"],
            "condition_id": SAMPLE_CELL["condition_id"],
            "population_id": SAMPLE_CELL["population_id"],
            "ai_summary_ko": test_marker,
            "ai_grade": "C",  # 임시 등급
        }
        result = client.table("evidence_cells").upsert(
            data, on_conflict="substance_id,condition_id,population_id"
        ).execute()
        print(f"  upsert 응답: data={len(result.data) if result.data else 0}개 row")
        if result.data:
            print(f"  응답 sample: {result.data[0].get('id')} / {result.data[0].get('ai_summary_ko')}")
        
        # 실제 DB에 반영됐나
        after = client.table("evidence_cells").select("id, ai_summary_ko").eq("id", SAMPLE_CELL["id"]).execute()
        if after.data and after.data[0].get("ai_summary_ko") == test_marker:
            print(f"  ✓ UPSERT가 DB에 반영됨")
        else:
            print(f"  ❌ UPSERT가 DB에 반영 안 됨")
            print(f"     예상: {test_marker}")
            print(f"     실제: {after.data[0].get('ai_summary_ko') if after.data else 'EMPTY'}")
            print(f"  → upsert는 응답엔 보이는데 실제 저장 안 됨 (silent failure)")
    except Exception as e:
        print(f"  ❌ UPSERT 예외: {e}")

# 6. SELECT 후 UPDATE 패턴 (calculate_grades.py의 새 로직)
print("\n[6] SELECT 후 UPDATE 패턴 (calculate_grades.py 새 로직)")
if SAMPLE_CELL:
    try:
        test_marker = f"PATTERN_TEST_{os.getpid()}"
        # 1) 기존 row 있는지 확인
        existing = client.table("evidence_cells").select("id").eq(
            "substance_id", SAMPLE_CELL["substance_id"]
        ).eq("condition_id", SAMPLE_CELL["condition_id"]).eq("population_id", SAMPLE_CELL["population_id"]).execute()
        
        print(f"  SELECT 결과: {len(existing.data)}개 row 있음")
        
        if existing.data:
            cell_id = existing.data[0]["id"]
            print(f"  → UPDATE 시도 (id={cell_id})")
            result = client.table("evidence_cells").update({
                "ai_summary_ko": test_marker
            }).eq("id", cell_id).execute()
            print(f"  UPDATE 응답: data={len(result.data) if result.data else 0}개 row")
            
            # 실제 반영 확인
            after = client.table("evidence_cells").select("ai_summary_ko").eq("id", cell_id).execute()
            if after.data and after.data[0].get("ai_summary_ko") == test_marker:
                print(f"  ✓ 패턴 동작 OK")
            else:
                print(f"  ❌ 패턴 동작 실패")
                print(f"     실제 값: {after.data[0].get('ai_summary_ko') if after.data else 'EMPTY'}")
        else:
            print(f"  → INSERT 시도 (이상함, SAMPLE_CELL이 분명 있는데 SELECT가 못 찾음)")
    except Exception as e:
        print(f"  ❌ 패턴 예외: {e}")

# 7. study_extractions 조회 (extracted_at 필터링이 잘 되는지)
print("\n[7] fetch_all_extractions 시뮬레이션")
try:
    query = client.table("study_extractions").select(
        "id, study_id, substance_id, condition_id, population_id, "
        "effect_direction, is_valid, ai_confidence"
    ).not_.is_("extracted_at", "null").eq("is_valid", True)
    
    result = query.range(0, 10).execute()
    print(f"  조회 결과: {len(result.data)}개 row")
    if result.data:
        sample = result.data[0]
        print(f"  샘플: effect={sample.get('effect_direction')}, valid={sample.get('is_valid')}, conf={sample.get('ai_confidence')}")
except Exception as e:
    print(f"  ❌ 조회 실패: {e}")

# 8. 트리거 확인
print("\n[8] 트리거 상태 확인 (직접 PostgreSQL 함수 호출 가능한 경우)")
try:
    # PostgREST는 trigger 정보 직접 못 가져옴. 대신 INSERT 한 번 시도
    test_id = str(uuid.uuid4())
    sub = client.table("substances").select("id").limit(1).execute()
    cond = client.table("conditions").select("id").limit(1).execute()
    pop = client.table("populations").select("id").eq("is_default", True).execute()
    
    if sub.data and cond.data and pop.data:
        # 임시 셀 INSERT (있으면 무시)
        try:
            test_data = {
                "id": test_id,
                "substance_id": sub.data[0]["id"],
                "condition_id": cond.data[0]["id"],
                "population_id": pop.data[0]["id"],
                "ai_grade": "C",
                "ai_summary_ko": f"DIAG_INSERT_{os.getpid()}",
            }
            ins = client.table("evidence_cells").insert(test_data).execute()
            print(f"  INSERT 시도 결과: data={len(ins.data) if ins.data else 0}개")
            
            # 진짜 들어갔나 확인
            check = client.table("evidence_cells").select("id, ai_summary_ko").eq("id", test_id).execute()
            if check.data:
                print(f"  ✓ INSERT 성공 (트리거가 막지 않음)")
                # 정리
                client.table("evidence_cells").delete().eq("id", test_id).execute()
            else:
                print(f"  ❌ INSERT가 응답엔 OK인데 DB엔 없음 (트리거 의심)")
        except Exception as e:
            print(f"  INSERT 예외: {e}")
except Exception as e:
    print(f"  ❌ 트리거 진단 실패: {e}")

print("\n" + "=" * 70)
print("진단 완료. 위 결과를 캡처해서 보여주세요.")
print("=" * 70)
