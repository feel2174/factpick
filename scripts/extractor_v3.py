"""FactPick PICO 추출기 v3.

영선의 비전:
  - 한 abstract = 한 번만 읽음
  - 모드 두 가지:
      META_SR: 메타분석/SR → multi-substance 추출 (한 abstract에서 N개 성분 정보)
      RCT:     단일 쌍 RCT → 정밀 SMD/CI + 설계/안전성
  - 결과는 study_extractions_v2 + study_substance_effects 두 테이블에 저장
  - "틀에 안 맞는 정보 버리지 않기" — extra_notes/narrative 보존

큐는 build_extraction_queue_v3.py가 study_extractions_v2.extra의 priority_rank로 만들지만,
직접 study_id list로도 실행 가능.

사용 예:
  python extractor_v3.py --condition osteoarthritis --limit 50
  python extractor_v3.py --condition osteoarthritis --mode meta_sr --limit 30
  python extractor_v3.py --condition osteoarthritis --mode rct --limit 30
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
from claude_extractor import call_claude  # noqa: E402
from prompts_v3 import META_SR_PROMPT, RCT_PROMPT  # noqa: E402

from supabase import Client, create_client  # noqa: E402

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("extractor_v3")


# ==============================================================================
# Substance name 매칭
# ==============================================================================

def _norm(s: str) -> str:
    """Lowercase + 공백/하이픈/구두점 정규화 + 한글 NFC."""
    s = unicodedata.normalize("NFKC", s).lower()
    return "".join(ch for ch in s if ch.isalnum() or ch in (" ", "-")).strip()


def _variants(key: str) -> list[str]:
    """단복수 + 일부 접미 변형을 생성."""
    if not key:
        return []
    out = {key}
    # 단복수 (영문 기본 규칙)
    if key.endswith("s") and len(key) >= 4:
        out.add(key[:-1])
        if key.endswith("es") and len(key) >= 5:
            out.add(key[:-2])
    else:
        out.add(key + "s")
        if key.endswith(("sh", "ch", "x", "ss")):
            out.add(key + "es")
    # 'curcumin' ↔ 'curcuminoid'/'curcuminoids' 같은 접미
    if not key.endswith("oid") and len(key) >= 5:
        out.add(key + "oid")
        out.add(key + "oids")
    return list(out)


def build_substance_matcher(sb: Client) -> dict[str, str]:
    """raw 성분명 → substance_id 매핑.
    name_ko, name_en, aliases(JSONB) 모두 + 단복수/접미 변형까지 인덱싱.
    """
    rows = sb.table("substances").select("id, slug, name_ko, name_en, aliases").execute().data
    idx: dict[str, str] = {}
    for r in rows:
        sid = r["id"]
        candidates = [r.get("name_ko"), r.get("name_en"), r.get("slug")] + (r.get("aliases") or [])
        for c in candidates:
            if not c:
                continue
            base = _norm(str(c))
            for v in _variants(base):
                if v and v not in idx:
                    idx[v] = sid
    return idx


def match_substance(raw_name: str, idx: dict[str, str]) -> Optional[str]:
    """raw 이름을 substance_id로 매핑. 못 찾으면 None.

    매칭 규칙 (영선의 비전: 정보 손실보다 잘못된 매칭이 더 나쁨):
    1. 정확 일치 우선
    2. 키가 짧으면(<=5) 정확 일치만 허용 (예: NAC가 diclofeNAC에 잘못 매칭되는 거 방지)
    3. 키가 길면(>=6) 단어 경계 매칭만 (단순 부분문자열 X)
    """
    if not raw_name:
        return None
    n = _norm(raw_name)
    if not n:
        return None
    if n in idx:
        return idx[n]
    # 단어 토큰으로 분리
    tokens = set(n.split())
    # 긴 키 우선 (예: 'vitamin d3' > 'vitamin d')
    for k in sorted(idx.keys(), key=len, reverse=True):
        if len(k) < 3:
            continue
        if len(k) <= 5:
            # 짧은 키는 정확 일치 또는 단어 토큰 일치만
            if k == n or k in tokens:
                return idx[k]
            continue
        # 긴 키: 단어 경계 매칭 (양방향)
        k_tokens = set(k.split())
        # k의 모든 단어가 n의 단어 시퀀스에 부분 시퀀스로 포함
        if k_tokens.issubset(tokens):
            return idx[k]
        # 반대로 n이 k의 단어 시퀀스에 포함 (예: n='msm'은 k='methylsulfonylmethane msm'에 토큰 매칭)
        if tokens.issubset(k_tokens) and len(tokens) >= 1 and len(n) >= 4:
            return idx[k]
    return None


# ==============================================================================
# Tasks
# ==============================================================================

@dataclass
class Task:
    study_id: str
    pubmed_id: str
    title: str
    abstract: str
    study_type: str
    sample_size: Optional[int]
    year: Optional[int]
    condition_id: str
    condition_name_ko: str
    condition_name_en: str
    # RCT 모드: 어떤 성분을 단일 쌍으로 정밀 분석할지
    substance_focus_id: Optional[str] = None
    substance_focus_name_ko: Optional[str] = None
    substance_focus_name_en: Optional[str] = None


def select_tasks(
    sb: Client,
    condition_slug: str,
    mode: Optional[str],
    limit: int,
    min_rct_n: int = 200,
) -> list[Task]:
    """추출할 study 후보 선정.

    mode='meta_sr': 해당 condition의 매핑된 메타/SR 중 v2에 아직 추출 안 된 것
    mode='rct': 해당 condition × (성분) 쌍 RCT 중 n>=min_rct_n + v2에 아직 없는 것
    mode=None: 메타/SR 먼저, 그 다음 RCT
    """
    cond = (
        sb.table("conditions")
        .select("id, name_ko, name_en")
        .eq("slug", condition_slug)
        .single()
        .execute()
        .data
    )

    # 기존 매핑(study × substance × condition)에서 사용 가능한 후보 가져옴
    ext = (
        sb.table("study_extractions")
        .select("study_id, substance_id")
        .eq("condition_id", cond["id"])
        .eq("is_valid", True)
        .execute()
        .data
    )

    study_ids = list({e["study_id"] for e in ext})
    if not study_ids:
        return []

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

    # v2에 이미 (study × mode × focus) 있는 거 빼기
    existing = (
        sb.table("study_extractions_v2")
        .select("study_id, extraction_mode, substance_focus_id")
        .eq("condition_id", cond["id"])
        .execute()
        .data
    )
    done_meta: set[str] = {e["study_id"] for e in existing if e["extraction_mode"] == "meta_sr"}
    done_rct: set[tuple[str, Optional[str]]] = {
        (e["study_id"], e["substance_focus_id"])
        for e in existing
        if e["extraction_mode"] == "rct"
    }

    sub_ids = list({e["substance_id"] for e in ext})
    sub_map = {
        s["id"]: s
        for s in sb.table("substances").select("id, name_ko, name_en").in_("id", sub_ids).execute().data
    }

    tasks: list[Task] = []

    if mode in (None, "meta_sr"):
        for sid in study_ids:
            st = studies_map.get(sid)
            if not st or not st.get("abstract"):
                continue
            if st["study_type"] not in ("meta_analysis", "systematic_review"):
                continue
            if sid in done_meta:
                continue
            tasks.append(
                Task(
                    study_id=sid,
                    pubmed_id=st["pubmed_id"],
                    title=st["title"] or "",
                    abstract=st["abstract"] or "",
                    study_type=st["study_type"],
                    sample_size=st.get("sample_size"),
                    year=st.get("year"),
                    condition_id=cond["id"],
                    condition_name_ko=cond["name_ko"],
                    condition_name_en=cond["name_en"],
                )
            )

    if mode in (None, "rct"):
        # RCT는 (study × substance) 쌍 단위로 추출
        rct_pairs = []
        for e in ext:
            st = studies_map.get(e["study_id"])
            if not st or not st.get("abstract"):
                continue
            if st["study_type"] != "rct":
                continue
            n = st.get("sample_size") or 0
            if n < min_rct_n:
                continue
            if (e["study_id"], e["substance_id"]) in done_rct:
                continue
            rct_pairs.append((e, n))
        # n 큰 순서로
        rct_pairs.sort(key=lambda x: -x[1])
        for e, _n in rct_pairs:
            st = studies_map[e["study_id"]]
            sub = sub_map.get(e["substance_id"], {})
            tasks.append(
                Task(
                    study_id=e["study_id"],
                    pubmed_id=st["pubmed_id"],
                    title=st["title"] or "",
                    abstract=st["abstract"] or "",
                    study_type=st["study_type"],
                    sample_size=st.get("sample_size"),
                    year=st.get("year"),
                    condition_id=cond["id"],
                    condition_name_ko=cond["name_ko"],
                    condition_name_en=cond["name_en"],
                    substance_focus_id=e["substance_id"],
                    substance_focus_name_ko=sub.get("name_ko"),
                    substance_focus_name_en=sub.get("name_en"),
                )
            )

    return tasks[:limit]


# ==============================================================================
# Persistence
# ==============================================================================

def upsert_meta_sr(
    sb: Client,
    task: Task,
    parsed: dict,
    raw: Optional[str],
    matcher: dict[str, str],
    dry_run: bool,
) -> tuple[int, int]:
    """meta_sr 결과를 v2 + sse에 저장. (성분수, 매핑된수) 반환."""
    substances = parsed.get("substances") or []

    v2_row = {
        "study_id": task.study_id,
        "condition_id": task.condition_id,
        "extraction_mode": "meta_sr",
        "primary_condition": parsed.get("primary_condition"),
        "study_design_summary": parsed.get("study_design_summary"),
        "n_studies_included": _to_int(parsed.get("n_studies_included")),
        "total_sample_size": _to_int(parsed.get("total_sample_size")),
        "evidence_grade_stated": parsed.get("evidence_grade_stated"),
        "is_multi_substance": parsed.get("is_multi_substance"),
        "head_to_head_comparisons": parsed.get("head_to_head_comparisons"),
        "safety_notes": parsed.get("safety_notes"),
        "limitations": parsed.get("limitations"),
        "authors_conclusion": parsed.get("authors_conclusion"),
        "extra_notes": parsed.get("extra_notes"),
        "ai_raw_response": (raw or "")[:5000],
        "is_valid": True,
        "substance_focus_id": None,
    }

    if dry_run:
        log.info(f"  [DRY] meta_sr v2 + sse {len(substances)}건")
        return len(substances), 0

    v2_resp = (
        sb.table("study_extractions_v2")
        .upsert(v2_row, on_conflict="study_id,condition_id,extraction_mode,substance_focus_id")
        .execute()
    )
    if not v2_resp.data:
        log.warning("  upsert v2 데이터 비어있음")
        return 0, 0
    v2_id = v2_resp.data[0]["id"]

    # 같은 (v2) 의 기존 sse 한번 정리 (재실행시 중복 방지)
    sb.table("study_substance_effects").delete().eq("extraction_v2_id", v2_id).execute()

    sse_rows = []
    matched = 0
    for s in substances:
        raw_name = s.get("name_raw") or s.get("name") or ""
        sub_id = match_substance(raw_name, matcher)
        if sub_id:
            matched += 1
        sse_rows.append({
            "extraction_v2_id": v2_id,
            "study_id": task.study_id,
            "condition_id": task.condition_id,
            "substance_id": sub_id,
            "substance_name_raw": raw_name[:300],
            "intervention_detail": _trim(s.get("intervention_detail")),
            "comparator": _trim(s.get("comparator")),
            "outcome_measure": _trim(s.get("outcome_measure")),
            "timepoint": _trim(s.get("timepoint")),
            "effect_metric": _trim(s.get("effect_metric")),
            "effect_value": _to_num(s.get("effect_value")),
            "ci_lower": _to_num(s.get("ci_lower")),
            "ci_upper": _to_num(s.get("ci_upper")),
            "p_value": _to_num(s.get("p_value")),
            "n_studies_for_substance": _to_int(s.get("n_studies_for_this_substance")),
            "effect_size_category": _clean_enum(s.get("effect_size_category"),
                {"large","moderate","small","null_effect","negative","unclear"}),
            "clinical_importance": _clean_enum(s.get("clinical_importance"),
                {"clinically_important","not_clinically_important","unclear"}),
            "effect_direction": _clean_enum(s.get("effect_direction"),
                {"positive","null","negative","mixed"}),
            "narrative": _trim(s.get("narrative"), max_len=1000),
            "quality_note": _trim(s.get("quality_note"), max_len=1000),
            "source_study_type": task.study_type,
            "is_primary_outcome": False,
            "study_sample_size": task.sample_size,
            "study_year": task.year,
            "is_valid": True,
        })
    if sse_rows:
        # 500개씩 끊어서 insert
        for i in range(0, len(sse_rows), 500):
            sb.table("study_substance_effects").insert(sse_rows[i:i+500]).execute()
    return len(substances), matched


def upsert_rct(
    sb: Client,
    task: Task,
    parsed: dict,
    raw: Optional[str],
    matcher: dict[str, str],
    dry_run: bool,
) -> tuple[int, int]:
    primary = parsed.get("primary_outcome") or {}
    design = parsed.get("design_features") or {}

    v2_row = {
        "study_id": task.study_id,
        "condition_id": task.condition_id,
        "extraction_mode": "rct",
        "substance_focus_id": task.substance_focus_id,
        "primary_condition": parsed.get("primary_condition"),
        "comparator": parsed.get("comparator"),
        "population_detail": parsed.get("population_detail"),
        "population_type": parsed.get("population_type"),
        "sample_size_total": _to_int(parsed.get("sample_size_total")),
        "sample_size_treatment": _to_int(parsed.get("sample_size_treatment")),
        "sample_size_control": _to_int(parsed.get("sample_size_control")),
        "design_features": design,
        "dose_value": _to_num(parsed.get("dose_value")),
        "dose_unit": parsed.get("dose_unit"),
        "duration_weeks": _to_int(parsed.get("duration_weeks")),
        "primary_outcome": primary,
        "secondary_outcomes": parsed.get("secondary_outcomes"),
        "relevance_score": _to_num(parsed.get("relevance_score")),
        "extraction_confidence": _to_num(parsed.get("extraction_confidence")),
        "safety_notes": parsed.get("safety_notes"),
        "limitations": parsed.get("limitations"),
        "authors_conclusion": parsed.get("authors_conclusion"),
        "extra_notes": parsed.get("extra_notes"),
        "ai_raw_response": (raw or "")[:5000],
        "is_valid": True,
        "is_multi_substance": False,
    }

    if dry_run:
        log.info(f"  [DRY] rct v2 + sse 1건")
        return 1, 1 if task.substance_focus_id else 0

    v2_resp = (
        sb.table("study_extractions_v2")
        .upsert(v2_row, on_conflict="study_id,condition_id,extraction_mode,substance_focus_id")
        .execute()
    )
    if not v2_resp.data:
        return 0, 0
    v2_id = v2_resp.data[0]["id"]
    sb.table("study_substance_effects").delete().eq("extraction_v2_id", v2_id).execute()

    raw_name = task.substance_focus_name_en or task.substance_focus_name_ko or "?"
    sse_row = {
        "extraction_v2_id": v2_id,
        "study_id": task.study_id,
        "condition_id": task.condition_id,
        "substance_id": task.substance_focus_id,
        "substance_name_raw": raw_name[:300],
        "intervention_detail": _trim(parsed.get("substance_focus")),
        "comparator": _trim(parsed.get("comparator")),
        "outcome_measure": _trim(primary.get("measure")),
        "timepoint": None,
        "effect_metric": _trim(primary.get("effect_metric")),
        "effect_value": _to_num(primary.get("effect_value")),
        "ci_lower": _to_num(primary.get("ci_lower")),
        "ci_upper": _to_num(primary.get("ci_upper")),
        "p_value": _to_num(primary.get("p_value")),
        "n_studies_for_substance": 1,
        "effect_size_category": _clean_enum(primary.get("effect_size_category"),
            {"large","moderate","small","null_effect","negative","unclear"}),
        "clinical_importance": None,
        "effect_direction": _clean_enum(primary.get("effect_direction"),
            {"positive","null","negative","mixed"}),
        "narrative": _trim(primary.get("narrative"), max_len=1000),
        "quality_note": _trim(parsed.get("limitations"), max_len=1000),
        "source_study_type": task.study_type,
        "is_primary_outcome": True,
        "study_sample_size": task.sample_size,
        "study_year": task.year,
        "is_valid": True,
    }
    sb.table("study_substance_effects").insert(sse_row).execute()
    return 1, 1 if task.substance_focus_id else 0


# ==============================================================================
# Helpers
# ==============================================================================

def _to_int(v) -> Optional[int]:
    if v is None or v == "":
        return None
    try:
        return int(float(v))
    except (ValueError, TypeError):
        return None


def _to_num(v) -> Optional[float]:
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (ValueError, TypeError):
        return None


def _trim(s, max_len: int = 300) -> Optional[str]:
    if not s:
        return None
    return str(s)[:max_len]


def _clean_enum(v, allowed: set[str]) -> Optional[str]:
    if v is None:
        return None
    s = str(v).strip().lower()
    return s if s in allowed else None


# ==============================================================================
# Main
# ==============================================================================

def main() -> int:
    parser = argparse.ArgumentParser(description="FactPick extractor v3 (multi-substance + RCT precision)")
    parser.add_argument("--condition", required=True, help="condition slug (e.g., osteoarthritis)")
    parser.add_argument("--mode", choices=["meta_sr", "rct"], help="모드 (생략시 둘 다)")
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--min-rct-n", type=int, default=200)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.0, help="추출 사이 대기 (초)")
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    log.info("성분 매처 빌드...")
    matcher = build_substance_matcher(sb)
    log.info(f"  매처 키 {len(matcher)}개")

    log.info(f"작업 선정 중... condition={args.condition} mode={args.mode or 'all'} limit={args.limit}")
    tasks = select_tasks(sb, args.condition, args.mode, args.limit, args.min_rct_n)
    log.info(f"  대상 {len(tasks)}편")
    if not tasks:
        log.info("할 일 없음.")
        return 0

    stats = {"ok": 0, "fail": 0, "subs": 0, "matched": 0, "meta_sr": 0, "rct": 0}

    for i, task in enumerate(tasks, 1):
        is_rct = task.substance_focus_id is not None
        focus = task.substance_focus_name_ko or ""
        log.info(
            f"[{i}/{len(tasks)}] PMID {task.pubmed_id} | {task.study_type} | "
            f"{'RCT focus='+focus if is_rct else 'meta_sr'} | n={task.sample_size or '?'}"
        )

        if is_rct:
            prompt = RCT_PROMPT.format(
                substance_name_en=task.substance_focus_name_en or "?",
                substance_name_ko=task.substance_focus_name_ko or "?",
                condition_name_en=task.condition_name_en,
                condition_name_ko=task.condition_name_ko,
                title=task.title[:300],
                abstract=task.abstract[:3000],
            )
        else:
            prompt = META_SR_PROMPT.format(
                condition_name_en=task.condition_name_en,
                condition_name_ko=task.condition_name_ko,
                title=task.title[:300],
                abstract=task.abstract[:3000],
            )

        try:
            parsed, raw = call_claude(prompt)
        except RuntimeError as e:
            if "RATE_LIMIT" in str(e):
                log.error("Claude 한도. 중단.")
                return 2
            raise

        if not parsed:
            stats["fail"] += 1
            log.warning("  ❌ 파싱 실패")
            continue

        try:
            if is_rct:
                n_subs, matched = upsert_rct(sb, task, parsed, raw, matcher, args.dry_run)
                stats["rct"] += 1
            else:
                n_subs, matched = upsert_meta_sr(sb, task, parsed, raw, matcher, args.dry_run)
                stats["meta_sr"] += 1
            stats["ok"] += 1
            stats["subs"] += n_subs
            stats["matched"] += matched
            log.info(f"  ✓ 성분 {n_subs}개 추출 (DB 매핑 {matched}개)")
        except Exception as e:
            stats["fail"] += 1
            log.exception(f"  upsert 실패: {e}")

        if args.sleep > 0:
            time.sleep(args.sleep)

    log.info(
        f"\n=== 완료 === ok={stats['ok']} fail={stats['fail']} "
        f"meta_sr={stats['meta_sr']} rct={stats['rct']} "
        f"sse_rows={stats['subs']} matched={stats['matched']}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
