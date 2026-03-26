# ESL Environmental Intelligence Platform

## Condensed Platform Summary — Panel Map, Data Flow & Decision Impact

---

## Executive Summary

The ESL platform is a capital deployment intelligence system for Caribbean environmental risk. It takes environmental data inputs, converts them into investment risk scores, and delivers three outputs that drive every capital decision:

1. **A decision signal** — PROCEED, CONDITION, or DECLINE
2. **A capital structure** — Loan, Grant, or Blended
3. **A financial cost** — what the risk costs in dollars, and what intervention saves

The platform serves corporate and commercial banks (JMMB, NCB, Sagicor, FirstCaribbean, Republic Bank), development finance institutions (CDB, IDB Invest, IFC), climate funds (GCF, GEF, CCRIF), institutional investors, and environmental regulators across 14 Caribbean markets.

Every panel in the platform either **feeds data into** or **is fed by** the risk engine and capital logic. This document maps each panel to its data source, its output, and how it impacts the capital decision.

---

## Platform Data Flow (High Level)

```
PROJECT INPUTS (address, type, env data)
       |
       v
  RISK ENGINE ──────────────────────────────────────┐
  (4 subscores → overall risk 0-100)                |
       |                                            |
       v                                            v
  DECISION SIGNAL              CAPITAL MODE ENGINE
  (PROCEED/CONDITION/DECLINE)  (Loan/Grant/Blended)
       |                              |
       v                              v
  FINANCIAL ENGINE             STRUCTURE ENGINE
  (rate, insurance, cost)      (covenants/phases/triggers)
       |                              |
       └──────────┬───────────────────┘
                  v
         CAPITAL DECISION SUMMARY
         (single-glance decision card)
                  |
                  v
         GOVERNANCE LIFECYCLE
         (covenants, ESAP, monitoring, audit)
```

---

## Page 1: Portfolio Command Center (`/`)

### Panel: Portfolio Decision Banner

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Portfolio Summary API — capital-weighted average risk across all projects |
| **Feeds** | Sets the top-level portfolio posture for the session |
| **Decision impact** | Determines whether the portfolio-level recommendation is PROCEED WITH PORTFOLIO (risk < 50), REBALANCE (50-65), or REDUCE EXPOSURE (> 65). This is the first thing a CIO or IC chair sees. |

### Panel: Summary Strip (4 metrics)

| Metric | Fed by | Decision impact |
|--------|--------|-----------------|
| Total Capital | Sum of all project investment amounts | Sets denominator for all capital-at-risk calculations |
| Weighted Risk | Capital-weighted average of all project risk scores | Drives the portfolio decision banner |
| Exposure at Risk | Sum of investment in projects with risk > 70 | Directly flags the dollar amount at elevated risk — triggers rebalancing discussions |
| Confidence Score | Average data confidence across portfolio | Low confidence (< 60%) signals the portfolio is making decisions on unreliable data |

### Panel: Risk vs. Confidence Scatter Matrix

| Attribute | Detail |
|-----------|--------|
| **Fed by** | All projects — each plotted by risk score (Y) vs. confidence (X), sized by investment |
| **Feeds** | Visual identification of problem quadrants |
| **Decision impact** | Projects in the top-left (high risk, low confidence) are the most dangerous — high risk AND we don't trust the data. These are the ones that need immediate attention. Bottom-right projects (low risk, high confidence) are safe to deploy. |

### Panel: Capital Allocation Pie Chart

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Project risk categories (Low < 40, Medium 40-70, High > 70) and their investment amounts |
| **Feeds** | Capital constraint analysis |
| **Decision impact** | If High-risk slice exceeds 25% of total capital, the portfolio is in breach of the capital constraint policy. Triggers forced rebalancing. |

### Panel: Data Confidence Index

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Confidence API — percentage of projects with lab data, monitoring data, IFC alignment |
| **Feeds** | Confidence penalty in financial calculations (+0.5% rate for confidence < 50%) |
| **Decision impact** | Identifies the specific data gaps degrading portfolio confidence. "Only 29% of projects have lab data" tells the team exactly what to fix. |

### Panel: Cross-Project Intelligence

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Intelligence API — automated pattern detection across all projects |
| **Feeds** | Portfolio optimization recommendations |
| **Decision impact** | Flags systemic risks that project-level analysis misses: geographic concentration (too much capital in one parish), sector clustering (overweight in ports), data quality gaps, climate vulnerability corridors. These drive portfolio rebalancing decisions. |

### Panel: Portfolio Governance Section

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Governance Summary API — aggregates covenants, ESAP, monitoring across all projects |
| **Feeds** | Breach alerts, compliance reporting |
| **Decision impact** | Covenant compliance below 80% signals institutional risk. Active breaches require immediate escalation. ESAP completion below 60% may block disbursements. |

### Panel: Capital Deployment Intelligence

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Portfolio Deployment API — runs capital mode logic on every project, aggregates results |
| **Feeds** | Portfolio-level capital structuring strategy |
| **Decision impact** | Shows the capital mix the portfolio actually needs (not what was planned). If 41% of capital requires grant structuring but the fund only has loan mandates, there's a structural mismatch. Deployment readiness shows how many projects can receive capital today vs. how many need prerequisites first. |

### Panel: ESL vs. Traditional Comparison

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Financial Comparison API — models outcomes with vs. without ESL intelligence |
| **Feeds** | ROI justification for the platform itself |
| **Decision impact** | Quantifies the value of the platform: "Without ESL, this portfolio costs $X more, misses Y issues, and has Z unpriced risks." This is the panel that justifies the platform to the board. |

### Panel: Asset Inventory Table

| Attribute | Detail |
|-----------|--------|
| **Fed by** | All projects with risk scores, confidence, decisions, investment amounts |
| **Feeds** | Project-level drill-down (click any row) |
| **Decision impact** | Sortable by any column. Sort by risk to find problems. Sort by investment to find big exposures. Sort by confidence to find data gaps. Color-coded decisions make it scannable in seconds. |

### Panel: Portfolio Optimization

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Optimization API — algorithmic recommendations based on risk, confidence, capital constraints |
| **Feeds** | Specific rebalancing actions |
| **Decision impact** | Gives named, actionable recommendations: "Reduce Montego Bay Port from $35M to $20M", "Add monitoring to Coastal Solar to unlock loan eligibility." These are the specific moves the IC should discuss. |

---

## Page 2: Project Intelligence View (`/project/:id`)

### Panel: Investment Decision Signal (Header Banner)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Risk engine — overall risk score and decision thresholds |
| **Feeds** | Every downstream panel — this is the master signal |
| **Decision impact** | PROCEED (< 40): standard due diligence. CONDITION (40-70): specific mitigations required before capital deployment. DECLINE (> 70): risk exceeds acceptable thresholds — either restructure or walk away. |

### Panel: Capital Decision Summary (Top of Overview)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Structure API (recommended mode, structure details), Impact API (delivery risk, efficiency), Financial API (rates, insurance, lifetime cost), project risk data (constraints, readiness) |
| **Feeds** | This is the terminal output — it is the decision itself |
| **Decision impact** | Answers four questions in one card: (1) What capital mode? Loan/Grant/Blended based on risk+confidence logic. (2) What structure? Mode-specific: covenant level for loans, disbursement phases for grants, split ratios for blended. (3) What does it cost? Rate adjustment, insurance uplift, lifetime cost for loans; delivery risk and efficiency for grants. (4) What must happen next? Numbered action items. Also shows deployment readiness, before/after savings, key constraints, and explainability. A CEO reads this card and knows the decision. |

### Panel: 7-Indicator Strip (Overview Tab)

| Indicator | Fed by | Decision impact |
|-----------|--------|-----------------|
| Capital Mode | Capital mode engine | Shows what mode the system recommends |
| Deployment Readiness | Risk + confidence + monitoring status | GREEN = deploy now, YELLOW = conditions first, RED = not ready |
| Confidence % | Data source flags (lab, monitoring, IFC) | Below 50% adds a rate penalty and pushes toward grant mode |
| ESAP % | ESAP items completion status | Below 60% may block disbursement |
| Monitoring | Has monitoring data flag | Required for READY status and confidence bonus |
| Last Event | Most recent monitoring event date | Stale monitoring (>90 days) signals degraded oversight |
| IFC | IFC alignment flag | Required for 100% confidence and full loan eligibility |

### Panel: Risk Topology Chart (Overview Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Risk engine — four subscores (Environmental, Infrastructure, Human Exposure, Regulatory) |
| **Feeds** | Identifies which risk dimension is driving the overall score |
| **Decision impact** | If Environmental Risk is 85 but Regulatory is 20, the intervention is environmental (monitoring, mitigation), not regulatory (permitting). This tells the team WHERE to focus. |

### Panel: Financial Translation (Overview Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Risk engine — translates risk scores into financial probability percentages |
| **Feeds** | Financial tab detail, covenant analysis |
| **Decision impact** | Converts abstract risk scores into language finance teams understand: "42% probability of 6-month delay", "28% probability of cost overrun", "65% probability of covenant trigger." These are the numbers that go into IC memos. |

### Panel: What-If Scenario Analysis (Risk Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Scenario API — re-runs risk engine with hypothetical changes (add monitoring, add lab data, achieve IFC alignment, reduce inputs) |
| **Feeds** | Capital Decision Summary constraints and next actions |
| **Decision impact** | Shows the before/after impact of each possible intervention. "If we add monitoring data, risk drops from 71 to 58 and the decision changes from DECLINE to CONDITION." This tells the team exactly which investment in data or mitigation unlocks the project. |

### Panel: Risk Monitoring Timeline (Risk Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Risk History API — 12 months of monthly risk and confidence snapshots |
| **Feeds** | Trend analysis |
| **Decision impact** | Rising risk trend triggers early warning. Improving confidence from new data confirms that investment in monitoring is working. A flat line with no improvement after 6 months signals the project is stuck. |

### Panel: Loan Pricing (Financial Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Financial API — base rate 8% + risk premium (0-1.5%) + confidence penalty (0-0.5%) |
| **Feeds** | Lifetime cost calculation, before/after comparison |
| **Decision impact** | A project at 9.5% vs. 8% is paying $1.5M more per $100M over 10 years just in risk premium. This quantifies the cost of inaction on environmental risk. |

### Panel: Insurance Impact (Financial Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Financial API — base 1% of value, multiplied by coastal/flood/risk factors |
| **Feeds** | Lifetime cost calculation |
| **Decision impact** | Insurance uplift directly reduces project returns. A 60% insurance increase on a $35M project is $210K/year additional cost. For coastal projects, this can make the economics unviable. |

### Panel: Capital Constraint (Financial Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Portfolio allocation data — high-risk capital as % of total |
| **Feeds** | Portfolio optimization, compliance |
| **Decision impact** | If high-risk allocation exceeds 25%, the portfolio is in policy breach. New high-risk projects cannot be added until exposure is reduced. This is a hard gate. |

### Panel: Impact Delivery Risk (Impact Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Impact API — counts risk drivers (flood, coastal, contamination, regulatory, low confidence) |
| **Feeds** | Grant structuring, disbursement risk |
| **Decision impact** | HIGH delivery risk means the project's environmental or social impacts may not be achieved as planned. For grant-funded projects, this is the primary concern — the funder needs to know if the money will deliver results. |

### Panel: Impact Efficiency Score (Impact Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Impact API — base 85 minus penalties for risk, confidence, and regulatory factors |
| **Feeds** | Grant evaluation, climate fund reporting |
| **Decision impact** | Below 60% efficiency, the project is a poor use of grant capital. Climate funds (GCF, GEF) use efficiency metrics to rank competing proposals. This score determines whether the project is competitive for concessional funding. |

### Panel: Structure View (Structure Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Structure API — mode-specific structuring (loan covenants, grant phases, blended triggers) |
| **Feeds** | Capital Decision Summary recommended structure |
| **Decision impact** | For Loans: shows the specific covenants and conditions precedent that must be in the term sheet. For Grants: shows the three disbursement phases and what conditions gate each release. For Blended: shows the grant-first de-risking strategy, what triggers transition to commercial lending, and the specific milestones required. This is the panel that legal and structuring teams use to draft documents. |

### Panel: Monitoring Events (Monitoring Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Monitoring API — event log with type, result, findings, capital tags |
| **Feeds** | Confidence score (has monitoring → +20%), deployment readiness, covenant compliance |
| **Decision impact** | Each monitoring event is tagged with its capital implication. "Required for grant release" means a disbursement is blocked until this event clears. "Required for loan covenant" means a covenant condition depends on this result. Disbursement officers use this tab to decide whether to release funds. |

### Panel: Audit Trail (Audit Tab)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Audit Log API — chronological record of every governance action |
| **Feeds** | Compliance reporting, institutional memory |
| **Decision impact** | Provides the complete evidentiary chain for any decision. When a regulator or auditor asks "why was this covenant marked as met?", the audit trail shows who did it, when, and what the details were. |

---

## Page 3: Authority Index (`/authority`)

### Panel: Caribbean Environmental Risk Index (CERI)

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Regional API — weighted composite across 14 Caribbean markets |
| **Feeds** | Country-level risk comparison, portfolio geographic diversification analysis |
| **Decision impact** | A rising CERI signals increasing systemic risk across the region. Banks and funds use this to adjust their Caribbean allocation limits. |

### Panel: Data Moat — Defensibility Signal

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Regional API — aggregated platform data volumes (projects, samples, monitoring points, countries, data points) |
| **Feeds** | Platform value proposition |
| **Decision impact** | This is not a decision panel — it is a competitive moat indicator. "127 projects analyzed, 4,500 lab samples, 585 monitoring points across 14 countries" tells investors and clients that no one else has this data density. |

### Panel: Country Risk Index

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Regional Indices API — per-country composite risk scores with trend data |
| **Feeds** | Country-level allocation decisions, portfolio geographic diversification |
| **Decision impact** | Banks set country exposure limits. If Haiti's risk index is 78 and rising, a bank might cap Haiti exposure at 10% of Caribbean portfolio. This panel provides the data for those limit-setting conversations. |

### Panel: Sector Benchmarking

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Regional Benchmarks API — sector-by-sector risk comparison across the Caribbean |
| **Feeds** | Sector allocation decisions |
| **Decision impact** | If port projects average 65 risk regionally but solar averages 35, the portfolio should tilt toward solar. Sector benchmarks tell teams which sectors are structurally riskier in the Caribbean context. |

---

## Page 4: Portfolio Manager (`/portfolios`)

### Panel: Portfolio Table

| Attribute | Detail |
|-----------|--------|
| **Fed by** | Portfolio API — project assignments with stage, investment, risk, confidence, decision |
| **Feeds** | Portfolio summary metrics, stage-based pipeline tracking |
| **Decision impact** | Stage tracking (Early → Pre-IC → Approved → Post-Close) is the pipeline. Moving a project from Early to Pre-IC signals it is ready for Investment Committee review. The weighted risk, total capital, and project count in the portfolio header tell the portfolio manager whether the overall book is healthy. |

---

## Decision Flow Summary

```
Environmental Data  →  4 Risk Subscores  →  Overall Risk (0-100)
                                               |
                                   ┌───────────┼───────────┐
                                   v           v           v
                               PROCEED     CONDITION    DECLINE
                              (risk<40)   (risk 40-70)  (risk>70)
                                   |           |           |
                                   v           v           v
                           ┌───────────────────────────────────┐
                           │     CAPITAL MODE ENGINE           │
                           │  Risk>70 + Conf<50 → Grant       │
                           │  Risk>60 OR Conf<60 → Blended    │
                           │  Otherwise → Loan                │
                           └───────────────────────────────────┘
                                          |
                           ┌──────────────┼──────────────┐
                           v              v              v
                         LOAN          BLENDED         GRANT
                      covenants     grant+loan       phased
                      rate adj      split ratio    disbursement
                      insurance     triggers        conditions
                           |              |              |
                           └──────────────┼──────────────┘
                                          v
                              CAPITAL DECISION SUMMARY
                              ┌─────────────────────┐
                              │ What mode?           │
                              │ What structure?      │
                              │ What cost?           │
                              │ What next?           │
                              └─────────────────────┘
                                          |
                                          v
                              GOVERNANCE LIFECYCLE
                              (covenants → ESAP → monitoring → audit)
```

---

*Document Version: 1.0*
*Platform: ESL Environmental Intelligence Platform*
*Last Updated: March 2026*
