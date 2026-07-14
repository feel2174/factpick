"""FactPick 등급 산출 v3 — study_substance_effects 기반.

영선의 비전:
  - SMD/MD 분리 (이전 버그 수정: 같은 통에 평균 안 함)
  - 수치 + 카테고리 모두 활용 (수치 없는 정보도 살림)
  - 메타/SR가중치 3, RCT 가중치 1
  - I 등급 (데이터 부족) 명확히 분별
  - evidence_cells.ai_* 컬럼에 저장 (인간 검수 grade는 안 건드림)

베타 v3 단순화:
  - 모든 추출은 healthy_adult 셀로 통합 (population 분리는 다음 단계)
  - condition은 cli 인자로 지정 (예: osteoarthritis)
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("grader_v3")

SMD_METRICS = {"smd", "hedges_g", "cohen_d"}
MD_METRICS = {"md"}
RATIO_METRICS = {"or", "rr", "hr"}

CATEGORY_SCORE = {
    "large": 4.0,
    "moderate": 3.0,
    "small": 1.5,
    "null_effect": 0.5,
    "negative": 0.0,
    "unclear": None,
}

META_TYPES = {"meta_analysis", "systematic_review"}
TIER_RANK = {"strong": 3, "good": 2, "weak": 1}

# 메타-우선 모델 기준 (영선 승인, 2026-06-05). 보수적으로 시작 — 검수하며 조정.
META_MIN_K = 5        # 강/양호 메타: 성분별 포함 연구 수 하한
META_MIN_N = 500      # 강/양호 메타: 총 표본 하한
SR_LARGE_K = 10       # GRADE 미기재여도 "양호"로 인정할 대규모 SR 연구 수
SR_LARGE_N = 1000     # GRADE 미기재여도 "양호"로 인정할 대규모 SR 표본
MEGA_N = 1000         # 메가트라이얼 표본 하한
QUALITY_FLOOR = {"strong": 4.0, "good": 3.3}  # 메타 품질이 보장하는 근거점수 하한


def classify_meta(grade: Optional[str], k: Optional[int], n: Optional[int]) -> str:
    """메타/SR 한 편의 품질 등급: strong / good / weak.
    grade=GRADE(evidence_grade_stated), k=성분별 포함 연구 수, n=총 표본."""
    g = (grade or "").lower().strip()
    k = k or 0
    n = n or 0
    if g == "high" and k >= META_MIN_K and n >= META_MIN_N:
        return "strong"
    if g == "moderate" and k >= META_MIN_K and n >= META_MIN_N:
        return "good"
    # GRADE 미기재지만 충분히 큰 SR이면 양호로 인정
    if g in ("", "unclear", "not_reported", "none") and k >= SR_LARGE_K and n >= SR_LARGE_N:
        return "good"
    return "weak"


def is_mega_rct(n: Optional[int], design: Optional[dict]) -> bool:
    """메가트라이얼: 대표본 + (다기관 또는 이중맹검)."""
    n = n or 0
    d = design or {}
    return n >= MEGA_N and (d.get("is_multicenter") is True or d.get("is_double_blind") is True)


def fetch_cells_data(sb: Client, condition_slug: str) -> tuple[dict, dict, list]:
    cond = (
        sb.table("conditions").select("id, slug, name_ko").eq("slug", condition_slug)
        .single().execute().data
    )
    healthy = (
        sb.table("populations").select("id, slug, name_ko").eq("slug", "healthy_adult")
        .single().execute().data
    )

    rows = (
        sb.table("study_substance_effects")
        .select(
            "id, substance_id, study_id, extraction_v2_id, effect_metric, effect_value, "
            "ci_lower, ci_upper, p_value, effect_size_category, effect_direction, "
            "clinical_importance, narrative, source_study_type, is_primary_outcome, "
            "n_studies_for_substance, study_sample_size, study_year, outcome_measure"
        )
        .eq("condition_id", cond["id"])
        .eq("is_valid", True)
        .not_.is_("substance_id", "null")
        .execute()
        .data
    )
    return cond, healthy, rows


def fetch_extractions(sb: Client, condition_id: str) -> dict[str, dict]:
    """study_extractions_v2를 id로 매핑 — GRADE/메타규모/RCT설계 신호 제공."""
    r = (
        sb.table("study_extractions_v2")
        .select(
            "id, extraction_mode, evidence_grade_stated, n_studies_included, "
            "total_sample_size, sample_size_total, design_features"
        )
        .eq("condition_id", condition_id)
        .eq("is_valid", True)
        .execute()
        .data
    )
    return {e["id"]: e for e in r}


def fetch_substance_names(sb: Client, ids: list[str]) -> dict[str, str]:
    out = {}
    for i in range(0, len(ids), 500):
        chunk = ids[i : i + 500]
        r = sb.table("substances").select("id, name_ko").in_("id", chunk).execute()
        for s in r.data:
            out[s["id"]] = s["name_ko"]
    return out


def weighted_smd(rows: list[dict], weights_by_study: dict[str, float]) -> tuple[Optional[float], int]:
    """SMD/Hedges_g만 가중평균. (값, 사용된 추출수).
    가중치는 study별로 사전 계산 (메타 3 / 메가트라이얼 2 / RCT 1 / 관찰 0.3)."""
    pairs = []
    for r in rows:
        m = (r.get("effect_metric") or "").lower().strip()
        v = r.get("effect_value")
        if m not in SMD_METRICS or v is None:
            continue
        try:
            v = float(v)
        except (ValueError, TypeError):
            continue
        if abs(v) > 5:  # 명백한 이상치 (SMD는 보통 -2~+2)
            continue
        w = weights_by_study.get(r["study_id"], 0.3)
        pairs.append((v, w))
    if not pairs:
        return None, 0
    total_w = sum(w for _, w in pairs)
    return (sum(v * w for v, w in pairs) / total_w, len(pairs)) if total_w > 0 else (None, 0)


def collect_md(rows: list[dict]) -> list[dict]:
    """MD 추출 (단위가 다르니 평균은 안 함). 카운트/리스트만."""
    out = []
    for r in rows:
        m = (r.get("effect_metric") or "").lower().strip()
        if m not in MD_METRICS or r.get("effect_value") is None:
            continue
        out.append({
            "value": r["effect_value"],
            "outcome": r.get("outcome_measure"),
            "ci_lower": r.get("ci_lower"),
            "ci_upper": r.get("ci_upper"),
            "narrative": (r.get("narrative") or "")[:200],
        })
    return out


def aggregate_cell(rows: list[dict], ext_map: dict[str, dict]) -> dict:
    """한 (substance × condition) 셀의 모든 추출 통합."""
    n_meta = 0
    n_rct = 0
    n_obs = 0
    n_mega = 0
    best_meta_tier: Optional[str] = None
    best_meta_grade: Optional[str] = None
    weights_by_study: dict[str, float] = {}
    seen_studies = set()
    by_study = defaultdict(list)
    for r in rows:
        by_study[r["study_id"]].append(r)
    # study별 source_study_type으로 카운트 (한 study가 메타/SR이면 1개로 카운트)
    for sid, sub_rows in by_study.items():
        st = (sub_rows[0].get("source_study_type") or "").lower()
        ext = ext_map.get(sub_rows[0].get("extraction_v2_id")) or {}
        weight = 0.3
        if st in META_TYPES:
            n_meta += 1
            # 성분별 포함 연구 수 k (메타 내 이 성분의 연구 수 우선, 없으면 SR 전체)
            k = max((r.get("n_studies_for_substance") or 0) for r in sub_rows)
            if not k:
                k = ext.get("n_studies_included") or 0
            n = ext.get("total_sample_size") or sum((r.get("study_sample_size") or 0) for r in sub_rows)
            tier = classify_meta(ext.get("evidence_grade_stated"), k, n)
            if best_meta_tier is None or TIER_RANK[tier] > TIER_RANK[best_meta_tier]:
                best_meta_tier = tier
                best_meta_grade = (ext.get("evidence_grade_stated") or "").lower() or None
            weight = 3.0
        elif st == "rct":
            n_rct += 1
            n_rct_sample = ext.get("sample_size_total") or (sub_rows[0].get("study_sample_size") or 0)
            if is_mega_rct(n_rct_sample, ext.get("design_features")):
                n_mega += 1
                weight = 2.0
            else:
                weight = 1.0
        elif st in ("cohort", "case_control", "observational"):
            n_obs += 1
            weight = 0.3
        weights_by_study[sid] = weight
        seen_studies.add(sid)

    smd, n_smd = weighted_smd(rows, weights_by_study)
    mds = collect_md(rows)

    # 카테고리 분포
    cat_counter = Counter(r.get("effect_size_category") for r in rows if r.get("effect_size_category"))
    dir_counter = Counter(r.get("effect_direction") for r in rows if r.get("effect_direction"))
    clin_counter = Counter(r.get("clinical_importance") for r in rows if r.get("clinical_importance"))

    # consistency: positive / (positive + null + negative + mixed)
    total_dir = sum(dir_counter.values())
    if total_dir:
        consistency = dir_counter.get("positive", 0) / total_dir
    else:
        consistency = None

    # 표본 크기 합산 (메타분석은 abstract에 명시된 경우만)
    total_n = 0
    for r in rows:
        n = r.get("study_sample_size")
        if n:
            total_n += n

    # narrative 모음 (최대 5개)
    narratives = []
    for r in rows:
        nr = r.get("narrative")
        if nr and len(narratives) < 5:
            narratives.append(nr[:200])

    return {
        "n_studies": len(seen_studies),
        "n_meta": n_meta,
        "n_rct": n_rct,
        "n_obs": n_obs,
        "n_mega": n_mega,
        "best_meta_tier": best_meta_tier,
        "best_meta_grade": best_meta_grade,
        "smd_pooled": smd,
        "n_smd_extracts": n_smd,
        "mds": mds,
        "category_dist": dict(cat_counter),
        "direction_dist": dict(dir_counter),
        "clinical_importance_dist": dict(clin_counter),
        "consistency": consistency,
        "total_sample_size": total_n,
        "narratives": narratives,
    }


def category_efficacy(cat_dist: dict) -> Optional[float]:
    """카테고리 분포로 효능 점수 계산 (수치 없을 때)."""
    if not cat_dist:
        return None
    total = sum(cat_dist.values())
    if not total:
        return None
    score = 0.0
    for cat, n in cat_dist.items():
        s = CATEGORY_SCORE.get(cat)
        if s is None:
            continue
        score += s * n
    return score / total


def calculate_grade(agg: dict) -> tuple[str, float, float, Optional[str]]:
    """등급 + efficacy + evidence + 1줄 요약 산출."""
    n_meta = agg["n_meta"]
    n_rct = agg["n_rct"]
    n_obs = agg["n_obs"]

    # 데이터 자체가 너무 적으면 I
    total_quality = n_meta + n_rct
    if total_quality < 1 and n_obs < 2:
        return "I", 0.0, 0.0, "데이터 부족"

    # efficacy: SMD 우선, 없으면 카테고리
    smd = agg["smd_pooled"]
    if smd is not None:
        efficacy = min(abs(smd) * 2.5, 5.0)
        eff_source = f"SMD {smd:+.2f}"
    else:
        cat_eff = category_efficacy(agg["category_dist"])
        if cat_eff is None:
            efficacy = 0.5
            eff_source = "카테고리/수치 없음"
        else:
            efficacy = min(cat_eff, 5.0)
            eff_source = f"카테고리 평균 {cat_eff:.1f}"

    # ── 메타-우선 근거 점수 ──────────────────────────────────────────────
    # 메타 1.5(max 3) + 메가트라이얼 1.2(max 2.4) + 일반RCT 0.3(max 1.5) + 일관성 1
    n_mega = agg.get("n_mega", 0)
    n_rct_plain = max(n_rct - n_mega, 0)
    ev_meta = min(n_meta * 1.5, 3.0)
    ev_mega = min(n_mega * 1.2, 2.4)
    ev_rct = min(n_rct_plain * 0.3, 1.5)
    ev_cons = (agg.get("consistency") or 0) * 1.0
    bonus = 0.5 if (agg.get("total_sample_size") or 0) >= 5000 else 0.0
    base_evidence = ev_meta + ev_mega + ev_rct + ev_cons + bonus

    # 잘 검증된 메타는 그 자체로 근거점수 하한을 보장 (영선 비전: 메타를 기둥으로)
    tier = agg.get("best_meta_tier")
    floor = QUALITY_FLOOR.get(tier or "", 0.0)
    evidence = min(max(base_evidence, floor), 5.0)

    # negative가 많으면 efficacy 패널티
    neg = agg["direction_dist"].get("negative", 0)
    total_dir = sum(agg["direction_dist"].values()) or 1
    if neg / total_dir > 0.4 and smd is None:
        efficacy = min(efficacy, 1.0)

    # null_effect 우세 → F. 신뢰 가능한 메타(strong/good)면 1편만으로도, 아니면 3편 이상일 때.
    null_eff_count = agg["category_dist"].get("null_effect", 0)
    cat_total = sum(agg["category_dist"].values()) or 1
    trustworthy_meta = tier in ("strong", "good")
    null_dominant = (null_eff_count / cat_total >= 0.6) and (
        (n_meta + n_rct) >= 3 or trustworthy_meta
    )

    has_mega = n_mega > 0

    # ── 근거 견고성 상한(cap): 어디까지 등급을 줄 수 있나 ──────────────────
    if tier == "strong":
        cap = "A"                                   # 강한 메타 단독으로 A 가능
    elif tier == "good" and (n_meta >= 2 or has_mega):
        cap = "A"                                   # 양호 메타 + 보강 → A
    elif tier == "good" or has_mega:
        cap = "B"                                   # 양호 메타 단독 / 메가트라이얼 단독 → B
    elif total_quality >= 3:
        cap = "A"                                   # 논문 다수(기존 경로)
    elif total_quality >= 2:
        cap = "B"
    else:
        cap = "C"                                   # 근거 빈약 → 보수적

    # ── 임계값 기반 1차 등급 (편수 게이트 제거; 견고성은 cap이 담당) ──────
    if null_dominant:
        grade = "F"
    elif efficacy >= 3.5 and evidence >= 3.5:
        grade = "A"
    elif efficacy >= 2.5 and evidence >= 2.5:
        grade = "B"
    elif efficacy >= 1.0 and evidence >= 1.0:
        grade = "C"
    elif total_quality >= 1 or n_obs >= 3:
        grade = "D"
    else:
        grade = "I"

    # cap 적용 (F/I는 별도 의미라 제외)
    order = ["A", "B", "C", "D", "F", "I"]
    if grade in ("A", "B", "C", "D") and order.index(grade) < order.index(cap):
        grade = cap

    # ── 요약 문구 ────────────────────────────────────────────────────────
    GRADE_LABEL = {
        "A": "강력한 효과", "B": "효과 있음", "C": "가능성 있음",
        "D": "근거 약함", "F": "신뢰 가능한 근거가 효과 없음으로 수렴", "I": "데이터 부족",
    }
    if grade in ("F", "I"):
        summary = GRADE_LABEL[grade]
    else:
        bits = [eff_source, f"메타 {n_meta}+RCT {n_rct}"]
        if n_mega:
            bits.append(f"메가트라이얼 {n_mega}")
        tier_ko = {"strong": "강한 메타", "good": "양호 메타"}.get(tier or "")
        if tier_ko:
            grade_disp = (agg.get("best_meta_grade") or "").upper()
            bits.append(f"{tier_ko}{f'(GRADE {grade_disp})' if grade_disp else ''}")
        summary = f"{GRADE_LABEL[grade]} ({', '.join(bits)})"

    return grade, round(efficacy, 2), round(evidence, 2), summary


def upsert_cell(sb: Client, condition_id: str, substance_id: str, population_id: str,
                agg: dict, grade: str, efficacy: float, evidence: float, summary: str,
                dry_run: bool):
    """evidence_cells에 ai_* 컬럼 업데이트 (없으면 insert)."""
    extra = {
        "v3": True,
        "meta_tier": agg.get("best_meta_tier"),
        "meta_grade": agg.get("best_meta_grade"),
        "n_mega_trial": agg.get("n_mega", 0),
        "category_dist": agg["category_dist"],
        "direction_dist": agg["direction_dist"],
        "clinical_importance_dist": agg["clinical_importance_dist"],
        "n_smd_extracts": agg["n_smd_extracts"],
        "mds_sample": agg["mds"][:5],
        "narratives": agg["narratives"],
    }
    row = {
        "substance_id": substance_id,
        "condition_id": condition_id,
        "population_id": population_id,
        "ai_grade": grade,
        "ai_efficacy_score": efficacy,
        "ai_evidence_score": evidence,
        "ai_summary_ko": summary,
        "ai_calculated_at": "now()",
        "smd_pooled": agg["smd_pooled"],
        "study_count_meta": agg["n_meta"],
        "study_count_rct": agg["n_rct"],
        "study_count_obs": agg["n_obs"],
        "total_sample_size": agg.get("total_sample_size") or 0,
        "consistency": agg.get("consistency") or 0,
        "extra": extra,
    }
    if dry_run:
        log.info(f"  [DRY] {substance_id[:8]}: grade={grade} eff={efficacy} evi={evidence}")
        return
    # ai_calculated_at은 "now()" 문자열로 못 보내므로 제거하고 DB default trigger에 맡김
    row.pop("ai_calculated_at", None)
    sb.table("evidence_cells").upsert(
        row, on_conflict="substance_id,condition_id,population_id"
    ).execute()


def main() -> int:
    parser = argparse.ArgumentParser(description="FactPick grade calculator v3")
    parser.add_argument("--condition", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    log.info(f"=== 등급 산출 v3: {args.condition} ===")
    cond, healthy, rows = fetch_cells_data(sb, args.condition)
    ext_map = fetch_extractions(sb, cond["id"])
    log.info(f"  total sse rows: {len(rows)} | extractions_v2: {len(ext_map)}")

    by_sub: dict[str, list] = defaultdict(list)
    for r in rows:
        by_sub[r["substance_id"]].append(r)
    log.info(f"  활성 셀(성분): {len(by_sub)}개")

    sub_names = fetch_substance_names(sb, list(by_sub.keys()))

    grade_dist = Counter()
    summary_lines = []
    for sub_id, sub_rows in by_sub.items():
        agg = aggregate_cell(sub_rows, ext_map)
        grade, eff, evi, summary = calculate_grade(agg)
        grade_dist[grade] += 1
        nm = sub_names.get(sub_id, "?")
        line = (
            f"  {grade}  {nm:20} eff={eff:.1f} evi={evi:.1f} | "
            f"meta={agg['n_meta']} rct={agg['n_rct']} obs={agg['n_obs']} | "
            f"smd={agg['smd_pooled']:+.2f} ({agg['n_smd_extracts']}편)" if agg["smd_pooled"] is not None else
            f"  {grade}  {nm:20} eff={eff:.1f} evi={evi:.1f} | "
            f"meta={agg['n_meta']} rct={agg['n_rct']} obs={agg['n_obs']} | smd=N/A"
        )
        summary_lines.append((grade, line))
        upsert_cell(sb, cond["id"], sub_id, healthy["id"], agg, grade, eff, evi, summary, args.dry_run)

    summary_lines.sort(key=lambda x: ["A", "B", "C", "D", "F", "I"].index(x[0]))
    for _, ln in summary_lines:
        log.info(ln)

    log.info(f"\n=== 등급 분포 ===")
    for g in ["A", "B", "C", "D", "F", "I"]:
        if grade_dist.get(g):
            log.info(f"  {g}: {grade_dist[g]}개")

    return 0


if __name__ == "__main__":
    sys.exit(main())
