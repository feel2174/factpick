"""substance_products_kr.json → substances.extra.korea_products 적재.

영선이 검수한 한국 시판 제품 매핑을 DB에 반영.
- substances.extra JSONB의 'korea_products' 키 안에 저장
- 기존 extra 데이터는 보존 (병합)
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
log = logging.getLogger("import_products")

DATA_FILE = Path(__file__).parent.parent / "data" / "substance_products_kr.json"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    data = json.loads(DATA_FILE.read_text())
    products_map = data.get("products", {})
    log.info(f"매핑 대상: {len(products_map)}개 slug")

    # 모든 substance fetch
    subs = sb.table("substances").select("id, slug, name_ko, extra").execute().data
    by_slug = {s["slug"]: s for s in subs}

    updated = 0
    skipped = 0
    for slug, prod_info in products_map.items():
        if slug.startswith("_"):
            continue  # _korea_specific_verified 같은 메타 키 skip
        sub = by_slug.get(slug)
        if not sub:
            log.warning(f"  ⚠️  slug '{slug}' substances 테이블에 없음 — skip")
            skipped += 1
            continue

        # extra 병합
        extra = dict(sub.get("extra") or {})
        extra["korea_products"] = prod_info  # {"top": {...}, "others": [...]}

        if args.dry_run:
            top_name = prod_info.get("top", {}).get("name", "?")
            log.info(f"  [DRY] {sub['name_ko']:20} → top: {top_name}")
        else:
            sb.table("substances").update({"extra": extra}).eq("id", sub["id"]).execute()
            top_name = prod_info.get("top", {}).get("name", "?")
            n_others = len(prod_info.get("others", []))
            log.info(f"  ✓ {sub['name_ko']:20} → {top_name} (+ {n_others}개 추가)")
            updated += 1

    log.info(f"\n=== 완료 === updated={updated} skipped={skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
