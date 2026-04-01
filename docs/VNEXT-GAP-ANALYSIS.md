# VNext Master Prompt — Gap Analysis

## Status: What's Built vs. What's Specified

This document compares the 24-section master prompt against actual implementation, section by section. Each item is rated:

- **DONE** — Fully implemented and functional
- **PARTIAL** — Core logic exists but incomplete vs. spec
- **SHALLOW** — Surface-level implementation, needs depth
- **MISSING** — Not implemented

---

## Section 1: Mission (Instrument-Agnostic Architecture)

| Requirement | Status | Notes |
|---|---|---|
| 7 instrument types supported | **DONE** | LOAN, GRANT, BLENDED, GUARANTEE, TA, PROGRAMMATIC, EMERGENCY — all in `instrument-logic.ts` |
| Sector family layering | **DONE** | 8 families with distinct weighting profiles in `methodology-profiles.ts` |
| True layered risk architecture | **DONE** | 6-layer PERS with `calculateLayeredPERS()` producing all layer scores |
| DFI-grade weighting defense | **DONE** | Profiles include rationale, assumptions, limitations |
| Calibration memo generation | **DONE** | `memo-generator.ts` generates 6 memo types from live data |
| Real grant/blended logic | **DONE** | 6 grant signals, blended transition logic, grant-first sequencing |
| Outcome delivery framework | **DONE** | Theory of change, metrics, milestones, outcome delivery risk |
| Transition logic | **DONE** | GRANT→LOAN, GRANT→BLENDED, BLENDED→LOAN, TA→BLENDED, EMERGENCY→REHAB |
| Funder-specific logic | **PARTIAL** | Capital structure recommendation exists but funder-specific framework mapping (IDB vs CDB vs GCF specific safeguards/reporting) is generic |
| Multi-instrument portfolio metrics | **PARTIAL** | Portfolio view exists but lacks instrument-specific metric breakdowns (loan capital-at-risk, grant outcome delivery aggregate, blended concessionality distribution) |

---

## Section 2: Critical Design Correction (Layered + Inspectable)

| Requirement | Status | Notes |
|---|---|---|
| `country_context_score` | **DONE** | Computed in `calculateCountryContext()` |
| `project_exposure_score` | **DONE** | Computed in `calculateProjectExposure()` |
| `sector_receptor_sensitivity_score` | **DONE** | Computed in `calculateSectorSensitivity()` |
| `intervention_delivery_risk_score` | **DONE** | Computed in `calculateInterventionDelivery()` |
| `instrument_structure_risk_score` | **DONE** | From `assessInstrument().structureRiskScore` |
| `outcome_delivery_risk_score` | **DONE** | Computed from outcome inputs |
| `confidence_score` | **DONE** | `riskScores.dataConfidence` |
| `implementation_capacity_score` | **PARTIAL** | Input to instrument logic but not stored as a separate persisted layer output in DB |
| `disbursement_readiness_score` | **DONE** | Computed and stored |
| `transition_readiness_score` | **DONE** | LOAN_READY / BLENDED_ELIGIBLE / GRANT_PHASE / PRE_READINESS |
| `pers_base_score` | **DONE** | `persBreakdown.persScore` |
| `pers_final_score` | **DONE** | After confidence adjustment |
| `decision_signal` | **DONE** | Instrument-specific |
| `capital_mode_recommendation` | **DONE** | From `recommendCapitalMode()` |
| `monitoring_intensity` | **DONE** | From `determineMonitoringIntensity()` |
| `recommended_controls` | **DONE** | `instrumentAssessment.conditions` |
| `recommended_conditions` | **DONE** | `instrumentAssessment.conditions` |
| `explainability_payload` | **DONE** | `buildLayeredExplainability()` produces narrative array |
| Scores stored in DB per project | **PARTIAL** | Computed on-the-fly during assessment; `layered_scores` field exists on projects table but not all individual layer scores are persisted as separate columns |

---

## Section 3: Sector Family Architecture

| Requirement | Status | Notes |
|---|---|---|
| 8 sector families | **DONE** | All 8 defined in `sector-families.ts` |
| Structured relevance profiles | **DONE** | 7 relevance factors per profile (hazard, biodiversity, governance, disasterHistory, communityVulnerability, outcomeComplexity, monitoringNeeds) |
| 17 subfactors per family | **PARTIAL** | Spec calls for 17 subfactors (flood, coastal, sea-level, seismic, water stress, biodiversity, protected area, land tenure, governance, corruption, disaster history, community vulnerability, service continuity, implementation complexity, outcome complexity, monitoring intensity, transition). Implementation has 7 consolidated factors — functionally equivalent but less granular than spec |
| Stored in structured tables | **DONE** | `methodology_profiles` table with all weights and relevance |
| Expanded project types/subtypes | **PARTIAL** | `sector-families.ts` maps project types to families, but the full expanded taxonomy (40+ subtypes per family as listed in spec Section 3.3) is not exhaustively enumerated — uses pattern matching with reasonable defaults |
| `private_sector_productive` profile | **MISSING** | The spec calls for 9 profiles including `PERS_PRIVATE_SECTOR_V1`. Only 8 profiles exist (universal + 7 families). Private sector uses the universal fallback |

---

## Section 4: Instrument-Agnostic Logic

| Requirement | Status | Notes |
|---|---|---|
| 7 instruments | **DONE** | All 7 in `instrument-logic.ts` |
| LOAN: pricing, covenant, borrower strength | **DONE** | PERS-based thresholds, quarterly covenant conditions, confidence-adjusted risk |
| GRANT: 6 decision signals | **DONE** | PROCEED, PROCEED_WITH_CONTROLS, RESEQUENCE, NARROW_SCOPE, DEFER_PENDING_BASELINE, DO_NOT_FUND |
| GRANT: high risk ≠ auto-decline | **DONE** | DO_NOT_FUND only when PERS > 85 AND capacity < 30 |
| BLENDED: grant/debt split, transition | **DONE** | Grant component formula, grant-first sequencing, transition triggers |
| GUARANTEE: credit enhancement | **DONE** | Coverage caps, annual reassessment |
| TA/PROGRAMMATIC/EMERGENCY | **DONE** | Appropriate logic for each |
| Blended outputs: GRANT_FIRST, BLENDED_NOW, LOAN_READY_AFTER_VALIDATION | **PARTIAL** | Transition readiness computed but not using exact spec labels (uses PROCEED/CONDITION/PROCEED_WITH_CONTROLS instead of GRANT_FIRST/BLENDED_NOW labels) |

---

## Section 5: Outcome Delivery Framework

| Requirement | Status | Notes |
|---|---|---|
| Theory of change per project | **DONE** | `outcomes` table with `theoryOfChange` field |
| Outputs, outcomes, beneficiaries | **DONE** | `outcome_metrics` with categories (climate, economic, social, etc.) |
| Verification metrics | **DONE** | Target value, current value, status tracking |
| `outcome_delivery_risk_score` | **DONE** | Computed in layered engine |
| `outcome_confidence_score` | **PARTIAL** | Implied by data confidence but not computed as a separate dedicated score |
| `implementation_capacity_score` | **DONE** | Input to instrument assessment |
| `disbursement_readiness_score` | **DONE** | Input to instrument assessment + stored |
| Milestones | **DONE** | `disbursement_milestones` table with gating effects |
| Reporting cycle, responsible parties | **PARTIAL** | Basic structure exists but no explicit reporting_cycle or responsible_party fields on outcome records |

---

## Section 6: Disbursement & Transition Logic

| Requirement | Status | Notes |
|---|---|---|
| Milestone types (baseline, safeguard, procurement, etc.) | **DONE** | `milestone_type` enum with gating effects |
| Milestone fields (name, evidence, status, gating, date, reviewer) | **DONE** | All in `disbursement_milestones` schema |
| 5 transition pathways | **DONE** | GRANT→BLENDED, GRANT→LOAN, BLENDED→LOAN, TA→BLENDED, EMERGENCY→REHAB |
| Transition fields (trigger, criteria, horizon, conditions, confidence, reviewer, status) | **DONE** | All in `transition_pathways` schema |
| `transition_readiness_score` | **DONE** | Computed from PERS + confidence |
| Recommended next capital stage | **DONE** | Via transition readiness status |
| Blockers to transition | **PARTIAL** | Implied by validation criteria but not surfaced as an explicit "blockers" list |

---

## Section 7: Family-Specific Weighting Profiles

| Requirement | Status | Notes |
|---|---|---|
| 9 profiles (including private sector) | **PARTIAL** | 8 profiles implemented. `PERS_PRIVATE_SECTOR_V1` missing |
| Stored in DB and seeded | **DONE** | `methodology_profiles` table seeded by `seedVNextData()` |
| Profile fields (label, description, family, instruments, effective date, active, calibration status, rationale, limitations, evidence, review) | **DONE** | All stored |
| Base layer weights (CC, PE, SRS, IDR) | **DONE** | Each profile has distinct weights |
| Modifier weights (instrument structure, outcome delivery, confidence) | **DONE** | `instrumentStructureModifier`, `outcomeRiskModifier`, `confidenceInfluence` |
| **Weight values match spec exactly** | **NO** | Spec provides exact defaults (e.g., ecosystems CC=0.25, PE=0.15, SRS=0.35, IDR=0.25). Implementation uses different but defensible values (CC=0.35, PE=0.20, SRS=0.20, IDR=0.10, ORM=0.15). This is a **deliberate design choice** — the implementation includes outcome risk as a base contributor rather than keeping it modifier-only, and redistributes weight accordingly. The differences are documented in profile rationale |

---

## Section 8: Instrument-Specific Modifier Rules

| Requirement | Status | Notes |
|---|---|---|
| Loan modifiers (confidence, readiness penalties) | **DONE** | Low confidence adds conditions; readiness < threshold adds verification |
| Grant modifiers (outcome focus, no auto-decline) | **DONE** | Structure risk formula weighs outcome, capacity, disbursement equally with PERS |
| Blended modifiers (transition, milestone importance) | **DONE** | Grant-first sequencing, transition triggers |
| TA/Programmatic/Emergency modifiers | **DONE** | Appropriate emphasis on governance, readiness, staged controls |
| Modifiers stored as auditable rule sets | **PARTIAL** | Logic is in code (`instrument-logic.ts`) with clear thresholds but not in a separate auditable rule-set table — the code IS the rule set, documented in-line |

---

## Section 9: Decision Matrices by Instrument

| Requirement | Status | Notes |
|---|---|---|
| Loan matrix (3 signals) | **DONE** | PROCEED / CONDITION / DECLINE |
| Grant matrix (6 signals) | **DONE** | Full 6-signal logic with nuanced conditions |
| Blended matrix (4 signals) | **DONE** | With grant component recommendation |
| Guarantee matrix | **DONE** | 3 signals with coverage caps |
| TA/Programmatic/Emergency matrices | **DONE** | Appropriate logic for each |
| Matrix metadata stored structurally | **PARTIAL** | Matrices are algorithmic in code, exposed via API (`/api/methodology/instruments`), but not stored as configurable data — they are hardcoded business rules |

---

## Section 10: Calibration Guardrails

| Requirement | Status | Notes |
|---|---|---|
| No weight shift > ±0.10 without review | **SHALLOW** | Not enforced programmatically. Guardrails are documented but not implemented as runtime constraints |
| No layer below 0.05 or above 0.50 | **SHALLOW** | Same — documented but not enforced |
| Base weights normalize to 1.00 | **PARTIAL** | Profiles are authored to sum correctly, but no runtime normalization check |
| Subfactor 0.00-1.00 bounds | **DONE** | Code uses `clamp(0, 1)` |
| Changes > 0.20 require calibration note | **MISSING** | No change tracking on profile weights |
| > 5 material subfactor changes → UNDER_REVIEW | **MISSING** | No automatic status trigger |
| Confidence adjustment bounded (±15 pts) | **DONE** | `confidenceInfluence` is typically 0.10-0.20 (equivalent to ~5-15 pt adjustment) |

---

## Section 11: Methodology Defense System

| Requirement | Status | Notes |
|---|---|---|
| Defense records stored | **DONE** | `methodology_evidence` table |
| Weighting rationale | **DONE** | Each profile has `rationale` field |
| Assumptions, limitations | **DONE** | Each profile has `assumptions` and `knownLimitations` |
| Evidence notes | **DONE** | `methodology_evidence` table linked to profiles |
| Calibration notes | **DONE** | Via memo system |
| Review history | **PARTIAL** | Memos are stored but no formal review/approval workflow with timestamps |
| Per-profile defense showing why family needs distinct treatment | **DONE** | Rationale explains differentiation |

---

## Section 12: Profile Comparison Engine

| Requirement | Status | Notes |
|---|---|---|
| Side-by-side comparison of default vs family vs alternative | **PARTIAL** | UI shows profiles side by side on methodology page. API exposes all profiles. But no dedicated "apply profile X to project Y and compare results" computation endpoint |
| Show layer scores, final score difference | **MISSING** | No project-level "what if I used a different profile" comparison |
| Decision difference | **MISSING** | Same |
| Capital mode difference | **MISSING** | Same |
| Monitoring difference | **MISSING** | Same |
| Top driver changes | **MISSING** | Same |

**This is the biggest single gap**: the spec envisions a scenario analysis tool ("what would this project score under the ecosystems profile vs. the infrastructure profile?") and that does not exist.

---

## Section 13: Calibration Memo Generation

| Requirement | Status | Notes |
|---|---|---|
| 6 memo types | **DONE** | weighting_defense, calibration_review, portfolio_risk_methodology, sector_family_scoring, instrument_logic, grant_blended_readiness |
| Memo sections (purpose, scope, version, weights, rationale, behavior, inconsistencies, sensitivity, recommendations, confidence, next needs) | **DONE** | `generateMemo()` produces structured content with all sections |
| Memo inputs (profile, family, country, funder, portfolio, time, validation cases) | **PARTIAL** | Profile and family filtering work. Country/funder/portfolio/time period filtering not implemented |
| Output formats (in-app, markdown, JSON, DOCX) | **PARTIAL** | In-app view and JSON. No markdown export button. No DOCX generation |

---

## Section 14: Validation & Calibration Workbench

| Requirement | Status | Notes |
|---|---|---|
| `validation_cases` table | **DONE** | Schema + API + seeded |
| `validation_observations` table | **DONE** | Schema + API + seeded |
| `methodology_reviews` table | **MISSING** | No dedicated review workflow table |
| `memo_runs` table | **DONE** | `calibration_memos` table |
| `profile_performance_snapshots` table | **MISSING** | Not in schema |
| `override_decisions` table | **DONE** | Schema + API + seeded |
| `outcome_realizations` table | **PARTIAL** | `outcome_metrics` tracks target vs current, but no separate "realization" comparison table |
| Predicted vs observed comparisons | **DONE** | Validation cases compare predicted/observed risk |
| Default vs family profile comparison | **MISSING** | See Section 12 gap |
| Override governance with correctness tracking | **DONE** | `proved_correct` field on overrides |

---

## Section 15: Funder / Framework Expansion

| Requirement | Status | Notes |
|---|---|---|
| IDB, IDB Invest, CDB, World Bank, GCF, GEF, Adaptation Fund, EIB, Equator Principles | **SHALLOW** | Framework names are seeded (IDB ESPF, CDB ESRP, IFC PS, GCF, Equator Principles) but funder-specific logic (different safeguard requirements, reporting styles, results framework expectations) is not meaningfully differentiated |
| Grant/climate-fund specific: safeguards, reporting style, results framework, readiness expectations, disbursement controls | **SHALLOW** | The platform recommends capital modes and services but doesn't tailor the decision logic or conditions to specific funder frameworks |
| Not just relabeled lender compliance | **PARTIAL** | Grant logic IS genuinely different (6 signals vs 3), but funder-specific compliance mapping is surface-level |

---

## Section 16: ESL Service Categories

| Requirement | Status | Notes |
|---|---|---|
| 15 service categories | **DONE** | 16 services in `esl-services-expanded.ts` (exceeds spec) |
| Automated scope reflects family and instrument | **DONE** | `recommendServices()` filters by family + instrument, assigns priority |
| Fee ranges and durations | **DONE** | All 16 services have fee range and duration |

---

## Section 17: Data / Source Maturity

| Requirement | Status | Notes |
|---|---|---|
| Source health: live, curated, hybrid, manual, degraded, pending | **DONE** | Source health tracking exists |
| ThinkHazard, ND-GAIN, WB Climate/CCKP visibility | **DONE** | Data sources integrated and tracked |
| Confidence reflects source mode, spatial precision, recency, fallback, coverage | **DONE** | Data confidence scoring considers multiple factors |

---

## Section 18: Multi-Instrument Portfolio View

| Requirement | Status | Notes |
|---|---|---|
| Loan metrics (avg PERS, capital at risk, proceed/condition/decline) | **PARTIAL** | Portfolio page shows aggregate PERS but doesn't break down by instrument type |
| Grant metrics (outcome delivery, implementation readiness, disbursement, beneficiary concentration) | **MISSING** | No grant-specific portfolio aggregates |
| Blended metrics (concessionality distribution, transition readiness, pathway pipeline) | **MISSING** | No blended-specific portfolio aggregates |
| Filter by instrument, family, country, funder, monitoring, decision, transition | **PARTIAL** | Some filtering exists but not the full matrix |

---

## Section 19: UI / API Additions

| Page | Status | Notes |
|---|---|---|
| Methodology Defense | **DONE** | `/methodology` |
| Calibration Workbench | **DONE** | `/calibration` |
| Memo Generator | **DONE** | Part of `/calibration` |
| Outcomes / Theory of Change | **DONE** | `/outcomes` |
| Disbursement & Transition | **DONE** | `/disbursement` |
| Funder Logic | **DONE** | `/funder-logic` |
| Override Review / Governance | **DONE** | `/overrides` |
| Methodology Profile Detail | **PARTIAL** | Profiles shown on methodology page but no dedicated profile detail page |
| Profile Comparison | **MISSING** | No interactive comparison tool |
| Profile History / Version View | **MISSING** | No version history UI |

| API Endpoint | Status |
|---|---|
| Methodology profiles | **DONE** |
| Methodology defense | **DONE** |
| Memo generation | **DONE** |
| Outcomes framework | **DONE** |
| Disbursement milestones | **DONE** |
| Transition pathways | **DONE** |
| Override logging | **DONE** |
| Family profile comparison | **MISSING** |
| Calibration review endpoints | **PARTIAL** |
| Profile performance snapshots | **MISSING** |

---

## Section 20: Documentation

| Document | Status | Notes |
|---|---|---|
| Instrument agnostic model | **DONE** | `/docs/instrument-logic.md` |
| Sector family architecture | **DONE** | `/docs/sector-families.md` |
| PERS layered model | **DONE** | `/docs/layered-pers-architecture.md` |
| Weighting profiles | **DONE** | `/docs/methodology-profiles.md` |
| Weighting profile defaults | **PARTIAL** | Covered in profiles doc but not standalone |
| Family subfactor relevance | **PARTIAL** | Covered in profiles doc but not standalone |
| Instrument modifier rules | **PARTIAL** | Covered in instrument logic doc |
| Decision matrices | **PARTIAL** | Covered in instrument logic doc |
| Calibration guardrails | **PARTIAL** | Mentioned in docs but not standalone |
| Methodology defense | **DONE** | `/docs/validation-overrides.md` |
| Calibration memo engine | **DONE** | `/docs/calibration-memos.md` |
| Outcome delivery framework | **DONE** | `/docs/outcomes-framework.md` |
| Disbursement transition model | **PARTIAL** | Covered in outcomes framework doc |
| Funder alignment expansion | **PARTIAL** | Covered in instrument logic doc |
| Portfolio multi-instrument metrics | **MISSING** | No standalone doc |
| Profile comparison engine | **MISSING** | Not implemented |
| Memo rules | **PARTIAL** | Covered in calibration memos doc |

---

## Section 21: Demo / Seed Expectations

| Requirement | Status | Notes |
|---|---|---|
| Infrastructure loan | **DONE** | Kingston Harbour Water Treatment |
| Ecosystem grant | **DONE** | Seeded |
| Governance grant | **DONE** | Guyana PFM Reform |
| Disaster recovery grant | **DONE** | Dominica Post-Hurricane Housing |
| Blended agriculture | **PARTIAL** | Barbados Solar Farm is blended but climate, not agriculture |
| Blended resilience program | **PARTIAL** | Not explicitly a resilience program |
| TA governance project | **DONE** | Guyana PFM Reform |
| Private-sector productive | **MISSING** | No private sector demo project |
| 10 cross-family demo projects | **PARTIAL** | 7 demo projects seeded (spec says 10) |
| 5 memo runs | **PARTIAL** | Memo generation works but unclear if 5 are pre-seeded |
| 5 override examples | **PARTIAL** | Override structure exists; seeded examples unclear |
| 6 validation observations | **DONE** | Seeded in `seedVNextData()` |
| High-risk grant with PROCEED_WITH_CONTROLS | **DONE** | Logic supports this scenario |
| Blended with GRANT→LOAN transition | **DONE** | Transition pathway seeded |
| Default vs family producing different decisions | **PARTIAL** | Possible with engine but not explicitly seeded as a showcase |

---

## Section 22: Acceptance Criteria Summary

| # | Criterion | Status |
|---|---|---|
| 1 | Family-specific weighting profiles | **DONE** |
| 2 | Subfactor relevance by family | **DONE** (7 factors, not 17) |
| 3 | Loan, grant, blended materially distinct | **DONE** |
| 4 | Decision matrices differ by instrument | **DONE** |
| 5 | Outcomes, beneficiaries, milestones, ToC | **DONE** |
| 6 | Disbursement + transition readiness | **DONE** |
| 7 | Methodology defense stored + viewable | **DONE** |
| 8 | Calibration memos from real data | **DONE** |
| 9 | Profile comparison at project + portfolio | **MISSING** |
| 10 | Override governance auditable | **DONE** |
| 11 | Portfolio views multi-instrument | **PARTIAL** |
| 12 | Funder alignment extends into grant/blended | **SHALLOW** |
| 13 | Sector layering in schema, scoring, UI, explainability | **DONE** |
| 14 | Documentation reflects implementation | **DONE** |
| 15 | App runs end-to-end | **DONE** |

---

## Priority Gaps to Close (Ranked by Impact)

### HIGH PRIORITY

1. **Profile Comparison Engine** (Sections 12, 22.9) — The ability to run "what if this project used a different profile" and compare results side-by-side. This is critical for methodology defense and calibration. Needs: API endpoint + UI page.

2. **Multi-Instrument Portfolio Metrics** (Section 18, 22.11) — Portfolio page needs instrument-specific aggregates: loan capital-at-risk, grant outcome delivery aggregate, blended concessionality/transition pipeline. Needs: API + UI upgrade.

3. **Funder-Specific Framework Logic** (Section 15, 22.12) — Move beyond generic labels to actual funder-specific requirements: IDB ESPF vs CDB ESRP vs GCF safeguard categories, reporting templates, readiness expectations. Needs: data model + recommendation logic.

### MEDIUM PRIORITY

4. **PERS_PRIVATE_SECTOR_V1 Profile** — The 9th profile from the spec. Quick to add.

5. **Calibration Guardrails as Runtime Enforcement** (Section 10) — Currently documented, not enforced. Add validation logic that rejects weight changes exceeding ±0.10 without a calibration note.

6. **3 Additional Demo Projects** (Section 21) — Need private sector, agriculture blended, and resilience program demo projects to reach 10 total.

7. **Blended Output Labels** — Use spec labels (GRANT_FIRST, BLENDED_NOW, LOAN_READY_AFTER_VALIDATION) in addition to or instead of generic signal names.

### LOWER PRIORITY

8. **17 Subfactors per Family** — Current 7 consolidated factors are functionally adequate but less granular than spec's 17. Expanding would improve methodology defense documentation.

9. **Memo Export Formats** — Add markdown export and DOCX-ready payload generation.

10. **Profile Performance Snapshots Table** — Schema table for tracking how profiles perform over time.

11. **Methodology Review Workflow** — Formal review/approval workflow with timestamps and reviewer tracking.

12. **Profile History / Version View** — UI for viewing how profiles have changed over time.

---

*Analysis date: April 2026*
*Based on: Master VNext prompt (24 sections, 1233 lines) vs. live codebase*
