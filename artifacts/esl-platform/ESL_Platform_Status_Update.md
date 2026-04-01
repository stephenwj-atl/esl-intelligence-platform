# ESL Intelligence Platform — Status Update & Team Review Document
## April 2026 — Post-Hardening Pass

**Purpose:** Team review document. Please comment on gaps, priorities, and corrections.

---

## 1. Platform Summary

The ESL Environmental Intelligence Platform is a Bloomberg Terminal-style decision support system for Caribbean development finance. It transforms environmental, climate, and governance data into investment risk signals — delivering PROCEED, CONDITION, or DECLINE decisions across a project portfolio.

**Target Users:** Development finance institutions, grant-making bodies, blended finance teams, environmental consultancies operating in the Caribbean region.

---

## 2. Current State — What's Built and Working

### 2.1 Core Decision Engine
| Component | Status | Notes |
|---|---|---|
| Algorithmic Risk Scoring (0-100) | Complete | 12+ weighted indicators across 4 dimensions |
| Data Confidence Index (0-100%) | Complete | Weights lab data, monitoring, third-party validation |
| Decision Signal (PROCEED/CONDITION/DECLINE) | Complete | Threshold-based: <40 / 40-70 / >70 |
| PERS (Project Environmental Risk Score) | Complete | CERI×0.50 + ProjectOverlay×0.25 + Sensitivity×0.15 + InterventionRisk×0.10 |
| Capital Mode Recommendation | Complete | Loan (PERS<45), Blended (45-70), Grant (>70) |
| Monitoring Intensity | Complete | STANDARD / ENHANCED / INTENSIVE based on PERS |
| 5 Intervention Risk Profiles | Complete | Physical Infrastructure, Social, Environmental, Governance, Disaster |
| SEA/ESIA Mitigation Factors | Complete | SEA: 0.85x, ESIA: 0.90x on project overlay |
| Scenario "What-If" Modelling | Complete | Test how changes affect risk profile |
| PERS Explainability & Provenance | Complete | Full breakdown with data source tracking |

### 2.2 Portfolio Intelligence
| Component | Status | Notes |
|---|---|---|
| Portfolio Command Center (4 tabs) | Complete | Overview, Allocation, Impact, Intelligence |
| PERS Intelligence Card | Complete | Avg PERS, risk buckets, capital mode distribution |
| Capital Deployment Mix (Loan/Grant/Blended) | Complete | Aggregate portfolio view |
| Risk Distribution Histogram | Complete | 5-bucket distribution |
| Exposure at Risk | Complete | Capital weighted by risk level |
| Risk Alerts | Complete | Auto-flagged high-risk/low-confidence projects |

### 2.3 Project Intelligence View
| Tab | Status | Notes |
|---|---|---|
| Decision | Complete | Outcome, conditions, risk summary |
| PERS | Complete | Full PERS breakdown, intervention profile, monitoring |
| Baseline | Complete | Data layer coverage, confidence |
| Structure | Complete | Capital mode, blended split |
| Financial | Complete | Rate adjustments, insurance, lifetime impact |
| ESL Services | Complete | Automated service scope proposals |
| Impact | Complete | Impact delivery risk, efficiency |
| Drivers | Complete | Risk driver breakdown |
| Evidence | Complete | Validation status per category |
| Scenario | Complete | What-if modelling |
| Monitoring | Complete | Site visits, lab tests, audits |
| Report | Complete | Exportable summary |
| Audit | Complete | Action history |

### 2.4 Data Ingestion System
**33 data source pipelines** covering **17 Caribbean countries** with **2,176 regional data records**.

| Pipeline | Source Key | Status | Records | Confidence |
|---|---|---|---|---|
| WRI Aqueduct | wri-aqueduct | success | 17 | 72.1% |
| NOAA IBTrACS | noaa-ibtracs | success | 51 | 80% |
| ArcGIS Jamaica | arcgis-jamaica | partial | 10,182 | 45.7% |
| Jamaica Open Data | jamaica-opendata | success | 16 | 80% |
| INFORM Risk Index | inform-risk-index | success | 68 | 80% |
| EM-DAT Disasters | em-dat-disasters | success | 102 | 65% |
| World Bank Indicators | world-bank-indicators | success | 119 | 80% |
| WHO GHO Health | who-gho-health | success | 82 | 80% |
| ThinkHazard (GFDRR) | gfdrr-thinkhazard | pending | 0 | — |
| Coral Reef Watch | noaa-coral-reef-watch | success | 17 | 65% |
| USGS Earthquake | usgs-earthquake-hazards | success | 2,000 | 80% |
| UNESCO World Heritage | unesco-world-heritage | success | 17 | 65% |
| OSM Infrastructure | openstreetmap-infrastructure | success | 17 | 65% |
| JRC Global Flood | jrc-global-flood | success | 17 | 65% |
| NOAA Sea Level Rise | noaa-sea-level-rise | success | 17 | 65% |
| HydroSHEDS | wwf-hydrosheds | success | 17 | 65% |
| Open Buildings | google-open-buildings | success | 17 | 65% |
| SoilGrids | isric-soilgrids | partial | 17 | 65% |
| WDPA Protected Areas | wdpa-protected-planet | success | 17 | 65% |
| WorldPop Population | worldpop-population | success | 17 | 80% |
| Transparency CPI | transparency-cpi-index | success | 51 | 80% |
| NEPA EIA Jamaica | nepa-eia-jamaica | success | 541 | 80% |
| Caribbean EIA Regional | caribbean-eia-regional | success | 514 | 80% |
| WB Documents | wb-documents-eia | success | 470 | 80% |
| ND-GAIN Index | nd-gain-index | pending | 0 | — |
| WB Climate (CCKP) | wb-cckp | pending | 0 | 80% |

**Ingestion Mode:** All sources currently operate as "curated" (high-quality reference data hardcoded as fallbacks). Live API connections exist for several pipelines but degrade gracefully to curated data when APIs are unreachable.

**3 pipelines pending:** ThinkHazard, ND-GAIN, and WB Climate (CCKP) have not completed initial runs.

### 2.5 PERS Data Feeds (Live Regional Data → PERS)
| Feed | Source Pipeline | Countries | Purpose |
|---|---|---|---|
| Governance Quality (CPI) | Transparency CPI | 17 | PERS sensitivity component |
| Disaster History Score | EM-DAT | 17 | PERS sensitivity component |
| INFORM Risk Score | INFORM Risk Index | 17 | PERS CERI adjustment |

### 2.6 Project Portfolio Status
**14 projects** across **7 countries**, all PERS-scored:

| Project | Country | Type | PERS | Capital Mode | Decision |
|---|---|---|---|---|---|
| Kingston Solar Farm | Jamaica | Solar | 27.1 | Loan | PROCEED |
| Barbados Solar Farm & Grid Modernization | Barbados | Solar | 26.4 | Loan | PROCEED |
| Negril Agricultural Hub | Jamaica | Agriculture | 35.9 | Loan | PROCEED |
| Trinidad Agricultural Supply Chain | Trinidad & Tobago | Food Processing | 36.4 | Loan | PROCEED |
| Kingston Harbour Water Treatment | Jamaica | Water Treatment | 38.9 | Loan | CONDITION |
| St. Lucia Community Health Network | Saint Lucia | Hospital | 46.9 | Blended | CONDITION |
| Ocho Rios Resort Development | Jamaica | Hotel | 48.6 | Blended | CONDITION |
| Spanish Town Industrial Park | Jamaica | Industrial | 48.7 | Blended | CONDITION |
| Port Antonio Marina | Jamaica | Port | 48.8 | Blended | CONDITION |
| Bahamas Coastal Resilience & Mangrove | Bahamas | Mangrove Restoration | 49.9 | Blended | CONDITION |
| Guyana Public Financial Management | Guyana | Regulatory Capacity | 53.3 | Blended | CONDITION |
| Coastal Solar Phase II | Jamaica | Solar | 58.2 | Blended | DECLINE |
| Montego Bay Port Expansion | Jamaica | Port | 65.1 | Blended | DECLINE |
| Dominica Post-Hurricane Housing | Dominica | Emergency Shelter | 71.1 | Grant | DECLINE |

### 2.7 Security & Access
| Feature | Status |
|---|---|
| Email/Password + Mandatory TOTP 2FA | Complete |
| JWT Session Tokens (httpOnly cookies) | Complete |
| AES-256-GCM Encryption at Rest | Complete (decisionOutcome, decisionInsight, reputationalRisk) |
| Role-Based Access Control | Complete (Analyst, Investment Officer, Admin) |
| Helmet CSP + Rate Limiting | Complete |
| Restricted CORS | Complete |

### 2.8 Compliance Dashboard
| Framework | Status |
|---|---|
| SOC 2 Type II | Complete |
| ISO 27001 | Complete |
| ISO 27701 | Complete |
| IFC Performance Standards | Complete |

### 2.9 Lender Framework Alignment
| Framework | Status |
|---|---|
| IDB ESPF | Complete |
| CDB ESRP | Complete |
| World Bank ESF | Complete |
| Green Climate Fund (GCF) | Complete |
| European Investment Bank (EIB) | Complete |
| Equator Principles | Complete |

---

## 3. Recent Hardening Pass — What Changed

### Completed (T001-T006)

| Task | What Changed |
|---|---|
| T001: Wire Regional Data into PERS | PERS now pulls live governance/disaster/INFORM scores from regional_data table instead of static defaults. Full provenance tracking (source pipeline, fallback status, timestamps). |
| T002: PERS Recalculation | New `pers:recalculate` script recalculates all PERS-scored projects when regional data updates. Stores old/new/delta. |
| T003: Portfolio PERS Aggregation | Portfolio summary API now returns PERS section (avg score, risk buckets, capital mode distribution, monitoring distribution). Dashboard shows PERS Intelligence card. |
| T004: Legacy Backfill | All 7 legacy projects (IDs 1-7) now have PERS scores. New `pers:backfill` script. |
| T005: Schema Alignment | Drizzle ORM schema now matches PostgreSQL reality. investmentAmount (real), decisionConditions (jsonb), financial percent fields (real). |
| T006: Source Mode Distinction | `ingestion_mode` column (live/curated/hybrid) added to data_source_freshness. All pipeline freshness calls updated. |

### Operational Scripts
```
pnpm --filter @workspace/api-server run pers:recalculate [--dry-run] [--country=Jamaica]
pnpm --filter @workspace/api-server run pers:backfill [--dry-run]
pnpm --filter @workspace/api-server run ingestion:run-all [pipeline-name]
pnpm --filter @workspace/api-server run seed:demo
```

---

## 4. Known Gaps — For Team Discussion

### HIGH PRIORITY

| # | Gap | Impact | Current State |
|---|---|---|---|
| G1 | Financial impact model is loan-only | Grant/blended projects show irrelevant metrics (interest rates, insurance) | Only loan pricing implemented |
| G2 | No program outcome targets or theory of change | Impact tab derives from risk scores, not program-specific outcomes | Cannot assess "will this program deliver intended outcomes?" |
| G3 | No beneficiary/community outcome metrics | Platform can't report primary decision criteria for grant committees | No positive outcome tracking (beneficiaries, hectares restored, etc.) |
| G10 | Portfolio metrics are loan-centric | No impact delivery rate, disbursement velocity, outcome concentration | Portfolio view doesn't serve grant managers |

### MEDIUM PRIORITY

| # | Gap | Impact | Current State |
|---|---|---|---|
| G4 | Blended finance modelled as ratio only | No first-loss, guarantee, TA facility modelling | Simple X% grant + Y% loan split |
| G5 | No transition pathway modelling | Missing core blended finance value proposition | No Grant → Blended → Loan timeline |
| G6 | Disbursement logic is 3-phase binary | Oversimplifies real grant governance | Not milestone-based |
| G7 | No donor-specific safeguard mapping | Framework compliance is generic, not funder-specific | IFC/EP only, no GCF/GEF/AF specifics |
| G8 | Risk engine underweights soil, biodiversity, land tenure | Biased toward infrastructure | Weak for agriculture, watershed, ecosystem programs |

### LOW PRIORITY

| # | Gap | Impact | Current State |
|---|---|---|---|
| G9 | Project types limited | Can't properly classify watershed, forestry, marine, adaptation | Infrastructure-oriented categories |
| G11 | Covenant language defaults to lending conventions | Misaligned with grant governance | No results frameworks terminology |
| G12 | Missing ESL service categories | Gaps in social impact, biodiversity, resettlement | 10 services, missing ~5 DFI-standard categories |

### DATA & INFRASTRUCTURE GAPS

| # | Gap | Impact | Current State |
|---|---|---|---|
| D1 | All pipelines running in "curated" mode | Data labeled as "curated" even when live APIs exist | Need to validate and switch to "live"/"hybrid" |
| D2 | 3 pipelines pending (ThinkHazard, ND-GAIN, WB Climate) | Missing hazard classification and climate adaptation data | Pipelines exist but haven't completed initial runs |
| D3 | ArcGIS Jamaica partially failing | 3 of 7 ArcGIS services unreachable (flood, PRTR) | 45.7% confidence |
| D4 | No live API authentication for rate-limited sources | WRI, WHO vulnerable to rate limiting | No API keys configured |
| D5 | Geospatial processing simplified | Centroid/bbox lookups instead of full raster analysis | Node.js memory limits |
| D6 | Country coverage imbalanced | Jamaica has deepest data; some countries have national-level only | Confidence varies 45-80% across countries |

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Frontend (React + Vite + Tailwind)             │
│  artifacts/esl-platform/                        │
│  - Dashboard (4 tabs)                           │
│  - Project Detail (13 tabs)                     │
│  - Compliance Dashboard                         │
│  - Authority Dashboard                          │
└───────────────────────┬─────────────────────────┘
                        │ HTTPS + TOTP Auth
┌───────────────────────▼─────────────────────────┐
│  API Server (Express 5)                         │
│  artifacts/api-server/                          │
│  - /api/projects      (CRUD + risk analysis)    │
│  - /api/portfolio     (aggregation + PERS)      │
│  - /api/governance    (covenants, ESAP, align)  │
│  - /api/financial     (loan pricing, blended)   │
│  - /api/pipelines     (batch intake)            │
│  - /api/regional      (country indices, CERI)   │
│  - /api/esl           (service scoping)         │
│  - /api/ingestion     (pipeline management)     │
│  - /api/compliance    (framework checking)      │
└───────────────────────┬─────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────┐
│  PostgreSQL (23 tables)                         │
│  lib/db/                                        │
│  - projects (core entity)                       │
│  - regional_data (2,176 records, 17 countries)  │
│  - data_source_freshness (33 sources)           │
│  - ingestion_runs, raw_data_cache               │
│  - risk_history, financial_impacts              │
│  - covenants, esap_items, monitoring_events     │
│  - portfolios, portfolio_projects               │
│  - users, sessions, audit_logs                  │
└─────────────────────────────────────────────────┘
```

### Key Files
| File | Purpose |
|---|---|
| `api-server/src/lib/pers-engine.ts` | PERS calculation engine |
| `api-server/src/lib/risk-engine.ts` | Core risk scoring |
| `api-server/src/lib/country-data-lookup.ts` | Regional data → PERS inputs with provenance |
| `api-server/src/lib/capital-translator.ts` | Environmental risk → financial outputs |
| `api-server/src/lib/project-encryption.ts` | AES-256-GCM field encryption |
| `api-server/src/services/data-ingestion/` | 33 pipeline adapters |
| `api-server/src/scripts/pers-recalculate.ts` | Batch PERS recalculation |
| `api-server/src/scripts/pers-backfill.ts` | Legacy project backfill |
| `lib/db/src/schema/` | All Drizzle schema definitions |
| `esl-platform/src/pages/dashboard.tsx` | Portfolio Command Center |

---

## 6. Recommended Next Steps (For Team Discussion)

### Phase 1 — Instrument-Agnostic Financial Model
**Addresses:** G1, G10
- Build mode-specific financial models (Loan pricing, Grant efficiency, Blended concessionality)
- Add grant portfolio metrics (impact delivery rate, disbursement velocity)
- Differentiate portfolio view by capital mode

### Phase 2 — Program Outcomes Framework
**Addresses:** G2, G3
- Define target outcomes per project (beneficiaries, hectares, emissions)
- Link environmental risk to outcome delivery probability
- Portfolio-level outcome aggregation

### Phase 3 — Blended Finance Structures
**Addresses:** G4, G5
- First-loss, guarantee, TA facility modelling
- Transition pathway timeline (Grant → Blended → Loan)
- Concessionality and crowding-in analysis

### Phase 4 — Sector Expansion
**Addresses:** G8, G9, G12
- Agriculture, watershed, marine, forestry risk weights
- New project types
- New ESL service categories (social impact, biodiversity, resettlement)

### Phase 5 — Data Maturity
**Addresses:** D1-D6
- Validate and switch working APIs to "live" mode
- Fix 3 pending pipelines
- Obtain API keys for rate-limited sources
- Improve sub-national data coverage

### Phase 6 — Funder-Specific Compliance
**Addresses:** G7, G11
- GCF, GEF, Adaptation Fund specific safeguard mapping
- Results framework terminology for grant mode
- Donor reporting cycle integration

---

## 7. Team Questions

Please review and comment on:

1. **Gap priorities** — Are G1-G3 (grant/impact model) truly the highest priority, or are there operational needs that should come first?
2. **Country coverage** — Which countries beyond Jamaica need deepened sub-national data first?
3. **Project types** — What project types are you seeing most from clients that aren't currently supported?
4. **Funder mapping** — Which specific funders/donors should we map first beyond IFC/Equator Principles?
5. **Data sources** — Are there data sources we should prioritize getting live API access for?
6. **PERS formula** — Is the current weighting (CERI 50%, Project Overlay 25%, Sensitivity 15%, Intervention Risk 10%) appropriate, or should it be adjusted?
7. **Missing features** — What capabilities are clients asking for that aren't listed here?
8. **Security/compliance** — Any additional compliance frameworks we should add?

---

*Document generated April 2026. All data reflects current platform state.*
