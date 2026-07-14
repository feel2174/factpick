"""Golden Set JSON → verified_effects 테이블 import.

영선이 작성한 verified_osteoarthritis.json을 DB에 마이그레이션.
- substance_id 자동 매핑 (기존 substances 테이블의 slug/name/aliases 활용)
- 매핑 실패 시 substance_id=NULL (variant 정보로 식별)
- 같은 verified_id가 이미 있으면 upsert

사용:
  python import_golden_set.py [--dry-run]
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from extractor_v3 import build_substance_matcher, match_substance  # noqa: E402

from supabase import create_client  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("golden_import")

GOLDEN_JSON = Path(__file__).parent.parent / "golden_set" / "verified_osteoarthritis.json"


def variant_label_from(entry: dict) -> str | None:
    """name_ko에서 variant label 유추 (괄호/dash 분리)."""
    name = entry.get("name_ko") or ""
    # 괄호 안 정보가 variant 후보
    if "(" in name and ")" in name:
        start = name.index("(")
        end = name.index(")", start)
        label = name[start + 1 : end].strip()
        if label:
            return label
    # ID에 _ 분리된 후미 (예: glucosamine_rotta → rotta)
    vid = entry.get("substance_id") or ""
    if "_" in vid:
        parts = vid.split("_")
        if len(parts) >= 2 and len(parts[-1]) >= 2:
            return parts[-1]
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    data = json.loads(GOLDEN_JSON.read_text())
    entries = data["entries"]
    condition_slug = data["condition"]
    log.info(f"Golden Set: {len(entries)}개 entries (condition={condition_slug})")

    cond = sb.table("conditions").select("id").eq("slug", condition_slug).limit(1).execute().data
    if not cond:
        log.error(f"❌ condition {condition_slug} DB에 없음")
        return 1
    condition_id = cond[0]["id"]

    matcher = build_substance_matcher(sb)
    log.info(f"매처 키 {len(matcher)}개")

    sub_names = {
        s["id"]: s["name_ko"]
        for s in sb.table("substances").select("id, name_ko").execute().data
    }

    rows = []
    matched = 0
    unmatched_names = []
    for e in entries:
        # 매칭: name_en 우선, 없으면 name_ko, 그것도 없으면 verified_id
        match_target = e.get("name_en") or e.get("name_ko") or e.get("substance_id") or ""
        # variant 키워드 떼고 매칭 (예: "글루코사민 Rotta/Dona®" → "글루코사민")
        base_name = match_target.split("(")[0].split("/")[0].strip()
        sub_id = match_substance(base_name, matcher)
        if not sub_id and match_target != base_name:
            sub_id = match_substance(match_target, matcher)

        if sub_id:
            matched += 1
        else:
            unmatched_names.append(e.get("name_ko"))

        smd_source = e.get("smd_source") or "direct"
        # 정규화
        if smd_source not in {
            "direct", "MD_converted", "NNT_converted", "single_RCT_estimated",
            "active_comparator_equivalence", "secondary_citation", "alternative_metric_only",
        }:
            log.warning(f"  unknown smd_source '{smd_source}' for {e.get('name_ko')} → direct로 처리")
            smd_source = "direct"

        rows.append({
            "verified_id": e["substance_id"],
            "condition_id": condition_id,
            "substance_id": sub_id,
            "name_ko": e.get("name_ko") or e["substance_id"],
            "name_en": e.get("name_en"),
            "variant_label": variant_label_from(e),
            "substance_type": e.get("type"),
            "smd": e.get("smd"),
            "ci_lower": e.get("ci_lower"),
            "ci_upper": e.get("ci_upper"),
            "studies_count": e.get("studies_count"),
            "patients_count": e.get("patients_count"),
            "smd_source": smd_source,
            "is_estimated": e.get("is_estimated", False),
            "evidence_grade": e.get("evidence_grade"),
            "funding_bias": e.get("funding_bias", False),
            "warnings": e.get("warnings") or [],
            "source_code": e.get("source_code"),
            "effect_direction": "pain_reduction",
        })

    log.info(f"매칭 결과: {matched}/{len(entries)}편")
    if unmatched_names:
        log.info(f"  매칭 실패 (variant로만 식별): {unmatched_names[:10]}")

    log.info("\n=== Preview ===")
    for r in rows[:8]:
        sub_disp = sub_names.get(r["substance_id"], "(none)") if r["substance_id"] else "(none)"
        smd_disp = f"{r['smd']:+.2f}" if r["smd"] is not None else "  N/A"
        fb = "⚠FB" if r["funding_bias"] else "   "
        log.info(
            f"  {r['name_ko']:30} [{sub_disp:15}] smd={smd_disp} grade={r['evidence_grade'] or '?':10} {fb} {r['smd_source']}"
        )

    if args.dry_run:
        log.info("\n(dry-run, DB 변경 없음)")
        return 0

    log.info(f"\nDB upsert 중...")
    inserted = 0
    for r in rows:
        try:
            sb.table("verified_effects").upsert(r, on_conflict="verified_id,condition_id").execute()
            inserted += 1
        except Exception as ex:
            log.error(f"  실패: {r['name_ko']}: {ex}")
    log.info(f"✓ {inserted}/{len(rows)} 적재 완료")
    return 0


if __name__ == "__main__":
    sys.exit(main())
