# Workspace

## Overview

ESL Environmental Intelligence Platform — a Bloomberg-style Portfolio Command Center for Environmental Solutions Limited. Converts environmental data into investment risk signals with clear Proceed/Condition/Decline decisions across a portfolio of projects. V3 adds a full institutional governance lifecycle layer.

pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + Recharts + Framer Motion
- **Routing**: wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   └── esl-platform/       # React frontend (Portfolio Command Center)
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/
│   └── src/seed.ts         # Database seed script (7 sample projects)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Key Features

### Portfolio Command Center (Dashboard)
- Portfolio Decision Banner (PROCEED_WITH_PORTFOLIO / REBALANCE / REDUCE_EXPOSURE)
- Summary strip: Total Capital, Avg Risk, Exposure at Risk, Confidence Score
- Risk vs Confidence Scatter Matrix (color-coded by risk, sized by investment)
- Capital Allocation Pie Chart (by risk level)
- Data Confidence Index with Lab/Monitoring/IFC progress bars
- Risk Distribution Histogram
- Cross-Project Intelligence (Geographic Concentration, Sector Risk, Data Quality Gap, Validation Deficit, Climate Vulnerability)
- Top Risk Alerts Panel
- Sortable Asset Inventory Table
- Portfolio Optimization Panel with recommendations
- **Portfolio Governance Section**: ESAP Completion %, Covenant Compliance %, Active Breaches count, Monitoring Events count, Breach & Escalation Alerts panel
- **Role Selector**: Analyst / Investment Officer / Admin selector in dashboard header

### Portfolio Manager (/portfolios)
- Portfolio CRUD (create, delete)
- Project assignment with stage tracking (Early, Pre-IC, Approved, Post-Close)
- Investment amount entry per project
- Portfolio metrics (weighted risk, total investment, project count)

### Project Intelligence View (7-tab interface)
- **Risk Overview**: Investment Decision Signal, What-If Scenario Analysis, Risk Monitoring Timeline, Risk Topology, Financial Translation
- **Framework Alignment**: IFC PS1-PS8, Equator Principles, IDB Invest alignment with status/severity/gap analysis
- **Covenants**: Investment covenant tracking with status management (Pending/In Progress/Met/Breach)
- **ESAP**: Environmental & Social Action Plan items with progress tracking and evidence
- **Monitoring**: Monitoring event log with type, result, findings, escalation status
- **Audit Trail**: Full audit log of all governance actions with timestamps and actors
- **Report**: Institutional report generation (Pre-IC / Post-Close format) with full governance data

### Risk Scoring Engine (`artifacts/api-server/src/lib/risk-engine.ts`)
- Environmental, Infrastructure, Human Exposure, Regulatory risk subscores (0-100)
- Risk scale: 0-100 (PROCEED < 40, CONDITION 40-70, DECLINE > 70)
- Data Confidence: 40% base + 20% each for hasLabData, hasMonitoringData, isIFCAligned
- Uncertainty penalty for low confidence
- Financial risk translation
- Auto-generated conditions and intelligence insights

### Database Schema (`lib/db/src/schema/`)
- `projects` table: inputs, computed scores, financial risks, decisions, investment amounts
- `portfolios` table: named portfolio groupings
- `portfolio_projects` table: project-to-portfolio assignments with stage + investment amount
- `risk_history` table: monthly risk/confidence snapshots per project (12-month timeline)
- `covenants` table: investment covenant tracking per project (category, description, trigger, status)
- `esap_items` table: ESAP action items per project (action, responsible, deadline, status, evidence)
- `monitoring_events` table: monitoring event log per project (date, type, result, findings, status)
- `audit_logs` table: governance audit trail (action, user, details, timestamps)
- `framework_alignments` table: framework alignment records per project (framework, standard, status, gap, severity)

### API Routes
- `GET /api/healthz` — health check
- `GET /api/projects` — list all projects
- `POST /api/projects` — create project with analysis
- `GET /api/projects/:id` — get project detail
- `DELETE /api/projects/:id` — delete project
- `POST /api/projects/:id/scenario` — what-if scenario analysis
- `GET /api/projects/:id/risk-history` — 12-month risk history for timeline
- `GET /api/portfolio/summary` — portfolio-level metrics and alerts
- `GET /api/portfolio/optimize` — optimization recommendations
- `GET /api/portfolio/intelligence` — cross-project intelligence patterns
- `GET /api/portfolio/confidence` — data confidence index
- `GET /api/portfolio/decision` — portfolio-level decision signal
- `GET /api/portfolios` — list all portfolios with projects
- `POST /api/portfolios` — create portfolio
- `GET /api/portfolios/:id` — get portfolio with projects
- `DELETE /api/portfolios/:id` — delete portfolio
- `POST /api/portfolios/:id/projects` — add project to portfolio (with duplicate guard)
- `DELETE /api/portfolios/:id/projects/:projectId` — remove project from portfolio
- `GET /api/projects/:id/framework-alignment` — framework alignment for project (auto-generates on first call)
- `GET /api/projects/:id/covenants` — covenants for project (auto-generates on first call)
- `PATCH /api/covenants/:id` — update covenant status (validated enum: Pending/In Progress/Met/Breach)
- `GET /api/projects/:id/esap` — ESAP items for project (auto-generates on first call)
- `PATCH /api/esap/:id` — update ESAP item status/evidence (validated enum: Not Started/In Progress/Complete/Overdue)
- `POST /api/projects/:id/monitoring` — add monitoring event (validated type + status enums)
- `GET /api/projects/:id/monitoring` — monitoring events for project
- `GET /api/projects/:id/audit-log` — audit log for project
- `GET /api/audit-log` — global audit log (last 200 entries)
- `GET /api/governance/summary` — portfolio governance KPIs (covenant compliance %, ESAP completion %, breaches, monitoring events)
- `GET /api/projects/:id/report` — generate institutional report for project

### V4 Regional/Authority Routes
- `GET /api/regional/data` — regional dataset query (filter by country, type)
- `GET /api/regional/indices` — Caribbean Risk Index (all countries with trends)
- `GET /api/regional/indices/:country` — single country trend
- `GET /api/regional/benchmarks/sector` — sector benchmarking with trends
- `GET /api/regional/benchmarks/project/:id` — project vs region/sector comparison with percentile
- `GET /api/regional/benchmarks/portfolio` — portfolio vs regional baseline
- `GET /api/regional/confidence` — regional data confidence/coverage breakdown
- `GET /api/regional/insights` — generated intelligence insights
- `GET /api/regional/authority-summary` — authority dashboard headline data (CERI, data moat, countries, sectors)

### Governance Frontend
- Governance API client: `artifacts/esl-platform/src/lib/governance-api.ts` (direct fetch, not codegen)
- Governance tab components: `artifacts/esl-platform/src/components/governance-tabs.tsx`
- Dashboard governance section in `artifacts/esl-platform/src/pages/dashboard.tsx`
- API governance routes in `artifacts/api-server/src/routes/governance.ts`

### V4 Regional Frontend
- Regional API client: `artifacts/esl-platform/src/lib/regional-api.ts`
- Authority Dashboard: `artifacts/esl-platform/src/pages/authority-dashboard.tsx` (/authority)
- Project Benchmarking: `artifacts/esl-platform/src/components/benchmarking.tsx` (Benchmark tab)
- Portfolio Benchmarking: integrated into dashboard governance section
- API regional routes in `artifacts/api-server/src/routes/regional.ts`

## Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client
- `pnpm --filter @workspace/db run push` — push DB schema
- `pnpm --filter @workspace/scripts run seed` — seed sample portfolio data
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/esl-platform run dev` — run frontend dev server

## Design
- Dark charcoal/black background, cyan/teal primary, white text
- Institutional Bloomberg Terminal aesthetic
- Investment amounts in millions USD (e.g. $25M)
- API server runs on port 8080
