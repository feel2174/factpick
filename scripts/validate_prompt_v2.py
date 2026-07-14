"""검증: 새 PICO 프롬프트가 effect_metric/value/CI 추출률을 얼마나 올리는지.

골관절염 healthy_adult 셀 중 effect_value=NULL인 메타+RCT 10편을 골라
새 프롬프트로 재추출 → 결과만 출력 (DB는 안 건드림).
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# 같은 폴더의 claude_extractor 모듈에서 함수/프롬프트 재사용
sys.path.insert(0, str(Path(__file__).parent))
from claude_extractor import PICO_PROMPT, call_claude  # noqa: E402

from supabase import create_client  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")

N_SAMPLES = 10
CONDITION_SLUG = "osteoarthritis"


def main() -> int:
    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    cond = sb.table("conditions").select("id, name_ko, name_en").eq("slug", CONDITION_SLUG).single().execute().data
    healthy = sb.table("populations").select("id").eq("slug", "healthy_adult").single().execute().data
    healthy_id = healthy["id"]

    # effect_value=NULL인 추출 (메타/RCT 우선)
    rows = (
        sb.table("study_extractions")
        .select("id, study_id, substance_id, population_id, effect_metric, effect_value, ci_lower, ci_upper, p_value")
        .eq("condition_id", cond["id"])
        .eq("is_valid", True)
        .is_("effect_value", "null")
        .not_.is_("extracted_at", "null")
        .limit(2000)
        .execute()
        .data
    )
    # healthy_adult or NULL pop만
    rows = [r for r in rows if r["population_id"] in (None, healthy_id)]
    if not rows:
        print("후보 없음")
        return 1

    # studies/substances 메타데이터 join
    study_ids = list({r["study_id"] for r in rows})
    sub_ids = list({r["substance_id"] for r in rows})
    studies = {
        s["id"]: s
        for s in sb.table("studies")
        .select("id, pubmed_id, title, abstract, study_type")
        .in_("id", study_ids)
        .execute()
        .data
    }
    subs = {
        s["id"]: s
        for s in sb.table("substances").select("id, name_ko, name_en").in_("id", sub_ids).execute().data
    }

    # 메타/RCT 우선 + abstract 있는 것만
    def rank(r: dict) -> int:
        st = studies.get(r["study_id"], {})
        t = st.get("study_type") or ""
        if t in ("meta_analysis", "systematic_review"):
            return 0
        if t == "rct":
            return 1
        return 2

    import re

    NUM_PATTERN = re.compile(
        r"\b(?:smd|standardi[sz]ed mean difference|hedges'?\s*g|cohen'?s\s*d|effect size|mean difference|\bmd\b|"
        r"95\s*%\s*ci|risk ratio|odds ratio|hazard ratio)\b",
        re.IGNORECASE,
    )

    def has_quant(r: dict) -> bool:
        ab = studies.get(r["study_id"], {}).get("abstract") or ""
        return bool(NUM_PATTERN.search(ab))

    candidates = [r for r in rows if studies.get(r["study_id"], {}).get("abstract") and has_quant(r)]
    candidates.sort(key=rank)
    candidates = candidates[:N_SAMPLES]
    print(f"(abstract에 효과크기 키워드가 명시된 후보만 선별: {len(candidates)}편)")

    print(f"=== 검증 대상: {len(candidates)}편 ({CONDITION_SLUG}, effect_value=NULL) ===\n")

    results = []
    for i, r in enumerate(candidates, 1):
        st = studies[r["study_id"]]
        sub = subs[r["substance_id"]]
        prompt = PICO_PROMPT.format(
            substance_name_en=sub["name_en"],
            substance_name_ko=sub["name_ko"],
            condition_name_en=cond["name_en"],
            condition_name_ko=cond["name_ko"],
            title=st["title"][:300],
            abstract=(st["abstract"] or "")[:3000],
        )
        print(f"[{i}/{len(candidates)}] {sub['name_ko']} | PMID {st['pubmed_id']} | {st.get('study_type','?')}")
        print(f"        제목: {(st['title'] or '')[:90]}")
        parsed, _raw = call_claude(prompt)
        if not parsed:
            print("        ❌ 파싱 실패\n")
            results.append({"ok": False, "extracted": False})
            continue
        em = parsed.get("effect_metric")
        ev = parsed.get("effect_value")
        cl = parsed.get("ci_lower")
        cu = parsed.get("ci_upper")
        p = parsed.get("p_value")
        extracted = ev is not None
        print(f"        → metric={em}, value={ev}, CI=[{cl}, {cu}], p={p}")
        results.append({
            "ok": True,
            "extracted": extracted,
            "metric": em,
            "value": ev,
            "ci_lower": cl,
            "ci_upper": cu,
            "p_value": p,
        })
        print()

    print("\n=== 요약 ===")
    total = len(results)
    parsed_ok = sum(1 for r in results if r["ok"])
    extracted = sum(1 for r in results if r["extracted"])
    print(f"총 {total}편, 파싱 성공 {parsed_ok}, effect_value 추출 {extracted}편 ({extracted / total * 100:.0f}%)")
    metrics = {}
    for r in results:
        if r["extracted"]:
            metrics[r["metric"]] = metrics.get(r["metric"], 0) + 1
    if metrics:
        print(f"  metric 분포: {metrics}")
    with_ci = sum(1 for r in results if r["extracted"] and r.get("ci_lower") is not None)
    with_p = sum(1 for r in results if r["extracted"] and r.get("p_value") is not None)
    print(f"  CI 같이 추출: {with_ci}/{extracted}, p-value 같이: {with_p}/{extracted}")
    print("\n참고: 이전(전체 골관절염 1,000편) 추출률 = 1.4%")
    return 0


if __name__ == "__main__":
    sys.exit(main())
