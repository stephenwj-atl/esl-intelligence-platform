# Workspace

## Overview

ESL Environmental Intelligence Platform — a decision intelligence system for Environmental Solutions Limited that converts environmental data into investment risk signals with clear Proceed/Condition/Decline decisions.

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

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
- **Frontend**: React + Vite + Tailwind CSS + Recharts
- **Routing**: wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── esl-platform/       # React frontend (ESL Intelligence Platform)
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts
│   └── src/seed.ts         # Database seed script
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## Key Features

### Risk Scoring Engine (`artifacts/api-server/src/lib/risk-engine.ts`)
- Environmental Risk: flood, contamination, water stress, coastal exposure
- Infrastructure Risk: flood, coastal, regulatory
- Human Exposure Risk: community sensitivity, contamination
- Regulatory Risk: regulatory complexity, community, contamination
- Data Confidence: based on lab data, monitoring data, IFC alignment
- Overall Risk: weighted composite with uncertainty penalty

### Financial Risk Translation
- Delay Risk %, Cost Overrun %, Covenant Breach %
- Reputational Risk (Low/Medium/High)

### Decision Engine
- PROCEED (risk < 40), CONDITION (40-70), DECLINE (> 70)
- Auto-generated conditions and intelligence insights

### Database Schema (`lib/db/src/schema/projects.ts`)
- `projects` table: stores project inputs, computed risk scores, financial risks, and decision outcomes

### API Routes
- `GET /api/healthz` — health check
- `GET /api/projects` — list all projects
- `POST /api/projects` — create project with analysis
- `GET /api/projects/:id` — get project detail
- `DELETE /api/projects/:id` — delete project

## Commands

- `pnpm run typecheck` — full typecheck
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API client
- `pnpm --filter @workspace/db run push` — push DB schema
- `pnpm --filter @workspace/scripts run seed` — seed sample data
- `pnpm --filter @workspace/api-server run dev` — run API server
- `pnpm --filter @workspace/esl-platform run dev` — run frontend dev server
