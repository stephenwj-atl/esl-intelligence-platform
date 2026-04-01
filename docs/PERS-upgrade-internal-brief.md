# ESL Intelligence Platform — PERS Upgrade Internal Brief

**Date:** April 2026
**Status:** Deployed to development environment
**Classification:** Internal — Engineering & Investment Teams

---

## What Changed

The ESL platform has been upgraded from a country-level environmental intelligence system to a **project-level capital deployment decision system**. The core addition is the **Project Environmental Risk Score (PERS)** — a quantitative framework that scores every project on a 0–100 scale and drives capital mode recommendations, monitoring intensity, and lender framework alignment.

---

## PERS Formula

```
PERS = (CERI × 0.50) + (ProjectOverlay × 0.25) + (Sensitivity × 0.15) + (InterventionRisk × 0.10)
```

| Component | Weight | Source |
|---|---|---|
| CERI (Country Environmental Risk Index) | 50% | 26 data pipelines — environmental, infrastructure, human exposure, regulatory |
| Project Overlay | 25% | Sector-specific complexity, adjusted by SEA (0.85×) and ESIA (0.90×) mitigation |
| Sensitivity | 15% | Human exposure, regulatory, governance quality, disaster loss history |
| Intervention Risk | 10% | Delivery modality — 5 profiles with distinct risk drivers |

### Decision Thresholds
| PERS Score | Signal | Action |
|---|---|---|
| < 40 | PROCEED | Standard due diligence |
| 40 – 70 | CONDITION | Additional safeguards required |
| > 70 | DECLINE | Fundamental risk mitigation needed |

---

## New Capabilities

### 1. Expanded Project Classification
- **6 project categories:** Hard Infrastructure, Soft Infrastructure, Climate & Environment, Agriculture & Food Security, Governance & Institutional, Disaster Response & Recovery
- **40 project types** across all categories (was ~10)
- **5 intervention risk profiles** with distinct risk drivers, typical failure modes, and mitigation recommendations

### 2. Capital Mode Engine
| Mode | Criteria | Use Case |
|---|---|---|
| Loan | PERS < 45, confidence > 60% | Low risk, standard covenants |
| Blended | PERS 45–70 or confidence gaps | Grant-first de-risking before loan activation |
| Grant | PERS > 70, confidence < 50% | Impact delivery focus |

### 3. Monitoring Intensity
| Level | Criteria | Frequency |
|---|---|---|
| STANDARD | PERS < 40, confidence >= 60% | Semi-annual reporting, annual site visits |
| ENHANCED | PERS 40–65 or confidence 40–60% | Quarterly reporting, semi-annual site visits |
| INTENSIVE | PERS > 65 or confidence < 40% | Monthly reporting, quarterly site visits |

### 4. SEA/ESIA as Primary Investment Guidance
Per CEO directive, SEA and ESIA are positioned as primary investment guidance tools. When a project has:
- **SEA framework:** 0.85× reduction on project overlay (sector risk component)
- **ESIA completed:** 0.90× reduction on project overlay

EIA remains permitting compliance only — not recommended as an investment guidance tool.

### 5. Lender Framework Alignment
PERS assessments map to 6 lender frameworks: IDB ESPF, CDB ESRP, World Bank ESF, GCF, EIB, Equator Principles. Each provides framework-specific EIA/ESIA requirements, risk categorization, and compliance guidance.

### 6. Three New Data Pipelines
- **INFORM Risk Index** — EU DRMKC composite risk scores (hazard, vulnerability, coping capacity)
- **Transparency International CPI** — Corruption Perceptions Index for governance quality
- **EM-DAT** — International Disaster Database for loss history scoring

Total pipeline count: **26** across 17 Caribbean countries.

### 7. Frontend Updates
- **PERS Tab** on every project — full formula breakdown, intervention risk profile with risk drivers, failure modes, mitigation recommendations, project classification
- **Project Header** — shows category badge, capital mode, monitoring intensity
- **Methodology Page** at `/methodology` — complete PERS documentation for investment teams
- **Expanded Project Creation Form** — 6-category selector, intervention type, SEA/ESIA toggles, lender framework, coordinates

### 8. Demo Portfolio
7 demo projects seeded across all capital modes and categories:

| Project | Country | Category | PERS | Capital | Monitoring |
|---|---|---|---|---|---|
| Kingston Harbour Water Treatment | Jamaica | Hard Infrastructure | 38.2 | Loan | STANDARD |
| Barbados Solar Farm | Barbados | Climate & Environment | 27.2 | Loan | ENHANCED |
| Trinidad Agricultural Supply Chain | Trinidad & Tobago | Agriculture & Food Security | 36.4 | Loan | STANDARD |
| St. Lucia Health Network | Saint Lucia | Soft Infrastructure | 46.9 | Blended | ENHANCED |
| Bahamas Coastal Resilience | Bahamas | Climate & Environment | 50.0 | Blended | ENHANCED |
| Guyana Financial Management Reform | Guyana | Governance & Institutional | 52.9 | Blended | ENHANCED |
| Dominica Post-Hurricane Housing | Dominica | Disaster Response & Recovery | 70.8 | Grant | INTENSIVE |

---

## Known Gaps & Next Steps

### Gap 1: PERS Sensitivity Uses Hardcoded Defaults (HIGH PRIORITY)
The PERS engine supports governance quality (from CPI) and disaster loss history (from EM-DAT) as inputs to the Sensitivity component. However, the API route that creates projects **does not yet query regional_data** for these values — it falls back to hardcoded defaults (governance = 50, disaster history = 40). This means the 3 new pipelines (INFORM, CPI, EM-DAT) populate the database but their data is not yet wired into the PERS calculation at project creation time.

**Impact:** Sensitivity scores are uniform across countries rather than reflecting actual governance and disaster profiles. A project in well-governed Barbados gets the same sensitivity sub-score as one in a country with weaker governance.

**Fix:** Query `regional_data` for the project's country at creation time, extract CPI and EM-DAT values, and pass them into `calculatePERS()` as the `governanceScore` and `disasterLossHistory` parameters. The PERS engine already accepts these — only the wiring is missing.

### Gap 2: Legacy Projects Lack PERS Scores
7 of 14 projects predate the PERS upgrade and have no PERS score, capital mode, monitoring intensity, or project classification. These display correctly in the UI (graceful fallback) but don't benefit from the new assessment framework.

**Fix:** Run a backfill script that re-analyzes legacy projects through the PERS pipeline. Requires either inferring classification from existing project type or manual classification input.

### Gap 3: Schema Drift Between Drizzle ORM and Database
The Drizzle schema file defines some columns differently from how they exist in the actual PostgreSQL database (e.g., `investmentAmount` is `text` in Drizzle but `real` in PostgreSQL, `decisionConditions` is `text` in Drizzle but `jsonb` in the DB). Columns were added via direct SQL `ALTER TABLE` to avoid Drizzle push interactive prompts. This works at runtime because Drizzle sends raw SQL, but it means:
- TypeScript types may not perfectly reflect actual column types
- Future `drizzle-kit push` runs could attempt destructive changes

**Fix:** Align the Drizzle schema to match the actual PostgreSQL column types, then validate with a dry-run push.

### Gap 4: INFORM/CPI/EM-DAT Pipelines Use Reference Data
The three new pipelines are implemented and registered but currently use hardcoded Caribbean reference data rather than pulling from live external APIs. This is the same pattern used by several other pipelines (Aqueduct, WDPA) where API credentials or stable endpoints are pending.

**Fix:** Connect to live data sources when API access is available. The pipeline architecture already supports hot-swapping reference data for live API calls.

### Gap 5: No Automated PERS Recalculation on Data Refresh
When pipelines ingest new data (e.g., updated CPI scores, new disaster events), existing project PERS scores are not automatically recalculated. The scoring engine runs at project creation time only.

**Fix:** Add a post-ingestion hook or scheduled job that recalculates PERS for all active projects when underlying data changes, with change-tracking in risk_history.

### Gap 6: Dashboard Portfolio Metrics Don't Aggregate PERS
The Portfolio Command Center's summary metrics (total capital, average risk, allocation breakdown) still use the original risk score rather than PERS. The PERS-aware capital mode and monitoring intensity data is available but not yet surfaced in portfolio-level views.

**Fix:** Update the dashboard overview and allocation tabs to aggregate by PERS score, capital mode distribution, and monitoring intensity breakdown.

---

## API Endpoints Added

| Method | Path | Description |
|---|---|---|
| POST | `/api/projects` | Updated — now runs full PERS pipeline on creation |
| GET | `/api/projects/:id/pers-assessment` | Full PERS breakdown with explainability |
| GET | `/api/methodology/pers` | PERS methodology documentation (JSON) |

---

## Run Commands

```bash
# Seed demo projects
pnpm --filter @workspace/api-server run seed:demo

# Run all data pipelines
pnpm --filter @workspace/api-server run ingestion:run-all

# Run specific pipelines
pnpm --filter @workspace/api-server run ingestion:run-all inform-risk,transparency-cpi,em-dat
```

---

## Files Changed

| Area | Key Files |
|---|---|
| PERS Engine | `artifacts/api-server/src/lib/pers-engine.ts` |
| API Routes | `artifacts/api-server/src/routes/projects.ts` |
| New Pipelines | `artifacts/api-server/src/services/data-ingestion/inform-risk.ts`, `transparency-cpi.ts`, `em-dat.ts` |
| Frontend PERS Tab | `artifacts/esl-platform/src/pages/project-detail.tsx` |
| Methodology Page | `artifacts/esl-platform/src/pages/methodology.tsx` |
| Project Creation | `artifacts/esl-platform/src/pages/new-project.tsx` |
| Demo Seed | `artifacts/api-server/src/scripts/seed-demo-projects.ts` |
| Schema | `lib/db/src/schema/projects.ts` (+ direct SQL ALTER for 14 columns) |
