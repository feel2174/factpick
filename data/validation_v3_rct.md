# RCT 정밀 추출 v3 검증 — 골관절염

_총 10편: RCT sample_size ≥ 200 양질 후보_

(1) abstract 원문 (2) 새 프롬프트가 뽑은 JSON. 누락/오분류 있으면 알려줘.

---

## 1. PMID 40001000 — 이부프로펜 × 골관절염

**Title:** Efficacy and safety of fasinumab in an NSAID-controlled study in patients with pain due to osteoarthritis of the knee or hip.

**Year:** 2025 · **n:** 4531 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/40001000/

### Abstract
```
OBJECTIVE: Osteoarthritis (OA) causes significant musculoskeletal pain. This study assessed the efficacy and safety of fasinumab, an investigational nerve growth factor inhibitor, in patients with moderate-to-severe OA pain of the knee/hip.
METHODS: In this Phase 3, randomized, double-blind, placebo- and non-steroidal anti-inflammatory drug (NSAID)-controlled study, patients with OA (Kellgren-Lawrence grade ≥ 2; Western Ontario and McMaster Universities Arthritis Index [WOMAC] pain score ≥ 4) received (2:1:1:1) fasinumab 1 mg every 4 weeks, diclofenac 75 mg twice daily, celecoxib 200 mg daily, or placebo for 24 weeks. Co‑primary endpoints were change in WOMAC pain and physical function scores to Week 24 versus placebo. For safety, joints were imaged in all patients at pre‑specified times, regardless of symptoms.
RESULTS: Of 4531 patients screened, 1650 were randomized. At Week 24, greater improvements were observed for fasinumab versus placebo; least-squares mean difference: -0.63 (p = 0.0003) for WOMAC pain and -0.64 (p = 0.0003) for physical function. Improvements were numerically greater for fasinumab versus NSAIDs for physical function (-0.64 versus -0.31; nominal p < 0.05) and pain (-0.63 versus - 0.39; p = NS). Adjudicated arthropathies occurred in 1.6% of placebo-treated, 1.5% of NSAID-treated, and 5.6% of fasinumab-treated patients; joint replacements occurred in 3.6% of placebo-treated, 4.8% of NSAID-treated, and 3.4% of fasinumab-treated patients.
CONCLUSION: Fasinumab significantly improved WOMAC pain and physical function scores versus placebo in < 24 weeks in difficult-to-treat patients with pain due to OA of the knee/hip. Adjudicated arthropathies were more frequent with fasinumab; there were no differences in the proportions of patients with joint replacements.
TRIAL REGISTRATION: Clinicaltrials.gov NCT03304379. Date of first registration: October 2, 2017.
```

### Extracted JSON
_primary: metric=MD, value=-0.63, category=small · design: DB · PC · relevance=0.03 · confidence=0.9_

```json
{
  "primary_condition": "Moderate-to-severe pain due to osteoarthritis of the knee or hip (Kellgren-Lawrence grade ≥ 2, WOMAC pain ≥ 4)",
  "substance_focus": "Fasinumab 1 mg subcutaneous every 4 weeks (investigational anti-NGF antibody) — NOT ibuprofen",
  "comparator": "Placebo plus active NSAID controls (diclofenac 75 mg twice daily and celecoxib 200 mg daily); ibuprofen was not used",
  "population_detail": "Adults with moderate-to-severe knee/hip OA (KL grade ≥ 2, WOMAC pain ≥ 4), described as difficult-to-treat",
  "population_type": "mixed",
  "sample_size_total": 1650,
  "sample_size_treatment": null,
  "sample_size_control": null,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": true,
    "is_placebo_controlled": true,
    "is_multicenter": "unclear",
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 24
  },
  "dose_value": 1,
  "dose_unit": "mg",
  "duration_weeks": 24,
  "primary_outcome": {
    "measure": "WOMAC pain score (change from baseline to Week 24 vs placebo)",
    "effect_metric": "MD",
    "effect_value": -0.63,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": 0.0003,
    "effect_direction": "positive",
    "effect_size_category": "small",
    "narrative": "At Week 24, greater improvements were observed for fasinumab versus placebo; least-squares mean difference -0.63 (p = 0.0003) for WOMAC pain."
  },
  "secondary_outcomes": [
    {
      "measure": "WOMAC physical function score (change to Week 24 vs placebo)",
      "effect_metric": "MD",
      "effect_value": -0.64,
      "p_value": 0.0003,
      "narrative": "Least-squares mean difference -0.64 (p = 0.0003) for WOMAC physical function for fasinumab versus placebo."
    },
    {
      "measure": "WOMAC physical function — fasinumab vs NSAIDs",
      "effect_metric": "MD",
      "effect_value": -0.64,
      "p_value": null,
      "narrative": "Improvements were numerically greater for fasinumab versus NSAIDs for physical function (-0.64 versus -0.31; nominal p < 0.05)."
    },
    {
      "measure": "WOMAC pain — fasinumab vs NSAIDs",
      "effect_metric": "MD",
      "effect_value": -0.63,
      "p_value": null,
      "narrative": "Pain improvement was numerically greater for fasinumab versus NSAIDs (-0.63 versus -0.39; p = NS)."
    }
  ],
  "safety_notes": "Adjudicated arthropathies occurred in 5.6% of fasinumab-treated vs 1.6% placebo and 1.5% NSAID patients (more frequent with fasinumab). Joint replacements: 3.4% fasinumab, 3.6% placebo, 4.8% NSAID (no meaningful difference).",
  "limitations": null,
  "authors_conclusion": "Fasinumab significantly improved WOMAC pain and physical function versus placebo within 24 weeks in difficult-to-treat knee/hip OA patients, but adjudicated arthropathies were more frequent with fasinumab, with no difference in joint replacement rates.",
  "relevance_score": 0.03,
  "extraction_confidence": 0.9,
  "extra_notes": "MAJOR RELEVANCE MISMATCH: This trial tests fasinumab (an anti-NGF biologic), not ibuprofen. The NSAID comparators were diclofenac and celecoxib — ibuprofen was not administered in any arm. The target pair (Ibuprofen × Osteoarthritis) is essentially absent. Randomization ratio was 2:1:1:1 (fasinumab:diclofenac:celecoxib:placebo) of 1650 randomized (~660 fasinumab, ~330 each for the other three arms), but exact per-arm Ns were not stated in the abstract, so treatment/control sizes left null. Effect values for WOMAC are on the standard 0–10 scale; a ~0.6-point difference is statistically significant but of modest clinical magnitude. NCT03304379, first registered Oct 2, 2017."
}
```

---

## 2. PMID 20638563 — 이부프로펜 × 골관절염

**Title:** Celecoxib versus omeprazole and diclofenac in patients with osteoarthritis and rheumatoid arthritis (CONDOR): a randomised trial.

**Year:** 2010 · **n:** 4484 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/20638563/

### Abstract
```
BACKGROUND: Cyclo-oxygenase (COX)-2-selective non-steroidal anti-inflammatory drugs (NSAIDs) and non-selective NSAIDs plus a proton-pump inhibitor (PPI) have similar upper gastrointestinal outcomes, but risk of clinical outcomes across the entire gastrointestinal tract might be lower with selective drugs than with non-selective drugs. We aimed to compare risk of gastrointestinal events associated with celecoxib versus diclofenac slow release plus omeprazole.
METHODS: We undertook a 6-month, double-blind, randomised trial in patients with osteoarthritis or rheumatoid arthritis at increased gastrointestinal risk at 196 centres in 32 countries or territories. Patients tested negative for Helicobacter pylori and were aged 60 years and older or 18 years and older with previous gastroduodenal ulceration. We used a computer-generated randomisation schedule to assign patients in a 1:1 ratio to receive celecoxib 200 mg twice a day or diclofenac slow release 75 mg twice a day plus omeprazole 20 mg once a day. Patients and investigators were masked to treatment allocation. The primary endpoint was a composite of clinically significant upper or lower gastrointestinal events adjudicated by an independent committee. Analysis was by intention to treat. This trial is registered with ClinicalTrials.gov, number NCT00141102.
FINDINGS: 4484 patients were randomly allocated to treatment (2238 celecoxib; 2246 diclofenac plus omeprazole) and were included in intention-to-treat analyses. 20 (0.9%) patients receiving celecoxib and 81 (3.8%) receiving diclofenac plus omeprazole met criteria for the primary endpoint (hazard ratio 4.3, 95% CI 2.6-7.0; p<0.0001). 114 (6%) patients taking celecoxib versus 167 (8%) taking diclofenac plus omeprazole withdrew early because of gastrointestinal adverse events (p=0.0006).
INTERPRETATION: Risk of clinical outcomes throughout the gastrointestinal tract was lower in patients treated with a COX-2-selective NSAID than in those receiving a non-selective NSAID plus a PPI. These findings should encourage review of approaches to reduce risk of NSAID treatment.
FUNDING: Pfizer Inc.
```

### Extracted JSON
_primary: metric=HR, value=4.3, category=large · design: DB · MC · relevance=0 · confidence=0.95_

```json
{
  "primary_condition": "Osteoarthritis or rheumatoid arthritis in patients at increased gastrointestinal risk (H. pylori-negative, aged ≥60 or ≥18 with previous gastroduodenal ulceration)",
  "substance_focus": "Celecoxib 200 mg twice daily (COX-2-selective NSAID) — NOTE: Ibuprofen was NOT tested in this trial",
  "comparator": "Active control: diclofenac slow release 75 mg twice daily plus omeprazole 20 mg once daily",
  "population_detail": "Adults with osteoarthritis or rheumatoid arthritis at increased GI risk; H. pylori-negative; aged ≥60 years or ≥18 years with prior gastroduodenal ulceration",
  "population_type": "mixed",
  "sample_size_total": 4484,
  "sample_size_treatment": 2238,
  "sample_size_control": 2246,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": true,
    "is_placebo_controlled": false,
    "is_multicenter": true,
    "has_intention_to_treat": true,
    "follow_up_weeks": 26
  },
  "dose_value": 200,
  "dose_unit": "mg",
  "duration_weeks": 26,
  "primary_outcome": {
    "measure": "Composite of clinically significant upper or lower gastrointestinal events (independently adjudicated)",
    "effect_metric": "HR",
    "effect_value": 4.3,
    "ci_lower": 2.6,
    "ci_upper": 7.0,
    "p_value": 0.0001,
    "effect_direction": "positive",
    "effect_size_category": "large",
    "narrative": "20 (0.9%) patients receiving celecoxib and 81 (3.8%) receiving diclofenac plus omeprazole met criteria for the primary endpoint (hazard ratio 4.3, 95% CI 2.6-7.0; p<0.0001)."
  },
  "secondary_outcomes": [
    {
      "measure": "Early withdrawal due to gastrointestinal adverse events",
      "effect_metric": "percent",
      "effect_value": 6,
      "p_value": 0.0006,
      "narrative": "114 (6%) patients taking celecoxib versus 167 (8%) taking diclofenac plus omeprazole withdrew early because of gastrointestinal adverse events (p=0.0006)."
    }
  ],
  "safety_notes": "Primary endpoint was itself a GI safety/event composite; celecoxib had fewer clinically significant GI events across the entire tract (0.9% vs 3.8%) and fewer early withdrawals for GI adverse events (6% vs 8%) than diclofenac plus omeprazole.",
  "limitations": "Not explicitly stated in abstract; note no placebo arm, 6-month duration only, industry funding (Pfizer), and primary endpoint is GI safety rather than efficacy/pain.",
  "authors_conclusion": "Risk of clinical outcomes throughout the gastrointestinal tract was lower with a COX-2-selective NSAID (celecoxib) than with a non-selective NSAID plus a PPI, and approaches to reducing NSAID treatment risk should be reviewed.",
  "relevance_score": 0,
  "extraction_confidence": 0.95,
  "extra_notes": "MISMATCH: The task header specifies 'Ibuprofen × Osteoarthritis,' but this CONDOR trial tested CELECOXIB versus diclofenac+omeprazole — ibuprofen is not involved at all, hence relevance_score=0. The trial is a GI-safety comparison, not an efficacy/pain (e.g., WOMAC/VAS) study, so no analgesic effect data are reported. Population includes both osteoarthritis and rheumatoid arthritis patients selected for elevated GI risk; HR 4.3 reflects ~4-fold higher GI event risk on diclofenac+omeprazole relative to celecoxib. 196 centres across 32 countries/territories. Registered NCT00141102."
}
```

---

## 3. PMID 24625625 — 이부프로펜 × 골관절염

**Title:** Efficacy and safety of tanezumab monotherapy or combined with non-steroidal anti-inflammatory drugs in the treatment of knee or hip osteoarthritis pain.

**Year:** 2015 · **n:** 2700 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/24625625/

### Abstract
```
OBJECTIVE: To evaluate whether subjects with knee or hip osteoarthritis (OA) pain on non-steroidal anti-inflammatory drugs (NSAIDs) received greater benefit when tanezumab monotherapy replaced or was coadministered with NSAIDs.
METHODS: Subjects (N=2700) received intravenous tanezumab (5 or 10 mg) or placebo every 8 weeks with or without oral naproxen 500 mg twice daily or celecoxib 100 mg twice daily. Efficacy was assessed as change from baseline to week 16 in three co-primary endpoints: Western Ontario and McMaster Universities Osteoarthritis Index (WOMAC) Pain, WOMAC Physical Function and Patient's Global Assessment (PGA) of OA. Safety assessments included adverse events, physical and neurological examinations, laboratory tests and vital signs.
RESULTS: Although all tanezumab treatments provided significant improvements in WOMAC Pain and Physical Function over either NSAID alone, only tanezumab+NSAIDs were significant versus NSAIDs with PGA and met the prespecified definition of superiority. Combination treatment did not substantially improve pain or function over tanezumab monotherapy. Adverse event frequency was higher with tanezumab than with NSAIDs and highest with combination therapy. Higher incidence of all-cause total joint replacements occurred with tanezumab+NSAID versus tanezumab monotherapy or NSAIDs. Rapidly progressive OA incidence was significantly greater versus NSAID in all tanezumab groups except tanezumab 5 mg monotherapy.
CONCLUSIONS: Subjects receiving partial symptomatic relief of OA pain with NSAIDs may receive greater benefit with tanezumab monotherapy. While only coadministration of tanezumab with NSAIDs met the definition of superiority, combination treatment did not provide important benefits over tanezumab monotherapy; small differences in efficacy were negated by treatment-limiting or irreversible safety outcomes.
TRIAL REGISTRATION NUMBER: NCT00809354.
```

### Extracted JSON
_primary: metric=None, value=None, category=unclear · design: PC · relevance=0.03 · confidence=0.4_

```json
{
  "primary_condition": "knee or hip osteoarthritis pain (subjects with partial symptomatic relief on NSAIDs)",
  "substance_focus": "tanezumab IV 5 or 10 mg every 8 weeks, alone or coadministered with an NSAID (naproxen 500 mg BID or celecoxib 100 mg BID); ibuprofen was NOT tested",
  "comparator": "placebo and active NSAID control (naproxen 500 mg BID or celecoxib 100 mg BID)",
  "population_detail": "Adults with knee or hip OA pain receiving NSAIDs (N=2700)",
  "population_type": "mixed",
  "sample_size_total": 2700,
  "sample_size_treatment": null,
  "sample_size_control": null,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": "unclear",
    "is_placebo_controlled": true,
    "is_multicenter": "unclear",
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 16
  },
  "dose_value": null,
  "dose_unit": null,
  "duration_weeks": 16,
  "primary_outcome": {
    "measure": "WOMAC Pain (one of three co-primary endpoints: WOMAC Pain, WOMAC Physical Function, Patient's Global Assessment)",
    "effect_metric": null,
    "effect_value": null,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": null,
    "effect_direction": "positive",
    "effect_size_category": "unclear",
    "narrative": "Although all tanezumab treatments provided significant improvements in WOMAC Pain and Physical Function over either NSAID alone, only tanezumab+NSAIDs were significant versus NSAIDs with PGA and met the prespecified definition of superiority."
  },
  "secondary_outcomes": [
    {
      "measure": "WOMAC Physical Function",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "All tanezumab treatments provided significant improvements in WOMAC Physical Function over either NSAID alone."
    },
    {
      "measure": "Patient's Global Assessment (PGA) of OA",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "Only tanezumab+NSAIDs were significant versus NSAIDs on PGA and met the prespecified definition of superiority; combination did not substantially improve pain or function over tanezumab monotherapy."
    }
  ],
  "safety_notes": "Adverse event frequency was higher with tanezumab than with NSAIDs and highest with combination therapy. Higher incidence of all-cause total joint replacements occurred with tanezumab+NSAID versus tanezumab monotherapy or NSAIDs. Rapidly progressive OA incidence was significantly greater versus NSAID in all tanezumab groups except tanezumab 5 mg monotherapy.",
  "limitations": "Treatment-limiting or irreversible safety outcomes (joint replacement, rapidly progressive OA) negated small efficacy differences; no numeric effect estimates reported in abstract.",
  "authors_conclusion": "Subjects with partial symptomatic relief on NSAIDs may benefit more from tanezumab monotherapy; while only tanezumab+NSAID coadministration met the superiority definition, combination provided no important benefit over monotherapy and small efficacy gains were negated by treatment-limiting or irreversible safety outcomes.",
  "relevance_score": 0.03,
  "extraction_confidence": 0.4,
  "extra_notes": "CRITICAL MISMATCH: This trial does NOT study ibuprofen. The intervention is tanezumab (an anti-NGF monoclonal antibody, IV 5 or 10 mg every 8 weeks); the NSAID comparators/co-treatments are naproxen 500 mg BID and celecoxib 100 mg BID. Ibuprofen is not mentioned, so relevance to the Ibuprofen × Osteoarthritis pair is essentially nil. Three co-primary endpoints assessed at week 16. No numeric effect sizes, CIs, or p-values are reported in the abstract, limiting numeric extraction. Dose-response/safety signal: rapidly progressive OA risk elevated in all tanezumab arms except the 5 mg monotherapy arm. NCT00809354."
}
```

---

## 4. PMID 16941030 — 이부프로펜 × 골관절염

**Title:** Cardiorenal effects of celecoxib as compared with the nonsteroidal anti-inflammatory drugs diclofenac and ibuprofen.

**Year:** 2006 · **n:** 2183 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/16941030/

### Abstract
```
The cardiorenal safety database from the Celecoxib Long-term Arthritis Safety Study (CLASS) was analyzed to examine whether supratherapeutic doses of celecoxib are associated with decreased renal function and blood pressure (BP) effects compared with standard doses of diclofenac and ibuprofen in osteoarthritis (OA) and rheumatoid arthritis (RA) patients.In total, 8059 patients were enrolled; 7968 received at least one dose of study drug (RA: N = 2183; OA: N = 5785). Patients received celecoxib, 400 mg twice a day (b.i.d.). (N = 3987); ibuprofen, 800 mg three times a day. (N = 1985); or diclofenac, 75 mg b.i.d. (N = 1996). Effects measured included: investigator-reported hypertension, edema or congestive heart failure, clinically important BP elevations, incidence of patients starting new antihypertensive medication, and increases in serum creatinine or reductions in creatinine clearance. Celecoxib was associated with a similar incidence of hypertension or edema to diclofenac but significantly lower than ibuprofen. The celecoxib group had significantly fewer initiations of antihypertensives versus ibuprofen. Systolic BP increases of >20 mmHg and above 140 mmHg occurred significantly less often with celecoxib compared with ibuprofen or diclofenac. Changes in serum creatinine or estimated creatinine clearance occurred in a similar percentage of patients taking celecoxib or ibuprofen; modest differences were evident against diclofenac. In patients with mild prerenal azotemia, significantly fewer patients taking celecoxib exhibited clinically important reductions in renal function (3.7%), compared with diclofenac (7.3%; P < 0.05) and ibuprofen (7.3%; P < 0.05). A supratherapeutic dose of celecoxib was associated with an improved cardiorenal safety profile compared with standard doses of either ibuprofen or diclofenac.
```

### Extracted JSON
_primary: metric=percent, value=7.3, category=moderate · design: - · relevance=0.4 · confidence=0.7_

```json
{
  "primary_condition": "Osteoarthritis and rheumatoid arthritis (mixed; OA N=5785, RA N=2183) — cardiorenal safety analysis",
  "substance_focus": "Ibuprofen 800 mg three times daily (2400 mg/day)",
  "comparator": "Active control — celecoxib 400 mg b.i.d. (supratherapeutic) and diclofenac 75 mg b.i.d.",
  "population_detail": "OA and RA patients enrolled in the CLASS trial; subgroup analyses included patients with mild prerenal azotemia",
  "population_type": "mixed",
  "sample_size_total": 7968,
  "sample_size_treatment": 1985,
  "sample_size_control": 5983,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": "unclear",
    "is_placebo_controlled": false,
    "is_multicenter": "unclear",
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": null
  },
  "dose_value": 2400,
  "dose_unit": "mg",
  "duration_weeks": null,
  "primary_outcome": {
    "measure": "Clinically important reduction in renal function in patients with mild prerenal azotemia",
    "effect_metric": "percent",
    "effect_value": 7.3,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": 0.05,
    "effect_direction": "negative",
    "effect_size_category": "moderate",
    "narrative": "In patients with mild prerenal azotemia, significantly fewer patients taking celecoxib exhibited clinically important reductions in renal function (3.7%), compared with diclofenac (7.3%; P < 0.05) and ibuprofen (7.3%; P < 0.05)."
  },
  "secondary_outcomes": [
    {
      "measure": "Investigator-reported hypertension or edema",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "Celecoxib was associated with a significantly lower incidence of hypertension or edema than ibuprofen (similar to diclofenac)."
    },
    {
      "measure": "Initiation of new antihypertensive medication",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "The celecoxib group had significantly fewer initiations of antihypertensives versus ibuprofen."
    },
    {
      "measure": "Systolic BP increase >20 mmHg and above 140 mmHg",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "Systolic BP increases of >20 mmHg and above 140 mmHg occurred significantly less often with celecoxib compared with ibuprofen or diclofenac."
    }
  ],
  "safety_notes": "Ibuprofen (vs celecoxib) was associated with higher rates of hypertension/edema, more antihypertensive initiations, more frequent clinically important systolic BP elevations, and a higher rate of clinically important renal function decline in patients with mild prerenal azotemia (7.3% vs 3.7%). Changes in serum creatinine/estimated creatinine clearance were similar between ibuprofen and celecoxib.",
  "limitations": "Not explicitly stated by authors in the abstract; notable design asymmetry — a supratherapeutic dose of celecoxib (400 mg b.i.d.) was compared against standard therapeutic doses of ibuprofen and diclofenac.",
  "authors_conclusion": "A supratherapeutic dose of celecoxib was associated with an improved cardiorenal safety profile compared with standard doses of either ibuprofen or diclofenac.",
  "relevance_score": 0.4,
  "extraction_confidence": 0.7,
  "extra_notes": "This is a cardiorenal SAFETY analysis of the CLASS trial, not an efficacy trial; the primary focus is celecoxib, with ibuprofen serving as an active comparator — hence reduced relevance to an 'Ibuprofen × Osteoarthritis' efficacy query. Population is mixed OA+RA, so OA-specific effects are not separable from the abstract. No pain/WOMAC/efficacy outcomes reported. 'effect_direction: negative' reflects an unfavorable cardiorenal profile for ibuprofen relative to celecoxib (not an efficacy benefit). sample_size_control (5983) aggregates the two non-ibuprofen arms (celecoxib 3987 + diclofenac 1996). Follow-up duration not given in abstract (CLASS was a long-term study). Ibuprofen dose stated as 800 mg t.i.d. = 2400 mg/day."
}
```

---

## 5. PMID 28591564 — 아세트아미노펜 × 골관절염

**Title:** Effect of a model consultation informed by guidelines on recorded quality of care of osteoarthritis (MOSAICS): a cluster randomised controlled trial in primary care.

**Year:** 2017 · **n:** 1851 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/28591564/

### Abstract
```
OBJECTIVE: To determine the effect of a model osteoarthritis (OA) consultation (MOAC) informed by National Institute for Health and Care Excellence (NICE) recommendations compared with usual care on recorded quality of care of clinical OA in general practice.
DESIGN: Two-arm cluster randomised controlled trial.
SETTING: Eight general practices in Cheshire, Shropshire, or Staffordshire UK.
PARTICIPANTS: General practitioners and nurses with patients consulting with clinical OA.
INTERVENTION: Following six-month baseline period practices were randomised to intervention (n = 4) or usual care (n = 4). Intervention practices delivered MOAC (enhanced initial GP consultation, nurse-led clinic, OA guidebook) to patients aged ≥45 years consulting with clinical OA. An electronic (e-)template for consultations was used in all practices to record OA quality care indicators.
OUTCOMES: Quality of OA care over six months recorded in the medical record.
RESULTS: 1851 patients consulted in baseline period (1015 intervention; 836 control); 1960 consulted following randomisation (1118 intervention; 842 control). At baseline wide variations in quality of care were noted. Post-randomisation increases were found for written advice on OA (4-28%), exercise (4-22%) and weight loss (1-15%) in intervention practices but not controls (1-3%). Intervention practices were more likely to refer to physiotherapy (10% vs 2%, odds ratio 5.30; 95% CI 2.11, 13.34), and prescribe paracetamol (22% vs 14%, 1.74; 95% CI 1.27, 2.38).
CONCLUSIONS: The intervention did not improve all aspects of care but increased core NICE recommendations of written advice on OA, exercise and weight management. There remains a need to reduce variation and uniformly enhance improvement in recorded OA care.
TRIAL REGISTRATION NUMBER: ISRCTN06984617.
```

### Extracted JSON
_primary: metric=OR, value=1.74, category=moderate · design: MC · relevance=0.2 · confidence=0.9_

```json
{
  "primary_condition": "clinical osteoarthritis in patients aged ≥45 years consulting in primary care",
  "substance_focus": "Paracetamol (acetaminophen) prescribing was measured only as a quality-of-care indicator; no acetaminophen dose/regimen was tested. The intervention tested was a model OA consultation (enhanced GP consultation, nurse-led clinic, OA guidebook).",
  "comparator": "usual care",
  "population_detail": "Adults aged ≥45 years consulting in general practice with clinical OA; GPs and nurses across 8 UK practices",
  "population_type": "mixed",
  "sample_size_total": 1960,
  "sample_size_treatment": 1118,
  "sample_size_control": 842,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": false,
    "is_placebo_controlled": false,
    "is_multicenter": true,
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 26
  },
  "dose_value": null,
  "dose_unit": null,
  "duration_weeks": 26,
  "primary_outcome": {
    "measure": "Recorded quality of OA care over six months (NICE quality indicators); paracetamol prescribing extracted as the acetaminophen-relevant indicator",
    "effect_metric": "OR",
    "effect_value": 1.74,
    "ci_lower": 1.27,
    "ci_upper": 2.38,
    "p_value": null,
    "effect_direction": "positive",
    "effect_size_category": "moderate",
    "narrative": "Intervention practices were more likely to prescribe paracetamol (22% vs 14%, OR 1.74; 95% CI 1.27, 2.38)."
  },
  "secondary_outcomes": [
    {
      "measure": "Referral to physiotherapy",
      "effect_metric": "OR",
      "effect_value": 5.3,
      "p_value": null,
      "narrative": "Intervention practices more likely to refer to physiotherapy (10% vs 2%, OR 5.30; 95% CI 2.11, 13.34)."
    },
    {
      "measure": "Written advice on OA (recorded)",
      "effect_metric": "percent",
      "effect_value": 28,
      "p_value": null,
      "narrative": "Written advice on OA increased to 4-28% in intervention practices versus 1-3% in controls."
    },
    {
      "measure": "Exercise advice / weight loss advice (recorded)",
      "effect_metric": "percent",
      "effect_value": 22,
      "p_value": null,
      "narrative": "Exercise advice rose 4-22% and weight loss advice 1-15% in intervention practices but not controls (1-3%)."
    }
  ],
  "safety_notes": null,
  "limitations": "Authors note the intervention did not improve all aspects of care and that wide variation in care quality remained; outcomes were limited to what was recorded in the medical record (recording rather than actual care delivered).",
  "authors_conclusion": "The intervention did not improve all aspects of care but increased core NICE recommendations of written advice on OA, exercise and weight management, with a continued need to reduce variation and uniformly enhance recorded OA care.",
  "relevance_score": 0.2,
  "extraction_confidence": 0.9,
  "extra_notes": "This is a cluster RCT of a guideline-informed consultation model, NOT a trial of acetaminophen efficacy. Paracetamol appears only as a process/quality indicator (prescribing rate 22% vs 14%), with no dose, duration, or clinical outcome (pain/function) for acetaminophen reported. p-values not given in abstract; significance inferred from CIs excluding 1. 'Six months' converted to 26 weeks (both baseline and post-randomisation periods were six months). Unit of randomisation is the practice (n=8: 4 intervention, 4 control); patient counts are consultations within those clusters. Not suitable for an acetaminophen-vs-comparator efficacy synthesis."
}
```

---

## 6. PMID 23993259 — 이부프로펜 × 골관절염

**Title:** NSAIDs are associated with lower depression scores in patients with osteoarthritis.

**Year:** 2013 · **n:** 1497 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/23993259/

### Abstract
```
BACKGROUND: Studies have demonstrated the success of augmentation of antidepressant therapy with nonsteroidal anti-inflammatory drugs (NSAID) in decreasing depressive symptoms; however, little is known about the benefit of NSAID therapy on depressive symptoms.
METHODS: This study pooled data from 5 postapproval trials, each trial a 6-week, multicenter, randomized, double-blinded, placebo-controlled, active-comparator, parallel-group study in subjects with active osteoarthritis. Subjects were randomized to placebo group, ibuprofen 800 mg 3 times daily or naproxen 500 mg twice daily group, or Celebrex 200 mg daily group. Apart from different ethnicities enrolled, these trials had identical study designs. Depression was assessed using the Patient Health Questionnaire-9 (PHQ-9). Outcomes measured were change in PHQ-9 score after 6 weeks of NSAID therapy and change in classification of depression with a PHQ-9 score ≥10 as a marker of depression.
RESULTS: There were 1497 patients included. Median PHQ-9 score was similar in all 3 groups at baseline and after 6 weeks of treatment. Multivariable regression analysis demonstrated a detectable effect in lowering PHQ-9 score in the ibuprofen or naproxen group (-0.31) and Celebrex group (-0.61) (P = .0390). With respect to the change in classification of depression, logistic regression analysis demonstrated a trend towards significant treatment effect of all NSAIDs compared with placebo.
CONCLUSION: Our analysis of pooled data from 5 postapproval trials shows that NSAID usage demonstrates a trend towards reduction of depression symptoms in patients with osteoarthritis based upon PHQ-9 scores. Future clinical trials should investigate this association with maximum dosage of drugs, increased treatment duration, and monitoring of social and environmental changes.
```

### Extracted JSON
_primary: metric=MD, value=-0.31, category=small · design: DB · PC · MC · relevance=0.45 · confidence=0.8_

```json
{
  "primary_condition": "active osteoarthritis (depression symptoms assessed, not OA pain)",
  "substance_focus": "ibuprofen 800 mg three times daily (pooled with naproxen 500 mg twice daily in effect estimate)",
  "comparator": "placebo (and active comparators naproxen and celecoxib)",
  "population_detail": "Adults with active osteoarthritis enrolled across 5 postapproval trials with differing ethnicities",
  "population_type": "mixed",
  "sample_size_total": 1497,
  "sample_size_treatment": null,
  "sample_size_control": null,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": true,
    "is_placebo_controlled": true,
    "is_multicenter": true,
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 6
  },
  "dose_value": 800,
  "dose_unit": "mg",
  "duration_weeks": 6,
  "primary_outcome": {
    "measure": "PHQ-9 depression score (change after 6 weeks)",
    "effect_metric": "MD",
    "effect_value": -0.31,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": 0.039,
    "effect_direction": "positive",
    "effect_size_category": "small",
    "narrative": "Multivariable regression demonstrated a detectable lowering of PHQ-9 score in the ibuprofen or naproxen group (-0.31) and Celebrex group (-0.61) (P = .0390)."
  },
  "secondary_outcomes": [
    {
      "measure": "Change in depression classification (PHQ-9 score ≥10)",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "Logistic regression demonstrated a trend towards a significant treatment effect of all NSAIDs compared with placebo on change in depression classification."
    }
  ],
  "safety_notes": null,
  "limitations": "Authors note future trials should use maximum dosage, increased treatment duration, and monitoring of social/environmental changes; only a trend (not robust significance) was observed and median PHQ-9 was similar across groups at baseline and 6 weeks.",
  "authors_conclusion": "Pooled data from 5 postapproval trials show NSAID use demonstrates a trend towards reduction of depression symptoms in osteoarthritis patients based on PHQ-9 scores.",
  "relevance_score": 0.45,
  "extraction_confidence": 0.8,
  "extra_notes": "This is a pooled post-hoc analysis of 5 RCTs, not a single RCT, and the outcome is DEPRESSION (PHQ-9), not osteoarthritis pain/function — so relevance to the Ibuprofen × Osteoarthritis (symptom) pair is limited. The ibuprofen-specific effect cannot be isolated because ibuprofen and naproxen were combined into one group (-0.31); the larger effect was in the celecoxib/Celebrex group (-0.61). Ibuprofen total daily dose = 2400 mg/day (800 mg TID). No confidence intervals reported in the abstract; baseline PHQ-9 scores were low/similar across groups, so the absolute clinical effect on depression is minimal."
}
```

---

## 7. PMID 17010685 — 칼슘 × 골관절염

**Title:** Strontium ranelate reduces the urinary level of cartilage degradation biomarker CTX-II in postmenopausal women.

**Year:** 2007 · **n:** 1310 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/17010685/

### Abstract
```
OBJECTIVE: Strontium ranelate significantly decreases the risk of osteoporotic fractures. The objective of the present study was to investigate whether strontium ranelate (2 g/day) also affects cartilage brakedown as measured by urinary marker of cartilage degradation, designated CTX-II.
METHODS: A subgroup of 2617 postmenopausal osteoporotic women (aged 75.7+/-4.4 years) were selected from the TROPOS phase III study on the basis of a urinary sampling reported at each visit during the first three years of the study. When included in TROPOS, they were randomized to strontium ranelate or placebo in a double-blind fashion for 3 years. A calcium and vitamin D supplement was also provided to the subjects during the study. A marker of collagen type II degradation (CTX-II) corrected for urinary creatinine (CTX-II/cr.) was assessed at regular intervals throughout the study in 1310 patients in strontium ranelate group and 1307 patients in placebo group.
RESULTS: The response in CTX-II depended on time (p<0.0001), and this time dependency differed statistically significantly between groups (time x treatment) (p<0.0003). In addition, there was a statistically significant difference between treatments (p<0.0001). The difference in the response of CTX-II/cr. appeared already after three months, with the strontium ranelate-treated subjects having approximately 15-20% lower values than the placebo-treated subjects for the remaining study period (p<0.0001).
CONCLUSION: Treatment with strontium ranelate significantly decreases urinary excretion of CTX-II, a marker of cartilage destruction. Further studies are warranted to investigate an effect on cartilage formation and symptoms of osteoarthritis.
```

### Extracted JSON
_primary: metric=percent, value=None, category=moderate · design: DB · PC · relevance=0.1 · confidence=0.85_

```json
{
  "primary_condition": "cartilage degradation (biomarker CTX-II) in postmenopausal osteoporotic women; surrogate for osteoarthritis",
  "substance_focus": "strontium ranelate 2 g/day (calcium + vitamin D given to BOTH arms as background supplement, not the tested agent)",
  "comparator": "placebo (plus calcium and vitamin D supplement, same as treatment arm)",
  "population_detail": "Postmenopausal osteoporotic women aged 75.7±4.4 years, subgroup of the TROPOS phase III study",
  "population_type": "elderly",
  "sample_size_total": 2617,
  "sample_size_treatment": 1310,
  "sample_size_control": 1307,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": true,
    "is_placebo_controlled": true,
    "is_multicenter": "unclear",
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 156
  },
  "dose_value": 2,
  "dose_unit": "g",
  "duration_weeks": 156,
  "primary_outcome": {
    "measure": "Urinary CTX-II corrected for creatinine (CTX-II/cr.), a marker of type II collagen / cartilage degradation",
    "effect_metric": "percent",
    "effect_value": null,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": 0.0001,
    "effect_direction": "positive",
    "effect_size_category": "moderate",
    "narrative": "Strontium ranelate-treated subjects had approximately 15-20% lower CTX-II/cr. values than placebo from 3 months onward through the remaining study period (p<0.0001)."
  },
  "secondary_outcomes": [
    {
      "measure": "Time x treatment interaction for CTX-II response",
      "effect_metric": null,
      "effect_value": null,
      "p_value": 0.0003,
      "narrative": "The time dependency of the CTX-II response differed significantly between groups (time x treatment, p<0.0003)."
    },
    {
      "measure": "Overall between-treatment difference in CTX-II",
      "effect_metric": null,
      "effect_value": null,
      "p_value": 0.0001,
      "narrative": "There was a statistically significant overall difference between treatments in CTX-II (p<0.0001), with the effect appearing already after 3 months."
    }
  ],
  "safety_notes": null,
  "limitations": "Authors note that effects on cartilage formation and on clinical symptoms of osteoarthritis were not assessed and warrant further study; outcome is a biochemical surrogate, not a clinical OA endpoint.",
  "authors_conclusion": "Treatment with strontium ranelate significantly decreases urinary excretion of CTX-II, a marker of cartilage destruction, though effects on cartilage formation and OA symptoms remain to be investigated.",
  "relevance_score": 0.1,
  "extraction_confidence": 0.85,
  "extra_notes": "This RCT tests STRONTIUM RANELATE, not calcium — calcium (with vitamin D) was provided identically to both the treatment and placebo arms as background supplementation, so it is not the active intervention and is not isolated as an effect. Hence low relevance to a Calcium × Osteoarthritis question. Outcome is a urinary cartilage-degradation biomarker (CTX-II/cr.), a surrogate marker, not a validated clinical OA outcome (no pain/function/WOMAC measured). The 15-20% reduction is an approximate range given verbatim; no single point estimate or confidence interval was reported, so effect_value left null. Effect was rapid (apparent by 3 months) and sustained. Subgroup analysis nested within the TROPOS osteoporosis fracture trial."
}
```

---

## 8. PMID 16495392 — 글루코사민 × 골관절염

**Title:** Glucosamine, chondroitin sulfate, and the two in combination for painful knee osteoarthritis.

**Year:** 2006 · **n:** 1229 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/16495392/

### Abstract
```
BACKGROUND: Glucosamine and chondroitin sulfate are used to treat osteoarthritis. The multicenter, double-blind, placebo- and celecoxib-controlled Glucosamine/chondroitin Arthritis Intervention Trial (GAIT) evaluated their efficacy and safety as a treatment for knee pain from osteoarthritis.
METHODS: We randomly assigned 1583 patients with symptomatic knee osteoarthritis to receive 1500 mg of glucosamine daily, 1200 mg of chondroitin sulfate daily, both glucosamine and chondroitin sulfate, 200 mg of celecoxib daily, or placebo for 24 weeks. Up to 4000 mg of acetaminophen daily was allowed as rescue analgesia. Assignment was stratified according to the severity of knee pain (mild [N=1229] vs. moderate to severe [N=354]). The primary outcome measure was a 20 percent decrease in knee pain from baseline to week 24.
RESULTS: The mean age of the patients was 59 years, and 64 percent were women. Overall, glucosamine and chondroitin sulfate were not significantly better than placebo in reducing knee pain by 20 percent. As compared with the rate of response to placebo (60.1 percent), the rate of response to glucosamine was 3.9 percentage points higher (P=0.30), the rate of response to chondroitin sulfate was 5.3 percentage points higher (P=0.17), and the rate of response to combined treatment was 6.5 percentage points higher (P=0.09). The rate of response in the celecoxib control group was 10.0 percentage points higher than that in the placebo control group (P=0.008). For patients with moderate-to-severe pain at baseline, the rate of response was significantly higher with combined therapy than with placebo (79.2 percent vs. 54.3 percent, P=0.002). Adverse events were mild, infrequent, and evenly distributed among the groups.
CONCLUSIONS: Glucosamine and chondroitin sulfate alone or in combination did not reduce pain effectively in the overall group of patients with osteoarthritis of the knee. Exploratory analyses suggest that the combination of glucosamine and chondroitin sulfate may be effective in the subgroup of patients with moderate-to-severe knee pain. (ClinicalTrials.gov number, NCT00032890.).
```

### Extracted JSON
_primary: metric=percent, value=3.9, category=null_effect · design: DB · PC · MC · relevance=0.9 · confidence=0.95_

```json
{
  "primary_condition": "symptomatic knee osteoarthritis (painful knee OA; stratified mild [N=1229] vs moderate-to-severe [N=354])",
  "substance_focus": "Glucosamine 1500 mg/day (also tested: chondroitin sulfate 1200 mg/day, and the two in combination)",
  "comparator": "placebo (primary comparator); celecoxib 200 mg/day as active control",
  "population_detail": "Adults with symptomatic knee osteoarthritis, mean age 59 years, 64% women; acetaminophen up to 4000 mg/day allowed as rescue analgesia",
  "population_type": "mixed",
  "sample_size_total": 1583,
  "sample_size_treatment": null,
  "sample_size_control": null,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": true,
    "is_placebo_controlled": true,
    "is_multicenter": true,
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 24
  },
  "dose_value": 1500,
  "dose_unit": "mg",
  "duration_weeks": 24,
  "primary_outcome": {
    "measure": "Responder rate — ≥20% decrease in knee pain (WOMAC pain) from baseline to week 24",
    "effect_metric": "percent",
    "effect_value": 3.9,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": 0.3,
    "effect_direction": "null",
    "effect_size_category": "null_effect",
    "narrative": "As compared with the rate of response to placebo (60.1 percent), the rate of response to glucosamine was 3.9 percentage points higher (P=0.30)."
  },
  "secondary_outcomes": [
    {
      "measure": "Responder rate — combined glucosamine + chondroitin vs placebo (overall group)",
      "effect_metric": "percent",
      "effect_value": 6.5,
      "p_value": 0.09,
      "narrative": "The rate of response to combined treatment was 6.5 percentage points higher than placebo (P=0.09)."
    },
    {
      "measure": "Responder rate — combined therapy vs placebo in moderate-to-severe pain subgroup",
      "effect_metric": "percent",
      "effect_value": 24.9,
      "p_value": 0.002,
      "narrative": "For patients with moderate-to-severe pain at baseline, the rate of response was significantly higher with combined therapy than with placebo (79.2 percent vs. 54.3 percent, P=0.002)."
    },
    {
      "measure": "Responder rate — celecoxib (active control) vs placebo",
      "effect_metric": "percent",
      "effect_value": 10.0,
      "p_value": 0.008,
      "narrative": "The rate of response in the celecoxib control group was 10.0 percentage points higher than that in the placebo control group (P=0.008)."
    }
  ],
  "safety_notes": "Adverse events were mild, infrequent, and evenly distributed among the groups.",
  "limitations": "Subgroup benefit in moderate-to-severe pain came from exploratory analyses; high placebo response rate (60.1%); per-arm sample sizes not reported in abstract.",
  "authors_conclusion": "Glucosamine and chondroitin sulfate alone or in combination did not reduce pain effectively in the overall group with knee osteoarthritis, though exploratory analyses suggest the combination may help the moderate-to-severe pain subgroup.",
  "relevance_score": 0.9,
  "extraction_confidence": 0.95,
  "extra_notes": "GAIT trial (NCT00032890), 5-arm design (glucosamine, chondroitin, combination, celecoxib, placebo). Glucosamine monotherapy showed a non-significant 3.9-percentage-point benefit over placebo. Notably, celecoxib (the validated active control) was also only modestly superior to placebo, reflecting an unusually high placebo response that limits assay sensitivity. Subgroup signal: combination therapy effective only in moderate-to-severe baseline pain (exploratory, hypothesis-generating). Glucosamine here was glucosamine hydrochloride."
}
```

---

## 9. PMID 33538113 — 이부프로펜 × 골관절염

**Title:** Long-Term Safety and Efficacy of Subcutaneous Tanezumab Versus Nonsteroidal Antiinflammatory Drugs for Hip or Knee Osteoarthritis: A Randomized Trial.

**Year:** 2021 · **n:** 996 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/33538113/

### Abstract
```
OBJECTIVE: To assess the long-term safety and 16-week efficacy of subcutaneous tanezumab in patients with hip or knee osteoarthritis (OA).
METHODS: This was a phase III randomized, double-blind, active treatment-controlled (using nonsteroidal antiinflammatory drugs [NSAIDs] as the active treatment control) safety trial of tanezumab (56-week treatment/24-week posttreatment follow-up) in adults who were receiving stable-dose NSAID therapy at the time of screening and who had Western Ontario and McMaster Universities Osteoarthritis Index (WOMAC) pain and physical function scores of ≥5; patient global assessment (PtGA) of OA of fair, poor, or very poor; history of inadequate pain relief with standard analgesics; and no history or radiographic evidence of prespecified bone/joint conditions beyond OA. Patients received oral naproxen, celecoxib, or diclofenac twice daily (NSAID group; n = 996) or tanezumab 2.5 mg (n = 1,002) or 5 mg (n = 998) subcutaneously every 8 weeks. Coprimary efficacy end points at week 16 were changes in WOMAC pain and physical function scores and changes in PtGA. The primary joint safety end point over 80 weeks comprised adjudicated rapidly progressive OA type 1 or 2, primary osteonecrosis, subchondral insufficiency fracture, or pathologic fracture. Mean values, least squares mean values, and least squares mean differences between groups (with 95% confidence intervals [95% CIs]) were calculated.
RESULTS: Of 3,021 randomized patients, 2,996 received ≥1 treatment dose. Adverse events (AEs) were similar between patients treated with tanezumab 2.5 mg and those treated with NSAIDs, and were more prevalent in those treated with tanezumab 5 mg. Composite joint safety events were significantly more prevalent with tanezumab 2.5 mg and tanezumab 5 mg than with NSAIDs (observation time-adjusted rate/1,000 patient-years 38.3 [95% CI 28.0, 52.5] and 71.5 [95% CI 56.7, 90.2], respectively, versus 14.8 [95% CI 8.9, 24.6]; P = 0.001 for tanezumab 2.5 mg versus NSAIDs; P < 0.001 for tanezumab 5 mg versus NSAIDs). Tanezumab 5 mg significantly improved pain and physical function but did not improve PtGA at week 16 when compared to NSAIDs; corresponding differences between the tanezumab 2.5 mg and NSAID groups were not statistically significant.
CONCLUSION: In patients previously receiving a stable dose of NSAIDs, tanezumab administered subcutaneously resulted in more joint safety events than continued NSAIDs, with differences being dose dependent. Pain and physical function improved with both doses of tanezumab compared to NSAIDs, reaching statistical significance with tanezumab 5 mg at 16 weeks.
```

### Extracted JSON
_primary: metric=None, value=None, category=unclear · design: DB · relevance=0.03 · confidence=0.8_

```json
{
  "primary_condition": "hip or knee osteoarthritis (moderate-to-severe; WOMAC pain and physical function ≥5, PtGA fair/poor/very poor)",
  "substance_focus": "subcutaneous tanezumab 2.5 mg or 5 mg every 8 weeks (NOT ibuprofen)",
  "comparator": "active control — oral NSAIDs (naproxen, celecoxib, or diclofenac twice daily)",
  "population_detail": "Adults with hip or knee OA already receiving stable-dose NSAID therapy at screening, with WOMAC pain and function scores ≥5, PtGA fair/poor/very poor, and history of inadequate pain relief with standard analgesics; no bone/joint conditions beyond OA",
  "population_type": "mixed",
  "sample_size_total": 3021,
  "sample_size_treatment": 2000,
  "sample_size_control": 996,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": true,
    "is_placebo_controlled": false,
    "is_multicenter": "unclear",
    "has_intention_to_treat": "unclear",
    "follow_up_weeks": 80
  },
  "dose_value": null,
  "dose_unit": "mg",
  "duration_weeks": 56,
  "primary_outcome": {
    "measure": "WOMAC pain (coprimary efficacy endpoint at week 16; trial's designated primary endpoint was a composite joint-safety endpoint over 80 weeks)",
    "effect_metric": null,
    "effect_value": null,
    "ci_lower": null,
    "ci_upper": null,
    "p_value": null,
    "effect_direction": "positive",
    "effect_size_category": "unclear",
    "narrative": "Tanezumab 5 mg significantly improved pain and physical function but did not improve PtGA at week 16 when compared to NSAIDs; corresponding differences between the tanezumab 2.5 mg and NSAID groups were not statistically significant."
  },
  "secondary_outcomes": [
    {
      "measure": "Composite adjudicated joint-safety events over 80 weeks (rapidly progressive OA type 1/2, primary osteonecrosis, subchondral insufficiency fracture, or pathologic fracture) — observation-time-adjusted rate per 1,000 patient-years",
      "effect_metric": null,
      "effect_value": null,
      "p_value": 0.001,
      "narrative": "Composite joint-safety events were significantly more prevalent with tanezumab 2.5 mg (38.3/1,000 PY; 95% CI 28.0–52.5) and tanezumab 5 mg (71.5/1,000 PY; 95% CI 56.7–90.2) than with NSAIDs (14.8/1,000 PY; 95% CI 8.9–24.6); P=0.001 for 2.5 mg vs NSAIDs and P<0.001 for 5 mg vs NSAIDs."
    },
    {
      "measure": "WOMAC physical function (week 16)",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "Tanezumab 5 mg significantly improved physical function versus NSAIDs at week 16; tanezumab 2.5 mg did not reach statistical significance."
    },
    {
      "measure": "Patient Global Assessment (PtGA) of OA (week 16)",
      "effect_metric": null,
      "effect_value": null,
      "p_value": null,
      "narrative": "Neither tanezumab 5 mg nor 2.5 mg improved PtGA compared to NSAIDs at week 16."
    }
  ],
  "safety_notes": "Adverse events were similar between tanezumab 2.5 mg and NSAIDs and more prevalent with tanezumab 5 mg. Composite joint-safety events were significantly more frequent with both tanezumab doses than NSAIDs in a dose-dependent manner (2.5 mg 38.3, 5 mg 71.5 vs NSAIDs 14.8 events/1,000 patient-years).",
  "limitations": null,
  "authors_conclusion": "In NSAID-experienced hip/knee OA patients, subcutaneous tanezumab caused more joint-safety events than continued NSAIDs in a dose-dependent fashion, while improving pain and physical function (statistically significant only for the 5 mg dose at 16 weeks).",
  "relevance_score": 0.03,
  "extraction_confidence": 0.8,
  "extra_notes": "MISMATCH: This trial does NOT study ibuprofen. The tested investigational substance is the anti-NGF monoclonal antibody tanezumab; the active comparator NSAIDs were naproxen, celecoxib, or diclofenac — ibuprofen was not used. It is fundamentally a long-term joint-safety trial (primary endpoint = composite joint-safety over 80 weeks) with 16-week efficacy as coprimary endpoints; no numeric MD/CI for WOMAC pain or function are reported in the abstract. Two tanezumab arms (2.5 mg n=1,002; 5 mg n=998) were pooled for sample_size_treatment=2,000; dose_value left null because two distinct doses were tested. Clear dose-response signal for both efficacy (only 5 mg significant) and joint-safety harm (5 mg > 2.5 mg > NSAIDs). 3,021 randomized; 2,996 received ≥1 dose. Phase III, double-blind."
}
```

---

## 10. PMID 29673465 — 이부프로펜 × 골관절염

**Title:** Effect of Aspirin Coadministration on the Safety of Celecoxib, Naproxen, or Ibuprofen.

**Year:** 2018 · **n:** 953 · **PubMed:** https://pubmed.ncbi.nlm.nih.gov/29673465/

### Abstract
```
BACKGROUND: The safety of nonsteroidal anti-inflammatory drug (NSAID) and aspirin coadministration is uncertain.
OBJECTIVES: The aim of this study was to compare the safety of combining NSAIDs with low-dose aspirin.
METHODS: This analysis of the PRECISION (Prospective Randomized Evaluation of Celecoxib Integrated Safety Versus Ibuprofen or Naproxen) trial included 23,953 patients with osteoarthritis or rheumatoid arthritis at increased cardiovascular risk randomized to celecoxib, ibuprofen, or naproxen. The on-treatment population was used for this study. Outcomes included composite major adverse cardiovascular events, noncardiovascular death, gastrointestinal or renal events, and components of the composite. Cox proportional hazards models compared outcomes among NSAIDs stratified by aspirin use following propensity score adjustment. Kaplan-Meier analysis was used to compare the cumulative probability of events.
RESULTS: When taken without aspirin, naproxen or ibuprofen had greater risk for the primary composite endpoint compared with celecoxib (hazard ratio [HR]: 1.52; 95% confidence interval [CI]: 1.22 to 1.90, p <0.001; and HR: 1.81; 95% CI: 1.46 to 2.26; p <0.001, respectively). Compared with celecoxib, ibuprofen had more major adverse cardiovascular events (p < 0.05), and both ibuprofen and naproxen had more gastrointestinal (p < 0.001) and renal (p < 0.05) events. Taken with aspirin, ibuprofen had greater risk for the primary composite endpoint compared with celecoxib (HR: 1.27; 95% CI: 1.06 to 1.51; p < 0.01); this was not significantly higher with naproxen (HR: 1.18; 95% CI: 0.98 to 1.41; p = 0.08). Among patients on aspirin, major adverse cardiovascular events were similar among NSAIDs, and compared with celecoxib, ibuprofen had more gastrointestinal and renal events (p < 0.05), while naproxen had more gastrointestinal events (p < 0.05), without a difference in renal events. Similar results were seen on adjusted Kaplan-Meier analysis.
CONCLUSIONS: Celecoxib has a more favorable overall safety profile than naproxen or ibuprofen when taken without aspirin. Adding aspirin attenuates the safety advantage of celecoxib, although celecoxib is still associated with fewer gastrointestinal events than ibuprofen or naproxen and fewer renal events than ibuprofen. (Prospective Randomized Evaluation of Celecoxib Integrated Safety vs Ibuprofen or Naproxen [PRECISION]; NCT00346216).
```

### Extracted JSON
_primary: metric=HR, value=1.81, category=moderate · design: - · relevance=0.55 · confidence=0.9_

```json
{
  "primary_condition": "Osteoarthritis or rheumatoid arthritis at increased cardiovascular risk (secondary analysis stratified by aspirin use)",
  "substance_focus": "Ibuprofen (dose not specified in abstract), one of three randomized NSAID arms in the PRECISION trial",
  "comparator": "Active control — celecoxib (with naproxen as third arm); no placebo",
  "population_detail": "23,953 patients with osteoarthritis or rheumatoid arthritis at increased cardiovascular risk; on-treatment population, analyzed by low-dose aspirin use",
  "population_type": "mixed",
  "sample_size_total": 23953,
  "sample_size_treatment": null,
  "sample_size_control": null,
  "design_features": {
    "is_randomized": true,
    "is_double_blind": "unclear",
    "is_placebo_controlled": false,
    "is_multicenter": "unclear",
    "has_intention_to_treat": false,
    "follow_up_weeks": null
  },
  "dose_value": null,
  "dose_unit": null,
  "duration_weeks": null,
  "primary_outcome": {
    "measure": "Composite major adverse cardiovascular events (primary composite endpoint), ibuprofen vs celecoxib, without aspirin",
    "effect_metric": "HR",
    "effect_value": 1.81,
    "ci_lower": 1.46,
    "ci_upper": 2.26,
    "p_value": 0.001,
    "effect_direction": "negative",
    "effect_size_category": "moderate",
    "narrative": "When taken without aspirin, ibuprofen had greater risk for the primary composite endpoint compared with celecoxib (HR: 1.81; 95% CI: 1.46 to 2.26; p <0.001)."
  },
  "secondary_outcomes": [
    {
      "measure": "Primary composite endpoint, ibuprofen vs celecoxib, with aspirin",
      "effect_metric": "HR",
      "effect_value": 1.27,
      "p_value": 0.01,
      "narrative": "Taken with aspirin, ibuprofen had greater risk for the primary composite endpoint compared with celecoxib (HR: 1.27; 95% CI: 1.06 to 1.51; p <0.01)."
    },
    {
      "measure": "Gastrointestinal events, ibuprofen vs celecoxib",
      "effect_metric": null,
      "effect_value": null,
      "p_value": 0.001,
      "narrative": "Compared with celecoxib, ibuprofen had more gastrointestinal events both without aspirin (p <0.001) and with aspirin (p <0.05)."
    },
    {
      "measure": "Renal events, ibuprofen vs celecoxib",
      "effect_metric": null,
      "effect_value": null,
      "p_value": 0.05,
      "narrative": "Ibuprofen had more renal events than celecoxib both without aspirin (p <0.05) and with aspirin (p <0.05)."
    }
  ],
  "safety_notes": "This was a safety-focused analysis. Without aspirin, ibuprofen (vs celecoxib) showed more major adverse cardiovascular events (p <0.05), more gastrointestinal (p <0.001) and more renal (p <0.05) events. With aspirin, MACE was similar across NSAIDs, but ibuprofen still had more GI and renal events than celecoxib (p <0.05 each). Adding aspirin attenuated celecoxib's overall safety advantage.",
  "limitations": "Not explicitly stated in abstract; implicitly a post-hoc/secondary stratified analysis using the on-treatment (not intention-to-treat) population with propensity score adjustment, and aspirin use was not randomized.",
  "authors_conclusion": "Celecoxib has a more favorable overall safety profile than ibuprofen or naproxen without aspirin; adding aspirin attenuates this advantage, though celecoxib still has fewer gastrointestinal events than both and fewer renal events than ibuprofen.",
  "relevance_score": 0.55,
  "extraction_confidence": 0.9,
  "extra_notes": "This is a secondary/stratified analysis of the PRECISION RCT (NCT00346216) focused on aspirin coadministration safety, not OA efficacy. Outcomes are cardiovascular/GI/renal safety endpoints, not pain or function — there is no WOMAC/VAS/pain measure. Ibuprofen is one of three NSAID arms and the population mixes osteoarthritis and rheumatoid arthritis (proportion of OA not given). All effect estimates are relative to celecoxib (reference); HRs >1 indicate worse safety for ibuprofen. No ibuprofen-specific or OA-specific sample size, dose, or follow-up duration reported in the abstract."
}
```

---
