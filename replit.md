# Workspace

## Overview

The ESL Environmental Intelligence Platform is a Bloomberg-style Portfolio Command Center designed for Environmental Solutions Limited. Its primary purpose is to transform environmental data into actionable investment risk signals, enabling clear "Proceed," "Condition," or "Decline" decisions across a portfolio of projects. The platform includes a comprehensive institutional governance lifecycle layer. Its vision is to provide a robust tool for managing environmental investment risks, enhancing decision-making, and optimizing capital deployment in environmental projects.

## User Preferences

I prefer iterative development with clear, concise communication. Please ask before making any major architectural changes or significant modifications to existing features. Ensure all explanations are straightforward and avoid overly technical jargon where possible. I like to be informed about the implications of changes on the overall system.

## System Architecture

The project is a pnpm workspace monorepo utilizing TypeScript.

### Technology Stack
- **Monorepo tool**: pnpm workspaces
- **Node.js**: Version 24
- **TypeScript**: Version 5.9
- **API Framework**: Express 5
- **Database**: PostgreSQL with Drizzle ORM
- **Validation**: Zod (v4) and `drizzle-zod`
- **API Codegen**: Orval (from OpenAPI spec)
- **Build Tool**: esbuild (CJS bundle)
- **Frontend**: React, Vite, Tailwind CSS, Recharts, Framer Motion
- **Routing**: wouter

### Core Features

**1. Portfolio Command Center (Frontend Dashboard)**
- A 3-tab layout providing an "Overview," "Allocation," and "Intelligence" view.
- **Overview**: Displays portfolio-level decisions, summary metrics (Total Capital, Avg Risk, Exposure at Risk, Confidence Score), Capital Deployment Intelligence, Top Risk Alerts, and an Asset Inventory.
- **Allocation**: Features a Risk vs. Confidence Scatter Matrix, Capital Allocation Pie Chart, Data Confidence Index, Risk Distribution, and Portfolio Financial Impact projections.
- **Intelligence**: Offers Cross-Project Intelligence patterns, Portfolio Governance metrics (ESAP %, Covenant Compliance %), and Portfolio Optimization recommendations.
- Includes a Role Selector (Analyst/Investment Officer/Admin).

**2. Project Intelligence View**
- A 10-tab interface for detailed project analysis: "Decision," "Structure," "Financial," "Impact," "Drivers," "Evidence," "Scenario," "Monitoring," "Report," and "Audit."
- **Decision**: Provides a Capital Decision Summary, recommended structure, financial impact, key constraints, and next actions.
- **Structure**: Details capital structure by mode (Loan, Grant, Blended).
- **Financial**: Covers loan pricing, insurance, covenant levels, and lifetime cost.
- **Impact**: Assesses Impact Delivery Risk, Efficiency Score, Monitoring Intensity, and Disbursement Risk.
- **Scenario**: Allows "what-if" analysis with before/after comparisons and a Risk Monitoring Timeline.

**3. Risk Scoring Engine**
- Calculates Environmental, Infrastructure, Human Exposure, and Regulatory risk subscores (0-100).
- Defines risk scale: PROCEED (< 40), CONDITION (40-70), DECLINE (> 70).
- Incorporates Data Confidence calculation (base 40% + bonuses for Lab Data, Monitoring Data, IFC Alignment) and uncertainty penalties.
- Performs financial risk translation and generates auto-conditions/insights.

**4. Capital Deployment Interface**
- Manages capital allocation modes (Loan/Grant/Blended) via a global context and UI switch.
- Implements logic for dynamic blended split calculation based on overall risk, data confidence, validation gaps, and environmental exposure.
- Determines Deployment Readiness (READY, CONDITIONALLY READY, NOT READY) based on risk, confidence, and monitoring status.
- Integrates capital tags into monitoring events.

**5. Assessment Pipeline System**
- Enables creation and management of assessment pipelines with configurable frameworks, thresholds, and capital modes.
- Supports batch upload of proposals (from CSV), automatic scoring, and assignment to portfolios.
- Provides screening results with framework compliance details and capital allocation summaries (total grant/loan, eligible/conditional/ineligible counts).

**6. Financial Calculation Logic**
- Defines rules for base interest rates, risk-based penalties, confidence penalties, insurance calculations, covenant classifications (HIGH, MEDIUM, LOW), and capital constraints for high-risk allocations.

**7. ESL Service Scope Generator**
- Converts risk flags and compliance gaps into concrete ESL service proposals
- API: `artifacts/api-server/src/routes/esl-services.ts`
  - `GET /api/esl/project/:id/services` — scopes services for single project
  - `GET /api/esl/portfolio/pipeline` — aggregate ESL revenue across portfolio
- Service catalog: EIA, Lab Validation, Monitoring Program, IFC Compliance, Climate Risk Assessment, Regulatory Advisory, Contamination Assessment, Water Resource Assessment
- Each service: trigger conditions from project risk profile, scope items, deliverables, timeline (weeks), estimated fee (based on project value), priority (CRITICAL/RECOMMENDED), risk reduction points, confidence gain
- Fee calculation: percentage of project value with min/max caps per service type
- Frontend: "ESL Services" tab on project detail (`artifacts/esl-platform/src/components/esl-services-tab.tsx`)
- Dashboard: "ESL Service Pipeline" panel on Intelligence tab showing total revenue opportunity, service breakdown, top projects
- "Generate Proposal" button exports scope document as text file

### Database Schema Highlights
- `projects`: Stores project inputs, scores, financial risks, decisions, investment amounts.
- `portfolios`: Manages named portfolio groupings.
- `risk_history`: Monthly risk/confidence snapshots.
- `covenants`, `esap_items`, `monitoring_events`: Track governance and compliance.
- `audit_logs`: Stores a full audit trail of governance actions.
- `pipelines`: Configures assessment pipeline definitions.
- `financial_impacts`: Stores detailed financial impact data.

### UI/UX Design
- Aesthetic: Dark charcoal/black background, cyan/teal primary, white text, aiming for a Bloomberg Terminal look.
- Investment amounts displayed in millions USD (e.g., $25M).

## External Dependencies

- **PostgreSQL**: Primary database for all application data.
- **OpenAPI Specification**: Used for defining API contracts and generating client code.
- **Recharts**: For data visualization and charting in the frontend.
- **Framer Motion**: For animations and interactive UI components.