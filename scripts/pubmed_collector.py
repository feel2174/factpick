#!/usr/bin/env python3
"""
FactPick PubMed Collector
=========================
PubMed E-utilities + NIH iCite API로 영양제/약물 관련 논문을 수집해
Supabase studies 테이블에 저장합니다.

수집 전략 (Tier 기반 품질 게이트):
  Tier 1: 메타분석/체계적 문헌고찰 → 무조건 다 수집 (상한 없음)
  Tier 2: RCT → 표본 30+, 2005년 이후, IF≥1.0 또는 RCR≥0.5, 최대 100편
  Tier 3: 코호트/관찰연구 → 표본 100+, 2010년 이후, RCR≥1.0, 최대 30편
  제외:   case report, 동물실험, in vitro, 영어 외, 사설/letter, 철회 논문

사용법:
  # 초기 시드 (모든 성분, 모든 적응증 조합)
  python pubmed_collector.py --initial

  # 일일 증분 (어제~오늘 등록된 신규 논문)
  python pubmed_collector.py --daily

  # 특정 성분만
  python pubmed_collector.py --substance msm

  # 드라이런 (DB 저장 안 함)
  python pubmed_collector.py --initial --dry-run

환경변수 (.env):
  SUPABASE_URL=https://xxxxx.supabase.co
  SUPABASE_SERVICE_KEY=eyJxxx...
  PUBMED_API_KEY=optional_ncbi_key       # 없어도 됨 (3 req/s vs 10 req/s)
  PUBMED_EMAIL=your@email.com
  JCR_CSV_PATH=./data/jcr_2024.csv       # 선택, Impact Factor 매핑용
"""

from __future__ import annotations

import argparse
import csv
import logging
import os
import sys
import time
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET

import requests
from dotenv import load_dotenv
from supabase import create_client, Client


# ==============================================================================
# 설정
# ==============================================================================

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "")
PUBMED_API_KEY = os.getenv("PUBMED_API_KEY")
PUBMED_EMAIL = os.getenv("PUBMED_EMAIL", "factpick@example.com")
JCR_CSV_PATH = os.getenv("JCR_CSV_PATH", "")

NCBI_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
ICITE_BASE = "https://icite.od.nih.gov/api/pubs"
RATE_LIMIT = 0.11 if PUBMED_API_KEY else 0.34  # API 키 있으면 10/s, 없으면 3/s
TOOL = "factpick"

# Tier 게이트 기준
TIER1_PUBTYPES = ["Meta-Analysis", "Systematic Review"]
TIER2_PUBTYPES = ["Randomized Controlled Trial"]
TIER3_PUBTYPES = ["Cohort Studies", "Case-Control Studies", "Observational Study"]

# 제외 출판유형
EXCLUDE_PUBTYPES = {
    "Case Reports", "Comment", "Editorial", "Letter", "News",
    "Retracted Publication", "Retraction of Publication",
    "Practice Guideline",  # 가이드라인은 별도 처리 (나중에)
}

# Tier별 상한
TIER1_CAP = None       # 무제한
TIER2_CAP = 100        # 성분×적응증당 RCT 최대 100
TIER3_CAP = 30         # 관찰연구 최대 30
TIER2_MIN_SAMPLE = 30
TIER3_MIN_SAMPLE = 100
TIER2_MIN_YEAR = 2005
TIER3_MIN_YEAR = 2010
TIER2_MIN_RCR = 0.5    # 분야 평균의 절반
TIER3_MIN_RCR = 1.0    # 분야 평균 이상

# 적응증과 PubMed 검색어 매핑 (성분과 함께 AND로 결합)
CONDITION_SEARCH_TERMS = {
    "osteoarthritis":    '("osteoarthritis"[MeSH] OR "osteoarthritis"[tiab] OR "joint pain"[tiab])',
    "insomnia":          '("sleep initiation and maintenance disorders"[MeSH] OR "insomnia"[tiab] OR "sleep quality"[tiab])',
    "hypertension":      '("hypertension"[MeSH] OR "blood pressure"[tiab])',
    "hyperlipidemia":    '("dyslipidemias"[MeSH] OR "cholesterol"[tiab] OR "lipid"[tiab])',
    "depression_mild":   '("depression"[MeSH] OR "depressive"[tiab])',
    "anxiety":           '("anxiety"[MeSH] OR "anxiety"[tiab])',
    "cognitive_decline": '("cognition"[MeSH] OR "cognitive"[tiab] OR "memory"[tiab])',
    "immune_support":    '("immune system"[MeSH] OR "immunity"[tiab] OR "common cold"[tiab])',
    "skin_aging":        '("skin aging"[MeSH] OR "skin aging"[tiab] OR "wrinkle"[tiab])',
    "migraine":          '("migraine disorders"[MeSH] OR "migraine"[tiab])',
}


# ==============================================================================
# 로깅
# ==============================================================================

log_dir = Path.home() / "factpick" / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
log_file = log_dir / f"collector_{date.today().isoformat()}.log"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(log_file, mode="a", encoding="utf-8"),
    ],
)
log = logging.getLogger("factpick")


# ==============================================================================
# 데이터 클래스
# ==============================================================================

@dataclass
class Study:
    """수집된 논문 한 편의 정보."""
    pubmed_id: str
    title: str
    abstract: Optional[str] = None
    doi: Optional[str] = None
    journal: Optional[str] = None
    journal_if: Optional[float] = None
    year: Optional[int] = None
    study_type: Optional[str] = None
    sample_size: Optional[int] = None
    duration_weeks: Optional[int] = None
    pub_types: list[str] = field(default_factory=list)
    mesh_terms: list[str] = field(default_factory=list)
    icite_citations: Optional[int] = None
    icite_rcr: Optional[float] = None
    language: str = "eng"
    is_retracted: bool = False
    source_api: str = "pubmed"

    def to_db_row(self) -> dict:
        """Supabase studies 테이블용 row로 변환."""
        return {
            "pubmed_id": self.pubmed_id,
            "doi": self.doi,
            "title": self.title,
            "abstract": self.abstract,
            "journal": self.journal,
            "journal_if": self.journal_if,
            "year": self.year,
            "study_type": self.study_type,
            "sample_size": self.sample_size,
            "duration_weeks": self.duration_weeks,
            "source_api": self.source_api,
            "raw_metadata": {
                "pub_types": self.pub_types,
                "mesh_terms": self.mesh_terms,
                "icite_citations": self.icite_citations,
                "icite_rcr": self.icite_rcr,
                "language": self.language,
                "is_retracted": self.is_retracted,
            },
        }


# ==============================================================================
# Impact Factor 매핑
# ==============================================================================

class JCRMapper:
    """JCR CSV에서 저널명 → IF 매핑.
    
    Web of Science에서 다운로드한 CSV 형식 (column: Journal name, JIF)
    파일 없으면 비활성화 (모든 저널 IF 없음으로 처리).
    """

    def __init__(self, csv_path: str = ""):
        self.mapping: dict[str, float] = {}
        if csv_path and Path(csv_path).exists():
            try:
                with open(csv_path, encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        name = (row.get("Journal name") or row.get("Title") or "").strip().lower()
                        jif = row.get("JIF") or row.get("Impact Factor") or row.get("2024 JIF") or "0"
                        try:
                            self.mapping[name] = float(jif)
                        except (ValueError, TypeError):
                            pass
                log.info(f"JCR 매핑 로드: {len(self.mapping)}개 저널")
            except Exception as e:
                log.warning(f"JCR CSV 로드 실패: {e}")
        else:
            log.info("JCR CSV 없음 — IF 필터 비활성 (모든 논문 통과)")

    def get_if(self, journal: Optional[str]) -> Optional[float]:
        if not journal or not self.mapping:
            return None
        return self.mapping.get(journal.strip().lower())


# ==============================================================================
# PubMed API 클라이언트
# ==============================================================================

class PubMedClient:
    """NCBI E-utilities 래퍼."""

    def __init__(self, api_key: Optional[str] = None, email: str = ""):
        self.api_key = api_key
        self.email = email
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": f"{TOOL}/1.0"})

    def _params(self, extra: dict) -> dict:
        base = {"tool": TOOL, "email": self.email}
        if self.api_key:
            base["api_key"] = self.api_key
        return {**base, **extra}

    def _get(self, endpoint: str, params: dict, timeout: int = 30) -> requests.Response:
        time.sleep(RATE_LIMIT)
        for attempt in range(3):
            try:
                r = self.session.get(f"{NCBI_BASE}/{endpoint}", params=params, timeout=timeout)
                r.raise_for_status()
                return r
            except requests.exceptions.RequestException as e:
                wait = 2 ** attempt
                log.warning(f"  요청 실패 (시도 {attempt+1}/3): {e}, {wait}초 후 재시도")
                time.sleep(wait)
        raise RuntimeError(f"3회 재시도 실패: {endpoint}")

    def esearch(self, query: str, max_results: int = 200,
                mindate: Optional[str] = None, maxdate: Optional[str] = None) -> list[str]:
        """검색 → PMID 리스트."""
        # English[Language]가 이미 들어있으면 추가 안 함 (중복 방지)
        full_term = query if "English[Language]" in query else f"{query} AND English[Language]"
        params = self._params({
            "db": "pubmed",
            "term": full_term,
            "retmax": max_results,
            "sort": "relevance",
            "retmode": "json",
        })
        if mindate:
            params["mindate"] = mindate
            params["datetype"] = "edat"
        if maxdate:
            params["maxdate"] = maxdate

        r = self._get("esearch.fcgi", params)
        data = r.json()
        pmids = data.get("esearchresult", {}).get("idlist", [])
        return pmids

    def efetch(self, pmids: list[str]) -> list[Study]:
        """PMID 리스트 → Study 객체 리스트 (XML 파싱)."""
        if not pmids:
            return []

        results: list[Study] = []
        for i in range(0, len(pmids), 200):  # 배치 200개씩
            batch = pmids[i:i + 200]
            params = self._params({
                "db": "pubmed",
                "id": ",".join(batch),
                "retmode": "xml",
            })
            r = self._get("efetch.fcgi", params, timeout=60)
            results.extend(self._parse_xml(r.text))
        return results

    def _parse_xml(self, xml_text: str) -> list[Study]:
        try:
            root = ET.fromstring(xml_text)
        except ET.ParseError as e:
            log.error(f"XML 파싱 실패: {e}")
            return []

        studies = []
        for art in root.findall(".//PubmedArticle"):
            try:
                studies.append(self._parse_article(art))
            except Exception as e:
                log.warning(f"  article 파싱 실패: {e}")
        return studies

    def _parse_article(self, art: ET.Element) -> Study:
        pmid = self._text(art, ".//PMID")
        title = self._text(art, ".//ArticleTitle") or "(no title)"

        # Abstract: 여러 AbstractText를 합침
        abstract_parts = []
        for at in art.findall(".//AbstractText"):
            label = at.get("Label", "")
            text = "".join(at.itertext()).strip()
            if label:
                abstract_parts.append(f"{label}: {text}")
            else:
                abstract_parts.append(text)
        abstract = "\n".join(abstract_parts) if abstract_parts else None

        # DOI
        doi = None
        for aid in art.findall(".//ArticleId"):
            if aid.get("IdType") == "doi":
                doi = aid.text
                break

        # Journal
        journal = self._text(art, ".//Journal/Title")

        # Year
        year = None
        year_text = self._text(art, ".//PubDate/Year")
        if year_text:
            try:
                year = int(year_text)
            except ValueError:
                pass
        if not year:
            medline_date = self._text(art, ".//PubDate/MedlineDate")
            if medline_date and len(medline_date) >= 4:
                try:
                    year = int(medline_date[:4])
                except ValueError:
                    pass

        # Publication types
        pub_types = [pt.text for pt in art.findall(".//PublicationType") if pt.text]

        # MeSH terms
        mesh_terms = [mh.text for mh in art.findall(".//MeshHeading/DescriptorName") if mh.text]

        # Retracted 체크
        is_retracted = any(
            pt in ("Retracted Publication", "Retraction of Publication")
            for pt in pub_types
        )

        # Language
        lang = self._text(art, ".//Language") or "eng"

        # Study type 분류
        study_type = self._classify_study_type(pub_types, title, abstract)

        # Sample size 추정 (abstract에서 정규식)
        sample_size = self._extract_sample_size(abstract or "")

        return Study(
            pubmed_id=pmid,
            title=title,
            abstract=abstract,
            doi=doi,
            journal=journal,
            year=year,
            study_type=study_type,
            sample_size=sample_size,
            pub_types=pub_types,
            mesh_terms=mesh_terms,
            language=lang,
            is_retracted=is_retracted,
        )

    @staticmethod
    def _text(elem: ET.Element, xpath: str) -> Optional[str]:
        node = elem.find(xpath)
        if node is None:
            return None
        return "".join(node.itertext()).strip() or None

    @staticmethod
    def _classify_study_type(pub_types: list[str], title: str, abstract: Optional[str]) -> str:
        """Publication type + 제목 키워드로 연구 디자인 분류."""
        title_lower = (title or "").lower()
        abs_lower = (abstract or "").lower()
        all_text = title_lower + " " + abs_lower

        if "Meta-Analysis" in pub_types or "meta-analysis" in title_lower:
            return "meta_analysis"
        if "Systematic Review" in pub_types or "systematic review" in title_lower:
            return "systematic_review"
        if "Randomized Controlled Trial" in pub_types:
            return "rct"
        if any(t in pub_types for t in ["Clinical Trial", "Controlled Clinical Trial"]):
            if "double-blind" in all_text or "placebo-controlled" in all_text:
                return "rct"
            return "clinical_trial"
        if "Cohort Studies" in pub_types or "cohort study" in title_lower:
            return "cohort"
        if "Case-Control Studies" in pub_types or "case-control" in title_lower:
            return "case_control"
        if "Observational Study" in pub_types:
            return "observational"
        if "Case Reports" in pub_types:
            return "case_report"
        return "other"

    @staticmethod
    def _extract_sample_size(text: str) -> Optional[int]:
        """abstract에서 표본 크기 추정 (N=숫자 패턴)."""
        import re
        if not text:
            return None
        patterns = [
            r"[Nn]\s*=\s*(\d{2,5})",
            r"(\d{2,5})\s*(?:patients|subjects|participants|individuals)",
            r"a\s*total\s*of\s*(\d{2,5})",
        ]
        for pat in patterns:
            m = re.search(pat, text)
            if m:
                try:
                    n = int(m.group(1))
                    if 10 <= n <= 100000:  # 합리적 범위
                        return n
                except ValueError:
                    continue
        return None


# ==============================================================================
# iCite API (인용수 + RCR)
# ==============================================================================

class iCiteClient:
    """NIH iCite — citation count + Relative Citation Ratio."""

    def __init__(self):
        self.session = requests.Session()

    def fetch(self, pmids: list[str]) -> dict[str, dict]:
        """PMID 리스트 → {pmid: {citations, rcr}}."""
        if not pmids:
            return {}

        result = {}
        for i in range(0, len(pmids), 200):
            batch = pmids[i:i + 200]
            time.sleep(0.1)
            try:
                r = self.session.get(
                    ICITE_BASE,
                    params={"pmids": ",".join(batch)},
                    timeout=30,
                )
                r.raise_for_status()
                data = r.json()
                for item in data.get("data", []):
                    pmid = str(item.get("pmid", ""))
                    if pmid:
                        result[pmid] = {
                            "citations": item.get("citation_count"),
                            "rcr": item.get("relative_citation_ratio"),
                        }
            except Exception as e:
                log.warning(f"  iCite 실패: {e}")
        return result


# ==============================================================================
# Tier 게이트 (품질 필터)
# ==============================================================================

def apply_tier_gates(studies: list[Study], jcr: JCRMapper) -> list[Study]:
    """Tier 게이트 통과한 논문만 반환."""

    # IF 보강
    for s in studies:
        s.journal_if = jcr.get_if(s.journal)

    tier1, tier2, tier3 = [], [], []
    excluded_count = 0

    for s in studies:
        # 공통 제외
        if s.is_retracted:
            excluded_count += 1
            continue
        if s.language and s.language != "eng":
            excluded_count += 1
            continue
        if any(pt in EXCLUDE_PUBTYPES for pt in s.pub_types):
            excluded_count += 1
            continue

        # Tier 1: 메타분석 / SR
        if s.study_type in ("meta_analysis", "systematic_review"):
            tier1.append(s)
            continue

        # Tier 2: RCT
        if s.study_type == "rct":
            if s.year and s.year < TIER2_MIN_YEAR:
                excluded_count += 1
                continue
            if s.sample_size and s.sample_size < TIER2_MIN_SAMPLE:
                excluded_count += 1
                continue
            # IF나 RCR 둘 중 하나라도 통과하면 OK (둘 다 None이면 일단 통과)
            if_ok = s.journal_if is None or s.journal_if >= 1.0
            rcr_ok = s.icite_rcr is None or s.icite_rcr >= TIER2_MIN_RCR
            if not (if_ok or rcr_ok):
                excluded_count += 1
                continue
            tier2.append(s)
            continue

        # Tier 3: 코호트/관찰
        if s.study_type in ("cohort", "case_control", "observational"):
            if s.year and s.year < TIER3_MIN_YEAR:
                excluded_count += 1
                continue
            if s.sample_size and s.sample_size < TIER3_MIN_SAMPLE:
                excluded_count += 1
                continue
            if s.icite_rcr is not None and s.icite_rcr < TIER3_MIN_RCR:
                excluded_count += 1
                continue
            tier3.append(s)
            continue

        # 그 외 (case_report, other 등) 제외
        excluded_count += 1

    # Tier별 상한 적용 (인용수 높은 순으로 자름)
    def by_quality(s: Study) -> tuple:
        # RCR 우선, 그 다음 citations, 그 다음 최신
        return (s.icite_rcr or 0, s.icite_citations or 0, s.year or 0)

    tier2.sort(key=by_quality, reverse=True)
    tier3.sort(key=by_quality, reverse=True)

    if TIER2_CAP:
        tier2 = tier2[:TIER2_CAP]
    if TIER3_CAP:
        tier3 = tier3[:TIER3_CAP]

    final = tier1 + tier2 + tier3
    log.info(f"    Tier1(메타/SR): {len(tier1)} | Tier2(RCT): {len(tier2)} | Tier3(관찰): {len(tier3)} | 제외: {excluded_count}")
    return final


# ==============================================================================
# Supabase 저장
# ==============================================================================

class SupabaseStore:
    """studies, study_extractions, evidence_studies 등 DB 저장 헬퍼."""

    def __init__(self, url: str, key: str, dry_run: bool = False):
        self.dry_run = dry_run
        if dry_run:
            self.client = None
            log.info("DRY RUN 모드: DB 저장 안 함")
        else:
            self.client = create_client(url, key)

    def get_substances(self, slug_filter: Optional[str] = None) -> list[dict]:
        """수집 대상 성분 리스트."""
        if self.dry_run:
            # 테스트용
            return [{"id": "test-id", "slug": "msm", "name_ko": "MSM",
                     "pubmed_mesh": ["Methylsulfonylmethane"]}]
        query = self.client.table("substances").select(
            "id, slug, name_ko, name_en, pubmed_mesh, aliases"
        )
        if slug_filter:
            query = query.eq("slug", slug_filter)
        return query.execute().data

    def get_conditions(self) -> list[dict]:
        """수집 대상 적응증 리스트."""
        if self.dry_run:
            return [{"id": "test-id", "slug": "osteoarthritis", "name_ko": "골관절염"}]
        return self.client.table("conditions").select(
            "id, slug, name_ko, search_terms"
        ).eq("is_published", True).execute().data

    def get_last_collection_date(self, substance_id: str, condition_id: str) -> Optional[str]:
        """마지막 수집 날짜 (일일 증분용)."""
        if self.dry_run:
            return None
        # studies.fetched_at의 최대값 기준
        result = self.client.table("studies").select("fetched_at").order(
            "fetched_at", desc=True
        ).limit(1).execute()
        if result.data:
            return result.data[0]["fetched_at"][:10]  # YYYY-MM-DD
        return None

    def upsert_studies(self, studies: list[Study]) -> int:
        """studies 테이블에 upsert. pubmed_id 중복은 무시."""
        if not studies:
            return 0
        if self.dry_run:
            for s in studies[:3]:
                log.info(f"  [DRY] {s.pubmed_id}: {s.title[:80]}")
            log.info(f"  [DRY] 총 {len(studies)}편 (DB 저장 생략)")
            return len(studies)

        rows = [s.to_db_row() for s in studies]
        # 100편씩 배치
        total = 0
        for i in range(0, len(rows), 100):
            batch = rows[i:i + 100]
            try:
                self.client.table("studies").upsert(
                    batch, on_conflict="pubmed_id", ignore_duplicates=False
                ).execute()
                total += len(batch)
            except Exception as e:
                log.error(f"  upsert 실패: {e}")
        return total

    def link_studies_to_extractions(self, studies: list[Study],
                                     substance_id: str, condition_id: str):
        """수집한 논문을 어떤 substance × condition에 매핑할지 임시 큐에 저장.
        실제 PICO 추출은 다음 단계 (claude_cli_extractor.py)에서 처리.
        여기서는 study_extractions에 빈 row만 만들어두기.
        """
        if not studies or self.dry_run:
            return

        # pubmed_id → study UUID 조회
        pmids = [s.pubmed_id for s in studies]
        result = self.client.table("studies").select("id, pubmed_id").in_(
            "pubmed_id", pmids
        ).execute()
        pmid_to_uuid = {r["pubmed_id"]: r["id"] for r in result.data}

        # study_extractions에 placeholder row 생성 (AI 추출 대기 상태)
        rows = []
        for s in studies:
            study_uuid = pmid_to_uuid.get(s.pubmed_id)
            if not study_uuid:
                continue
            rows.append({
                "study_id": study_uuid,
                "substance_id": substance_id,
                "condition_id": condition_id,
                "ai_confidence": None,  # 아직 AI 처리 안 됨
                "extracted_at": None,
                "is_valid": True,
            })

        if rows:
            # 중복 방지: 같은 (study, substance, condition) 조합이 이미 있으면 skip
            for i in range(0, len(rows), 100):
                batch = rows[i:i + 100]
                try:
                    self.client.table("study_extractions").upsert(
                        batch, ignore_duplicates=True
                    ).execute()
                except Exception as e:
                    log.warning(f"  extractions placeholder 실패: {e}")


# ==============================================================================
# 메인 수집 로직
# ==============================================================================

def build_substance_query(substance: dict) -> str:
    """성분에 대한 PubMed 검색어 빌드."""
    terms = []
    name_en = substance.get("name_en", "")
    if name_en:
        terms.append(f'"{name_en}"[tiab]')

    for mesh in substance.get("pubmed_mesh", []) or []:
        terms.append(f'"{mesh}"[MeSH]')
        terms.append(f'"{mesh}"[tiab]')

    for alias in substance.get("aliases", []) or []:
        # 한글 별명은 PubMed에서 의미 없으니 제외
        if any("\uac00" <= c <= "\ud7af" for c in alias):
            continue
        terms.append(f'"{alias}"[tiab]')

    return "(" + " OR ".join(set(terms)) + ")"


def collect_substance_condition(
    pm: PubMedClient,
    icite: iCiteClient,
    jcr: JCRMapper,
    store: SupabaseStore,
    substance: dict,
    condition: dict,
    mindate: Optional[str] = None,
):
    """한 (성분 × 적응증) 조합에 대해 수집."""
    sub_slug = substance["slug"]
    cond_slug = condition["slug"]
    log.info(f"\n▶ {substance['name_ko']} × {condition['name_ko']}")

    # 검색어 빌드
    sub_query = build_substance_query(substance)
    cond_query = CONDITION_SEARCH_TERMS.get(cond_slug, f'"{condition["name_ko"]}"[tiab]')
    base_query = f"{sub_query} AND {cond_query}"

    all_pmids = set()

    # Tier별로 따로 검색 (PubMed Publication Type 필터 활용)
    queries = [
        (f"{base_query} AND ((\"Meta-Analysis\"[ptyp]) OR (\"Systematic Review\"[ptyp]))", "Tier1", 500),
        (f"{base_query} AND \"Randomized Controlled Trial\"[ptyp]", "Tier2", 500),
        (f"{base_query} AND (\"Cohort Studies\"[MeSH] OR \"Observational Study\"[ptyp])", "Tier3", 200),
    ]

    for q, tier_name, max_r in queries:
        try:
            pmids = pm.esearch(q, max_results=max_r, mindate=mindate)
            log.info(f"  [{tier_name}] PubMed 검색 → {len(pmids)}편")
            all_pmids.update(pmids)
        except Exception as e:
            log.error(f"  [{tier_name}] 검색 실패: {e}")

    if not all_pmids:
        log.info("  → 수집할 논문 없음")
        return

    # 메타데이터 가져오기
    log.info(f"  EFetch로 {len(all_pmids)}편 메타데이터 가져오는 중...")
    studies = pm.efetch(list(all_pmids))

    # iCite로 인용수 보강
    log.info(f"  iCite로 인용수/RCR 보강 중...")
    icite_data = icite.fetch([s.pubmed_id for s in studies])
    for s in studies:
        info = icite_data.get(s.pubmed_id, {})
        s.icite_citations = info.get("citations")
        s.icite_rcr = info.get("rcr")

    # Tier 게이트 적용
    filtered = apply_tier_gates(studies, jcr)

    # DB 저장
    saved = store.upsert_studies(filtered)
    log.info(f"  ✓ {saved}편 studies에 저장")

    # study_extractions에 placeholder 생성 (다음 AI 단계용)
    store.link_studies_to_extractions(filtered, substance["id"], condition["id"])


def run_initial(store: SupabaseStore, pm: PubMedClient, icite: iCiteClient, jcr: JCRMapper,
                substance_filter: Optional[str] = None):
    """초기 시드 수집 — 모든 성분 × 모든 적응증."""
    substances = store.get_substances(slug_filter=substance_filter)
    conditions = store.get_conditions()
    log.info(f"\n=== 초기 시드 수집 시작 ===")
    log.info(f"성분 {len(substances)}개 × 적응증 {len(conditions)}개 = {len(substances)*len(conditions)} 조합")

    for i, sub in enumerate(substances, 1):
        log.info(f"\n[{i}/{len(substances)}] 성분: {sub['name_ko']}")
        for cond in conditions:
            try:
                collect_substance_condition(pm, icite, jcr, store, sub, cond)
            except Exception as e:
                log.error(f"  ✗ 실패: {e}")


def run_daily(store: SupabaseStore, pm: PubMedClient, icite: iCiteClient, jcr: JCRMapper):
    """일일 증분 — 어제 등록된 신규 논문만."""
    mindate = (date.today() - timedelta(days=2)).isoformat().replace("-", "/")
    substances = store.get_substances()
    conditions = store.get_conditions()
    log.info(f"\n=== 일일 증분 수집 (mindate={mindate}) ===")

    for sub in substances:
        for cond in conditions:
            try:
                collect_substance_condition(pm, icite, jcr, store, sub, cond, mindate=mindate)
            except Exception as e:
                log.error(f"  ✗ 실패: {e}")


# ==============================================================================
# CLI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(description="FactPick PubMed Collector")
    parser.add_argument("--initial", action="store_true", help="초기 시드 모드")
    parser.add_argument("--daily", action="store_true", help="일일 증분 모드")
    parser.add_argument("--substance", type=str, help="특정 성분 slug만 처리")
    parser.add_argument("--dry-run", action="store_true", help="DB 저장 안 함")
    args = parser.parse_args()

    if not (args.initial or args.daily):
        parser.print_help()
        sys.exit(1)

    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 설정되지 않음. .env 확인")
        sys.exit(1)

    log.info(f"=== FactPick Collector 시작 ===")
    log.info(f"PubMed API 키: {'있음 (10 req/s)' if PUBMED_API_KEY else '없음 (3 req/s)'}")
    log.info(f"JCR CSV: {JCR_CSV_PATH or '없음'}")

    pm = PubMedClient(api_key=PUBMED_API_KEY, email=PUBMED_EMAIL)
    icite = iCiteClient()
    jcr = JCRMapper(JCR_CSV_PATH)
    store = SupabaseStore(SUPABASE_URL, SUPABASE_KEY, dry_run=args.dry_run)

    start = time.time()
    try:
        if args.initial:
            run_initial(store, pm, icite, jcr, substance_filter=args.substance)
        elif args.daily:
            run_daily(store, pm, icite, jcr)
    except KeyboardInterrupt:
        log.info("\n사용자 중단")
        sys.exit(130)
    except Exception as e:
        log.exception(f"예외 발생: {e}")
        sys.exit(1)

    elapsed = time.time() - start
    log.info(f"\n=== 완료 ({elapsed:.1f}초 = {elapsed/60:.1f}분) ===")


if __name__ == "__main__":
    main()
