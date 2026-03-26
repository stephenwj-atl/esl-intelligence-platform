# ESL Environmental Intelligence Platform

## Complete Platform Guide, User Manual & Demo Script

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Navigation & Layout](#3-navigation--layout)
4. [Portfolio Command Center (Dashboard)](#4-portfolio-command-center)
5. [Project Intelligence View](#5-project-intelligence-view)
6. [Capital Deployment Intelligence](#6-capital-deployment-intelligence)
7. [Authority Index (Regional Intelligence)](#7-authority-index)
8. [Portfolio Manager](#8-portfolio-manager)
9. [New Analysis (Project Creation)](#9-new-analysis)
10. [Risk Scoring Methodology](#10-risk-scoring-methodology)
11. [Financial Calculation Logic](#11-financial-calculation-logic)
12. [Capital Mode Engine](#12-capital-mode-engine)
13. [Governance Framework](#13-governance-framework)
14. [API Reference](#14-api-reference)
15. [Database Schema](#15-database-schema)
16. [Demo Script](#16-demo-script)
17. [Sample Portfolio Data](#17-sample-portfolio-data)

---

## 1. Executive Summary

The ESL Environmental Intelligence Platform is a Bloomberg Terminal-style decision intelligence system for environmental risk in Caribbean development finance. It converts raw environmental data into:

- **Investment decision signals** (PROCEED / CONDITION / DECLINE)
- **Capital structuring recommendations** (Loan / Grant / Blended)
- **Financial impact quantification** (rate adjustments, insurance uplift, lifetime cost)
- **Deployment readiness assessments** (READY / CONDITIONALLY READY / NOT READY)
- **Institutional governance lifecycle management** (covenants, ESAP, monitoring, audit trails)

The platform serves development banks, climate funds, institutional investors, and environmental regulators across the Caribbean region.

**What this system answers at a glance:**

- What should we do with this capital?
- What structure is required?
- What are the financial consequences?
- What must happen next?

---

## 2. Platform Overview

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS + Recharts + Framer Motion |
| Backend | Express 5 (TypeScript) |
| Database | PostgreSQL + Drizzle ORM |
| Validation | Zod |
| Routing | wouter |
| State | React Query + React Context |
| Monorepo | pnpm workspaces |

### Design Language

- Dark charcoal/black background
- Cyan/teal primary accent color
- White text with muted secondary text
- Institutional Bloomberg Terminal aesthetic
- Monospace fonts for data values
- Investment amounts in millions USD (e.g., $25M)

---

## 3. Navigation & Layout

### Global Header

Every page displays a persistent header containing:

- **ESL Intelligence** logo and brand (top-left)
- **Capital Mode Switch** — three-segment control: LOAN | GRANT | BLENDED (center)
- **Portfolio name** — displays the active portfolio (e.g., "Caribbean Energy Fund")
- **System status** indicator (e.g., "System Nominal")
- **User avatar** (top-right)

### Sidebar Navigation

| Menu Item | Route | Description |
|-----------|-------|-------------|
| Command Center | `/` | Portfolio-level dashboard |
| Authority Index | `/authority` | Regional intelligence across Caribbean markets |
| Portfolios | `/portfolios` | Portfolio management interface |
| New Analysis | `/new` | Create a new project assessment |

---

## 4. Portfolio Command Center

**Route:** `/` (Dashboard)

The Command Center is the primary landing page — a portfolio-level intelligence dashboard that aggregates risk, financial, governance, and capital deployment data across all projects.

### 4.1 Role Selector

A dropdown in the header allows switching between three user perspectives:

- **Analyst** — full data access, detailed risk views
- **Investment Officer** — decision-focused, capital allocation view
- **Admin** — governance and compliance focus

### 4.2 Portfolio Decision Banner

The top banner provides an immediate portfolio-level decision signal:

| Decision | Condition | Color |
|----------|-----------|-------|
| PROCEED WITH PORTFOLIO | Weighted risk < 50 | Green |
| REBALANCE | Risk 50-65 | Yellow |
| REDUCE EXPOSURE | Risk > 65 | Red |

Displays: narrative explanation, weighted risk score, high-risk capital percentage.

### 4.3 Summary Strip

Four key portfolio metrics displayed in a horizontal strip:

- **Total Capital** — sum of all project investment amounts
- **Weighted Risk** — capital-weighted average risk score
- **Exposure at Risk** — capital in high-risk projects (>70 risk)
- **Confidence Score** — average data confidence across portfolio

### 4.4 Visualizations

- **Risk vs. Confidence Scatter Matrix** — plots every project by risk (Y-axis) vs. confidence (X-axis), color-coded by risk tier, sized by investment amount
- **Capital Allocation Pie Chart** — portfolio capital split by risk category (Low/Medium/High)
- **Risk Distribution Histogram** — bar chart of projects across risk ranges
- **Data Confidence Index** — progress bars for Lab Data, Monitoring, and IFC Alignment percentages

### 4.5 Cross-Project Intelligence

Automated pattern detection across the portfolio, including:

- Geographic Concentration risk
- Sector Risk clustering
- Data Quality Gaps
- Validation Deficits
- Climate Vulnerability patterns

### 4.6 Portfolio Governance Section

- **ESAP Completion %** — percentage of environmental/social action plan items completed
- **Covenant Compliance %** — percentage of covenants met
- **Active Breaches** — count of current covenant breaches
- **Monitoring Events** — total monitoring events recorded
- **Breach & Escalation Alerts** — list of active breaches with severity

### 4.7 Capital Deployment Intelligence Panel

Added in V5.5, this panel aggregates capital structuring data across the portfolio:

- **Capital Mix** — breakdown of Loan/Grant/Blended project counts and capital percentages with a stacked bar
- **Deployment Readiness** — Ready/Conditional/Not Ready project counts with a segmented bar
- **Capital Efficiency** — percentage of capital at risk, total dollar exposure, key risk drivers
- **Structuring Insights** — auto-generated text insights (e.g., "2 projects require grant-first structuring", "3 projects viable for direct lending")

### 4.8 Financial Intelligence Panels

- **Portfolio Risk Cost** — total additional financing cost, insurance uplift, and combined risk cost
- **ESL vs. Traditional Comparison** — side-by-side: total cost without ESL intelligence vs. with ESL, showing savings, ROI multiple, and specific issues avoided
- **Asset Inventory Table** — sortable table of all projects with risk score, confidence, decision signal, and investment amount
- **Portfolio Optimization** — expandable panel with specific rebalancing recommendations

---

## 5. Project Intelligence View

**Route:** `/project/:id`

Each project has a deep intelligence view organized into 8 tabs. The page header shows:

- Project name, type badge, country, and investment amount
- **Investment Decision Signal** — large PROCEED / CONDITION / DECLINE banner with risk score and confidence
- **Breach / Escalation Alert** — red alert banner if active breaches detected

### 5.1 Capital Decision Summary

At the top of the Overview tab sits the **Capital Decision Summary** — a single-glance decision card that answers four questions:

1. **What should we do?** — Core Decision: the system-recommended capital mode (Loan, Grant, or Blended) based on the risk engine, not the user-selected mode
2. **What structure is required?** — Mode-specific recommendation:
   - *Loan:* covenant level, conditions precedent count, monitoring requirement
   - *Grant:* phased disbursement, validation gates, phase completion status
   - *Blended:* grant percentage, loan triggers, transition milestones
3. **What happens financially?** — Mode-specific financial/impact consequence:
   - *Loan:* rate adjustment, insurance uplift, lifetime cost
   - *Grant:* delivery risk level, impact efficiency %, disbursement risk
   - *Blended:* grant de-risk %, loan viability, projected savings
4. **What must happen next?** — Numbered action items derived from the recommended mode's requirements

Additional elements:
- **Deployment Status Badge** — READY (green) / CONDITIONALLY READY (yellow) / NOT READY (red)
- **Before/After Comparison** — inline panel showing rate and premium with vs. without intervention, plus total projected savings
- **Key Constraints** — auto-generated constraint list (confidence gaps, monitoring gaps, concentration breaches)
- **Decision Explainability** — expandable "Why this decision?" section showing underlying risk drivers and narrative explanation of the recommendation logic

### 5.2 Overview Tab

Below the Capital Decision Summary:

- **7-Indicator Strip** — Capital Mode, Deployment Readiness, Confidence %, ESAP Progress %, Monitoring Status, Last Monitoring Event date, IFC Alignment
- **Risk Topology Chart** — bar chart of four risk subscores (Environmental, Infrastructure, Human Exposure, Regulatory)
- **Financial Translation Panel** — translates risk into financial terms: Delay Risk %, Cost Overrun %, Covenant Trigger %, Reputational Risk %

### 5.3 Risk Tab

- **What-If Scenario Analysis** — toggle cards for hypothetical changes (add monitoring, add lab data, IFC alignment, reduce risk inputs)
- Each toggle shows before/after comparison of risk score with green/red delta indicators
- **Risk Monitoring Timeline** — 12-month historical chart of risk score and confidence trends

### 5.4 Financial Tab

- **Loan Pricing** — base rate + risk premium + confidence penalty = final rate
- **Insurance Impact** — base premium, adjusted premium, multiplier, and contributing factors
- **Covenant Requirements** — level (LOW/MEDIUM/HIGH) with specific requirements listed
- **Capital Constraint** — high-risk allocation vs. policy limit, breach indicator
- **Lifetime Cost** — total additional financing cost + insurance uplift over loan term

### 5.5 Impact Tab

Mode-aware impact assessment (responds to global capital mode switch):

- **Impact Delivery Risk** — HIGH/MEDIUM/LOW with driver list (flood exposure, coastal vulnerability, etc.)
- **Impact Efficiency Score** — 0-100 score with progress bar and adjustment factors
- **Monitoring Intensity** — STANDARD/ELEVATED/HIGH with specific monitoring requirements
- **Disbursement Risk** — LOW/MODERATE/ELEVATED with contributing factors

### 5.6 Structure Tab

Capital structuring view that switches display based on global capital mode:

**Loan Mode:**
- Risk-adjusted rate, loan viability indicator, covenant level
- Conditions precedent (numbered list)
- Covenant requirements with "Required for loan covenant" badges
- Risk mitigation requirements (if any)

**Grant Mode:**
- Grant requirement status (REQUIRED/OPTIONAL), phase completion progress
- Grant purpose statement
- Disbursement Phases — three-phase structure:
  - Phase 1: Baseline Validation (30% allocation)
  - Phase 2: Monitoring Infrastructure (40% allocation)
  - Phase 3: Performance Verification (30% allocation)
- Each phase shows conditions with "Required for grant release" badges

**Blended Mode:**
- Grant Required indicator, grant/loan percentage split, loan viability
- Grant purpose statement
- Loan Activation Triggers — what must happen before commercial capital
- Transition Milestones — ESAP completion, monitoring trends, independent assessment
- Blended Finance Logic — visual flow diagram: Grant Phase (de-risk) -> Loan Phase (deploy)

### 5.7 Monitoring Tab

- Table of monitoring events with columns: Date, Type, Result, Status, Findings, Capital Tags
- Capital Tags column shows mode-relevant tags: "Required for grant release", "Required for loan covenant", "Grant disbursement hold"

### 5.8 Audit Trail Tab

- Chronological log of all governance actions for the project
- Shows: action, user, details, timestamp

### 5.9 Report Tab

- Generates an institutional-format report for the project
- Downloadable assessment summary

---

## 6. Capital Deployment Intelligence

### Capital Mode Switch

The three-segment control in the global header (LOAN | GRANT | BLENDED) controls the platform's view lens. It is available on every page.

- **Loan** — traditional lending view: rate adjustments, covenants, conditions precedent
- **Grant** — grant/climate fund view: disbursement phases, impact risk, delivery efficiency
- **Blended** — hybrid view: grant-first de-risking, loan triggers, transition milestones

### System-Recommended Mode

The system independently calculates a recommended capital mode for each project based on:

| Condition | Recommended Mode |
|-----------|-----------------|
| Risk > 70 AND Confidence < 50 | **Grant** |
| Risk > 60 OR Confidence < 60 | **Blended** |
| Otherwise | **Loan** |

The Capital Decision Summary always shows the system recommendation, regardless of the user-selected mode.

### Deployment Readiness

Each project receives a deployment readiness assessment:

| Status | Condition |
|--------|-----------|
| **READY** | Risk < 70 AND Confidence >= 50 AND has monitoring data |
| **CONDITIONALLY READY** | Risk < 70 OR Confidence >= 50 |
| **NOT READY** | Risk >= 70 AND Confidence < 50 AND no monitoring |

---

## 7. Authority Index

**Route:** `/authority`

The Authority Index is a regional intelligence dashboard spanning 14 Caribbean markets.

### 7.1 Caribbean Environmental Risk Index (CERI)

- Composite weighted risk score across all Caribbean markets
- Average confidence percentage
- Country count and active project count

### 7.2 Data Moat — Defensibility Signal

Quantifies the platform's proprietary data advantage:

- Projects Analyzed (127)
- Lab Samples (4,500)
- Monitoring Points (585)
- Countries Covered (14)
- Data Points (285)

### 7.3 Country Risk Index

- Horizontal bar chart ranking all 14 Caribbean countries by composite environmental risk
- Expandable country detail with 12-month trend charts
- Countries include: Jamaica, Trinidad & Tobago, Barbados, Bahamas, Haiti, Suriname, Dominican Republic, Guyana, Belize, Antigua, St. Lucia, Grenada, St. Vincent, Dominica

### 7.4 Data Coverage

- Breakdown of data confidence levels across the region: High, Medium, Low confidence percentages

### 7.5 Sector Benchmarking

- Sector-by-sector risk comparison with trend indicators
- Covers: Solar, Port, Hotel, Industrial, Agriculture, Infrastructure

### 7.6 Intelligence Insights

- Auto-generated regional insights and pattern alerts
- Categorized by type: Warning, Opportunity, Trend, Gap

---

## 8. Portfolio Manager

**Route:** `/portfolios`

### 8.1 Portfolio Management

- **Create Portfolio** — "New Portfolio" button to create named portfolio groupings
- **Delete Portfolio** — remove portfolio (with confirmation)
- **Portfolio Header** — shows name, project count, total capital, weighted risk

### 8.2 Project Assignment Table

Each portfolio displays its assigned projects in a table:

| Column | Description |
|--------|-------------|
| Project | Project name with risk-color indicator bar |
| Type | Project type badge (Solar, Port, Hotel, etc.) |
| Stage | Pipeline stage: Early, Pre-IC, Approved, Post-Close |
| Investment | Investment amount in millions |
| Risk Score | Color-coded risk score |
| Confidence | Data confidence percentage |
| Decision | PROCEED / CONDITION / DECLINE badge |

- **Add Project** button — assign existing projects to portfolio
- Click any project row to navigate to its detail view

---

## 9. New Analysis

**Route:** `/new`

Create a new project assessment by entering:

### Input Fields

| Field | Type | Description |
|-------|------|-------------|
| Project Name | Text | Name of the development project |
| Country | Select | Caribbean country location |
| Project Type | Select | Solar, Port, Hotel, Industrial, Agriculture |
| Investment Amount | Number | Investment size in millions USD |
| Flood Risk | Slider (0-10) | Flood exposure rating |
| Coastal Exposure | Slider (0-10) | Coastal vulnerability rating |
| Water Stress | Slider (0-10) | Water scarcity/quality rating |
| Contamination Risk | Slider (0-10) | Soil/water contamination rating |
| Regulatory Complexity | Slider (0-10) | Regulatory burden rating |
| Has Lab Data | Toggle | Whether lab validation data exists |
| Has Monitoring Data | Toggle | Whether environmental monitoring is deployed |
| Is IFC Aligned | Toggle | Whether project meets IFC Performance Standards |

On submission, the risk engine automatically computes all scores, generates the decision signal, and creates the project with full financial analysis.

---

## 10. Risk Scoring Methodology

### Risk Subscores (0-100 each)

| Subscore | Inputs | Weight |
|----------|--------|--------|
| Environmental Risk | Flood risk, coastal exposure, contamination risk | Primary |
| Infrastructure Risk | Water stress, contamination risk | Secondary |
| Human Exposure Risk | Water stress, regulatory complexity | Secondary |
| Regulatory Risk | Regulatory complexity, coastal exposure | Secondary |

### Overall Risk (0-100)

Weighted composite of all four subscores with uncertainty penalties applied when data confidence is low.

### Decision Thresholds

| Risk Range | Decision | Meaning |
|------------|----------|---------|
| 0 - 39 | **PROCEED** | Risk profile supports standard due diligence |
| 40 - 70 | **CONDITION** | Requires specific mitigation measures |
| 71 - 100 | **DECLINE** | Risk exceeds acceptable thresholds |

### Data Confidence (0-100%)

Base confidence starts at 40% and increases:

| Data Source | Confidence Bonus |
|-------------|-----------------|
| Lab Data available | +20% |
| Monitoring Data available | +20% |
| IFC Aligned | +20% |

Maximum confidence: 100% (all three sources present).

---

## 11. Financial Calculation Logic

### Loan Pricing

| Component | Calculation |
|-----------|-------------|
| Base Rate | 8.0% |
| Risk Premium (40-60 risk) | +0.5% |
| Risk Premium (60-75 risk) | +1.0% |
| Risk Premium (>75 risk) | +1.5% |
| Confidence Penalty (<50%) | +0.5% |
| **Final Rate** | Base + Risk Premium + Confidence Penalty |

### Insurance Premium

| Component | Calculation |
|-----------|-------------|
| Base Premium | 1% of project value |
| Coastal Exposure > 7 | +25% multiplier |
| Flood Risk > 7 | +20% multiplier |
| Overall Risk > 70 | +15% multiplier |

### Covenant Level

| Level | Condition |
|-------|-----------|
| HIGH | Risk > 70 AND Confidence < 60 |
| MEDIUM | Risk >= 50 |
| LOW | Otherwise |

### Capital Constraint

- Policy limit: 25% maximum allocation to high-risk projects
- Breach triggered when high-risk capital exceeds 25% of total portfolio

### Lifetime Cost

Total additional financing cost (rate adjustment x project value x 10-year term) + insurance uplift (premium increase x 10 years).

---

## 12. Capital Mode Engine

### Impact Intelligence (V5.5)

**Impact Delivery Risk:**
- HIGH: 3+ risk drivers identified (flood, coastal, contamination, regulatory, low confidence)
- MEDIUM: 1-2 risk drivers
- LOW: No significant drivers

**Impact Efficiency Score (0-100):**
- Base: 85
- Penalties: Risk > 70 (-20), Risk > 50 (-10), Confidence < 50 (-15), Confidence < 70 (-8), Regulatory > 7 (-5)

**Monitoring Intensity:**
- HIGH: Risk > 70 OR Confidence < 50
- ELEVATED: Risk > 50 OR Confidence < 70
- STANDARD: Otherwise

**Disbursement Risk:**
- ELEVATED: Risk > 70 AND Confidence < 60
- MODERATE: Risk > 60 OR Confidence < 50
- LOW: Otherwise

### Grant Structuring

Three-phase disbursement model:

| Phase | Name | Allocation | Gate |
|-------|------|------------|------|
| 1 | Baseline Validation | 30% | Lab data validated |
| 2 | Monitoring Infrastructure | 40% | Monitoring system installed |
| 3 | Performance Verification | 30% | IFC alignment confirmed |

### Blended Finance

| Component | Logic |
|-----------|-------|
| Grant % | Risk > 70: 40%, Risk > 50: 25%, Otherwise: 15% |
| Loan Viability | Risk > 75: NOT VIABLE, Risk > 60: CONDITIONAL, Otherwise: VIABLE |
| Triggers | Risk threshold, monitoring establishment, confidence threshold |

---

## 13. Governance Framework

### Framework Alignment

Tracks compliance with international environmental frameworks:

- IFC Performance Standards
- Equator Principles
- TCFD Recommendations
- EU Taxonomy

Each framework alignment records: standard, compliance status, gap description, and severity level.

### Covenants

Investment covenant tracking with statuses: Pending, In Progress, Met, Breach.

Categories include environmental monitoring, reporting, mitigation, and compliance covenants.

### ESAP (Environmental & Social Action Plan)

Action item tracking with statuses: Not Started, In Progress, Complete, Overdue.

Each item records: action description, responsible party, deadline, evidence documentation.

### Monitoring Events

Structured monitoring event log with:

- Event types: Site Visit, Lab Result, Sensor Reading, Compliance Check, Incident
- Results: Normal, Warning, Critical, Breach
- Findings narrative
- Capital Tags: "Required for grant release", "Required for loan covenant", "Grant disbursement hold"

### Audit Trail

Complete chronological log of all governance actions across the system. Every covenant update, ESAP change, monitoring event, and status transition is recorded with user attribution and timestamps.

---

## 14. API Reference

### Core Project APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/healthz` | Health check |
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project with risk analysis |
| GET | `/api/projects/:id` | Get project detail |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/scenario` | What-if scenario analysis |
| GET | `/api/projects/:id/risk-history` | 12-month risk history |

### Portfolio APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/portfolio/summary` | Portfolio-level metrics |
| GET | `/api/portfolio/optimize` | Optimization recommendations |
| GET | `/api/portfolio/intelligence` | Cross-project patterns |
| GET | `/api/portfolio/confidence` | Data confidence index |
| GET | `/api/portfolio/decision` | Portfolio decision signal |
| GET | `/api/portfolios` | List portfolios |
| POST | `/api/portfolios` | Create portfolio |
| GET | `/api/portfolios/:id` | Get portfolio with projects |
| DELETE | `/api/portfolios/:id` | Delete portfolio |
| POST | `/api/portfolios/:id/projects` | Add project to portfolio |
| DELETE | `/api/portfolios/:id/projects/:projectId` | Remove project |

### Governance APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/:id/framework-alignment` | Framework alignment records |
| GET | `/api/projects/:id/covenants` | Project covenants |
| PATCH | `/api/covenants/:id` | Update covenant status |
| GET | `/api/projects/:id/esap` | ESAP action items |
| PATCH | `/api/esap/:id` | Update ESAP item |
| POST | `/api/projects/:id/monitoring` | Add monitoring event |
| GET | `/api/projects/:id/monitoring` | Get monitoring events |
| GET | `/api/projects/:id/audit-log` | Project audit log |
| GET | `/api/audit-log` | Global audit log |
| GET | `/api/governance/summary` | Portfolio governance KPIs |
| GET | `/api/projects/:id/report` | Generate institutional report |

### Regional/Authority APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/regional/data` | Regional dataset query |
| GET | `/api/regional/indices` | Caribbean Risk Index (all) |
| GET | `/api/regional/indices/:country` | Single country trend |
| GET | `/api/regional/benchmarks/sector` | Sector benchmarking |
| GET | `/api/regional/benchmarks/project/:id` | Project vs. region |
| GET | `/api/regional/benchmarks/portfolio` | Portfolio vs. baseline |
| GET | `/api/regional/confidence` | Regional data coverage |
| GET | `/api/regional/insights` | Intelligence insights |
| GET | `/api/regional/authority-summary` | Authority dashboard data |

### Financial/Capital APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/financial/project/:id` | Project financial impact |
| GET | `/api/financial/portfolio` | Portfolio financial aggregation |
| GET | `/api/financial/comparison` | ESL vs. Traditional comparison |
| GET | `/api/financial/scenario/:id` | Mitigation scenario |
| GET | `/api/financial/project/:id/structure` | Capital structure |
| GET | `/api/financial/project/:id/impact` | Impact assessment |
| GET | `/api/financial/portfolio/deployment` | Portfolio deployment data |

---

## 15. Database Schema

| Table | Purpose |
|-------|---------|
| `projects` | Project inputs, computed risk scores, financial risks, decisions |
| `portfolios` | Named portfolio groupings |
| `portfolio_projects` | Project-to-portfolio assignments with stage and investment |
| `risk_history` | Monthly risk/confidence snapshots (12-month timeline) |
| `covenants` | Investment covenant tracking per project |
| `esap_items` | ESAP action items per project |
| `monitoring_events` | Monitoring event log per project |
| `audit_logs` | Governance audit trail |
| `framework_alignments` | Framework alignment records per project |
| `financial_impacts` | Cached financial impact calculations |

---

## 16. Demo Script

### Demo Setup

The platform comes pre-loaded with a sample portfolio: **Caribbean Energy Fund** containing 7 projects totaling $130M across Jamaica.

### Scene 1: Portfolio Command Center (2 minutes)

1. **Open the platform** — the Command Center loads immediately
2. **Point to the Portfolio Decision Banner** — "The system is recommending REDUCE EXPOSURE because weighted risk is 55.9 with 41% of capital in high-risk tier"
3. **Scan the Summary Strip** — "$130M total capital, 55.9 weighted risk, $53M at risk, 67.1% average confidence"
4. **Highlight the Scatter Matrix** — "Each bubble is a project. X-axis is confidence, Y-axis is risk. Green bubbles bottom-right are safe. Red bubbles top-left need attention"
5. **Scroll to Capital Deployment Intelligence** — "The system automatically categorizes: 59% of capital is loan-eligible, 41% requires grant structuring. 4 projects are deployment-ready, 2 are not"
6. **Show the Capital Efficiency panel** — "41% of capital is at risk due to low data confidence and high environmental uncertainty"

### Scene 2: The Good Project — Kingston Solar Farm (2 minutes)

1. **Click Kingston Solar Farm** from the asset table (or navigate to `/project/1`)
2. **Point to the Decision Signal** — "PROCEED with a 25.6 risk score and 100% confidence — this is a clean project"
3. **Read the Capital Decision Summary** — "System recommends Loan Mode, READY for deployment, $0 additional cost, no constraints. Next actions: proceed with standard due diligence"
4. **Click the Risk tab** — "All four risk subscores are low. The What-If toggles show minimal improvement because the project is already clean"
5. **Click the Financial tab** — "No rate adjustment needed, no insurance uplift. This project passes straight through"

### Scene 3: The Problem Project — Coastal Solar Phase II (2 minutes)

1. **Navigate to `/project/4`** (or click from portfolio)
2. **Point to the Decision Signal** — "DECLINE with a 71.0 risk score and only 40% confidence — this is a high-risk project with bad data"
3. **Read the Capital Decision Summary** — "System recommends Grant mode, NOT READY for deployment. Key constraints: data confidence below threshold, high environmental exposure, elevated monitoring required"
4. **Point to the Next Actions** — "The system tells us exactly what must happen: baseline data validation, independent environmental assessment, coastal resilience plan, and monitoring installation"
5. **Click 'Why this decision?'** — "The explainability section shows the specific risk drivers: flood exposure 8/10, coastal vulnerability 7/10, low data confidence. This drives the grant-first recommendation"
6. **Click the Before/After panel** — "If we intervene, rate drops from 9.5% to 8.5%, premium drops, saving $1.6M over the loan term"

### Scene 4: Capital Mode Switching (1 minute)

1. **Stay on Coastal Solar Phase II**
2. **Click GRANT in the header** — "Switching to Grant mode"
3. **Click the Impact tab** — "Now we see the grant-specific view: Impact Delivery Risk is HIGH, Impact Efficiency is 50%, Monitoring Intensity is HIGH, Disbursement Risk is ELEVATED"
4. **Click the Structure tab** — "Three disbursement phases: Baseline Validation (30%), Monitoring Infrastructure (40%), Performance Verification (30%). Each phase has specific conditions that must be met before funds release"
5. **Click BLENDED** — "Now the Structure tab shows a blended view: 40% grant to de-risk, then loan is conditional. The system shows specific loan activation triggers"

### Scene 5: Governance in Action (1 minute)

1. **Click the Monitoring tab** — "Every monitoring event is tagged with capital implications. 'Required for grant release' tells disbursement officers which events gate funding"
2. **Click the Audit Trail tab** — "Complete audit log of every governance action. This is the institutional memory"

### Scene 6: Authority Index (1 minute)

1. **Navigate to Authority Index** (sidebar)
2. **Point to the CERI** — "Caribbean Environmental Risk Index: 56.3 across 14 markets with 67.1% average confidence"
3. **Show the Data Moat** — "127 projects analyzed, 4,500 lab samples, 585 monitoring points across 14 countries. This is our defensibility signal — no one else has this data"
4. **Scroll to Country Risk Index** — "Haiti and Suriname are highest risk. Click any country to see the 12-month trend"

### Scene 7: The Close (30 seconds)

"This system does not just assess risk. It tells you:

- **What capital structure to use** — loan, grant, or blended
- **Whether you're ready to deploy** — with specific prerequisites
- **What it costs if you get it wrong** — and how much you save with intervention
- **What must happen next** — numbered action items, not analysis paralysis

This is a capital deployment intelligence system. It is relevant to every loan, every grant, every blended finance structure, every climate fund, and every development bank operating in the Caribbean."

---

## 17. Sample Portfolio Data

### Caribbean Energy Fund — 7 Projects, $130M Total

| # | Project | Type | Country | Investment | Risk | Confidence | Decision | Recommended Mode |
|---|---------|------|---------|------------|------|------------|----------|-----------------|
| 1 | Kingston Solar Farm | Solar | Jamaica | $25M | 25.6 | 100% | PROCEED | Loan |
| 2 | Montego Bay Port Expansion | Port | Jamaica | $35M | 76.9 | 40% | DECLINE | Grant |
| 3 | Ocho Rios Resort Development | Hotel | Jamaica | $18M | 55.9 | 60% | CONDITION | Blended |
| 4 | Coastal Solar Phase II | Solar | Jamaica | $18M | 71.0 | 40% | DECLINE | Grant |
| 5 | Spanish Town Industrial Park | Industrial | Jamaica | $12M | 51.2 | 80% | CONDITION | Loan |
| 6 | Negril Agricultural Hub | Agriculture | Jamaica | $8M | 36.7 | 100% | PROCEED | Loan |
| 7 | Port Antonio Marina | Port | Jamaica | $14M | 50.6 | 60% | CONDITION | Blended |

### Portfolio Pipeline Stages

| Stage | Projects |
|-------|----------|
| Approved | Kingston Solar Farm |
| Pre-IC | Montego Bay Port Expansion, Spanish Town Industrial Park |
| Early | Ocho Rios Resort, Coastal Solar Phase II, Negril Agricultural Hub, Port Antonio Marina |

---

*Document Version: V5.5 — Capital Deployment Intelligence*
*Platform: ESL Environmental Intelligence Platform*
*Last Updated: March 2026*
