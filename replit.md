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

11. **Data Provenance System**: API responses include `dataProvenance` field indicating `SIMULATED` (demo baselines) or `LIVE` (connected real sources). Authority dashboard shows a yellow banner when simulated data is in use. Jamaica data layer metadata (21 layers) is real, sourced from ESL research brief. Country risk scores, CERI, sector benchmarks, and trend data are simulated. See `docs/REAL_DATA_SOURCE_INTEGRATION.md` for full integration guide covering WRI Aqueduct, NOAA IBTrACS, GOJ ArcGIS services, WorldPop, and other real sources.

**Database Schema Highlights:** Key tables include `projects`, `portfolios`, `risk_history`, `covenants`, `esap_items`, `monitoring_events`, `audit_logs`, `pipelines`, `financial_impacts`, `outcomes`, `blended_structures`, `data_layers`, and `project_data_layers`.

**Authentication & Security:** Uses email/password with mandatory TOTP-based two-factor authentication (users cannot access any protected routes without completing 2FA setup). JWT session tokens stored in httpOnly cookies (no localStorage). bcrypt 12-round password hashing. AES-256-GCM encryption at rest for sensitive project fields (decisionOutcome, decisionInsight, reputationalRisk, decisionConditions). Security hardening: Helmet CSP, rate limiting (500 req/15min general, 20/15min auth), restricted CORS (auto-detects Replit domain), trust proxy for rate limiter, configurable session timeout via SESSION_TIMEOUT_HOURS env var (default 8h). Secrets stored in Replit Secrets (ENCRYPTION_KEY, ADMIN_BOOTSTRAP_SECRET, SESSION_SECRET) - never in .replit or source code.

**Role-Based Access Control (RBAC):** Server-enforced roles: Analyst, Investment Officer, Admin. Backend middleware `requireRole()` enforces permissions on routes: DELETE projects (Admin only), pipeline create/upload (IO/Admin), pipeline delete (Admin), audit log access (Admin/IO). Frontend role is derived from authenticated user's server role (no manual role switching). Role displayed as static badge in UI header.

**UI/UX Design:** Dark charcoal/black background with cyan/teal primary colors and white text, aiming for a Bloomberg Terminal aesthetic. Investment amounts are displayed in millions USD.

## External Dependencies

-   **PostgreSQL**: Primary database.
-   **OpenAPI Specification**: For API definition and client code generation.
-   **Recharts**: For frontend data visualization.
-   **Framer Motion**: For UI animations.