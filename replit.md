# Workspace

## Overview

ESL Environmental Intelligence Platform — a Bloomberg-style Portfolio Command Center for Environmental Solutions Limited. Converts environmental data into investment risk signals with clear Proceed/Condition/Decline decisions across a portfolio of projects.

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

### Portfolio Manager (/portfolios)
- Portfolio CRUD (create, delete)
- Project assignment with stage tracking (Early, Pre-IC, Approved, Post-Close)
- Investment amount entry per project
- Portfolio metrics (weighted risk, total investment, project count)

### Project Intelligence View
- Investment Decision Signal (PROCEED/CONDITION/DECLINE)
- Risk Monitoring Timeline (simulated 12-month trajectory with risk score + data confidence lines)
- Risk Topology Breakdown with bar charts
- Financial Translation (delay, cost, covenant, reputational risk)
- What-If Scenario Analysis (toggle inputs to see before/after risk impact)

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
