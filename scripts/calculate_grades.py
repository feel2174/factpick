#!/usr/bin/env python3
"""
FactPick Grade Calculator
==========================
PICO 추출이 완료된 study_extractions 데이터를 종합해서
evidence_cells에 등급(A~F) 자동 산출.

처리 흐름:
  1. extracted_at 있는 (성분 × 적응증 × 인구집단) 셀 찾기
  2. 각 셀마다 매핑된 추출 데이터 집계:
     - 논문 수 (메타분석/RCT/관찰)
     - 합산 효과 크기 (SMD pooled)
     - 신뢰구간, I² (이질성)
     - 일관성 (positive 비율)
  3. evidence_cells 테이블에 INSERT/UPDATE
  4. SQL 함수 calculate_evidence_grade() 호출해서 grade 산출
  5. 등급 변경된 셀은 자동으로 review_status='pending'

사용법:
  python calculate_grades.py                   # 모든 셀 재계산
  python calculate_grades.py --substance msm   # 특정 성분만
  python calculate_grades.py --dry-run         # 결과만 보기, DB 변경 X
"""

from __future__ import annotations

import argparse
import logging
import os
import statistics
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# 로깅
log_dir = Path.home() / "factpick" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"grades_{date.today().isoformat()}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file, mode="a", encoding="utf-8"),
    ],
)
log = logging.getLogger("grades")


# ==============================================================================
# 데이터 수집
# ==============================================================================

def fetch_all_extractions(client, substance_filter: Optional[str] = None):
    """추출 완료된 study_extractions를 모두 가져옴 (페이지네이션)."""
    query = client.table("study_extractions").select(
        "id, study_id, substance_id, condition_id, population_id, "
        "effect_direction, effect_metric, effect_value, ci_lower, ci_upper, "
        "p_value, dose_value, dose_unit, duration_weeks, rob_score, "
        "ai_confidence, is_valid, extra"
    ).not_.is_("extracted_at", "null").eq("is_valid", True)
    
    if substance_filter:
        sub_q = client.table("substances").select("id").eq("slug", substance_filter).execute()
        if not sub_q.data:
            log.warning(f"성분 slug 못 찾음: {substance_filter}")
            return []
        query = query.eq("substance_id", sub_q.data[0]["id"])
    
    # 페이지네이션
    all_data = []
    offset = 0
    page_size = 1000
    while True:
        page = query.range(offset, offset + page_size - 1).execute()
        if not page.data:
            break
        all_data.extend(page.data)
        if len(page.data) < page_size:
            break
        offset += page_size
    
    return all_data


def fetch_studies_metadata(client, study_ids: list[str]) -> dict:
    """study_id → {study_type, year, ...}."""
    if not study_ids:
        return {}
    result = {}
    for i in range(0, len(study_ids), 500):
        batch = study_ids[i:i+500]
        page = client.table("studies").select(
            "id, study_type, year, sample_size, raw_metadata"
        ).in_("id", batch).execute()
        for s in page.data:
            result[s["id"]] = s
    return result


# ==============================================================================
# 셀별 집계
# ==============================================================================

def aggregate_cell(extractions: list[dict], studies_map: dict) -> dict:
    """한 셀의 추출 데이터를 집계."""
    
    study_count_meta = 0
    study_count_rct = 0
    study_count_obs = 0
    total_sample_size = 0
    effect_values = []
    positive_count = 0
    null_count = 0
    negative_count = 0
    doses = []
    durations = []
    confidence_scores = []
    
    for ext in extractions:
        study = studies_map.get(ext["study_id"], {})
        st_type = study.get("study_type", "")
        
        # study type 카운트
        if st_type in ("meta_analysis", "systematic_review"):
            study_count_meta += 1
        elif st_type == "rct":
            study_count_rct += 1
        elif st_type in ("cohort", "case_control", "observational"):
            study_count_obs += 1
        
        # 표본 크기 누적
        n = study.get("sample_size") or 0
        if n:
            total_sample_size += n
        
        # 효과 방향 카운트
        direction = ext.get("effect_direction")
        if direction == "positive":
            positive_count += 1
        elif direction == "null":
            null_count += 1
        elif direction == "negative":
            negative_count += 1
        
        # 효과 크기 (SMD/MD만 합산 가능)
        if ext.get("effect_metric") in ("SMD", "MD") and ext.get("effect_value") is not None:
            try:
                ev = float(ext["effect_value"])
                # 메타분석은 가중치 3, RCT는 1, 관찰은 0.3
                weight = 3 if st_type in ("meta_analysis", "systematic_review") else \
                         1 if st_type == "rct" else 0.3
                effect_values.append((ev, weight))
            except (ValueError, TypeError):
                pass
        
        # 용량 / 기간
        if ext.get("dose_value"):
            try:
                doses.append(float(ext["dose_value"]))
            except (ValueError, TypeError):
                pass
        if ext.get("duration_weeks"):
            try:
                durations.append(int(ext["duration_weeks"]))
            except (ValueError, TypeError):
                pass
        
        # 신뢰도
        if ext.get("ai_confidence") is not None:
            try:
                confidence_scores.append(float(ext["ai_confidence"]))
            except (ValueError, TypeError):
                pass
    
    # 가중 평균 효과 크기
    smd_pooled = None
    if effect_values:
        total_weight = sum(w for _, w in effect_values)
        if total_weight > 0:
            smd_pooled = sum(v * w for v, w in effect_values) / total_weight
    
    # 일관성 = positive 비율 (null/negative는 부정적 신호)
    total_directed = positive_count + null_count + negative_count
    consistency = positive_count / total_directed if total_directed > 0 else 0
    
    # 용량 범위
    dose_min = min(doses) if doses else None
    dose_max = max(doses) if doses else None
    
    return {
        "study_count_meta": study_count_meta,
        "study_count_rct": study_count_rct,
        "study_count_obs": study_count_obs,
        "total_sample_size": total_sample_size,
        "smd_pooled": smd_pooled,
        "consistency": consistency,
        "dose_min": dose_min,
        "dose_max": dose_max,
        "positive_count": positive_count,
        "null_count": null_count,
        "negative_count": negative_count,
        "avg_confidence": statistics.mean(confidence_scores) if confidence_scores else None,
        "n_extractions": len(extractions),
    }


def calculate_grade(agg: dict) -> tuple[str, float, float]:
    """집계 결과로 등급(A~F, I), efficacy_score, evidence_score 계산.
    
    동일 알고리즘: 03_helper_functions.sql의 calculate_evidence_grade()와 일치
    
    등급:
      A: 강력 추천 (메타분석 다수 + 효과 명확)
      B: 추천 (RCT 다수 + 효과 일관)
      C: 가능성 있음 (RCT 일부, 효과 작거나 일관성 부족)
      D: 근거 부족 (관찰연구 수준)
      F: 효과 없음/위험 (충분한 데이터로 negative 입증)
      I: 데이터 부족 (Insufficient evidence — 판단 보류)
    """
    # 데이터 부족 체크 — 먼저
    total_quality_studies = agg["study_count_meta"] + agg["study_count_rct"]
    n_valid = agg.get("n_extractions", 0)
    
    # 유효 추출이 너무 적으면 I (Insufficient)
    if n_valid < 2:
        return "I", 0.0, 0.0
    
    # evidence_score (0~5)
    evidence_score = min(
        min(agg["study_count_meta"] * 1.5, 3.0) +
        min(agg["study_count_rct"] * 0.3, 1.5) +
        min(agg["study_count_obs"] * 0.1, 0.5) +
        agg["consistency"] * 1.0,
        5.0
    )
    evidence_score = max(evidence_score, 0)
    
    # efficacy_score (0~5)
    smd = agg.get("smd_pooled")
    if smd is not None:
        efficacy_score = min(abs(smd) * 2.5, 5.0)
    else:
        # SMD 없으면 일관성으로 추정
        efficacy_score = agg["consistency"] * 3.0  # 최대 3
    
    # grade — F 기준 강화: 최소 5편 이상 + 일관성 < 0.3 + negative가 1편 이상
    if total_quality_studies >= 5 and agg["consistency"] < 0.3 and agg["negative_count"] >= 1:
        grade = "F"
    # 추가 안전장치: 논문 3편 미만이면 최대 C등급
    elif total_quality_studies < 3:
        if evidence_score >= 2 and efficacy_score >= 1:
            grade = "C"
        elif evidence_score >= 1:
            grade = "D"
        else:
            grade = "I"  # 데이터 부족
    elif evidence_score >= 4 and efficacy_score >= 3:
        grade = "A"
    elif evidence_score >= 3 and efficacy_score >= 2:
        grade = "B"
    elif evidence_score >= 2 and efficacy_score >= 1:
        grade = "C"
    elif evidence_score >= 1:
        grade = "D"
    else:
        grade = "I"  # 매우 부족
    
    return grade, round(efficacy_score, 2), round(evidence_score, 2)


# ==============================================================================
# DB 업데이트
# ==============================================================================

def upsert_evidence_cell(client, substance_id: str, condition_id: str, population_id: str,
                          agg: dict, grade: str, efficacy: float, evidence_s: float,
                          ai_summary: str, dry_run: bool = False):
    """evidence_cells에 INSERT or UPDATE."""
    
    if not population_id:
        # population 없으면 healthy_adult 사용
        pop_q = client.table("populations").select("id").eq("is_default", True).limit(1).execute()
        if pop_q.data:
            population_id = pop_q.data[0]["id"]
        else:
            return
    
    data = {
        "substance_id": substance_id,
        "condition_id": condition_id,
        "population_id": population_id,
        "ai_efficacy_score": efficacy,
        "ai_evidence_score": evidence_s,
        "ai_grade": grade,
        "smd_pooled": agg.get("smd_pooled"),
        "study_count_meta": agg["study_count_meta"],
        "study_count_rct": agg["study_count_rct"],
        "study_count_obs": agg["study_count_obs"],
        "total_sample_size": agg["total_sample_size"],
        "consistency": round(agg["consistency"], 2),
        "dose_min": agg.get("dose_min"),
        "dose_max": agg.get("dose_max"),
        "ai_summary_ko": ai_summary[:500] if ai_summary else None,
        "review_status": "pending",  # 영선님 검토 대기
    }
    
    if dry_run:
        return
    
    try:
        # 기존 row 있는지 확인
        existing = client.table("evidence_cells").select("id").eq(
            "substance_id", substance_id
        ).eq("condition_id", condition_id).eq("population_id", population_id).execute()
        
        if existing.data:
            # UPDATE
            cell_id = existing.data[0]["id"]
            result = client.table("evidence_cells").update(data).eq("id", cell_id).execute()
            if not result.data:
                log.warning(f"  UPDATE 결과 비어있음: cell_id={cell_id}")
        else:
            # INSERT
            result = client.table("evidence_cells").insert(data).execute()
            if not result.data:
                log.warning(f"  INSERT 결과 비어있음")
    except Exception as e:
        log.error(f"  DB 저장 실패 ({substance_id[:8]}/{condition_id[:8]}): {e}")


# ==============================================================================
# 메인
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="FactPick Grade Calculator")
    parser.add_argument("--substance", type=str, help="특정 성분 slug만")
    parser.add_argument("--dry-run", action="store_true", help="DB 변경 없이 보기")
    args = parser.parse_args()
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL/KEY 누락")
        sys.exit(1)
    
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    log.info("=" * 60)
    log.info("FactPick 등급 산출 시작")
    log.info(f"  대상 성분: {args.substance or '전체'}")
    log.info(f"  Dry run: {args.dry_run}")
    log.info("=" * 60)
    
    # 1) 추출 완료된 데이터 로드
    log.info("\n[1/4] 추출 데이터 로드...")
    extractions = fetch_all_extractions(client, args.substance)
    log.info(f"  로드된 매핑: {len(extractions)}개")
    
    if not extractions:
        log.info("  추출된 데이터 없음. claude_extractor.py 실행 후 다시 시도.")
        return
    
    # 2) 논문 메타데이터
    log.info("\n[2/4] 논문 메타데이터 로드...")
    study_ids = list({e["study_id"] for e in extractions})
    studies_map = fetch_studies_metadata(client, study_ids)
    log.info(f"  로드된 논문: {len(studies_map)}편")
    
    # 3) 셀별로 그룹핑
    log.info("\n[3/4] 셀별 집계...")
    cells = defaultdict(list)
    for ext in extractions:
        # population_id가 NULL이면 healthy_adult로 통일
        pop_id = ext.get("population_id")
        if not pop_id:
            pop_id = "_default_"  # 임시 키
        key = (ext["substance_id"], ext["condition_id"], pop_id)
        cells[key].append(ext)
    
    log.info(f"  활성 셀: {len(cells)}개")
    
    # 성분 / 적응증 이름 매핑
    sub_ids = list({k[0] for k in cells.keys()})
    cond_ids = list({k[1] for k in cells.keys()})
    
    subs_q = client.table("substances").select("id, slug, name_ko").in_("id", sub_ids).execute()
    conds_q = client.table("conditions").select("id, slug, name_ko").in_("id", cond_ids).execute()
    
    sub_names = {s["id"]: s["name_ko"] for s in subs_q.data}
    cond_names = {c["id"]: c["name_ko"] for c in conds_q.data}
    
    # 4) 각 셀 등급 산출
    log.info("\n[4/4] 등급 산출...")
    
    grade_distribution = defaultdict(int)
    results = []
    
    for (sub_id, cond_id, pop_id), exts in cells.items():
        if pop_id == "_default_":
            pop_id = None
        
        agg = aggregate_cell(exts, studies_map)
        grade, efficacy, evidence_s = calculate_grade(agg)
        
        sub_name = sub_names.get(sub_id, "?")
        cond_name = cond_names.get(cond_id, "?")
        
        # AI 요약 (가장 신뢰도 높은 추출의 summary_ko 사용)
        best_summary = ""
        for ext in exts:
            ai_notes = ext.get("ai_notes") or ""
            if ai_notes and len(ai_notes) > len(best_summary):
                best_summary = ai_notes
        
        upsert_evidence_cell(
            client, sub_id, cond_id, pop_id,
            agg, grade, efficacy, evidence_s, best_summary,
            dry_run=args.dry_run
        )
        
        grade_distribution[grade] += 1
        results.append({
            "substance": sub_name,
            "condition": cond_name,
            "grade": grade,
            "efficacy": efficacy,
            "evidence": evidence_s,
            "n_papers": agg["n_extractions"],
            "n_meta": agg["study_count_meta"],
            "n_rct": agg["study_count_rct"],
            "consistency": agg["consistency"],
        })
    
    # 결과 정렬 — 등급 A부터
    grade_order = {"A": 0, "B": 1, "C": 2, "D": 3, "F": 4, "I": 5}
    results.sort(key=lambda r: (grade_order.get(r["grade"], 6), -r["efficacy"]))
    
    # 결과 출력
    log.info("\n" + "=" * 80)
    log.info(f"{'성분':<15}{'적응증':<20}{'등급':<6}{'효능':<8}{'근거':<8}{'논문':<6}{'일관성':<8}")
    log.info("-" * 80)
    for r in results[:50]:  # 상위 50개만
        log.info(f"{r['substance']:<15}{r['condition']:<20}{r['grade']:<6}"
                 f"{r['efficacy']:<8.2f}{r['evidence']:<8.2f}{r['n_papers']:<6}{r['consistency']:<8.2f}")
    
    log.info("\n=== 등급 분포 ===")
    for grade in ["A", "B", "C", "D", "F", "I"]:
        count = grade_distribution.get(grade, 0)
        if count:
            bar = "█" * count
            log.info(f"  {grade}등급: {count:3d} {bar}")
    
    log.info(f"\n총 {len(cells)}개 셀 등급 산출 완료")
    # 5) 고아 셀 정리 — 유효 추출이 없는 evidence_cells를 I 등급으로 변경
    if not args.dry_run:
        log.info("\n[5/5] 고아 셀 정리 (유효 추출 없는 셀을 I 등급으로)...")
        
        # 현재 처리한 셀의 (substance, condition, population) 조합
        processed_keys = set()
        for (sub_id, cond_id, pop_id), _ in cells.items():
            if pop_id == "_default_":
                # 기본 인구집단 ID 조회
                pop_q = client.table("populations").select("id").eq("is_default", True).limit(1).execute()
                if pop_q.data:
                    pop_id = pop_q.data[0]["id"]
            processed_keys.add((sub_id, cond_id, pop_id))
        
        # DB의 모든 evidence_cells 조회
        all_cells_q = client.table("evidence_cells").select(
            "id, substance_id, condition_id, population_id, ai_grade"
        ).execute()
        
        orphan_count = 0
        for cell in all_cells_q.data:
            key = (cell["substance_id"], cell["condition_id"], cell["population_id"])
            # 이번에 처리 안 된 셀 = 유효 추출이 없는 셀
            if key not in processed_keys and cell.get("ai_grade") not in (None, "I"):
                try:
                    client.table("evidence_cells").update({
                        "ai_grade": "I",
                        "ai_efficacy_score": 0,
                        "ai_evidence_score": 0,
                        "ai_summary_ko": "⚠️ 유효한 증거 없음 (관련성 필터 후 데이터 부족)",
                        "study_count_meta": 0,
                        "study_count_rct": 0,
                        "study_count_obs": 0,
                        "consistency": 0,
                        "smd_pooled": None,
                        "total_sample_size": 0,
                        "review_status": "pending",
                    }).eq("id", cell["id"]).execute()
                    orphan_count += 1
                except Exception as e:
                    log.warning(f"  고아 셀 정리 실패 ({cell['id'][:8]}): {e}")
        
        log.info(f"  ✓ {orphan_count}개 셀을 I 등급으로 정리")
    
    if not args.dry_run:
        log.info("\n다음 단계:")
        log.info("  1. Supabase에서 evidence_cells 테이블 확인")
        log.info("  2. 영선님이 약사 검토 (review_status='pending' 셀)")
        log.info("  3. 검토 완료 후 is_published=TRUE로 공개")


if __name__ == "__main__":
    main()
