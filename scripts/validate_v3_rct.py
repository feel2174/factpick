"""RCT 정밀 프롬프트 v3 검증.

골관절염 RCT n>=200 양질 후보 10편을 새 프롬프트로 추출 →
data/validation_v3_rct.md 로 결과 저장.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from claude_extractor import call_claude  # noqa: E402
from prompts_v3 import RCT_PROMPT  # noqa: E402

from supabase import create_client  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")

N_SAMPLES = 10
MIN_N = 200
CONDITION_SLUG = "osteoarthritis"
OUT_PATH = Path(__file__).parent.parent / "data" / "validation_v3_rct.md"


def main() -> int:
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
    cond = (
        sb.table("conditions")
        .select("id, name_ko, name_en")
        .eq("slug", CONDITION_SLUG)
        .single()
        .execute()
        .data
    )

    # 골관절염 매핑된 study_extractions 중 RCT만 가져오기 (study × substance × condition 트리플)
    ext = (
        sb.table("study_extractions")
        .select("study_id, substance_id")
        .eq("condition_id", cond["id"])
        .eq("is_valid", True)
        .execute()
        .data
    )
    study_ids = list({e["study_id"] for e in ext})

    studies_map: dict[str, dict] = {}
    for i in range(0, len(study_ids), 500):
        chunk = study_ids[i : i + 500]
        r = (
            sb.table("studies")
            .select("id, pubmed_id, title, abstract, study_type, sample_size, year")
            .in_("id", chunk)
            .execute()
        )
        for s in r.data:
            studies_map[s["id"]] = s

    # RCT n>=MIN_N + abstract 있음
    rct_ext = [
        e
        for e in ext
        if studies_map.get(e["study_id"], {}).get("study_type") == "rct"
        and (studies_map.get(e["study_id"], {}).get("sample_size") or 0) >= MIN_N
        and studies_map.get(e["study_id"], {}).get("abstract")
    ]

    # study당 1개씩만 (중복 방지). n수 큰 순서로.
    seen_studies: set[str] = set()
    picked: list[dict] = []
    for e in sorted(
        rct_ext,
        key=lambda x: -(studies_map[x["study_id"]].get("sample_size") or 0),
    ):
        if e["study_id"] in seen_studies:
            continue
        seen_studies.add(e["study_id"])
        picked.append(e)
        if len(picked) >= N_SAMPLES:
            break

    # 성분 메타데이터
    sub_ids = list({e["substance_id"] for e in picked})
    sub_map = {
        s["id"]: s
        for s in sb.table("substances").select("id, name_ko, name_en").in_("id", sub_ids).execute().data
    }

    print(f"=== 검증 대상: {len(picked)}편 (RCT n>={MIN_N}, 골관절염) ===\n")

    lines = [
        f"# RCT 정밀 추출 v3 검증 — {cond['name_ko']}",
        "",
        f"_총 {len(picked)}편: RCT sample_size ≥ {MIN_N} 양질 후보_",
        "",
        "(1) abstract 원문 (2) 새 프롬프트가 뽑은 JSON. 누락/오분류 있으면 알려줘.",
        "",
        "---",
        "",
    ]

    summary = {"parsed": 0, "with_value": 0, "with_ci": 0, "with_p": 0}
    for i, e in enumerate(picked, 1):
        st = studies_map[e["study_id"]]
        sub = sub_map.get(e["substance_id"], {})
        n = st.get("sample_size") or 0
        print(f"[{i}/{len(picked)}] PMID {st['pubmed_id']} | {sub.get('name_ko','?')} | n={n}")
        print(f"        {(st['title'] or '')[:90]}")

        prompt = RCT_PROMPT.format(
            substance_name_en=sub.get("name_en") or "?",
            substance_name_ko=sub.get("name_ko") or "?",
            condition_name_en=cond["name_en"],
            condition_name_ko=cond["name_ko"],
            title=(st["title"] or "")[:300],
            abstract=(st["abstract"] or "")[:3000],
        )
        parsed, raw = call_claude(prompt)

        lines.append(f"## {i}. PMID {st['pubmed_id']} — {sub.get('name_ko','?')} × 골관절염")
        lines.append("")
        lines.append(f"**Title:** {st['title']}")
        lines.append("")
        lines.append(
            f"**Year:** {st.get('year') or '?'} · **n:** {n} · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/{st['pubmed_id']}/"
        )
        lines.append("")
        lines.append("### Abstract")
        lines.append("```")
        lines.append((st["abstract"] or "")[:3000])
        lines.append("```")
        lines.append("")
        lines.append("### Extracted JSON")
        if parsed:
            summary["parsed"] += 1
            primary = parsed.get("primary_outcome") or {}
            if primary.get("effect_value") is not None:
                summary["with_value"] += 1
            if primary.get("ci_lower") is not None:
                summary["with_ci"] += 1
            if primary.get("p_value") is not None:
                summary["with_p"] += 1

            metric = primary.get("effect_metric")
            value = primary.get("effect_value")
            cat = primary.get("effect_size_category")
            d = parsed.get("design_features") or {}
            design_bits = []
            if d.get("is_double_blind") is True:
                design_bits.append("DB")
            if d.get("is_placebo_controlled") is True:
                design_bits.append("PC")
            if d.get("is_multicenter") is True:
                design_bits.append("MC")
            design_str = " · ".join(design_bits) or "-"

            lines.append(
                f"_primary: metric={metric}, value={value}, category={cat} · design: {design_str} · "
                f"relevance={parsed.get('relevance_score')} · confidence={parsed.get('extraction_confidence')}_"
            )
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(parsed, ensure_ascii=False, indent=2))
            lines.append("```")
            print(f"        → metric={metric}, value={value}, category={cat}, design={design_str}")
        else:
            lines.append("```")
            lines.append(raw or "(파싱 실패)")
            lines.append("```")
            print("        ❌ 파싱 실패")
        lines.append("")
        lines.append("---")
        lines.append("")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text("\n".join(lines), encoding="utf-8")
    print(f"\n=== 요약 ===")
    print(
        f"파싱 성공 {summary['parsed']}/{len(picked)} · primary effect_value {summary['with_value']} · "
        f"CI {summary['with_ci']} · p-value {summary['with_p']}"
    )
    print(f"✓ 결과 저장: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
