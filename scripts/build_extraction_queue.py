#!/usr/bin/env python3
"""
FactPick Extraction Queue Builder
==================================
셀(substance × condition)당 메타분석/SR 상위 N편을 PICO 추출 우선순위 큐로 만듭니다.

옵션 A3 전략:
  - 메타분석/SR 우선 (인용수 desc)
  - 셀당 최대 3편 (TOP_PER_CELL)
  - 이미 추출된 건 스킵
  - 큐를 study_extractions에 priority_rank로 표시

사용법:
  python build_extraction_queue.py              # 큐 생성/갱신
  python build_extraction_queue.py --reset      # 기존 priority 초기화 후 재생성
  python build_extraction_queue.py --top 5      # 셀당 5편으로 변경
  python build_extraction_queue.py --dry-run    # 미리보기만
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from collections import defaultdict
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

TOP_PER_CELL_DEFAULT = 3
ALLOWED_STUDY_TYPES = ["meta_analysis", "systematic_review"]

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("queue_builder")


def main():
    parser = argparse.ArgumentParser(description="FactPick 추출 우선순위 큐 빌더")
    parser.add_argument("--top", type=int, default=TOP_PER_CELL_DEFAULT,
                        help=f"셀당 최대 우선순위 편수 (기본 {TOP_PER_CELL_DEFAULT})")
    parser.add_argument("--reset", action="store_true",
                        help="기존 priority_rank를 모두 NULL로 리셋 후 재생성")
    parser.add_argument("--include-rct", action="store_true",
                        help="RCT도 포함 (메타 부족한 셀에 한해 RCT로 보충)")
    parser.add_argument("--dry-run", action="store_true",
                        help="DB 변경 없이 큐 구성만 미리보기")
    args = parser.parse_args()

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL 또는 SUPABASE_SERVICE_KEY 누락. .env 확인")
        sys.exit(1)

    client = create_client(SUPABASE_URL, SUPABASE_KEY)

    log.info("=" * 60)
    log.info(f"옵션 A3 큐 빌더 시작 (셀당 상위 {args.top}편)")
    log.info("=" * 60)

    # 1) study_extractions에 priority_rank 컬럼이 없으면 추가 안내
    log.info("\n[1/4] 사전 점검...")
    try:
        # priority_rank 컬럼 존재 확인
        test = client.table("study_extractions").select("id").limit(1).execute()
        log.info(f"  study_extractions 접근 OK")
    except Exception as e:
        log.error(f"  접근 실패: {e}")
        sys.exit(1)

    # 2) 리셋 옵션
    if args.reset and not args.dry_run:
        log.info("\n[2/4] 기존 priority_rank 리셋 중...")
        # extra JSONB에서 priority_rank 제거
        client.rpc("reset_extraction_priority").execute() if False else None
        # 직접 update (rpc 없을 수 있어서)
        try:
            client.table("study_extractions").update(
                {"extra": {}}
            ).neq("id", "00000000-0000-0000-0000-000000000000").execute()
            log.info("  리셋 완료")
        except Exception as e:
            log.warning(f"  리셋 실패 (무시 가능): {e}")

    # 3) 우선순위 후보 수집
    # 메타분석/SR 우선, 같은 셀 안에서 인용수 내림차순
    log.info("\n[3/4] 우선순위 후보 수집 중...")
    log.info(f"  대상 study_type: {ALLOWED_STUDY_TYPES}")

    # study_extractions 중 이미 추출된 건 제외, 메타/SR만
    query = """
    SELECT 
      se.id              AS extraction_id,
      se.substance_id,
      se.condition_id,
      se.population_id,
      st.id              AS study_id,
      st.pubmed_id,
      st.year,
      st.study_type,
      st.title,
      (st.raw_metadata->>'icite_citations')::int AS citations,
      (st.raw_metadata->>'icite_rcr')::float    AS rcr,
      s.name_ko          AS substance_name,
      c.name_ko          AS condition_name
    FROM study_extractions se
    JOIN studies     st ON st.id = se.study_id
    JOIN substances  s  ON s.id  = se.substance_id
    JOIN conditions  c  ON c.id  = se.condition_id
    WHERE se.extracted_at IS NULL
      AND se.is_valid = TRUE
      AND st.study_type = ANY(%s)
    ORDER BY 
      se.substance_id, 
      se.condition_id,
      CASE st.study_type
        WHEN 'meta_analysis' THEN 1
        WHEN 'systematic_review' THEN 2
        ELSE 3
      END,
      (st.raw_metadata->>'icite_citations')::int DESC NULLS LAST,
      st.year DESC NULLS LAST
    """

    # Supabase RPC가 임의 SQL 안 받음 → 직접 쿼리 빌드
    # 메타/SR만 조회 (raw_metadata는 select * 시 같이 옴)
    log.info("  studies 조회...")
    studies_q = client.table("studies").select(
        "id, pubmed_id, year, study_type, title, raw_metadata"
    ).in_("study_type", ALLOWED_STUDY_TYPES).execute()
    
    studies_map = {s["id"]: s for s in studies_q.data}
    log.info(f"  메타분석/SR 논문: {len(studies_map)}편")

    log.info("  study_extractions 조회 (미추출만)...")
    extractions_data = []
    # 페이지네이션으로 가져오기 (Supabase 기본 1000 limit)
    offset = 0
    page_size = 1000
    while True:
        page = client.table("study_extractions").select(
            "id, study_id, substance_id, condition_id, population_id"
        ).is_("extracted_at", "null").eq("is_valid", True).range(
            offset, offset + page_size - 1
        ).execute()
        if not page.data:
            break
        extractions_data.extend(page.data)
        if len(page.data) < page_size:
            break
        offset += page_size

    log.info(f"  미추출 매핑: {len(extractions_data)}개")

    # study_id 기준으로 메타/SR만 필터링
    candidates = []
    for ext in extractions_data:
        study = studies_map.get(ext["study_id"])
        if not study:
            continue
        meta = study.get("raw_metadata") or {}
        citations = meta.get("icite_citations") or 0
        rcr = meta.get("icite_rcr") or 0.0
        candidates.append({
            **ext,
            "study_type": study["study_type"],
            "year": study.get("year"),
            "title": study.get("title", "")[:60],
            "citations": citations,
            "rcr": rcr,
        })

    log.info(f"  메타/SR 후보: {len(candidates)}개")

    # 셀(substance × condition) 단위로 그룹핑
    cells = defaultdict(list)
    for c in candidates:
        key = (c["substance_id"], c["condition_id"])
        cells[key].append(c)

    log.info(f"  활성 셀 수: {len(cells)}개")

    # 4) 각 셀당 상위 N편 선정
    log.info(f"\n[4/4] 셀당 상위 {args.top}편 선정...")
    
    priority_updates = []  # [(extraction_id, rank), ...]
    cell_summary = []

    # 정렬: meta_analysis 우선 → citations desc → year desc
    def sort_key(item):
        type_order = 1 if item["study_type"] == "meta_analysis" else 2
        return (type_order, -item["citations"], -(item["year"] or 0))

    for (sub_id, cond_id), items in cells.items():
        items_sorted = sorted(items, key=sort_key)
        top_n = items_sorted[:args.top]
        
        for rank, item in enumerate(top_n, start=1):
            priority_updates.append((item["id"], rank, item["study_type"], item["citations"]))
        
        if top_n:
            sample = top_n[0]
            cell_summary.append({
                "substance": sample.get("substance_name", "?"),
                "condition": sample.get("condition_name", "?"),
                "selected": len(top_n),
                "available": len(items),
                "top_citations": top_n[0]["citations"],
            })

    log.info(f"  총 우선순위 추출 작업: {len(priority_updates)}개")
    
    # 미리보기
    log.info(f"\n=== 상위 10개 셀 미리보기 ===")
    cell_summary.sort(key=lambda x: -x["top_citations"])
    for s in cell_summary[:10]:
        log.info(f"  {s['substance']} × {s['condition']}: "
                 f"{s['selected']}/{s['available']}편 선정, 최고 인용 {s['top_citations']}회")

    # 5) DB 업데이트
    if args.dry_run:
        log.info("\n[DRY RUN] DB 변경 없이 종료")
        return

    log.info(f"\n[5/5] study_extractions.extra에 priority_rank 기록...")
    # extra JSONB 필드에 priority_rank 저장
    # Supabase는 일괄 update의 JSONB 필드 부분 갱신을 잘 못 함 → 한 row씩
    
    batch_size = 50
    success = 0
    failed = 0
    
    for i in range(0, len(priority_updates), batch_size):
        batch = priority_updates[i:i+batch_size]
        for ext_id, rank, stype, citations in batch:
            try:
                # extra 필드에 priority 정보 저장
                client.table("study_extractions").update({
                    "extra": {
                        "priority_rank": rank,
                        "priority_study_type": stype,
                        "priority_citations": citations,
                        "queued_at": "now"
                    }
                }).eq("id", ext_id).execute()
                success += 1
            except Exception as e:
                failed += 1
                if failed <= 3:  # 처음 3개만 로그
                    log.warning(f"  update 실패 (id={ext_id[:8]}): {e}")
        
        if (i + batch_size) % 500 == 0 or i + batch_size >= len(priority_updates):
            log.info(f"  진행: {min(i+batch_size, len(priority_updates))}/{len(priority_updates)} "
                     f"(성공 {success}, 실패 {failed})")

    log.info(f"\n=== 완료 ===")
    log.info(f"  큐에 등록된 추출 작업: {success}개")
    log.info(f"  실패: {failed}개")
    log.info(f"\n다음 단계: python claude_extractor.py 로 PICO 추출 시작")


if __name__ == "__main__":
    main()
