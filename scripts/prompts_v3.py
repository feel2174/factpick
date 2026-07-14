"""FactPick PICO 추출 프롬프트 v3.

설계 원칙 (영선의 비전):
- 한 abstract = 한 번만 읽음 (Claude 호출 절약)
- 거기 나오는 모든 성분 × 모든 효과 정보 보존
- 수치(SMD/CI/p) + 카테고리(large/small) + narrative 같이 저장
- "틀에 안 맞는 정보를 버리지 않기" — extra_notes 필드로 보존
- 메타/SR과 RCT는 다른 프롬프트:
    META_SR_PROMPT  → multi-substance, pooled effect 추출
    RCT_PROMPT      → 단일 쌍, 정밀 SMD/CI + 설계/안전성 추출
"""

META_SR_PROMPT = """You are a medical research analyst.

Below is the abstract of a meta-analysis or systematic review about treatments for **{condition_name_en} ({condition_name_ko})**.

**Title:** {title}

**Abstract:**
{abstract}

---

GOAL: Extract ALL information about ALL substances/treatments mentioned. Do not limit to one. Preserve every piece of evidence — quantitative or narrative — that could help a clinician decide between options.

Output JSON ONLY. No markdown, no prose.

Schema:
{{
  "primary_condition": "main condition studied (e.g., 'knee osteoarthritis')",
  "study_design_summary": "1-line description (e.g., '69 RCTs meta-analyzed, n=11,500')",
  "n_studies_included": integer or null,
  "total_sample_size": integer or null,
  "evidence_grade_stated": "GRADE level if mentioned (high/moderate/low/very_low) or null",
  "is_multi_substance": true,

  "substances": [
    {{
      "name_raw": "exact name as in abstract (e.g., 'Boswellia serrata extract', 'undenatured type II collagen')",
      "intervention_detail": "dose + form if mentioned, else null",
      "comparator": "placebo / standard care / head-to-head / unclear",

      "effect_metric": "SMD | MD | Hedges_g | OR | RR | HR | percent | null",
      "effect_value": numeric or null,
      "ci_lower": numeric or null,
      "ci_upper": numeric or null,
      "p_value": numeric or null,
      "n_studies_for_this_substance": integer or null,

      "effect_size_category": "large | moderate | small | null_effect | negative | unclear",
      "clinical_importance": "clinically_important | not_clinically_important | unclear",
      "effect_direction": "positive | null | negative | mixed",

      "timepoint": "short_term | medium_term | long_term | unclear",
      "outcome_measure": "primary outcome (e.g., 'VAS pain', 'WOMAC pain subscale')",

      "narrative": "1-sentence near-verbatim from the abstract describing THIS substance's effect",
      "quality_note": "anything relevant about quality/heterogeneity/risk-of-bias for this substance, or null"
    }}
  ],

  "head_to_head_comparisons": [
    {{
      "substance_a": "name_raw",
      "substance_b": "name_raw",
      "winner": "a | b | tie | unclear",
      "metric": "the comparison metric if any",
      "narrative": "1-sentence describing the comparison"
    }}
  ],

  "safety_notes": "adverse effects or safety signals mentioned, or null",
  "limitations": "study limitations the authors stated, or null",
  "authors_conclusion": "1-sentence near-verbatim of authors' overall conclusion",
  "extra_notes": "anything else in the abstract worth preserving that didn't fit above, or null"
}}

EXTRACTION RULES:

1. POOLED EFFECTS ONLY (for meta-analyses): extract the pooled/overall/summary effect for each substance — never an individual study effect from within the meta-analysis.

2. INCLUDE EVERY SUBSTANCE mentioned, even those with no effect or negative effect. "Glucosamine showed no benefit" is valuable information — extract it with effect_size_category="null_effect".

3. KEEP NAMES AS-IS. Don't translate, standardize, or merge. We'll match to our DB later. "BSE", "Boswellia extract", "Boswellia serrata" → three separate entries if listed separately.

4. SIZE CATEGORIES from narrative when no number is given:
   - "large" → effect_size_category="large"
   - "moderate" / "medium" → "moderate"
   - "small" / "modest" → "small"
   - "no significant difference" / "ineffective" → "null_effect"
   - "worse than control" / "harmful" → "negative"

5. NUMERIC EXTRACTION:
   - "SMD -0.48 (95% CI -0.72 to -0.24, p<0.001)" → effect_metric="SMD", effect_value=-0.48, ci_lower=-0.72, ci_upper=-0.24, p_value=0.001
   - "(effect size 0.85)" → effect_metric could be SMD or unclear; if abstract uses "standardized" or "Hedges' g" use SMD, else null
   - "MD -8.3mm on VAS" → effect_metric="MD", effect_value=-8.3, outcome_measure="VAS pain"

6. SIGN CONVENTION: for pain/symptom outcomes, negative SMD/MD = treatment REDUCED symptom = clinical benefit. Keep the sign as reported. Do not invert.

7. HEAD-TO-HEAD: if the abstract directly compares two substances (e.g., "MSM was superior to glucosamine"), record under head_to_head_comparisons.

8. NEVER FABRICATE. Numbers must come from the abstract text. If unsure between SMD and MD, look at the scale: standardized values typically lie within ±2.

9. extra_notes is for surprises — e.g., dose-response patterns, subgroup effects, mechanism hints, anything the schema didn't anticipate. Don't leave good information on the floor.

Output JSON only. Begin with {{ and end with }}."""


RCT_PROMPT = """You are a medical research analyst.

Below is the abstract of a randomized controlled trial (RCT) about **{substance_name_en} ({substance_name_ko})** for **{condition_name_en} ({condition_name_ko})**.

**Title:** {title}

**Abstract:**
{abstract}

---

GOAL: Extract precise effect data and study design quality. Single-substance focus, but preserve every detail that affects clinical interpretation.

Output JSON ONLY. No markdown, no prose.

Schema:
{{
  "primary_condition": "specific condition / subgroup (e.g., 'knee OA grade II-III')",
  "substance_focus": "what was actually tested (e.g., 'Boswellia serrata extract 500mg/day')",
  "comparator": "placebo / active control / standard care / etc.",

  "population_detail": "brief description (e.g., 'Adults aged 45-75 with symptomatic knee OA')",
  "population_type": "healthy_adult | elderly | pregnant | child | diabetes | hypertension | liver_impaired | kidney_impaired | athlete | mixed | unclear",
  "sample_size_total": integer or null,
  "sample_size_treatment": integer or null,
  "sample_size_control": integer or null,

  "design_features": {{
    "is_randomized": true | false | unclear,
    "is_double_blind": true | false | unclear,
    "is_placebo_controlled": true | false | unclear,
    "is_multicenter": true | false | unclear,
    "has_intention_to_treat": true | false | unclear,
    "follow_up_weeks": integer or null
  }},

  "dose_value": numeric or null,
  "dose_unit": "mg | g | IU | etc. or null",
  "duration_weeks": integer or null,

  "primary_outcome": {{
    "measure": "outcome scale (e.g., 'WOMAC pain', 'VAS', 'KOOS')",
    "effect_metric": "SMD | MD | Hedges_g | OR | RR | HR | percent | null",
    "effect_value": numeric or null,
    "ci_lower": numeric or null,
    "ci_upper": numeric or null,
    "p_value": numeric or null,
    "effect_direction": "positive | null | negative",
    "effect_size_category": "large | moderate | small | null_effect | negative | unclear",
    "narrative": "1-sentence verbatim describing the primary result"
  }},

  "secondary_outcomes": [
    {{
      "measure": "...",
      "effect_metric": "...",
      "effect_value": numeric or null,
      "p_value": numeric or null,
      "narrative": "..."
    }}
  ],

  "safety_notes": "adverse events reported, or null",
  "limitations": "limitations mentioned by authors, or null",
  "authors_conclusion": "1-sentence near-verbatim conclusion",

  "relevance_score": "0 to 1 — is this RCT really about {substance_name_en} × {condition_name_en}?",
  "extraction_confidence": "0 to 1 — confidence in numeric extraction",
  "extra_notes": "anything else worth preserving, or null"
}}

EXTRACTION RULES:

1. PRIMARY OUTCOME is the most important block — the abstract usually states it explicitly. If multiple primary endpoints, pick the one most relevant to the condition (e.g., pain for OA).

2. NUMERIC EXTRACTION:
   - "MD -1.2 (95% CI -1.8 to -0.6, p=0.001)" → effect_metric="MD", effect_value=-1.2, ci_lower=-1.8, ci_upper=-0.6, p_value=0.001
   - "30% improvement vs 10% in placebo" → effect_metric="percent", effect_value=30, narrative captures the comparison
   - "no significant difference (p=0.42)" → effect_metric=null, effect_value=null, p_value=0.42, effect_direction="null"

3. SIGN CONVENTION: for pain/symptom outcomes, negative SMD/MD = symptom REDUCED = clinical benefit. Keep as reported.

4. SECONDARY OUTCOMES: list 1-3 most clinically meaningful, with their numbers. Skip exploratory ones unless surprising.

5. DESIGN_FEATURES drive credibility. Mark `unclear` rather than guessing. "double-blind" / "DB-RCT" → is_double_blind=true.

6. RELEVANCE: if the RCT is only tangentially about this pair (e.g., a combination product where {substance_name_en} is one ingredient), give relevance_score < 0.5 and note it.

7. NEVER FABRICATE. Numbers come from the abstract only. extra_notes is for anything the schema missed — dose-response, subgroup signals, mechanism, etc.

Output JSON only. Begin with {{ and end with }}."""
