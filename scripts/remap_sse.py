"""study_substance_effects의 substance_id를 새 매처로 재계산.

매처 v1 버그: NAC가 diclofenac 등에 잘못 매핑됨.
매처 v2: 짧은 키(<=5)는 정확/토큰 일치, 긴 키는 단어 경계.

사용:
  python remap_sse.py --condition osteoarthritis [--dry-run]
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from extractor_v3 import build_substance_matcher, match_substance  # noqa: E402

from supabase import create_client  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("remap")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--condition", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--show-changes", type=int, default=30)
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    cond = sb.table("conditions").select("id").eq("slug", args.condition).single().execute().data

    matcher = build_substance_matcher(sb)
    log.info(f"매처 키 {len(matcher)}개")

    sub_names = {
        s["id"]: s["name_ko"]
        for s in sb.table("substances").select("id, name_ko").execute().data
    }

    # 페이지네이션
    rows = []
    offset = 0
    while True:
        page = (
            sb.table("study_substance_effects")
            .select("id, substance_id, substance_name_raw")
            .eq("condition_id", cond["id"])
            .range(offset, offset + 999)
            .execute()
            .data
        )
        if not page:
            break
        rows.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    log.info(f"sse 행 {len(rows)}개 조회")

    updates = []
    change_log = []
    for r in rows:
        old = r["substance_id"]
        new = match_substance(r["substance_name_raw"], matcher)
        if old != new:
            old_name = sub_names.get(old, "(none)") if old else "(none)"
            new_name = sub_names.get(new, "(none)") if new else "(none)"
            change_log.append((r["substance_name_raw"], old_name, new_name))
            updates.append({"id": r["id"], "substance_id": new})

    log.info(f"변경 대상: {len(updates)}개 / 전체 {len(rows)}")
    if change_log:
        # 변경 패턴 빈도
        pattern_counter = Counter((c[1], c[2]) for c in change_log)
        log.info("\n=== 변경 패턴 (top) ===")
        for (old, new), n in pattern_counter.most_common(20):
            log.info(f"  {old:20} → {new:20}  ({n}건)")
        log.info(f"\n=== 샘플 변경 (최대 {args.show_changes}건) ===")
        for raw, old, new in change_log[: args.show_changes]:
            log.info(f"  '{raw[:40]:40}'  [{old}] → [{new}]")

    if args.dry_run:
        log.info("\n(dry-run, DB 변경 없음)")
        return 0

    log.info(f"\nDB 업데이트 중...")
    # supabase는 batch upsert로 처리
    for i in range(0, len(updates), 100):
        chunk = updates[i : i + 100]
        for u in chunk:
            sb.table("study_substance_effects").update({"substance_id": u["substance_id"]}).eq("id", u["id"]).execute()
    log.info(f"✓ {len(updates)}개 업데이트 완료")
    return 0


if __name__ == "__main__":
    sys.exit(main())
