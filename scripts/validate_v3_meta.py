"""Multi-substance 프롬프트 v3 검증.

골관절염 메타/SR 10편 (종합리뷰 + 단일쌍 혼합)을 새 프롬프트로 추출 →
data/validation_v3_meta.md 로 결과 저장. 영선이 abstract와 JSON을 나란히 보고 검토.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from claude_extractor import call_claude  # noqa: E402
from prompts_v3 import META_SR_PROMPT  # noqa: E402

from supabase import create_client  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")

N_SAMPLES = 10
CONDITION_SLUG = "osteoarthritis"
OUT_PATH = Path(__file__).parent.parent / "data" / "validation_v3_meta.md"


def select_samples(sb, cond_id: str) -> list[dict]:
    """다양한 종합/단일 쌍 메타/SR 골고루 뽑기."""
    ext = (
        sb.table("study_extractions")
        .select("study_id, substance_id")
        .eq("condition_id", cond_id)
        .eq("is_valid", True)
        .execute()
        .data
    )
    study_ids = list({e["study_id"] for e in ext})
    studies = []
    for i in range(0, len(study_ids), 500):
        chunk = study_ids[i : i + 500]
        r = (
            sb.table("studies")
            .select("id, pubmed_id, title, abstract, study_type, sample_size, year")
            .in_("id", chunk)
            .execute()
        )
        studies.extend(r.data)
    meta_sr = [
        s
        for s in studies
        if s["study_type"] in ("meta_analysis", "systematic_review") and s.get("abstract")
    ]
    # 다양성: substance_id 개수가 큰 (= 종합 리뷰) 위주, 작은 (= 단일 쌍) 일부 섞기
    by_study = {}
    for e in ext:
        by_study.setdefault(e["study_id"], set()).add(e["substance_id"])
    meta_sr.sort(key=lambda s: len(by_study.get(s["id"], set())), reverse=True)

    # 종합 리뷰(성분 5+) 5편 + 단일 쌍(성분 1) 5편
    multi = [s for s in meta_sr if len(by_study.get(s["id"], set())) >= 5][:5]
    single = [s for s in meta_sr if len(by_study.get(s["id"], set())) == 1][:5]
    return multi + single


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

    samples = select_samples(sb, cond["id"])[:N_SAMPLES]
    print(f"=== 검증 대상: {len(samples)}편 (메타/SR, 골관절염) ===\n")

    lines = [
        f"# Multi-substance 추출 v3 검증 — {cond['name_ko']}",
        "",
        f"_총 {len(samples)}편: 종합 리뷰 + 단일 쌍 혼합_",
        "",
        "각 논문에 대해 (1) abstract 원문 (2) 새 프롬프트가 뽑아낸 JSON을 나란히 볼 수 있어. "
        "**누락된 정보 / 잘못 분류된 정보 / 추가 필드가 필요한 항목** 알려주면 프롬프트 다듬을게.",
        "",
        "---",
        "",
    ]

    for i, st in enumerate(samples, 1):
        print(f"[{i}/{len(samples)}] PMID {st['pubmed_id']} ({st['study_type']})")
        print(f"        {(st['title'] or '')[:90]}")

        prompt = META_SR_PROMPT.format(
            condition_name_en=cond["name_en"],
            condition_name_ko=cond["name_ko"],
            title=(st["title"] or "")[:300],
            abstract=(st["abstract"] or "")[:3000],
        )
        parsed, raw = call_claude(prompt)

        lines.append(f"## {i}. PMID {st['pubmed_id']} — {st['study_type']}")
        lines.append("")
        lines.append(f"**Title:** {st['title']}")
        lines.append("")
        lines.append(f"**Year:** {st.get('year', '?')} · **Sample size:** {st.get('sample_size') or '미상'}")
        lines.append("")
        lines.append(f"**PubMed:** https://pubmed.ncbi.nlm.nih.gov/{st['pubmed_id']}/")
        lines.append("")
        lines.append("### Abstract")
        lines.append("```")
        lines.append((st["abstract"] or "")[:3000])
        lines.append("```")
        lines.append("")
        lines.append("### Extracted JSON")
        if parsed:
            n_subs = len(parsed.get("substances") or [])
            n_h2h = len(parsed.get("head_to_head_comparisons") or [])
            with_value = sum(
                1
                for s in (parsed.get("substances") or [])
                if s.get("effect_value") is not None
            )
            with_cat = sum(
                1
                for s in (parsed.get("substances") or [])
                if s.get("effect_size_category")
            )
            lines.append(
                f"_성분 {n_subs}개 · head-to-head {n_h2h}개 · 수치 있음 {with_value}/{n_subs} · 카테고리 있음 {with_cat}/{n_subs}_"
            )
            lines.append("")
            lines.append("```json")
            lines.append(json.dumps(parsed, ensure_ascii=False, indent=2))
            lines.append("```")
            print(
                f"        → 성분 {n_subs}개, 수치 {with_value}, 카테고리 {with_cat}, h2h {n_h2h}"
            )
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
    print(f"\n✓ 결과 저장: {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
