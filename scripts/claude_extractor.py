#!/usr/bin/env python3
"""
FactPick PICO Extractor (Claude CLI 기반)
==========================================
Claude Code CLI를 subprocess로 호출해서 abstract → PICO 구조화 데이터로 추출합니다.
Claude Max 플랜 한도 내에서 무료로 처리 (API 비용 0원).

처리 흐름:
  1. study_extractions 큐에서 priority_rank 있는 작업 가져옴 (옵션 A3)
  2. 각 abstract를 Claude CLI에 던져서 PICO + 효과 + 품질 평가 JSON 추출
  3. 결과를 study_extractions에 UPDATE
  4. 체크포인트 자동 저장 (중단되어도 이어서 처리)

안전장치:
  - rate limit (분당 호출 수 제한)
  - 일일 처리량 제한 (Max 한도 보호)
  - 재시도 3회
  - JSON 파싱 실패 시 raw 응답 보관

사용법:
  python claude_extractor.py                    # 큐의 처음 100개 처리
  python claude_extractor.py --limit 50         # 50개만
  python claude_extractor.py --limit 500        # 한 세션에 500개
  python claude_extractor.py --substance msm    # 특정 성분만
  python claude_extractor.py --dry-run          # Claude 호출만 하고 DB 저장 X
  python claude_extractor.py --resume           # 마지막 체크포인트부터 재개
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, date
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")

# ==============================================================================
# 안전장치 설정
# ==============================================================================

CLAUDE_MODEL = "claude-opus-4-7"               # opus-4-7 사용 (한도 절약)
DEFAULT_LIMIT_PER_RUN = 100           # 한 번 실행에 처리할 최대 개수
RATE_LIMIT_SECONDS = 5.0              # 호출 간 최소 대기 (분당 ~20개)
MAX_RETRIES = 3                       # 실패 시 재시도
CLAUDE_TIMEOUT_SECONDS = 120          # CLI 호출 타임아웃
CHECKPOINT_FILE = Path.home() / "factpick" / "logs" / "extractor_checkpoint.json"

# 로그 설정
log_dir = Path.home() / "factpick" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"extractor_{date.today().isoformat()}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file, mode="a", encoding="utf-8"),
    ],
)
log = logging.getLogger("extractor")


# ==============================================================================
# PICO 추출 프롬프트
# ==============================================================================

PICO_PROMPT = """You are a medical research analyst extracting structured data from research abstracts.

Below is the abstract of a study about a substance/supplement and a health condition.

**Substance:** {substance_name_en} ({substance_name_ko})
**Condition:** {condition_name_en} ({condition_name_ko})

**Abstract:**
{title}

{abstract}

---

Extract the PICO + effect data into JSON. Output ONLY valid JSON, no explanation, no markdown.

Required JSON schema:
{{
  "population": "brief description of study participants (e.g., 'Adults with knee OA, n=200')",
  "population_type": "one of: healthy_adult, elderly, pregnant, child, diabetes, hypertension, liver_impaired, kidney_impaired, athlete, mixed, unclear",
  "intervention": "what was given (substance + dose if mentioned)",
  "dose_value": numeric value or null,
  "dose_unit": "mg/g/IU/etc or null",
  "duration_weeks": integer weeks or null,
  "comparison": "what was compared (placebo, standard care, etc.)",
  "outcome_measure": "primary outcome measured (e.g., VAS pain, WOMAC, HbA1c)",
  "effect_direction": "one of: positive, null, negative, mixed",
  "effect_metric": "one of: SMD, MD, RR, OR, HR, percent, or null",
  "effect_value": numeric or null,
  "ci_lower": numeric or null,
  "ci_upper": numeric or null,
  "p_value": numeric or null,
  "sample_size": integer or null,
  "study_type_confirmed": "one of: meta_analysis, systematic_review, rct, cohort, observational, other",
  "rob_assessment": "one of: low, some_concerns, high, unclear (your assessment of risk of bias)",
  "relevance_score": "0 to 1 (how relevant is this study to {substance_name_en} for {condition_name_en})",
  "extraction_confidence": "0 to 1 (your confidence in extraction accuracy)",
  "summary_ko": "한국어로 한 문장 요약 (50자 이내)"
}}

Rules:
- Use null (not "null" string) for missing values.
- For effect_direction: "positive" = significant benefit, "null" = no significant difference, "negative" = significant harm.
- For relevance_score < 0.3: the study is probably not actually about this substance-condition pair.
- Output JSON only. No prose, no markdown fences.

---

**EFFECT SIZE EXTRACTION — read carefully**

Effect size fields (effect_metric, effect_value, ci_lower, ci_upper, p_value) are the most important and most often missed. Scan the abstract aggressively for any numeric effect estimate, even in narrative text or parentheses.

Metric mapping (use these exact codes in effect_metric):
- "SMD" — Standardized Mean Difference, Hedges' g, Cohen's d, standardized effect size. Typical range −2 to +2.
- "MD" — Mean Difference, Weighted Mean Difference (WMD), absolute change on an outcome scale (e.g., VAS −1.5 cm, WOMAC −12.3 points). Range depends on the scale.
- "RR" — Risk Ratio, Relative Risk.
- "OR" — Odds Ratio.
- "HR" — Hazard Ratio.
- "percent" — percentage improvement or % reduction (e.g., "30% reduction in pain").
- null — only if the abstract reports no quantitative effect estimate at all (narrative only).

For meta-analyses / systematic reviews: extract the POOLED effect (e.g., "pooled SMD", "overall effect", "summary estimate") — never an individual subgroup effect, and never an effect from a single included study.

For RCTs: extract the primary endpoint's between-group effect. If only within-group change is reported, prefer the treatment-vs-control comparison; if absent, null.

CI / p-value:
- "(95% CI −0.65 to −0.25)" → ci_lower=-0.65, ci_upper=-0.25
- "(95% CI: 0.30, 0.60)" → ci_lower=0.30, ci_upper=0.60
- p reported as "p=0.001", "p < 0.001", "P=.02" → p_value=0.001, 0.001, 0.02
- "p=NS" or "not significant" → p_value=null

Sign convention for pain/symptom outcomes (where lower is better): a negative effect_value means the treatment REDUCED the symptom (= positive clinical effect). Keep the sign as reported. Do not invert.

Examples:
- "Curcumin reduced WOMAC pain (SMD −0.48; 95% CI −0.72 to −0.24; p<0.001)"
  → effect_metric="SMD", effect_value=-0.48, ci_lower=-0.72, ci_upper=-0.24, p_value=0.001, effect_direction="positive"
- "Glucosamine improved pain by 8.3 mm on VAS (MD −8.3, 95% CI −12.1 to −4.5)"
  → effect_metric="MD", effect_value=-8.3, ci_lower=-12.1, ci_upper=-4.5, effect_direction="positive"
- "Pooled OR 0.72 (0.55–0.95)" → effect_metric="OR", effect_value=0.72, ci_lower=0.55, ci_upper=0.95
- "There was a statistically significant improvement (p=0.03), but no effect size was reported"
  → effect_metric=null, effect_value=null, p_value=0.03, effect_direction="positive"
- Narrative only, no numbers and no p-value → all effect fields null.

Never fabricate a number. If unsure between SMD and MD, look at the scale: standardized/normalized values typically lie within ±2 — outside that range, it is almost certainly MD on a raw scale (VAS, WOMAC, etc.)."""


# ==============================================================================
# 데이터 클래스
# ==============================================================================

@dataclass
class ExtractionTask:
    extraction_id: str
    study_id: str
    substance_id: str
    condition_id: str
    population_id: Optional[str]
    pubmed_id: str
    title: str
    abstract: str
    substance_name_ko: str
    substance_name_en: str
    condition_name_ko: str
    condition_name_en: str
    priority_rank: int


# ==============================================================================
# Claude CLI 호출
# ==============================================================================

def call_claude(prompt: str, retry: int = 0) -> tuple[Optional[dict], Optional[str]]:
    """Claude CLI 호출하고 JSON 응답 파싱.
    
    Returns:
        (parsed_dict, raw_response) — 성공 시 parsed_dict 채워짐, 실패 시 None
    """
    try:
        import shutil
        claude_bin = shutil.which("claude") or "/opt/homebrew/bin/claude"
        result = subprocess.run(
            [
                claude_bin,
                "-p",                            # headless 모드
                "--model", CLAUDE_MODEL,         # sonnet
                "--output-format", "text",       # 텍스트로 받음 (JSON 추출은 우리가)
                "--allowedTools", "",            # 도구 사용 금지 (순수 텍스트 생성만)
                "--max-turns", "1",              # 단일 응답
                prompt,
            ],
            capture_output=True,
            text=True,
            timeout=CLAUDE_TIMEOUT_SECONDS,
        )
        
        if result.returncode != 0:
            err = result.stderr.strip()[:200]
            log.warning(f"  Claude CLI returncode={result.returncode}: {err}")
            # rate limit 감지
            if "rate" in err.lower() or "limit" in err.lower():
                log.error("  ⚠️  Claude 한도 도달 추정. 1시간 후 재시도하거나 --resume 사용")
                raise RuntimeError("RATE_LIMIT_DETECTED")
            return None, result.stderr
        
        raw = result.stdout.strip()
        
        # JSON 추출 (혹시 markdown fence 있을 경우 대비)
        if raw.startswith("```"):
            lines = raw.split("\n")
            raw = "\n".join(l for l in lines if not l.startswith("```"))
        
        # JSON 시작/끝 찾기
        start = raw.find("{")
        end = raw.rfind("}")
        if start < 0 or end < 0:
            log.warning(f"  JSON 없음: {raw[:100]}")
            return None, raw
        
        json_str = raw[start:end+1]
        try:
            parsed = json.loads(json_str)
            return parsed, raw
        except json.JSONDecodeError as e:
            log.warning(f"  JSON 파싱 실패: {e}")
            return None, raw
            
    except subprocess.TimeoutExpired:
        log.warning(f"  Claude CLI 타임아웃 ({CLAUDE_TIMEOUT_SECONDS}초)")
        if retry < MAX_RETRIES:
            time.sleep(5)
            return call_claude(prompt, retry + 1)
        return None, "TIMEOUT"
    except FileNotFoundError:
        log.error("  ❌ 'claude' 명령어를 찾을 수 없습니다. Claude Code 설치 확인.")
        sys.exit(1)


# ==============================================================================
# 큐 관리
# ==============================================================================

def get_pending_tasks(client, limit: int, substance_filter: Optional[str] = None) -> list[ExtractionTask]:
    """priority_rank 있는 미추출 작업을 가져옴 (rank 오름차순)."""
    
    # 매핑 데이터
    query = client.table("study_extractions").select(
        "id, study_id, substance_id, condition_id, population_id, extra"
    ).is_("extracted_at", "null").eq("is_valid", True)
    
    if substance_filter:
        # substance slug → id 변환
        sub_q = client.table("substances").select("id").eq("slug", substance_filter).execute()
        if sub_q.data:
            query = query.eq("substance_id", sub_q.data[0]["id"])
        else:
            log.warning(f"성분 slug 못 찾음: {substance_filter}")
            return []
    
    # priority_rank 있는 것만 (extra JSONB)
    # Supabase는 기본 1000개 limit이라 페이지네이션 필요
    pending = []
    offset = 0
    page_size = 1000
    while True:
        page = query.range(offset, offset + page_size - 1).execute()
        if not page.data:
            break
        for row in page.data:
            extra = row.get("extra") or {}
            rank = extra.get("priority_rank")
            if rank is None:
                continue
            pending.append({**row, "priority_rank": rank})
        if len(page.data) < page_size:
            break
        offset += page_size
    
    pending.sort(key=lambda x: x["priority_rank"])
    pending = pending[:limit]
    
    if not pending:
        return []
    
    # 관련 메타데이터 조인 (논문 + 성분 + 적응증)
    study_ids = list({r["study_id"] for r in pending})
    sub_ids = list({r["substance_id"] for r in pending})
    cond_ids = list({r["condition_id"] for r in pending})
    
    studies_q = client.table("studies").select("id, pubmed_id, title, abstract").in_("id", study_ids).execute()
    subs_q = client.table("substances").select("id, name_ko, name_en").in_("id", sub_ids).execute()
    conds_q = client.table("conditions").select("id, name_ko, name_en").in_("id", cond_ids).execute()
    
    studies_map = {s["id"]: s for s in studies_q.data}
    subs_map = {s["id"]: s for s in subs_q.data}
    conds_map = {c["id"]: c for c in conds_q.data}
    
    tasks = []
    for r in pending:
        st = studies_map.get(r["study_id"])
        sub = subs_map.get(r["substance_id"])
        cond = conds_map.get(r["condition_id"])
        
        if not (st and sub and cond):
            continue
        if not st.get("abstract"):  # abstract 없으면 스킵
            continue
            
        tasks.append(ExtractionTask(
            extraction_id=r["id"],
            study_id=r["study_id"],
            substance_id=r["substance_id"],
            condition_id=r["condition_id"],
            population_id=r.get("population_id"),
            pubmed_id=st["pubmed_id"],
            title=st["title"][:300],
            abstract=st["abstract"][:3000],  # Claude 입력 길이 제한
            substance_name_ko=sub["name_ko"],
            substance_name_en=sub["name_en"],
            condition_name_ko=cond["name_ko"],
            condition_name_en=cond["name_en"],
            priority_rank=r["priority_rank"],
        ))
    
    return tasks


def save_extraction(client, task: ExtractionTask, parsed: dict, raw: str, dry_run: bool):
    """추출 결과를 study_extractions UPDATE."""
    
    # 인구집단 매핑
    pop_type = parsed.get("population_type")
    pop_id = task.population_id
    if pop_type and pop_type != "unclear":
        pop_q = client.table("populations").select("id").eq("slug", pop_type).execute()
        if pop_q.data:
            pop_id = pop_q.data[0]["id"]
    
    update_data = {
        "population_id": pop_id,
        "effect_direction": parsed.get("effect_direction"),
        "effect_metric": parsed.get("effect_metric"),
        "effect_value": parsed.get("effect_value"),
        "ci_lower": parsed.get("ci_lower"),
        "ci_upper": parsed.get("ci_upper"),
        "p_value": parsed.get("p_value"),
        "dose_value": parsed.get("dose_value"),
        "dose_unit": parsed.get("dose_unit"),
        "duration_weeks": parsed.get("duration_weeks"),
        "rob_score": parsed.get("rob_assessment"),
        "ai_confidence": parsed.get("extraction_confidence"),
        "ai_model": f"claude-{CLAUDE_MODEL}-cli",
        "ai_notes": parsed.get("summary_ko"),
        "extracted_at": datetime.utcnow().isoformat(),
        "extra": {
            "population_description": parsed.get("population"),
            "intervention": parsed.get("intervention"),
            "comparison": parsed.get("comparison"),
            "outcome_measure": parsed.get("outcome_measure"),
            "study_type_confirmed": parsed.get("study_type_confirmed"),
            "relevance_score": parsed.get("relevance_score"),
            "raw_response": raw[:2000],
        },
    }
    
    # relevance < 0.3 → 잘못 매핑된 거니까 is_valid=False
    relevance = parsed.get("relevance_score") or 0.5
    try:
        relevance = float(relevance)
    except (TypeError, ValueError):
        relevance = 0.5
    if relevance < 0.3:
        update_data["is_valid"] = False
        update_data["ai_notes"] = f"⚠️ 관련성 낮음 ({relevance:.2f}): {parsed.get('summary_ko', '')}"
    
    if dry_run:
        log.info(f"  [DRY] PMID {task.pubmed_id}: {parsed.get('effect_direction')} "
                 f"(conf={parsed.get('extraction_confidence')}, rel={relevance:.2f})")
        return
    
    try:
        client.table("study_extractions").update(update_data).eq("id", task.extraction_id).execute()
    except Exception as e:
        log.error(f"  DB update 실패: {e}")


# ==============================================================================
# 체크포인트
# ==============================================================================

def load_checkpoint() -> dict:
    if CHECKPOINT_FILE.exists():
        try:
            return json.loads(CHECKPOINT_FILE.read_text())
        except Exception:
            return {}
    return {}


def save_checkpoint(processed_ids: list[str], stats: dict):
    CHECKPOINT_FILE.parent.mkdir(parents=True, exist_ok=True)
    CHECKPOINT_FILE.write_text(json.dumps({
        "last_run": datetime.utcnow().isoformat(),
        "processed_ids": processed_ids[-100:],  # 최근 100개만
        "stats": stats,
    }, indent=2))


# ==============================================================================
# 메인
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="FactPick PICO Extractor (Claude CLI)")
    parser.add_argument("--limit", type=int, default=DEFAULT_LIMIT_PER_RUN,
                        help=f"이번 실행에서 처리할 최대 작업 수 (기본 {DEFAULT_LIMIT_PER_RUN})")
    parser.add_argument("--substance", type=str, help="특정 성분 slug만")
    parser.add_argument("--dry-run", action="store_true", help="Claude 호출만 하고 DB 저장 X")
    parser.add_argument("--rate", type=float, default=RATE_LIMIT_SECONDS,
                        help=f"호출 간 최소 대기 초 (기본 {RATE_LIMIT_SECONDS})")
    args = parser.parse_args()
    
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL/KEY 누락")
        sys.exit(1)
    
    client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    log.info("=" * 60)
    log.info(f"FactPick PICO Extractor 시작")
    log.info(f"  모델: claude {CLAUDE_MODEL}")
    log.info(f"  처리 한도: {args.limit}개")
    log.info(f"  rate limit: {args.rate}초")
    log.info(f"  Dry run: {args.dry_run}")
    log.info("=" * 60)
    
    # Claude CLI 동작 확인
    log.info("\n[Pre-flight] Claude CLI 확인...")
    try:
        ver = subprocess.run(["claude", "--version"], capture_output=True, text=True, timeout=10)
        log.info(f"  Claude 버전: {ver.stdout.strip()}")
    except Exception as e:
        log.error(f"  Claude CLI 호출 실패: {e}")
        sys.exit(1)
    
    # 작업 큐 가져오기
    log.info("\n[1/2] 작업 큐 로드...")
    tasks = get_pending_tasks(client, args.limit, args.substance)
    log.info(f"  로드된 작업: {len(tasks)}개")
    
    if not tasks:
        log.info("  큐가 비어있습니다. build_extraction_queue.py를 먼저 실행하세요.")
        return
    
    # 처리 시작
    log.info(f"\n[2/2] PICO 추출 시작...")
    start = time.time()
    
    stats = {
        "total": len(tasks),
        "success": 0,
        "failed": 0,
        "low_relevance": 0,
        "skipped": 0,
    }
    processed_ids = []
    
    for i, task in enumerate(tasks, 1):
        log.info(f"\n[{i}/{len(tasks)}] {task.substance_name_ko} × {task.condition_name_ko} "
                 f"(PMID {task.pubmed_id}, rank {task.priority_rank})")
        log.info(f"  {task.title[:80]}")
        
        # 프롬프트 빌드
        prompt = PICO_PROMPT.format(
            substance_name_en=task.substance_name_en,
            substance_name_ko=task.substance_name_ko,
            condition_name_en=task.condition_name_en,
            condition_name_ko=task.condition_name_ko,
            title=task.title,
            abstract=task.abstract,
        )
        
        # Claude 호출
        try:
            parsed, raw = call_claude(prompt)
        except RuntimeError as e:
            if "RATE_LIMIT" in str(e):
                log.error("Claude 한도 도달 — 체크포인트 저장 후 종료")
                save_checkpoint(processed_ids, stats)
                sys.exit(2)
            raise
        
        if parsed is None:
            stats["failed"] += 1
            log.warning(f"  ❌ 추출 실패")
        else:
            save_extraction(client, task, parsed, raw, args.dry_run)
            stats["success"] += 1
            relevance = parsed.get("relevance_score") or 0.5
            try:
                relevance = float(relevance)
            except (TypeError, ValueError):
                relevance = 0.5
            if relevance < 0.3:
                stats["low_relevance"] += 1
            log.info(f"  ✓ 효과={parsed.get('effect_direction')} "
                     f"신뢰도={parsed.get('extraction_confidence')} "
                     f"관련성={relevance:.2f}")
        
        processed_ids.append(task.extraction_id)
        
        # 체크포인트 (10개마다)
        if i % 10 == 0:
            save_checkpoint(processed_ids, stats)
            elapsed = time.time() - start
            rate = i / elapsed if elapsed > 0 else 0
            remaining = (len(tasks) - i) / rate if rate > 0 else 0
            log.info(f"  [진행률] {i}/{len(tasks)} = {i*100/len(tasks):.0f}% "
                     f"| 속도 {rate:.1f}건/초 | 남은 시간 ~{remaining/60:.0f}분")
        
        # rate limit
        time.sleep(args.rate)
    
    # 최종 보고
    save_checkpoint(processed_ids, stats)
    elapsed = time.time() - start
    log.info(f"\n{'='*60}")
    log.info(f"완료 ({elapsed/60:.1f}분)")
    log.info(f"  성공: {stats['success']}")
    log.info(f"  실패: {stats['failed']}")
    log.info(f"  관련성 낮음 (필터링됨): {stats['low_relevance']}")
    log.info(f"{'='*60}")


if __name__ == "__main__":
    main()
