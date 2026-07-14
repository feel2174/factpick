"""personalization_rules.json → DB.

영선 검수한 룰을 personalization_rules 테이블에 upsert.
- verified_id (예: "glucosamine_rotta") → verified_effects.verified_id 매핑
- substance slug 매핑은 아직 안 함 (verified_id만 활용)
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("import_rules")

DATA_FILE = Path(__file__).parent.parent / "data" / "personalization_rules.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    data = json.loads(DATA_FILE.read_text())
    rules = data["rules"]
    log.info(f"룰 {len(rules)}개 import")

    inserted = 0
    for r in rules:
        cond_slug = r["condition_slug"]
        cond = (
            sb.table("conditions").select("id").eq("slug", cond_slug).limit(1).execute().data
        )
        if not cond:
            log.warning(f"⚠️  condition '{cond_slug}' 없음 — skip {r['rule_code']}")
            continue

        row = {
            "rule_code": r["rule_code"],
            "condition_id": cond[0]["id"],
            "rank": r["rank"],
            "icon": r.get("icon"),
            "title": r["title"],
            "message": r["message"],
            "match_conditions": r.get("match_conditions") or {},
            "highlight_substance_ids": r.get("highlight_substance_ids") or [],
            "highlight_verified_ids": r.get("highlight_verified_ids") or [],
            "avoid_substance_ids": r.get("avoid_substance_ids") or [],
            "avoid_verified_ids": r.get("avoid_verified_ids") or [],
            "display_order": r.get("display_order", 0),
            "is_active": True,
        }

        if args.dry_run:
            log.info(f"  [DRY] [{row['rank']}] {row['rule_code']:30} → {row['title']}")
        else:
            sb.table("personalization_rules").upsert(row, on_conflict="rule_code").execute()
            log.info(f"  ✓ [{row['rank']}] {row['rule_code']:30} → {row['title']}")
            inserted += 1

    log.info(f"\n완료: {inserted}/{len(rules)}")

    # Prune: JSON에 없는 룰은 비활성화
    json_codes = {r["rule_code"] for r in rules}
    existing = sb.table("personalization_rules").select("rule_code, is_active").execute().data
    to_deactivate = [
        r["rule_code"] for r in existing if r["rule_code"] not in json_codes and r["is_active"]
    ]
    if to_deactivate:
        log.info(f"\nJSON에 없는 활성 룰 {len(to_deactivate)}개 → is_active=false")
        for code in to_deactivate:
            if args.dry_run:
                log.info(f"  [DRY] 비활성: {code}")
            else:
                sb.table("personalization_rules").update({"is_active": False}).eq(
                    "rule_code", code
                ).execute()
                log.info(f"  ✓ 비활성: {code}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
