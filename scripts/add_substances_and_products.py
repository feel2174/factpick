"""골관절염 verified entries용 substances/products 추가.

영선 정정 + 자동 채움. 매핑 안 된 30+개를 한국 약 시장 일반 지식으로 1차 채움.
영선이 결과 보고 정정.
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
log = logging.getLogger("add_subs")


# ============================================================================
# 새로 추가할 substances (verified entries에 있지만 substances에 없는 것들)
# ============================================================================

NEW_SUBSTANCES = [
    # 처방약 NSAID
    {"slug": "celecoxib", "name_ko": "셀레콕시브", "name_en": "Celecoxib", "substance_type": "drug", "category": "NSAID (COX-2)"},
    {"slug": "etoricoxib", "name_ko": "에토리콕시브", "name_en": "Etoricoxib", "substance_type": "drug", "category": "NSAID (COX-2)"},
    {"slug": "polmacoxib", "name_ko": "폴마콕시브", "name_en": "Polmacoxib", "substance_type": "drug", "category": "NSAID (COX-2)"},
    {"slug": "naproxen", "name_ko": "나프록센", "name_en": "Naproxen", "substance_type": "drug", "category": "NSAID"},
    {"slug": "tramadol", "name_ko": "트라마돌", "name_en": "Tramadol", "substance_type": "drug", "category": "진통제"},
    # 외용 NSAID
    {"slug": "diclofenac_topical", "name_ko": "디클로페낙 외용", "name_en": "Diclofenac topical", "substance_type": "drug", "category": "외용 NSAID"},
    {"slug": "ketoprofen_topical", "name_ko": "케토프로펜 외용", "name_en": "Ketoprofen topical", "substance_type": "drug", "category": "외용 NSAID"},
    {"slug": "loxoprofen_topical", "name_ko": "록소프로펜 외용", "name_en": "Loxoprofen topical", "substance_type": "drug", "category": "외용 NSAID"},
    {"slug": "flurbiprofen_topical", "name_ko": "플루르비프로펜 외용", "name_en": "Flurbiprofen topical", "substance_type": "drug", "category": "외용 NSAID"},
    {"slug": "felbinac_topical", "name_ko": "펠비낙 외용", "name_en": "Felbinac topical", "substance_type": "drug", "category": "외용 NSAID"},
    {"slug": "piroxicam_topical", "name_ko": "피록시캄 외용", "name_en": "Piroxicam topical", "substance_type": "drug", "category": "외용 NSAID"},
    {"slug": "ibuprofen_topical", "name_ko": "이부프로펜 외용", "name_en": "Ibuprofen topical", "substance_type": "drug", "category": "외용 NSAID"},
    # OTC 보조제
    {"slug": "methyl_salicylate", "name_ko": "살리실산메틸", "name_en": "Methyl salicylate", "substance_type": "drug", "category": "외용 진통"},
    {"slug": "capsaicin_topical", "name_ko": "캡사이신 국소", "name_en": "Capsaicin topical", "substance_type": "drug", "category": "외용 진통"},
    # 한국 시판 복합제
    {"slug": "shinshin_arex", "name_ko": "신신파스 아렉스", "name_en": "Shinshin Arex (compound topical)", "substance_type": "drug", "category": "외용 복합제"},
    # 약초 복합제
    {"slug": "ski306x", "name_ko": "조인스 (SKI306X)", "name_en": "SKI306X", "substance_type": "supplement", "category": "약초 복합제"},
    # 직구 영양제
    {"slug": "l_carnitine", "name_ko": "L-카르니틴", "name_en": "L-Carnitine", "substance_type": "supplement", "category": "지방산 산화"},
    {"slug": "curcumin_enhanced", "name_ko": "강황 강화제형", "name_en": "Enhanced Curcumin (Theracurmin/Meriva)", "substance_type": "supplement", "category": "관절 영양제"},
    {"slug": "turmacin", "name_ko": "Turmacin", "name_en": "Turmacin (water-soluble turmerosaccharides)", "substance_type": "supplement", "category": "관절 영양제"},
    # 시술
    {"slug": "ia_steroid", "name_ko": "관절강내 스테로이드 주사", "name_en": "Intra-articular corticosteroid", "substance_type": "drug", "category": "관절 주사"},
    {"slug": "ia_hyaluronic_acid", "name_ko": "히알루론산 주사", "name_en": "Hyaluronic acid injection", "substance_type": "drug", "category": "관절 주사"},
    # 카테고리 평균
    {"slug": "topical_nsaids_avg", "name_ko": "국소 NSAIDs 평균", "name_en": "Topical NSAIDs (average)", "substance_type": "drug", "category": "외용 NSAID (평균)"},
]


# ============================================================================
# Verified ID → 한국 시판 제품 매핑 (substance_id로 매핑되는 substance 안에 들어감)
# matches_verified_id로 verified entry 특정
# ============================================================================

# slug 기반 매핑 ({slug: {top: {...}, others: [...]}})
PRODUCT_MAPPINGS = {
    # === 기존 정정 ===
    # 글루코사민 — 영선 정정: Non-Rotta는 별도 일반 영양제
    "glucosamine": {
        "top": {"name": "오스테민 캡슐", "manufacturer": "삼진제약", "type": "전문의약품", "note": "한국 시판 Rotta/Crystalline 글루코사민. Cochrane SMD -1.11. 단 펀딩 편향 표기.", "matches_verified_id": "glucosamine_rotta"},
        "others": [
            {"name": "Move프리 글루코사민", "manufacturer": "내츄럴팩토리 (직구)", "type": "직구 / 건강기능식품", "note": "일반 영양제 등급", "matches_verified_id": "glucosamine_non_rotta"},
            {"name": "일반 글루코사민 영양제", "manufacturer": "다수", "type": "건강기능식품", "note": "SMD -0.47 (Rotta+Non-Rotta 평균)", "matches_verified_id": "glucosamine_overall"},
        ],
    },
    # 콘드로이친 — IBSA는 한국 미수입 명시
    "chondroitin": {
        "top": {"name": "조인본 콘드로800", "manufacturer": "유한양행", "type": "일반의약품", "note": "유한양행/종근당 일반의약품 등급. SMD -0.63 (전체 평균)", "matches_verified_id": "chondroitin_overall"},
        "others": [
            {"name": "콘드로이친 IBSA 제약등급", "manufacturer": "IBSA (이탈리아)", "type": "한국 미수입", "note": "한국 시판 X. SMD -0.25, GRADE high.", "matches_verified_id": "chondroitin_ibsa_pharma"},
            {"name": "일반 콘드로이친 영양제", "manufacturer": "다수", "type": "건강기능식품", "note": "위약 수준 SMD -0.08", "matches_verified_id": "chondroitin_general_grade"},
            {"name": "조인트 콘드로800", "manufacturer": "종근당", "type": "일반의약품"},
        ],
    },
    # MSM
    "msm": {
        "top": {"name": "팜스 슈퍼 조인트 MSM", "manufacturer": "팜스", "type": "건강기능식품", "note": "MSM 단일제 거의 없음 — 복합제 다수"},
        "others": [
            {"name": "MSM Ace Gold", "manufacturer": "OEM 다수", "type": "건강기능식품"},
        ],
    },
    # 보스웰리아
    "boswellia": {
        "top": {"name": "프롬바이오 보스웰리아", "manufacturer": "프롬바이오", "type": "건강기능식품"},
        "others": [
            {"name": "프롬바이오 관절보스웰리아", "manufacturer": "프롬바이오", "type": "건강기능식품"},
        ],
    },
    # ASU
    "asu": {
        "top": {"name": "이모튼 캡슐", "manufacturer": "한국오츠카제약", "type": "전문의약품", "note": "ASU 300mg. 무릎 OA 처방", "matches_verified_id": "asu_piascledine"},
        "others": [],
    },
    # 아세트아미노펜
    "acetaminophen": {
        "top": {"name": "타이레놀 500mg", "manufacturer": "한국얀센", "type": "일반의약품", "note": "안전상비의약품 — 편의점도 가능"},
        "others": [
            {"name": "써스펜 8시간 ER", "manufacturer": "한미약품", "type": "일반의약품"},
        ],
    },
    # === 신규 처방 NSAID ===
    "celecoxib": {
        "top": {"name": "쎄레브렉스", "manufacturer": "한국화이자제약", "type": "전문의약품", "note": "COX-2 선택적. 위장 부작용 적음", "matches_verified_id": "celecoxib_200mg"},
        "others": [],
    },
    "etoricoxib": {
        "top": {"name": "아콕시아", "manufacturer": "한국MSD", "type": "전문의약품", "note": "COX-2 선택적. 60mg 1일 1회", "matches_verified_id": "etoricoxib_60mg"},
        "others": [],
    },
    "polmacoxib": {
        "top": {"name": "아셀렉스", "manufacturer": "크리스탈지노믹스", "type": "전문의약품", "note": "한국 개발 COX-2", "matches_verified_id": "polmacoxib_2mg"},
        "others": [],
    },
    "naproxen": {
        "top": {"name": "낙센", "manufacturer": "종근당", "type": "일반의약품 / 전문의약품", "note": "용량에 따라 일반/전문"},
        "others": [],
    },
    "tramadol": {
        "top": {"name": "트리돌", "manufacturer": "한미약품", "type": "전문의약품", "note": "마약성 진통제는 아니지만 향정신성. 의존성 주의"},
        "others": [
            {"name": "울트라셋 (아세트아미노펜+트라마돌)", "manufacturer": "한국얀센", "type": "전문의약품"},
        ],
    },
    # === 외용 NSAID ===
    "diclofenac_topical": {
        "top": {"name": "디클로페낙 패치/플라스타", "manufacturer": "다수 (제일헬스사이언스 등)", "type": "일반의약품", "note": "약국 OTC. 외용 NSAID 최강 SMD -0.81", "matches_verified_id": "diclofenac_patch"},
        "others": [
            {"name": "볼타렌 에멀겔", "manufacturer": "한국노바티스", "type": "일반의약품", "note": "디클로페낙 1% 겔", "matches_verified_id": "diclofenac_gel"},
        ],
    },
    "ketoprofen_topical": {
        "top": {"name": "케토톱 플라스타", "manufacturer": "한독", "type": "일반의약품", "note": "한국에서 가장 유명한 외용 NSAID 브랜드"},
        "others": [],
    },
    "loxoprofen_topical": {
        "top": {"name": "록소나파 외용", "manufacturer": "다수", "type": "일반의약품"},
        "others": [],
    },
    "flurbiprofen_topical": {
        "top": {"name": "플루리스 패치", "manufacturer": "다수", "type": "일반의약품", "note": "일반 flurbiprofen 외용"},
        "others": [
            {"name": "S-flurbiprofen 패치 (SFPP)", "manufacturer": "일본 OTC", "type": "한국 미수입", "note": "일본에서만 시판", "matches_verified_id": "s_flurbiprofen"},
        ],
    },
    "felbinac_topical": {
        "top": {"name": "펠비낙 외용", "manufacturer": "다수", "type": "일반의약품", "note": "OA에 대한 RCT 빈약"},
        "others": [],
    },
    "piroxicam_topical": {
        "top": {"name": "트라스트 패치", "manufacturer": "SK케미칼", "type": "일반의약품", "note": "피록시캄 외용 패치"},
        "others": [],
    },
    "ibuprofen_topical": {
        "top": {"name": "한국 이부프로펜 외용 시판 매우 제한적", "manufacturer": "—", "type": "한국 미수입", "note": "이부프로펜 외용 단일제는 거의 없음. 다른 외용 NSAID(케토톱·디클로페낙) 대체 권장"},
        "others": [],
    },
    "methyl_salicylate": {
        "top": {"name": "안티푸라민 등 (복합제)", "manufacturer": "다수", "type": "일반의약품", "note": "단일제는 거의 없고 복합제 위주"},
        "others": [],
    },
    "capsaicin_topical": {
        "top": {"name": "캡시카 플라스타", "manufacturer": "신신제약 등", "type": "일반의약품", "note": "캡사이신 외용. 타는 듯한 감각 부작용 주의"},
        "others": [],
    },
    "shinshin_arex": {
        "top": {"name": "신신파스 아렉스", "manufacturer": "신신제약", "type": "일반의약품", "note": "복합제 (살리실산메틸+l-멘톨+캠퍼 등)"},
        "others": [],
    },
    # === 약초 ===
    "ski306x": {
        "top": {"name": "조인스정 (SKI306X)", "manufacturer": "SK케미칼", "type": "전문의약품", "note": "한국 OA 시판 약초 복합제. SMD 데이터 한정", "matches_verified_id": "skl_306x_joins"},
        "others": [],
    },
    # === 직구 영양제 ===
    "l_carnitine": {
        "top": {"name": "L-Carnitine (Now Foods 등)", "manufacturer": "직구 (iHerb)", "type": "직구 / 건강기능식품", "note": "지방산 산화 보조. BMI 높을 때 보조 역할"},
        "others": [],
    },
    "curcumin_enhanced": {
        "top": {"name": "Theracurmin / Meriva / BCM-95 / Longvida", "manufacturer": "직구 (iHerb 등)", "type": "직구 / 건강기능식품", "note": "강화제형. 일반 강황 분말과 효과 차이 큼 SMD -0.82"},
        "others": [
            {"name": "쎄라큐민", "manufacturer": "Theravalues (직구)", "type": "직구 / 건강기능식품"},
        ],
    },
    "turmacin": {
        "top": {"name": "Turmacin (수용성 강황 추출물)", "manufacturer": "Natural Remedies (직구)", "type": "직구 / 건강기능식품", "note": "단일 RCT 기반 (Madhu 2013)"},
        "others": [],
    },
    # === 시술 ===
    "ia_steroid": {
        "top": {"name": "관절강내 스테로이드 주사", "manufacturer": "—", "type": "시술 (의원)", "note": "정형외과/통증의학과 시술. 1-2주엔 효과 크지만 6개월엔 거의 사라짐."},
        "others": [],
    },
    "ia_hyaluronic_acid": {
        "top": {"name": "히알루론산 관절강내 주사 (하이루안 등)", "manufacturer": "—", "type": "시술 (의원)", "note": "정형외과 시술. SMD -0.04 위약 수준"},
        "others": [],
    },
    "topical_nsaids_avg": {
        "top": {"name": "외용 NSAID 일반 (디클로페낙 패치/케토톱 등)", "manufacturer": "다수", "type": "일반의약품", "note": "여러 외용 NSAID 평균치 — 개별 제품은 위 참조"},
        "others": [],
    },
    # === 기존 매핑 유지 ===
    "vitamin_d": {
        "top": {"name": "디멤버 비타민D", "manufacturer": "다수", "type": "건강기능식품"},
        "others": [],
    },
    "magnesium": {
        "top": {"name": "마그네슘 글리시네이트", "manufacturer": "다수", "type": "건강기능식품"},
        "others": [],
    },
    "uc_ii_collagen": {
        "top": {"name": "UC-II 콜라겐", "manufacturer": "다수 (이뮨오티카 등)", "type": "건강기능식품"},
        "others": [],
    },
    "hyaluronic_acid": {
        "top": {"name": "조인플렉스 경구 히알루론산", "manufacturer": "다수", "type": "건강기능식품"},
        "others": [],
    },
    "collagen": {
        "top": {"name": "저분자 콜라겐 펩타이드", "manufacturer": "다수", "type": "건강기능식품"},
        "others": [],
    },
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

    # === Step 1: substances upsert ===
    log.info(f"=== Step 1: {len(NEW_SUBSTANCES)}개 새 substance upsert ===")
    existing_slugs = {s["slug"] for s in sb.table("substances").select("slug").execute().data}
    inserted_subs = 0
    for s in NEW_SUBSTANCES:
        if s["slug"] in existing_slugs:
            log.info(f"  = (이미 존재) {s['slug']}")
            continue
        if args.dry_run:
            log.info(f"  [DRY] + {s['name_ko']} ({s['slug']})")
        else:
            sb.table("substances").insert({**s, "aliases": []}).execute()
            log.info(f"  ✓ + {s['name_ko']} ({s['slug']})")
            inserted_subs += 1
    log.info(f"  추가됨: {inserted_subs}")

    # === Step 2: substance.extra.korea_products 적재 ===
    log.info(f"\n=== Step 2: {len(PRODUCT_MAPPINGS)}개 product 매핑 적재 ===")
    subs = sb.table("substances").select("id, slug, name_ko, extra").execute().data
    by_slug = {s["slug"]: s for s in subs}

    updated = 0
    skipped = 0
    for slug, prod_info in PRODUCT_MAPPINGS.items():
        sub = by_slug.get(slug)
        if not sub:
            log.warning(f"  ⚠️ slug '{slug}' 없음 — skip")
            skipped += 1
            continue
        extra = dict(sub.get("extra") or {})
        extra["korea_products"] = prod_info
        top_name = prod_info["top"]["name"]
        if args.dry_run:
            log.info(f"  [DRY] {sub['name_ko']:25} → {top_name}")
        else:
            sb.table("substances").update({"extra": extra}).eq("id", sub["id"]).execute()
            log.info(f"  ✓ {sub['name_ko']:25} → {top_name}")
            updated += 1

    log.info(f"\n=== 완료 === substances {inserted_subs} 추가, products {updated} 매핑, skip {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
