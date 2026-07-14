# Multi-substance 추출 v3 검증 — 골관절염

_총 6편: 종합 리뷰 + 단일 쌍 혼합_

각 논문에 대해 (1) abstract 원문 (2) 새 프롬프트가 뽑아낸 JSON을 나란히 볼 수 있어. **누락된 정보 / 잘못 분류된 정보 / 추가 필드가 필요한 항목** 알려주면 프롬프트 다듬을게.

---

## 1. PMID 29018060 — meta_analysis

**Title:** Dietary supplements for treating osteoarthritis: a systematic review and meta-analysis.

**Year:** 2018 · **Sample size:** 미상

**PubMed:** https://pubmed.ncbi.nlm.nih.gov/29018060/

### Abstract
```
OBJECTIVE: To investigate the efficacy and safety of dietary supplements for patients with osteoarthritis.
DESIGN: An intervention systematic review with random effects meta-analysis and meta-regression.
DATA SOURCES: MEDLINE, EMBASE, Cochrane Register of Controlled Trials, Allied and Complementary Medicine and Cumulative Index to Nursing and Allied Health Literature were searched from inception to April 2017.
STUDY ELIGIBILITY CRITERIA: Randomised controlled trials comparing oral supplements with placebo for hand, hip or knee osteoarthritis.
RESULTS: Of 20 supplements investigated in 69 eligible studies, 7 (collagen hydrolysate, passion fruit peel extract, Curcuma longa extract, Boswellia serrata extract, curcumin, pycnogenol and L-carnitine) demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term. Another six (undenatured type II collagen, avocado soybean unsaponifiables, methylsulfonylmethane, diacerein, glucosamine and chondroitin) revealed statistically significant improvements on pain, but were of unclear clinical importance. Only green-lipped mussel extract and undenatured type II collagen had clinically important effects on pain at medium term. No supplements were identified with clinically important effects on pain reduction at long term. Similar results were found for physical function. Chondroitin demonstrated statistically significant, but not clinically important structural improvement (effect size -0.30, -0.42 to -0.17). There were no differences between supplements and placebo for safety outcomes, except for diacerein. The Grading of Recommendations Assessment, Development and Evaluation suggested a wide range of quality evidence from very low to high.
CONCLUSIONS: The overall analysis including all trials showed that supplements provided moderate and clinically meaningful treatment effects on pain and function in patients with hand, hip or knee osteoarthritis at short term, although the quality of evidence was very low. Some supplements with a limited number of studies and participants suggested large treatment effects, while widely used supplements such as glucosamine and chondroitin were either ineffective or showed small and arguably clinically unimportant treatment effects. Supplements had no clinically important effects on pain and function at medium-term and long-term follow-ups.
```

### Extracted JSON
_성분 14개 · head-to-head 0개 · 수치 있음 1/14 · 카테고리 있음 14/14_

```json
{
  "primary_condition": "hand, hip or knee osteoarthritis",
  "study_design_summary": "Systematic review with random effects meta-analysis and meta-regression of 69 RCTs evaluating 20 oral dietary supplements vs placebo",
  "n_studies_included": 69,
  "total_sample_size": null,
  "evidence_grade_stated": "very_low_to_high (GRADE ranged from very low to high; overall quality very low)",
  "is_multi_substance": true,
  "substances": [
    {
      "name_raw": "collagen hydrolysate",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "Collagen hydrolysate demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Some supplements with large effects had a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "passion fruit peel extract",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "Passion fruit peel extract demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Large treatment effects suggested by a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "Curcuma longa extract",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "Curcuma longa extract demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Large treatment effects suggested by a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "Boswellia serrata extract",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "Boswellia serrata extract demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Large treatment effects suggested by a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "curcumin",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "Curcumin demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Large treatment effects suggested by a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "pycnogenol",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "Pycnogenol demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Large treatment effects suggested by a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "L-carnitine",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain reduction",
      "narrative": "L-carnitine demonstrated large (effect size >0.80) and clinically important effects for pain reduction at short term.",
      "quality_note": "Large treatment effects suggested by a limited number of studies and participants; overall evidence quality very low"
    },
    {
      "name_raw": "undenatured type II collagen",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "moderate",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "medium_term",
      "outcome_measure": "pain",
      "narrative": "Undenatured type II collagen revealed statistically significant improvement on pain of unclear clinical importance at short term, and was one of only two supplements with clinically important effects on pain at medium term.",
      "quality_note": "At short term clinical importance was unclear; clinically important benefit emerged only at medium term"
    },
    {
      "name_raw": "avocado soybean unsaponifiables",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "unclear",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain",
      "narrative": "Avocado soybean unsaponifiables revealed a statistically significant improvement on pain, but of unclear clinical importance.",
      "quality_note": "Statistically significant but clinical importance unclear"
    },
    {
      "name_raw": "methylsulfonylmethane",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "unclear",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain",
      "narrative": "Methylsulfonylmethane revealed a statistically significant improvement on pain, but of unclear clinical importance.",
      "quality_note": "Statistically significant but clinical importance unclear"
    },
    {
      "name_raw": "diacerein",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "unclear",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "pain",
      "narrative": "Diacerein revealed a statistically significant improvement on pain, but of unclear clinical importance.",
      "quality_note": "Statistically significant but clinical importance unclear; the only supplement to differ from placebo on safety outcomes (worse safety signal)"
    },
    {
      "name_raw": "glucosamine",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "small",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "mixed",
      "timepoint": "short_term",
      "outcome_measure": "pain",
      "narrative": "Glucosamine revealed a statistically significant improvement on pain of unclear clinical importance, but was characterised in the conclusion as either ineffective or showing small and arguably clinically unimportant treatment effects.",
      "quality_note": "Widely used supplement; despite many studies, effects were either null or small and clinically unimportant"
    },
    {
      "name_raw": "chondroitin",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": -0.3,
      "ci_lower": -0.42,
      "ci_upper": -0.17,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "small",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "positive",
      "timepoint": "short_term",
      "outcome_measure": "structural improvement (joint structure); pain also assessed",
      "narrative": "Chondroitin revealed a statistically significant improvement on pain of unclear clinical importance and demonstrated statistically significant, but not clinically important structural improvement (effect size -0.30, -0.42 to -0.17).",
      "quality_note": "Widely used supplement; effects either null or small and arguably clinically unimportant; the -0.30 effect size refers to structural improvement"
    },
    {
      "name_raw": "green-lipped mussel extract",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "unclear",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "medium_term",
      "outcome_measure": "pain",
      "narrative": "Only green-lipped mussel extract and undenatured type II collagen had clinically important effects on pain at medium term.",
      "quality_note": "Clinically important effect demonstrated only at medium term"
    }
  ],
  "head_to_head_comparisons": [],
  "safety_notes": "There were no differences between supplements and placebo for safety outcomes, except for diacerein, which differed from placebo on safety.",
  "limitations": "Overall quality of evidence was very low; supplements showing large effects often had only a limited number of studies and participants; GRADE quality ranged widely from very low to high; no clinically important effects were found at medium-term or long-term follow-up.",
  "authors_conclusion": "Supplements provided moderate and clinically meaningful effects on pain and function at short term (though evidence quality was very low), with some less-studied supplements suggesting large effects while widely used glucosamine and chondroitin were ineffective or had small clinically unimportant effects, and no clinically important effects at medium or long term.",
  "extra_notes": "Of 20 supplements investigated across 69 studies, only 14 are individually named in the abstract (7 large/short-term, 6 statistically significant but unclear importance, plus green-lipped mussel extract at medium term). No supplement showed clinically important effects on pain reduction at long term. Results for physical function paralleled those for pain. A notable dissociation exists between statistical significance and clinical importance, and between sparse-evidence supplements (large apparent effects) and well-studied glucosamine/chondroitin (small or null effects)."
}
```

---

## 2. PMID 17292766 — meta_analysis

**Title:** Assessment of upper gastrointestinal safety of etoricoxib and diclofenac in patients with osteoarthritis and rheumatoid arthritis in the Multinational Etoricoxib and Diclofenac Arthritis Long-term (MEDAL) programme: a randomised comparison.

**Year:** 2007 · **Sample size:** 701

**PubMed:** https://pubmed.ncbi.nlm.nih.gov/17292766/

### Abstract
```
BACKGROUND: Upper gastrointestinal safety of cyclo-oxygenase (COX)-2 selective inhibitors versus traditional non-steroidal anti-inflammatory drugs (NSAIDs) has not been assessed in trials that simulate standard clinical practice. Our aim was to assess the effects of these drugs on gastrointestinal outcomes in a population that includes patients taking gastrointestinal protective therapy.
METHODS: A prespecified pooled intent-to-treat analysis of three double-blind randomised comparisons of etoricoxib (60 or 90 mg daily) and diclofenac (150 mg daily) in 34 701 patients with osteoarthritis or rheumatoid arthritis was done for upper gastrointestinal clinical events (bleeding, perforation, obstruction, or ulcer) and the subset of complicated events (perforation, obstruction, witnessed ulcer bleeding, or significant bleeding). We also assessed such outcomes in patients who were taking concomitant proton pump inhibitors (PPIs) or low-dose aspirin. These trials are registered with , with the numbers , , and .
FINDINGS: Overall upper gastrointestinal clinical events were significantly less common with etoricoxib than with diclofenac (hazard ratio [HR] 0.69, 95% CI 0.57-0.83; p=0.0001). There were significantly fewer uncomplicated gastrointestinal events with etoricoxib than there were with diclofenac (0.57, 0.45-0.74; p<0.0001); there was no difference in complicated events (0.91, 0.67-1.24; p=0.561). PPIs were used concomitantly for at least 75% of the study period by 13 862 (40%) and low-dose aspirin by 11 418 (33%) patients; treatment effects did not differ significantly in these individuals.
INTERPRETATION: There were significantly fewer upper gastrointestinal clinical events with the COX-2 selective inhibitor etoricoxib than with the traditional NSAID diclofenac due to a decrease in uncomplicated events, but not in the more serious complicated events. The reduction in uncomplicated events with etoricoxib is maintained in patients treated with PPIs and is also observed with regular low-dose aspirin use.
```

### Extracted JSON
_성분 2개 · head-to-head 1개 · 수치 있음 2/2 · 카테고리 있음 2/2_

```json
{
  "primary_condition": "osteoarthritis (and rheumatoid arthritis)",
  "study_design_summary": "Prespecified pooled intent-to-treat analysis of 3 double-blind RCTs (MEDAL programme), n=34,701",
  "n_studies_included": 3,
  "total_sample_size": 34701,
  "evidence_grade_stated": null,
  "is_multi_substance": true,
  "substances": [
    {
      "name_raw": "etoricoxib",
      "intervention_detail": "60 or 90 mg daily, oral (COX-2 selective inhibitor)",
      "comparator": "head-to-head",
      "effect_metric": "HR",
      "effect_value": 0.69,
      "ci_lower": 0.57,
      "ci_upper": 0.83,
      "p_value": 0.0001,
      "n_studies_for_this_substance": 3,
      "effect_size_category": "moderate",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "long_term",
      "outcome_measure": "upper gastrointestinal clinical events (bleeding, perforation, obstruction, or ulcer)",
      "narrative": "Overall upper gastrointestinal clinical events were significantly less common with etoricoxib than with diclofenac (HR 0.69, 95% CI 0.57-0.83; p=0.0001), driven by fewer uncomplicated events (HR 0.57, 0.45-0.74; p<0.0001) with no difference in complicated events (HR 0.91, 0.67-1.24; p=0.561).",
      "quality_note": "Benefit confined to uncomplicated events; no significant difference in the more serious complicated events (perforation, obstruction, witnessed ulcer bleeding, or significant bleeding)."
    },
    {
      "name_raw": "diclofenac",
      "intervention_detail": "150 mg daily, oral (traditional NSAID)",
      "comparator": "head-to-head",
      "effect_metric": "HR",
      "effect_value": 0.69,
      "ci_lower": 0.57,
      "ci_upper": 0.83,
      "p_value": 0.0001,
      "n_studies_for_this_substance": 3,
      "effect_size_category": "negative",
      "clinical_importance": "clinically_important",
      "effect_direction": "negative",
      "timepoint": "long_term",
      "outcome_measure": "upper gastrointestinal clinical events (bleeding, perforation, obstruction, or ulcer)",
      "narrative": "Diclofenac (the traditional NSAID comparator) was associated with significantly more overall and uncomplicated upper gastrointestinal clinical events than etoricoxib (reference arm; HR for etoricoxib vs diclofenac 0.69, 95% CI 0.57-0.83).",
      "quality_note": "Serves as the active comparator; difference versus etoricoxib was in uncomplicated events only, not in complicated events."
    }
  ],
  "head_to_head_comparisons": [
    {
      "substance_a": "etoricoxib",
      "substance_b": "diclofenac",
      "winner": "a",
      "metric": "HR for upper GI clinical events 0.69 (95% CI 0.57-0.83, p=0.0001); uncomplicated events HR 0.57 (0.45-0.74, p<0.0001); complicated events HR 0.91 (0.67-1.24, p=0.561)",
      "narrative": "Etoricoxib produced significantly fewer overall and uncomplicated upper gastrointestinal clinical events than diclofenac, but the two did not differ in complicated (more serious) events."
    }
  ],
  "safety_notes": "Study endpoint was upper gastrointestinal safety: bleeding, perforation, obstruction, or ulcer (and the complicated subset). Etoricoxib reduced uncomplicated events versus diclofenac but showed no advantage for complicated events. Treatment effects did not differ significantly in patients on concomitant PPIs or low-dose aspirin.",
  "limitations": "No advantage of etoricoxib over diclofenac was demonstrated for the more serious complicated gastrointestinal events; trial registration numbers were not stated in the abstract text.",
  "authors_conclusion": "There were significantly fewer upper gastrointestinal clinical events with the COX-2 selective inhibitor etoricoxib than with the traditional NSAID diclofenac due to a decrease in uncomplicated events, but not in the more serious complicated events.",
  "extra_notes": "This is a gastrointestinal SAFETY (not efficacy/pain) analysis; HR <1 favours etoricoxib (fewer adverse GI events). Subgroups: PPIs were used concomitantly for ≥75% of the study period by 13,862 patients (40%) and low-dose aspirin by 11,418 (33%); the reduction in uncomplicated events with etoricoxib was maintained in both PPI-treated and regular low-dose-aspirin users."
}
```

---

## 3. PMID 26242469 — meta_analysis

**Title:** Topical diclofenac therapy for osteoarthritis: a meta-analysis of randomized controlled trials.

**Year:** 2016 · **Sample size:** 미상

**PubMed:** https://pubmed.ncbi.nlm.nih.gov/26242469/

### Abstract
```
The objective of this study was to evaluate the efficacy and safety of topical diclofenac therapy for osteoarthritis (OA). A meta-analysis of randomized controlled trials was conducted. A comprehensive literature search, covering the databases of Medline, the Cochrane Central Register of Controlled Trials, and EMBASE, was conducted in September 2014 to identify the randomized controlled trials which adopted the topical diclofenac therapy for OA. A total of nine papers were included in this meta-analysis. Topical diclofenac appears to be effective in both pain relief (standard mean differences (SMD) = 0.40; 95 % confidence interval (CI) 0.19 to 0.62; P = 0.0003) and function improvement (SMD = 0.23; 95 % CI 0.03 to 0.43; P = 0.03) when compared with the control group. The sensitivity analysis and subgroup analysis showed that the result of pain intensity was stable and reliable, while the result of physical function improvement was vague. With respect to safety, topical diclofenac demonstrated a higher incidence of adverse events such as dry skin, rash, dermatitis, neck pain, and withdrawal. Topical diclofenac is effective in pain relief as a treatment of OA. It may also have a potential effect in function improvement, which needs further studies to be explored. Although, some adverse effects were observed in the application of topical diclofenac, none of them was serious.
```

### Extracted JSON
_성분 2개 · head-to-head 0개 · 수치 있음 2/2 · 카테고리 있음 2/2_

```json
{
  "primary_condition": "osteoarthritis",
  "study_design_summary": "Meta-analysis of 9 RCTs of topical diclofenac for OA",
  "n_studies_included": 9,
  "total_sample_size": null,
  "evidence_grade_stated": null,
  "is_multi_substance": true,
  "substances": [
    {
      "name_raw": "topical diclofenac",
      "intervention_detail": null,
      "comparator": "placebo / standard care / unclear",
      "effect_metric": "SMD",
      "effect_value": 0.4,
      "ci_lower": 0.19,
      "ci_upper": 0.62,
      "p_value": 0.0003,
      "n_studies_for_this_substance": 9,
      "effect_size_category": "small",
      "clinical_importance": "unclear",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "pain relief / pain intensity",
      "narrative": "Topical diclofenac appears to be effective in pain relief (SMD = 0.40; 95% CI 0.19 to 0.62; P = 0.0003) when compared with the control group.",
      "quality_note": "Sensitivity analysis and subgroup analysis showed the result of pain intensity was stable and reliable."
    },
    {
      "name_raw": "topical diclofenac",
      "intervention_detail": null,
      "comparator": "placebo / standard care / unclear",
      "effect_metric": "SMD",
      "effect_value": 0.23,
      "ci_lower": 0.03,
      "ci_upper": 0.43,
      "p_value": 0.03,
      "n_studies_for_this_substance": 9,
      "effect_size_category": "small",
      "clinical_importance": "unclear",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "physical function improvement",
      "narrative": "Topical diclofenac appears to be effective in function improvement (SMD = 0.23; 95% CI 0.03 to 0.43; P = 0.03) when compared with the control group.",
      "quality_note": "The result of physical function improvement was described as vague on sensitivity and subgroup analysis; needs further studies."
    }
  ],
  "head_to_head_comparisons": [],
  "safety_notes": "Topical diclofenac demonstrated a higher incidence of adverse events such as dry skin, rash, dermatitis, neck pain, and withdrawal; however, none of the observed adverse effects was serious.",
  "limitations": "The result for physical function improvement was vague (not stable/reliable on sensitivity and subgroup analysis), and the potential effect on function improvement needs further studies to be explored.",
  "authors_conclusion": "Topical diclofenac is effective in pain relief as a treatment of OA and may also have a potential effect in function improvement.",
  "extra_notes": "Literature search (Medline, Cochrane CENTRAL, EMBASE) was conducted in September 2014. Pain intensity result was stable/reliable on sensitivity and subgroup analysis whereas function improvement was vague, indicating differing robustness across the two outcomes."
}
```

---

## 4. PMID 15674927 — meta_analysis

**Title:** Braces and orthoses for treating osteoarthritis of the knee.

**Year:** 2005 · **Sample size:** 444

**PubMed:** https://pubmed.ncbi.nlm.nih.gov/15674927/

### Abstract
```
BACKGROUND: Patients with osteoarthritis of the knee can be treated with a brace or orthosis (shoe insole). The main purpose of these aids is to reduce pain, improve physical function and, possibly, to slow disease progression.
OBJECTIVES: To assess the effectiveness of a brace or orthosis in the treatment of osteoarthritis of the knee.
SEARCH STRATEGY: We searched Cochrane Central Register of Controlled Trials (CENTRAL), MEDLINE and EMBASE (Current contents, Health STAR) up to October 2002. The reference lists of the publications in the identified trials were also screened.
SELECTION CRITERIA: Extracted studies were included in the final analysis if they met the pre-defined inclusion criteria: 1) a randomised controlled clinical trial or a controlled clinical trial, 2) all patients had osteoarthritis of the knee, 3) the intervention in one of the studied groups was a brace or an orthosis.
DATA COLLECTION AND ANALYSIS: Two reviewers independently selected the trials and assessed the methodological quality using the Delphi-list and one additional question about care programs. Three reviewers independently extracted the data on the intervention, type of outcome measures, follow-up, loss to follow-up, and results, using a pre-tested standardized form. Study authors were contacted for additional information.
MAIN RESULTS: Four trials involving a total of 444 people were included in this review. One study investigated a knee brace and three studies examined different types of orthoses for medial compartment osteoarthritis of the knee. Two studies were of high methodological quality while the other two studies were low. Notably, the randomisation and the blinding procedures were either insufficient or not described. The follow-up period (six weeks to six months) was too short to demonstrate long-term results. Pooling was difficult primarily due to the heterogeneity of the data and the way the information was presented. The pain, stiffness and physical function (WOMAC and MACTAR) scores of a brace group showed greater improvement at six months compared with a neoprene sleeve group, which showed greater improvement compared with a control group. The numbers of days of non-steroidal anti-inflammatory drug (NSAID) intake decreased significantly (relative percentage difference 23.9%) compared with baseline in a group with laterally wedged insoles,and remained unchanged in the neutrally wedged group. Patient compliance with the laterally wedged insole was significantly better compared with the neutrally wedged insole. In one study, the Visual Analogue Pain (VAS) pain score was significantly decreased from baseline in a strapped insole group (RPD - 24%), but not in the traditional lateral wedge group, but this strapped insole showed more adverse effects (popliteal pain, low back pain, and foot sole pain) compared with the traditional lateral wedge insole. Pain during bed rest, after getting up, after getting up from seated position and walking distance was si
```

### Extracted JSON
_성분 6개 · head-to-head 4개 · 수치 있음 2/6 · 카테고리 있음 6/6_

```json
{
  "primary_condition": "knee osteoarthritis",
  "study_design_summary": "Cochrane systematic review of 4 trials (1 RCT/CCT on knee brace, 3 on orthoses), n=444",
  "n_studies_included": 4,
  "total_sample_size": 444,
  "evidence_grade_stated": null,
  "is_multi_substance": true,
  "substances": [
    {
      "name_raw": "knee brace",
      "intervention_detail": null,
      "comparator": "head-to-head",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": 1,
      "effect_size_category": "moderate",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "medium_term",
      "outcome_measure": "WOMAC and MACTAR (pain, stiffness, physical function)",
      "narrative": "The pain, stiffness and physical function (WOMAC and MACTAR) scores of a brace group showed greater improvement at six months compared with a neoprene sleeve group, which showed greater improvement compared with a control group.",
      "quality_note": "Single study; randomisation and blinding procedures across the review were insufficient or not described, and follow-up (six weeks to six months) was too short for long-term results."
    },
    {
      "name_raw": "neoprene sleeve",
      "intervention_detail": null,
      "comparator": "head-to-head",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": 1,
      "effect_size_category": "small",
      "clinical_importance": "unclear",
      "effect_direction": "positive",
      "timepoint": "medium_term",
      "outcome_measure": "WOMAC and MACTAR (pain, stiffness, physical function)",
      "narrative": "The neoprene sleeve group showed greater improvement than the control group but less improvement than the brace group at six months on WOMAC and MACTAR scores.",
      "quality_note": "Intermediate effect between brace and control within a single study; pooling difficult due to heterogeneity."
    },
    {
      "name_raw": "laterally wedged insoles",
      "intervention_detail": "laterally wedged shoe insole for medial compartment OA",
      "comparator": "head-to-head",
      "effect_metric": "percent",
      "effect_value": -23.9,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": 1,
      "effect_size_category": "moderate",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "number of days of NSAID intake",
      "narrative": "The numbers of days of NSAID intake decreased significantly (relative percentage difference 23.9%) compared with baseline in a group with laterally wedged insoles, and patient compliance with the laterally wedged insole was significantly better compared with the neutrally wedged insole.",
      "quality_note": "For medial compartment osteoarthritis; significant decrease versus baseline reported, not a between-group pooled effect size."
    },
    {
      "name_raw": "neutrally wedged insole",
      "intervention_detail": "neutrally wedged shoe insole",
      "comparator": "head-to-head",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": 1,
      "effect_size_category": "null_effect",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "null",
      "timepoint": "unclear",
      "outcome_measure": "number of days of NSAID intake",
      "narrative": "The number of days of NSAID intake remained unchanged in the neutrally wedged group, and patient compliance was significantly worse than with the laterally wedged insole.",
      "quality_note": "Comparator arm; no change from baseline."
    },
    {
      "name_raw": "strapped insole",
      "intervention_detail": "strapped lateral wedge insole",
      "comparator": "head-to-head",
      "effect_metric": "percent",
      "effect_value": -24,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": 1,
      "effect_size_category": "moderate",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "Visual Analogue Pain (VAS) score",
      "narrative": "In one study, the VAS pain score was significantly decreased from baseline in a strapped insole group (RPD -24%), but this strapped insole showed more adverse effects (popliteal pain, low back pain, and foot sole pain) compared with the traditional lateral wedge insole.",
      "quality_note": "Significant change versus baseline but associated with more adverse effects than the traditional lateral wedge insole."
    },
    {
      "name_raw": "traditional lateral wedge insole",
      "intervention_detail": "traditional (non-strapped) lateral wedge insole",
      "comparator": "head-to-head",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": null,
      "n_studies_for_this_substance": 1,
      "effect_size_category": "null_effect",
      "clinical_importance": "unclear",
      "effect_direction": "null",
      "timepoint": "unclear",
      "outcome_measure": "Visual Analogue Pain (VAS) score",
      "narrative": "The VAS pain score was not significantly decreased from baseline in the traditional lateral wedge group, but it caused fewer adverse effects than the strapped insole.",
      "quality_note": "No significant VAS reduction from baseline; better tolerability than strapped insole."
    }
  ],
  "head_to_head_comparisons": [
    {
      "substance_a": "knee brace",
      "substance_b": "neoprene sleeve",
      "winner": "a",
      "metric": "WOMAC and MACTAR (pain, stiffness, physical function) at six months",
      "narrative": "The brace group showed greater improvement in pain, stiffness and physical function at six months than the neoprene sleeve group."
    },
    {
      "substance_a": "neoprene sleeve",
      "substance_b": "control",
      "winner": "a",
      "metric": "WOMAC and MACTAR (pain, stiffness, physical function) at six months",
      "narrative": "The neoprene sleeve group showed greater improvement than the control group at six months."
    },
    {
      "substance_a": "laterally wedged insoles",
      "substance_b": "neutrally wedged insole",
      "winner": "a",
      "metric": "days of NSAID intake (RPD 23.9% decrease vs unchanged) and patient compliance",
      "narrative": "Laterally wedged insoles significantly reduced NSAID intake days and had significantly better compliance than the neutrally wedged insole, which showed no change."
    },
    {
      "substance_a": "strapped insole",
      "substance_b": "traditional lateral wedge insole",
      "winner": "unclear",
      "metric": "VAS pain change from baseline vs adverse effects",
      "narrative": "The strapped insole significantly reduced VAS pain from baseline (RPD -24%) whereas the traditional lateral wedge did not, but the strapped insole produced more adverse effects (popliteal pain, low back pain, foot sole pain)."
    }
  ],
  "safety_notes": "The strapped insole showed more adverse effects (popliteal pain, low back pain, and foot sole pain) compared with the traditional lateral wedge insole.",
  "limitations": "Only four trials (n=444); two of low methodological quality with insufficient or undescribed randomisation and blinding; follow-up (six weeks to six months) too short for long-term results; pooling was difficult due to heterogeneity of data and the way information was presented.",
  "authors_conclusion": "Abstract truncated before the formal authors' conclusions; available results suggest braces and laterally wedged/strapped insoles may improve pain and function and reduce NSAID use in knee (medial compartment) osteoarthritis, but evidence is limited and short-term.",
  "extra_notes": "Three of the four trials specifically addressed medial compartment osteoarthritis of the knee with orthoses. The abstract's MAIN RESULTS text is cut off mid-sentence ('Pain during bed rest, after getting up, after getting up from seated position and walking distance was si...'), so an additional outcome comparison was not fully captured. Search current to October 2002; quality assessed with the Delphi-list plus one care-program question."
}
```

---

## 5. PMID 39314013 — meta_analysis

**Title:** Efficacy of Extracts of Oleogum Resin of Boswellia in the Treatment of Knee Osteoarthritis: A Systematic Review and Meta-Analysis.

**Year:** 2024 · **Sample size:** 미상

**PubMed:** https://pubmed.ncbi.nlm.nih.gov/39314013/

### Abstract
```
Knee osteoarthritis (OA) has recently been ranked as the 11th highest contributor to global disability. More than 40% of patients use complementary and alternative medicine including supplements containing phytoextracts with anti-inflammatory properties as those from the Boswellia genus. The aim of this meta-analysis was to evaluate the efficacy of phytoextracts from the oleogum resin of the Boswellia genus as supplementation for patients affected by knee OA. Four electronic databases were used for the research and PRISMA statements were followed throughout the study. The following inclusion criteria were used: (a) the subjects of the study were humans with a diagnosis of knee OA reported by medical staff; (b) randomization and the presence of control (placebo, negative or positive control), and (c) outcomes reported with WOMAC and/or visual analog scale (VAS) score. Publication bias was assessed with a funnel plot and through the Egger test. The Jadad scale was used in order to assess the quality of the studies included. The statistical heterogeneity was assessed using I2 statistics. Results of meta-analysis and subgroup analysis were reported using a forest plot. A total of 13 studies involving 850 (WOMAC) and 1185 (VAS) patients met the inclusion criteria. The meta-analysis did not detect a significant effect of the use of Boswellia extracts between the control and the treatment groups due to the high heterogeneity of the studies (p = 0.0865 for WOMAC) and (p = 0.3966 VAS). However, the subsequent subgroup analysis demonstrated the significant beneficial effect of Boswellia extracts in the treatment of knee OA with respect to a placebo (lower WOMAC score in the treatment groups). This was also confirmed in the meta-regression applied to the WOMAC scores. This is an important finding as people exposed to NSAID-related adverse effects could benefit from the use of Boswellia extracts. However, further high-quality studies are needed to establish the clinical efficacy of extracts from the genus Boswellia.
```

### Extracted JSON
_성분 2개 · head-to-head 0개 · 수치 있음 0/2 · 카테고리 있음 2/2_

```json
{
  "primary_condition": "knee osteoarthritis",
  "study_design_summary": "Systematic review and meta-analysis of 13 RCTs; n=850 (WOMAC) and n=1185 (VAS)",
  "n_studies_included": 13,
  "total_sample_size": 1185,
  "evidence_grade_stated": null,
  "is_multi_substance": false,
  "substances": [
    {
      "name_raw": "extracts of oleogum resin of the Boswellia genus",
      "intervention_detail": null,
      "comparator": "placebo / negative or positive control",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": 0.0865,
      "n_studies_for_this_substance": 13,
      "effect_size_category": "null_effect",
      "clinical_importance": "unclear",
      "effect_direction": "mixed",
      "timepoint": "unclear",
      "outcome_measure": "WOMAC score",
      "narrative": "The meta-analysis did not detect a significant effect of Boswellia extracts on WOMAC due to high heterogeneity (p = 0.0865), but subgroup analysis demonstrated a significant beneficial effect (lower WOMAC) versus placebo, confirmed by meta-regression.",
      "quality_note": "High statistical heterogeneity (I2) drove the non-significant overall WOMAC result; study quality assessed with Jadad scale; publication bias assessed via funnel plot and Egger test. Subgroup vs placebo was significant."
    },
    {
      "name_raw": "extracts of oleogum resin of the Boswellia genus",
      "intervention_detail": null,
      "comparator": "placebo / negative or positive control",
      "effect_metric": null,
      "effect_value": null,
      "ci_lower": null,
      "ci_upper": null,
      "p_value": 0.3966,
      "n_studies_for_this_substance": 13,
      "effect_size_category": "null_effect",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "null",
      "timepoint": "unclear",
      "outcome_measure": "visual analog scale (VAS) pain score",
      "narrative": "The meta-analysis did not detect a significant effect of Boswellia extracts on VAS between control and treatment groups due to the high heterogeneity of the studies (p = 0.3966).",
      "quality_note": "High statistical heterogeneity (I2); no significant subgroup or meta-regression finding reported for VAS, unlike WOMAC."
    }
  ],
  "head_to_head_comparisons": [],
  "safety_notes": "No direct adverse effects of Boswellia reported; authors note that patients exposed to NSAID-related adverse effects could benefit from using Boswellia extracts as an alternative.",
  "limitations": "High heterogeneity among included studies undermined the overall pooled estimates; authors state that further high-quality studies are needed to establish clinical efficacy.",
  "authors_conclusion": "Subgroup analysis and meta-regression showed a significant beneficial effect of Boswellia extracts (lower WOMAC) versus placebo in knee OA, an important option for patients exposed to NSAID-related adverse effects, though further high-quality studies are needed.",
  "extra_notes": "Overall pooled effects were non-significant for both WOMAC and VAS, but the placebo-controlled subgroup showed significant WOMAC benefit and this was confirmed by meta-regression on WOMAC scores. Patient counts differed by outcome (850 for WOMAC, 1185 for VAS); the 1185 (VAS) figure is reported here as total_sample_size as the larger reported pool. Background: >40% of OA patients use complementary/alternative medicine; knee OA ranked 11th highest contributor to global disability."
}
```

---

## 6. PMID 15846645 — meta_analysis

**Title:** Glucosamine therapy for treating osteoarthritis.

**Year:** 2005 · **Sample size:** 2570

**PubMed:** https://pubmed.ncbi.nlm.nih.gov/15846645/

### Abstract
```
BACKGROUND: Osteoarthritis (OA) is the most common form of arthritis, and it is often associated with significant disability and an impaired quality of life.
OBJECTIVES: To review all randomized controlled trials (RCTs) evaluating the effectiveness and toxicity of glucosamine in OA.
SEARCH STRATEGY: We searched MEDLINE, PREMEDLINE, EMBASE, AMED, ACP Journal Club, DARE, CDSR, and the CCTR. We also wrote letters to content experts, and hand searched reference lists of identified RCTs and pertinent review articles. All searches were updated in January 2005.
SELECTION CRITERIA: Relevant studies met the following criteria: 1) RCTs evaluating the effectiveness and safety of glucosamine in OA, 2) Both placebo controlled and comparative studies were eligible, 3) Both single blinded and double blinded studies were eligible.
DATA COLLECTION AND ANALYSIS: Data abstraction was performed independently by two investigators and the results were compared for degree of agreement. Gotzsche's method and a validated tool (Jadad 1996) were used to score the quality of the RCTs. Continuous outcome measures were pooled using standardized mean differences (SMD) as the measure of effect size. Dichotomous outcome measures were pooled using relative risk ratios (RR).
MAIN RESULTS: Analysis restricted to eight studies with adequate allocation concealment failed to show benefit of glucosamine for pain and WOMAC function. Collectively, the 20 analyzed RCTs found glucosamine favoured placebo with a 28% (change from baseline) improvement in pain (SMD -0.61, 95% CI -0.95, -0.28) and a 21% (change from baseline) improvement in function using the Lequesne index (SMD -0.51 95% CI -0.96, -0.05). However, the results are not uniformly positive, and the reasons for this remain unexplained. WOMAC pain, function and stiffness outcomes did not reach statistical significance. In the 10 RCTs in which the Rotta preparation of glucosamine was compared to placebo, glucosamine was found to be superior for pain (SMD -1.31, 95% CI -1.99, -0.64) and function using the Lequesne index (SMD -0.51, 95% CI -0.96, -0.05). Pooled results for pain (SMD -0.15, 95% CI -0.35, 0.05) and function using the WOMAC index (SMD 0.03, 95% CI -0.18, 0.25) in those RCTs in which a non-Rotta preparation of glucosamine was compared to placebo did not reach statistical significance. In the four RCTs in which the Rotta preparation of glucosamine was compared to an NSAID, glucosamine was superior in two, and equivalent in two. Two RCTs using the Rotta preparation showed that glucosamine was able to slow radiological progression of OA of the knee over a three year period (SMD 0.24, 95% CI 0.04, 0.43). Glucosamine was as safe as placebo in terms of the number of subjects reporting adverse reactions (RR=0.97, 95% CI, 0.88, 1.08).
AUTHORS' CONCLUSIONS: This update includes 20 studies with 2570 patients. Pooled results from studies using a non-Rotta preparation or adequate allocation concealment failed to show benefit in pain 
```

### Extracted JSON
_성분 7개 · head-to-head 1개 · 수치 있음 7/7 · 카테고리 있음 7/7_

```json
{
  "primary_condition": "osteoarthritis",
  "study_design_summary": "20 RCTs meta-analyzed, n=2570",
  "n_studies_included": 20,
  "total_sample_size": 2570,
  "evidence_grade_stated": null,
  "is_multi_substance": true,
  "substances": [
    {
      "name_raw": "glucosamine (all preparations pooled)",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": -0.61,
      "ci_lower": -0.95,
      "ci_upper": -0.28,
      "p_value": null,
      "n_studies_for_this_substance": 20,
      "effect_size_category": "moderate",
      "clinical_importance": "unclear",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "pain (28% change from baseline)",
      "narrative": "Collectively, the 20 analyzed RCTs found glucosamine favoured placebo with a 28% improvement in pain (SMD -0.61, 95% CI -0.95, -0.28).",
      "quality_note": "Analysis restricted to eight studies with adequate allocation concealment failed to show benefit of glucosamine for pain and WOMAC function; results are not uniformly positive and reasons remain unexplained; WOMAC pain, function and stiffness outcomes did not reach statistical significance."
    },
    {
      "name_raw": "glucosamine (all preparations pooled)",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": -0.51,
      "ci_lower": -0.96,
      "ci_upper": -0.05,
      "p_value": null,
      "n_studies_for_this_substance": 20,
      "effect_size_category": "moderate",
      "clinical_importance": "unclear",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "function using Lequesne index (21% change from baseline)",
      "narrative": "The 20 analyzed RCTs found a 21% improvement in function using the Lequesne index (SMD -0.51, 95% CI -0.96, -0.05).",
      "quality_note": "WOMAC function did not reach statistical significance; benefit not shown in studies with adequate allocation concealment."
    },
    {
      "name_raw": "Rotta preparation of glucosamine",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": -1.31,
      "ci_lower": -1.99,
      "ci_upper": -0.64,
      "p_value": null,
      "n_studies_for_this_substance": 10,
      "effect_size_category": "large",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "pain",
      "narrative": "In the 10 RCTs in which the Rotta preparation of glucosamine was compared to placebo, glucosamine was found to be superior for pain (SMD -1.31, 95% CI -1.99, -0.64).",
      "quality_note": "Benefit confined to studies using the Rotta preparation; pooled results from non-Rotta preparation or adequate allocation concealment failed to show benefit."
    },
    {
      "name_raw": "Rotta preparation of glucosamine",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": -0.51,
      "ci_lower": -0.96,
      "ci_upper": -0.05,
      "p_value": null,
      "n_studies_for_this_substance": 10,
      "effect_size_category": "moderate",
      "clinical_importance": "unclear",
      "effect_direction": "positive",
      "timepoint": "unclear",
      "outcome_measure": "function using Lequesne index",
      "narrative": "In the 10 RCTs comparing the Rotta preparation to placebo, glucosamine was superior for function using the Lequesne index (SMD -0.51, 95% CI -0.96, -0.05).",
      "quality_note": null
    },
    {
      "name_raw": "Rotta preparation of glucosamine",
      "intervention_detail": "three year period",
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": 0.24,
      "ci_lower": 0.04,
      "ci_upper": 0.43,
      "p_value": null,
      "n_studies_for_this_substance": 2,
      "effect_size_category": "small",
      "clinical_importance": "clinically_important",
      "effect_direction": "positive",
      "timepoint": "long_term",
      "outcome_measure": "radiological progression of knee OA",
      "narrative": "Two RCTs using the Rotta preparation showed that glucosamine was able to slow radiological progression of OA of the knee over a three year period (SMD 0.24, 95% CI 0.04, 0.43).",
      "quality_note": null
    },
    {
      "name_raw": "non-Rotta preparation of glucosamine",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": -0.15,
      "ci_lower": -0.35,
      "ci_upper": 0.05,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "null_effect",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "null",
      "timepoint": "unclear",
      "outcome_measure": "pain",
      "narrative": "Pooled results for pain (SMD -0.15, 95% CI -0.35, 0.05) in those RCTs in which a non-Rotta preparation of glucosamine was compared to placebo did not reach statistical significance.",
      "quality_note": "Confidence interval crosses zero; not statistically significant."
    },
    {
      "name_raw": "non-Rotta preparation of glucosamine",
      "intervention_detail": null,
      "comparator": "placebo",
      "effect_metric": "SMD",
      "effect_value": 0.03,
      "ci_lower": -0.18,
      "ci_upper": 0.25,
      "p_value": null,
      "n_studies_for_this_substance": null,
      "effect_size_category": "null_effect",
      "clinical_importance": "not_clinically_important",
      "effect_direction": "null",
      "timepoint": "unclear",
      "outcome_measure": "function using WOMAC index",
      "narrative": "Pooled results for function using the WOMAC index (SMD 0.03, 95% CI -0.18, 0.25) in RCTs using a non-Rotta preparation versus placebo did not reach statistical significance.",
      "quality_note": "Confidence interval crosses zero; not statistically significant."
    }
  ],
  "head_to_head_comparisons": [
    {
      "substance_a": "Rotta preparation of glucosamine",
      "substance_b": "NSAID",
      "winner": "a",
      "metric": "pain/function (number of trials favouring)",
      "narrative": "In the four RCTs in which the Rotta preparation of glucosamine was compared to an NSAID, glucosamine was superior in two, and equivalent in two."
    }
  ],
  "safety_notes": "Glucosamine was as safe as placebo in terms of the number of subjects reporting adverse reactions (RR=0.97, 95% CI 0.88, 1.08).",
  "limitations": "Results are not uniformly positive and the reasons remain unexplained; benefit disappeared in studies with adequate allocation concealment and in non-Rotta preparations; WOMAC pain, function and stiffness outcomes did not reach statistical significance.",
  "authors_conclusion": "This update includes 20 studies with 2570 patients, and pooled results from studies using a non-Rotta preparation or adequate allocation concealment failed to show benefit in pain.",
  "extra_notes": "Strong brand/preparation effect: the Rotta preparation drove the positive pooled results (large pain benefit, slowed radiographic progression), whereas non-Rotta preparations and adequately concealed trials showed null effects, suggesting possible bias or preparation-specific efficacy. Quality scored with Gotzsche's method and the validated Jadad 1996 tool."
}
```

---
