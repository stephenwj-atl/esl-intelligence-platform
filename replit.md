# Workspace

## Overview

The ESL Environmental Intelligence Platform is a Bloomberg-style Portfolio Command Center designed for Environmental Solutions Limited. It transforms environmental data into actionable investment risk signals, enabling "Proceed," "Condition," or "Decline" decisions across a project portfolio. The platform includes a comprehensive institutional governance lifecycle layer. Its vision is to manage environmental investment risks, enhance decision-making, and optimize capital deployment in environmental projects.

## User Preferences

I prefer iterative development with clear, concise communication. Please ask before making any major architectural changes or significant modifications to existing features. Ensure all explanations are straightforward and avoid overly technical jargon where possible. I like to be informed about the implications of changes on the overall system.

## System Architecture

The project is a pnpm workspace monorepo utilizing TypeScript.

**Technology Stack:**
- **Monorepo tool**: pnpm workspaces
- **Node.js**: Version 24
- **TypeScript**: Version 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (v4)
- **API Codegen**: Orval (from OpenAPI spec)
- **Build Tool**: esbuild (CJS bundle)
- **Frontend**: React, Vite, Tailwind CSS, wouter

**Core System Logic:**
All features must align with a mandatory 7-stage flow: Intake Screening, Baseline Data Formation, Risk Characterisation, Decision and Capital Sequencing, Deployment Control, Transition Validation, and Risk Resolution. This flow prohibits skipping stages, full deployment under unresolved uncertainty, decisions without confidence weighting, and transitions without validation.

**Core Features:**

1.  **Portfolio Command Center (Frontend Dashboard)**: A 4-tab interface ("Overview," "Allocation," "Impact," and "Intelligence") providing portfolio-level decisions, summary metrics (e.g., Total Capital, Avg Risk), capital deployment intelligence, risk alerts, and asset inventory. It includes role-based views.

2.  **Project Intelligence View**: A 10-tab interface for detailed project analysis including "Decision," "Structure," "Financial," "Impact," "Drivers," "Evidence," "Scenario," "Monitoring," "Report," and "Audit." Tabs are dynamically visible based on capital mode.

3.  **Risk Scoring Engine**: Calculates Environmental, Infrastructure, Human Exposure, and Regulatory risk subscores (0-100) and defines investment decision thresholds (PROCEED < 40, CONDITION 40-70, DECLINE > 70). It incorporates Data Confidence calculation and financial risk translation.

4.  **Capital Deployment Interface**: Manages capital allocation modes (Loan/Grant/Blended) via a global context, determines Deployment Readiness (READY, CONDITIONALLY READY, NOT READY), and integrates capital tags into monitoring events. Dynamic blended split calculation is based on risk and confidence.

5.  **Assessment Pipeline System**: Enables creating and managing assessment pipelines with configurable frameworks, thresholds, and capital modes. Supports batch upload, automatic scoring, and portfolio assignment, providing screening results and capital allocation summaries.

6.  **Financial Calculation Logic**: Defines rules for base interest rates, risk-based penalties, confidence penalties, insurance calculations, covenant classifications, and capital constraints for high-risk allocations.

7.  **Stage Flow Layer**: Implements and visualizes the mandatory 7-stage project flow across the platform, including a persistent progress bar, status panel, and stage impact analysis for scenarios.

8.  **Unified Translation Engine**: Core translation layer (`capital-translator.ts`) routing environmental data to mode-specific outputs (Loan, Grant, Blended) for financial metrics, impact analysis, and portfolio aggregation. It also recommends capital modes based on project risk and confidence.

9.  **ESL Service Scope Generator**: Converts risk flags and compliance gaps into concrete ESL service proposals (e.g., EIA, Monitoring Program) with defined scope, deliverables, timelines, estimated fees, and risk reduction/confidence gain points.

9a. **Compliance Dashboard**: Dedicated `/compliance` page with framework selector (SOC 2 Type II, ISO 27001, ISO 27701, IFC Performance Standards). Real-time control status evaluation engine. Accordion-expandable controls with status badges (Implemented/Partial/Planned/Gap), evidence links, platform feature mapping. Overall compliance score gauges per framework and aggregate posture. Compliance summary widget on dashboard Overview tab. Export capability (JSON). API: `GET /api/compliance/frameworks`, `/frameworks/:id`, `/summary`, `/export`. Files: `compliance.ts` (API), `compliance-api.ts` (client), `compliance.tsx` (page).

10. **Country Data Layer System**: Manages country-level environmental data (21 layers for Jamaica example) and project-specific overrides. Data layers are categorized (Environmental Hazards, Infrastructure, Social, Regulatory) and contribute to a Data Readiness Score.

11. **Data Provenance System**: Dynamic provenance derived from `data_source_freshness` table. Status is `SIMULATED` (no pipelines), `PARTIAL` (<3 pipelines connected), or `LIVE` (≥3 pipelines, avg confidence ≥50%). Authority dashboard shows yellow (simulated) or blue (partial) banner. Provenance threshold checks distinct pipeline names (aqueduct, ibtracs, opendata-jamaica, arcgis-jamaica), not raw source rows.

12. **Live Data Ingestion System**: Located at `artifacts/api-server/src/services/data-ingestion/`. Eighteen source adapters across 17 Caribbean countries and 101+ dataset types producing 4,844+ data records:
    - **Aqueduct** (WRI water stress, 17 countries — uses hardcoded reference data until WRI API credentials obtained)
    - **IBTrACS** (NOAA hurricane tracks CSV from `/access/csv/` path, ~55MB download, 9880+ Caribbean storm points)
    - **Open-Data Jamaica** (health facility CSVs from data.gov.jm, 345 facilities)
    - **ArcGIS Jamaica** (7 GOJ/MSET FeatureServer endpoints — 4/7 active; 3 unreachable: flood, PRTR)
    - **WDPA** (Protected Planet protected areas — 17 countries, land/marine coverage, requires `WDPA_API_TOKEN` for live API)
    - **WorldPop** (population density & urban exposure — 17 countries, live API validation)
    - **SoilGrids** (ISRIC soil classification — clay/sand/pH/organic carbon per country centroid, live REST API)
    - **Coral Reef Watch** (NOAA CRW — SST, DHW, bleaching alerts, 17 countries)
    - **USGS Earthquake** (20-year M3.0+ seismic events in Caribbean bbox, live FDSNWS API, ~2000 events)
    - **World Bank** (10 development indicators per country via WB API — GDP, electricity, water, sanitation, CO2, forest, unemployment, poverty, homicides)
    - **WHO GHO** (7 health indicators via GHO API — life expectancy, mortality, physician/bed density, health expenditure)
    - **UNESCO WHC** (World Heritage sites — count and heritage risk per country)
    - **OSM Infrastructure** (OpenStreetMap Overpass API — road segments, bridges, power lines, hospitals per country; 3 live queries + reference data)
    - **JRC Flood** (EU JRC Global Flood Model — 25yr/100yr flood-prone area %, coastal/river flood exposure, composite flood risk scores)
    - **NOAA SLR** (Sea level rise — current rate mm/yr, RCP4.5/8.5 projections at 2050/2100, low-elevation coastal zone %, coastline length)
    - **HydroSHEDS** (WWF watershed/drainage data — major/sub-basins, stream length, drainage density, floodplain %, watershed flood risk)
    - **Open Buildings** (Google Open Buildings estimates — building counts/density, informal settlement %, coastal building %, housing vulnerability)
    - **NEPA EIA** (NEPA Jamaica web scraping — EIA project listings from current site + archive, 31 projects, 6 project types, 7 parishes; regulatory density scoring; uses Node.js `https` with `rejectUnauthorized: false` due to NEPA's incomplete SSL cert chain)
    Shared utility: `utils/freshness.ts` provides `upsertFreshness()` for conflict-safe freshness writes. Orchestrator runs pipelines sequentially, then triggers scoring engine. Scoring engine computes weighted risk across 4 pillars (Environmental 30%, Infrastructure 25%, Community 25%, Regulatory 20%) using 19 dataset types. Admin-only ingestion API routes at `/api/ingestion/run`, `/api/ingestion/run-all`, `/api/ingestion/status`. Standalone runner: `pnpm --filter @workspace/api-server run ingestion:run-all` (supports single/multi-pipeline filter: `pnpm run ingestion:run-all jrc-flood,noaa-slr`).

**Database Schema Highlights:** Key tables include `projects`, `portfolios`, `risk_history`, `covenants`, `esap_items`, `monitoring_events`, `audit_logs`, `pipelines`, `financial_impacts`, `outcomes`, `blended_structures`, `data_layers`, `project_data_layers`, `raw_data_cache`, `data_source_freshness`, and `ingestion_runs`.

**Authentication & Security:** Uses email/password with mandatory TOTP-based two-factor authentication (users cannot access any protected routes without completing 2FA setup). JWT session tokens stored in httpOnly cookies (no localStorage). bcrypt 12-round password hashing. AES-256-GCM encryption at rest for sensitive project fields (decisionOutcome, decisionInsight, reputationalRisk, decisionConditions). Security hardening: Helmet CSP, rate limiting (500 req/15min general, 20/15min auth), restricted CORS (auto-detects Replit domain), trust proxy for rate limiter, configurable session timeout via SESSION_TIMEOUT_HOURS env var (default 8h). Secrets stored in Replit Secrets (ENCRYPTION_KEY, ADMIN_BOOTSTRAP_SECRET, SESSION_SECRET) - never in .replit or source code.

**Role-Based Access Control (RBAC):** Server-enforced roles: Analyst, Investment Officer, Admin. Backend middleware `requireRole()` enforces permissions on routes: DELETE projects (Admin only), pipeline create/upload (IO/Admin), pipeline delete (Admin), audit log access (Admin/IO). Frontend role is derived from authenticated user's server role (no manual role switching). Role displayed as static badge in UI header.

**UI/UX Design:** Dark charcoal/black background with cyan/teal primary colors and white text, aiming for a Bloomberg Terminal aesthetic. Investment amounts are displayed in millions USD.

## External Dependencies

-   **PostgreSQL**: Primary database.
-   **OpenAPI Specification**: For API definition and client code generation.
-   **Recharts**: For frontend data visualization.
-   **Framer Motion**: For UI animations.