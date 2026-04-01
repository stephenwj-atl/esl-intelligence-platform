# ESL Intelligence Platform
## Environmental Decision Intelligence for Caribbean Development Finance

---

# 1. What We Do

Environmental Solutions Limited (ESL) operates the Caribbean's first environmental decision intelligence platform purpose-built for development finance. The ESL Intelligence Platform transforms fragmented environmental data across 17 Caribbean nations into structured, explainable investment decisions — replacing the subjective, document-heavy due diligence process that currently delays capital deployment by months.

The platform serves three core functions:

1. **Risk Scoring**: Every project receives a quantitative environmental risk assessment through the proprietary Layered PERS (Project Environmental Risk Score) architecture — a 6-layer scoring engine that produces an explainable risk score calibrated to the specific sector, geography, and instrument type.

2. **Decision Logic**: Risk scores are translated into instrument-specific decision signals (Proceed, Condition, Decline, and nuanced variants) with plain-language reasoning, enforceable conditions, and monitoring requirements. Each of seven capital instruments has its own decision logic.

3. **Service Recommendation**: Based on the risk profile, the platform recommends specific ESL consulting services — ESIAs, climate risk assessments, monitoring programs — with scope, deliverables, timelines, and fee estimates. Risk creates demand; the platform converts risk signals into service proposals.

**The business model is simple**: development finance institutions (DFIs) and Caribbean governments subscribe to the intelligence platform for portfolio-level risk visibility. When the platform identifies environmental due diligence needs, ESL delivers the recommended assessment services. The platform is both the diagnostic tool and the gateway to ESL's consulting practice.

---

# 2. How We Do It

## 2.1 The Data Foundation

The platform ingests environmental, social, and governance data from 25+ international and regional data sources across 17 Caribbean countries:

| Data Domain | Sources | Coverage |
|---|---|---|
| Climate & Hazards | NOAA Coral Reef Watch, USGS Earthquake, IBTrACS Hurricanes, ThinkHazard, WB Climate (CMIP6), JRC Flood, NOAA Sea Level Rise | 17 countries, 20+ years historical |
| Environment & Biodiversity | WDPA Protected Areas, HydroSHEDS Watersheds, SoilGrids, WRI Aqueduct Water Stress | 17 countries |
| Infrastructure & Population | WorldPop, OSM Infrastructure, Open Buildings, Open Data Jamaica | 17 countries |
| Governance & Development | Transparency International CPI, INFORM Risk, ND-GAIN, World Bank Indicators, WHO GHO | 15-17 countries |
| Regulatory Intelligence | NEPA Jamaica (541 documents), Caribbean EIA (5 agencies, 530+ documents), World Bank Documents (470+ documents), UNESCO WHC | 17 countries, 1,800+ regulatory documents |
| Disaster History | EM-DAT International Disaster Database | 17 countries, 50+ years |

Data provenance is tracked per source. When data is stale, simulated, or unavailable, the platform explicitly flags it and adjusts confidence scores accordingly — there are no silent fallbacks.

## 2.2 The Scoring Pipeline

Every project assessment follows a mandatory 7-stage flow:

1. **Intake Screening** — Project registration, sector classification, country assignment
2. **Baseline Data Formation** — Automated data pull from regional sources, confidence scoring
3. **Risk Characterization** — Layered PERS calculation with explainability narrative
4. **Decision and Capital Sequencing** — Instrument-specific decision signal with conditions
5. **Deployment Control** — Milestone-based disbursement gates, monitoring framework
6. **Transition Validation** — Instrument transition readiness assessment
7. **Risk Resolution** — Portfolio-level risk monitoring, override governance

No stage can be skipped. No deployment occurs under unresolved uncertainty. No decision is issued without a confidence weight. No transition happens without validation.

## 2.3 Mandatory Explainability

Every score and every decision comes with a plain-language explanation of *why*. The platform generates explainability narratives that trace the decision back to specific data inputs, weights, and thresholds. An investment officer can read the reasoning, understand the model's logic, challenge specific assumptions, and — if warranted — override the recommendation with a documented rationale that feeds back into model calibration.

---

# 3. Top 5 Problems We Solve

### Problem 1: Environmental Due Diligence Is Too Slow

Caribbean DFIs currently spend 6-18 months on environmental due diligence for a single project. Most of that time is spent assembling baseline data that already exists in fragmented form across international databases. The platform automates baseline assembly for 17 countries and produces a preliminary risk assessment in seconds, not months.

### Problem 2: Investment Decisions Are Not Calibrated to Instrument Type

A loan, a grant, and a guarantee each carry fundamentally different risk implications — but traditional environmental assessments produce a single pass/fail verdict. A high-risk project that should receive a grant (because risk is the reason concessional capital exists) gets declined because the assessment doesn't distinguish between instrument types. The platform's instrument-specific decision logic solves this: grants have 6 nuanced decision signals, not 3.

### Problem 3: Sector-Blind Risk Scoring Produces Wrong Answers

A coastal flood defense project and a governance reform project have completely different risk drivers, but legacy scoring treats them identically. The platform assigns each project to one of 8 sector families, each with its own methodology profile — different weights, different relevance factors, different capital suitability. An ecosystem restoration project correctly weights biodiversity relevance at 0.9 and outcome complexity at 0.9; a hard infrastructure project correctly weights site-specific hazard at 0.8 and construction risk at 0.6.

### Problem 4: There's No Portfolio-Level Environmental Risk Visibility

Caribbean DFIs manage portfolios of 50-200 projects but have no consolidated view of environmental risk exposure, concentration by sector or country, or capital allocation by risk level. The platform provides a Bloomberg Terminal-style command center showing portfolio-level PERS distribution, capital allocation by instrument and risk tier, and early warning signals for risk migration.

### Problem 5: Assessment Quality Can't Be Verified or Improved

Traditional environmental assessments are static documents. Nobody knows whether last year's risk predictions were accurate. Nobody tracks how often analysts override model recommendations, or whether those overrides prove correct. The platform's calibration engine tracks predicted vs. observed outcomes, logs every analyst override, and generates methodology defense memos — creating a continuous improvement loop that makes every assessment better than the last.

---

# 4. The Layered PERS Architecture

## 4.1 What is PERS?

The Project Environmental Risk Score (PERS) is a composite index (0-100) that quantifies the environmental and social risk of a development finance project. PERS drives the investment decision: below 40 is Proceed, 40-70 is Condition, above 70 is Decline (for loan-equivalent instruments).

## 4.2 The 6-Layer Model

PERS v2.0 uses a 6-layer architecture where each layer captures a distinct risk dimension:

```
PERS = (L1 × W1) + (L2 × W2) + (L3 × W3) + (L4 × W4) + (L5 × M1) + (L6 × M2)
```

| Layer | Name | What It Measures | Weight Range |
|-------|------|-----------------|-------------|
| L1 | **Country Context** | Governance quality (CPI), INFORM risk index, national environmental baseline | 35-50% |
| L2 | **Project Exposure** | Site-specific hazard, sector complexity overlay, SEA/ESIA mitigation factors | 10-30% |
| L3 | **Sector Sensitivity** | Community vulnerability, governance quality, disaster loss history | 15-25% |
| L4 | **Intervention Delivery** | Delivery modality risk — physical construction vs. programmatic vs. governance reform | 10-20% |
| L5 | **Instrument Structure** | Instrument-specific risk (loan pricing risk, grant disbursement risk, guarantee call rate) | 0% (modifier) |
| L6 | **Outcome Delivery** | Theory of change credibility, implementation capacity, outcome complexity | 0-15% (modifier) |

**Critical design choice**: Layers 5 and 6 are modifiers, not base layers. Instrument structure risk and outcome delivery risk adjust the score but don't dominate it. This prevents the instrument choice from artificially inflating or deflating the environmental risk assessment.

## 4.3 Family-Specific Weighting

The weights (W1-W4, M1, M2) are not fixed. They are set by the project's **methodology profile**, which is determined by its **sector family**. Eight methodology profiles currently exist:

| Profile | Family | L1 | L2 | L3 | L4 | L6 | Confidence Penalty |
|---------|--------|----|----|----|----|----|----|
| PERS_DEFAULT_V1 | Universal | 50% | 25% | 15% | 10% | 0% | 15% |
| PERS_INFRA_V1 | Hard Infrastructure | 40% | 30% | 15% | 15% | 0% | 15% |
| PERS_SOCIAL_V1 | Social Infrastructure | 40% | 20% | 25% | 15% | 5% | 15% |
| PERS_AGRI_V1 | Agriculture | 35% | 25% | 20% | 10% | 10% | 15% |
| PERS_ECOSYSTEMS_V1 | Ecosystems | 35% | 20% | 20% | 10% | 15% | 20% |
| PERS_GOVERNANCE_V1 | Governance | 45% | 10% | 15% | 20% | 10% | 10% |
| PERS_DISASTER_V1 | Disaster Response | 35% | 20% | 15% | 20% | 10% | 10% |
| PERS_PROGRAMMATIC_V1 | Programmatic | 40% | 15% | 20% | 10% | 15% | 15% |

Each profile includes documented rationale, assumptions, and known limitations — the methodology can be challenged, defended, and improved through the calibration engine.

## 4.4 Relevance Factors

Beyond weights, each profile defines relevance factors (0.0-1.0) that determine how much each contextual data source contributes to scoring:

| Factor | INFRA | ECOSYSTEMS | GOVERNANCE | DISASTER |
|--------|-------|-----------|------------|----------|
| Hazard | 0.8 | 0.4 | 0.1 | 0.7 |
| Biodiversity | 0.2 | **0.9** | 0.1 | 0.1 |
| Governance | 0.3 | 0.4 | **0.9** | 0.3 |
| Disaster History | 0.5 | 0.3 | 0.2 | **0.9** |
| Community Vulnerability | 0.3 | 0.5 | 0.3 | 0.6 |
| Outcome Complexity | 0.4 | **0.9** | 0.8 | 0.5 |

These factors are not arbitrary — each is documented with a domain-specific rationale. For example, biodiversity relevance for ecosystems projects is 0.9 because the project's success is directly measured by ecological outcomes. For hard infrastructure, it's 0.2 because built assets interact with biodiversity indirectly through land use change.

## 4.5 Confidence Adjustment

When data confidence falls below 50%, the PERS score is inflated by a confidence penalty (typically 10-20%, varying by profile). This is a deliberate design choice: data-poor assessments should produce higher risk scores, not lower ones. The penalty creates an incentive to invest in data quality — and a natural pathway to ESL's baseline assessment services.

## 4.6 On Patents

The Layered PERS architecture has several potentially protectable elements:

- **The 6-layer decomposition** with family-specific weighting is a novel scoring architecture for environmental risk in development finance. No existing framework combines instrument-aware scoring with sector-family methodology profiles.
- **The instrument-specific decision logic** — particularly the 6-signal grant logic that rejects the conventional "high risk = decline" paradigm — is a novel contribution to development finance methodology.
- **The confidence penalty mechanism** that systematically inflates risk under data uncertainty is a defensible methodological innovation.

Whether to pursue patent protection depends on commercial strategy. A patent provides a defensive moat but requires public disclosure. Trade secret protection (keeping the exact weights, thresholds, and decision logic proprietary) may be more practical given the speed of iteration. The methodology profiles, weights, and rationale documentation already constitute strong trade secret documentation.

**Recommendation**: Consult with IP counsel experienced in financial methodology patents. The architecture is likely patentable as a "method for assessing environmental risk in development finance using instrument-aware layered scoring" — but the commercial value may be higher as a defended trade secret with published methodology defense papers (which establish prior art against competitors without requiring full disclosure).

---

# 5. Instrument-Specific Decision Logic

## 5.1 The Core Insight

Traditional environmental risk assessment produces a single verdict for every project. But a loan and a grant have fundamentally different risk economics:

- A **loan** requires the borrower to repay. High environmental risk increases default probability. The traditional Proceed/Condition/Decline framework is appropriate.
- A **grant** does not require repayment. High environmental risk is often the *reason* the grant exists — concessional capital is deployed precisely because commercial lending is not viable. Automatically declining high-risk grants defeats the purpose of development finance.

The platform implements distinct decision logic for each of 7 instrument types:

## 5.2 The Seven Instruments

### LOAN (3 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | PERS < 40 | Standard lending terms |
| CONDITION | PERS 40-70 | Enhanced due diligence, covenant protections |
| DECLINE | PERS > 70 | Risk too high for commercial lending |

Structure risk = PERS × 0.6 + (100 - Confidence) × 0.4

### GRANT (6 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | PERS < 55, adequate data | Standard grant deployment |
| PROCEED_WITH_CONTROLS | PERS > 55 OR low confidence, but feasible outcomes | Deploy with enhanced monitoring, milestone-based disbursement |
| RESEQUENCE | Low outcome delivery + low implementation capacity | Capacity building first, then program deployment |
| NARROW_SCOPE | PERS > 70 + weak outcome confidence | Reduce scope to achievable outcomes, pilot first |
| DEFER_PENDING_BASELINE | Disbursement readiness < 40 | Complete baseline assessment before activation |
| DO_NOT_FUND | PERS > 85 AND implementation capacity < 30 | Extreme risk with no capacity to deliver — grant capital unlikely to achieve any outcomes |

**Key principle**: Only DO_NOT_FUND blocks a grant, and only when extreme risk *combines* with extremely low implementation capacity. A PERS of 80 with strong implementation capacity gets PROCEED_WITH_CONTROLS, not a decline.

Structure risk = PERS × 0.3 + (100 - Outcome) × 0.3 + (100 - Capacity) × 0.2 + (100 - Disbursement) × 0.2

### BLENDED (4 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | PERS < 40 | Low risk — consider whether blended is even necessary |
| CONDITION | PERS 40-65 | Define grant/debt split and transition conditions |
| PROCEED_WITH_CONTROLS | PERS > 65 | Grant-first sequencing; debt enters after risk reduction |
| DO_NOT_FUND | PERS > 80 AND capacity < 30 | No viable transition pathway |

Recommended grant component = 30% + (PERS - 50) × 1.5% (up to 80%)

### GUARANTEE (3 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | PERS < 40 | Standard guarantee terms |
| CONDITION | PERS 40-75 | Cap coverage at 50%, annual reassessment |
| DECLINE | PERS > 75 | Call rate exceeds acceptable threshold |

### TECHNICAL ASSISTANCE (3 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | Adequate capacity | Standard TA deployment |
| NARROW_SCOPE | High risk + low outcome confidence | Focus on deliverable feasibility |
| DEFER_PENDING_BASELINE | Capacity < 20 | Institutional readiness assessment first |

### PROGRAMMATIC (4 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | Low-moderate risk, good capacity | Standard programmatic deployment |
| PROCEED_WITH_CONTROLS | Moderate risk | Phased deployment with pilot sites |
| DEFER_PENDING_BASELINE | Low disbursement readiness | Build readiness before deployment |
| DO_NOT_FUND | PERS > 80, capacity < 25 | Multi-site complexity too high |

### EMERGENCY (3 signals)
| Signal | Condition | Logic |
|--------|-----------|-------|
| PROCEED | Standard disaster context | Deploy with build-back-better compliance |
| PROCEED_WITH_CONTROLS | Elevated risk | Enhanced environmental safeguards |
| NARROW_SCOPE | Extreme risk, low confidence | Focus on immediate relief, defer recovery |

**Reduced confidence penalty**: Emergency instruments reduce the confidence penalty because urgency outweighs data completeness. Disaster response cannot wait for perfect data.

---

# 6. The 8 Sector Families

## 6.1 Why Sector Families?

Development finance portfolios span radically different project types — from highway construction to coral reef restoration to public sector reform. A single risk methodology cannot serve all of them equally. Sector families group projects by shared risk drivers and assign each family a calibrated methodology profile.

## 6.2 Family Definitions

| # | Family | Example Projects | Primary Risk Drivers |
|---|--------|-----------------|---------------------|
| 1 | **Hard Infrastructure** | Roads, ports, energy, water, housing, flood defense | Site hazard, construction complexity, supply chain |
| 2 | **Soft / Social Infrastructure** | Health facilities, schools, community centers | Community vulnerability, service delivery |
| 3 | **Agriculture & Food Systems** | Crop production, fisheries, food processing, value chains | Climate variability, biodiversity, market access |
| 4 | **Ecosystems & Natural Capital** | Reef restoration, forest conservation, nature-based solutions | Biodiversity, outcome uncertainty, monitoring needs |
| 5 | **Governance & Institutional** | Regulatory reform, institutional capacity, policy development | Political economy, institutional inertia |
| 6 | **Disaster Response & Recovery** | Emergency response, post-disaster reconstruction, resilience | Disaster recurrence, logistics, coordination |
| 7 | **Programmatic / Multi-Sector** | Cross-cutting programs, multi-site interventions | Results chain complexity, coordination |
| 8 | **Private Sector / Productive** | Commercial ventures, industrial assets, revenue-generating | Market risk, commercial viability |

## 6.3 Capital Suitability

Each family defines which instruments are appropriate:

| Family | Loan | Grant | Blended | Guarantee | TA | Programmatic | Emergency |
|--------|------|-------|---------|-----------|-----|-------------|-----------|
| Hard Infrastructure | Suitable | - | Suitable | Suitable | - | - | - |
| Social Infrastructure | Suitable | Suitable | Suitable | - | - | - | - |
| Agriculture | Suitable | Suitable | Suitable | - | - | - | - |
| Ecosystems | - | Suitable | Suitable | - | - | - | - |
| Governance | - | Suitable | - | - | Suitable | - | - |
| Disaster Response | - | Suitable | - | - | - | - | Suitable |
| Programmatic | - | Suitable | Suitable | - | - | Suitable | - |
| Private Sector | Suitable | - | Suitable | Suitable | - | - | - |

---

# 7. Outcomes Framework

## 7.1 Theory of Change Integration

Each project can define a theory of change — the IF-THEN logic connecting inputs, activities, outputs, and outcomes. This is not decorative. The outcome delivery risk score (Layer 6 in the PERS architecture) is computed from:

- **Outcome delivery risk** (0-100): How likely are the stated outcomes to materialize?
- **Implementation capacity** (0-100): Does the implementing entity have the capacity to deliver?
- **Outcome complexity**: How complex is the results chain? (Set by the methodology profile)

## 7.2 Disbursement Milestones

Capital deployment is gated by milestones:

| Milestone Type | What It Gates | Example |
|---------------|---------------|---------|
| Technical | Construction quality | Geotechnical survey completion |
| Fiduciary | Financial controls | Procurement manual adoption |
| Physical | Progress verification | Foundation completion |
| Environmental | Safeguard compliance | ESIA approval |
| Social | Community requirements | Stakeholder consultation completion |

Each milestone has a gating effect:
- **gates_first_tranche**: Must be completed before any disbursement
- **gates_construction**: Must be completed before construction phase
- **gates_second_tranche**: Must be completed before second disbursement
- **informational**: Tracked but does not gate disbursement

## 7.3 Transition Readiness

The platform assesses whether a project is ready to transition between instruments:

| Status | Criteria | Meaning |
|--------|----------|---------|
| LOAN_READY | PERS < 45, Confidence > 60% | Risk low enough for commercial lending |
| BLENDED_ELIGIBLE | PERS < 60, Confidence > 50% | Suitable for blended grant/debt structure |
| GRANT_PHASE | PERS < 75 | Still in concessional territory |
| PRE_READINESS | PERS >= 75 | Not yet ready for any instrument transition |

Transition pathways define the specific conditions for moving from one instrument to another — the PERS threshold, confidence threshold, validation criteria, and time horizon.

---

# 8. ESL Service Pricing and Catalog

## 8.1 The 16-Service Catalog

| # | Service | Duration | Fee Range (USD) |
|---|---------|----------|----------------|
| 1 | Environmental and Social Impact Assessment (ESIA) | 12-24 weeks | $75K - $350K |
| 2 | Environmental Impact Assessment (EIA) | 8-16 weeks | $40K - $200K |
| 3 | Strategic Environmental Assessment (SEA) | 16-36 weeks | $100K - $500K |
| 4 | Environmental Monitoring Program Design | 6-12 weeks | $30K - $120K |
| 5 | Laboratory Testing and Validation | 4-10 weeks | $15K - $80K |
| 6 | Climate Risk and Resilience Assessment | 8-16 weeks | $50K - $200K |
| 7 | Biodiversity and Habitat Assessment | 10-20 weeks | $60K - $250K |
| 8 | Watershed and Hydrology Assessment | 8-16 weeks | $45K - $180K |
| 9 | Contamination Assessment and Remediation | 6-20 weeks | $35K - $300K |
| 10 | Stakeholder Engagement and Social Impact Assessment | 8-16 weeks | $40K - $150K |
| 11 | Resettlement and Livelihood Restoration | 12-24 weeks | $80K - $400K |
| 12 | Governance and Institutional Systems Support | 8-24 weeks | $50K - $200K |
| 13 | Baseline and Monitoring System Design | 6-14 weeks | $35K - $120K |
| 14 | Audit and Verification Services | 3-8 weeks | $20K - $80K |
| 15 | Emergency Environmental Response | 2-8 weeks | $25K - $150K |
| 16 | Transition Validation and Readiness Assessment | 4-10 weeks | $30K - $100K |

## 8.2 How Prices Are Derived

Fee ranges are based on Caribbean market rates for international-standard environmental consulting, calibrated against:

- **IFC Performance Standards** scope requirements for Category A/B projects
- **Caribbean DFI** (IDB, CDB, World Bank) typical project preparation grant allocations
- **ESL's operational cost structure** for field teams, laboratory partnerships, and technical specialists in the Caribbean theater
- **Complexity factors**: larger projects, more environmentally sensitive locations, and multi-country programs trend toward the upper bound

The ranges are intentionally wide (typically 3-5x between min and max) because scope varies dramatically by project. An ESIA for a single-building health clinic ($75K) and an ESIA for a multi-island port expansion ($350K) are the same service category but require different team sizes, field effort, and specialist inputs.

## 8.3 Smart Recommendation Logic

The platform doesn't just list services — it recommends specific services with priority levels based on the project's risk profile:

**CRITICAL recommendations** (must-do):
- ESIA when PERS > 50 (risk characterization and funder compliance)
- EIA when regulatory risk > 50 (likely mandatory for permitting)
- Biodiversity assessment for all ecosystem/natural capital projects
- Stakeholder engagement when human exposure risk > 50
- Emergency response for all disaster recovery projects
- Governance support for all governance/institutional projects

**RECOMMENDED** (should-do):
- SEA for grant/programmatic interventions with PERS > 40
- Climate risk assessment when PERS > 45
- Environmental monitoring when data confidence < 60%
- Laboratory testing when data confidence < 50%
- Transition validation for all blended finance projects

**OPTIONAL** (available if needed):
All remaining services matched by sector family and instrument type

This priority logic creates a natural sales funnel: the platform identifies the need, quantifies the urgency, and ESL delivers the service.

---

# 9. Calibration and Methodology Defense

## 9.1 Validation Cases

The platform tracks predicted vs. observed outcomes to test model accuracy over time. Each validation case records:
- The PERS score at the time of assessment (predicted risk)
- The actual risk observed after implementation
- The decision signal issued vs. what actually happened
- The sector family and methodology profile used

This creates an empirical feedback loop. If PERS systematically overestimates risk for agriculture projects in Jamaica, the prediction error accumulates in validation cases, flagging the PERS_AGRI_V1 profile for recalibration.

## 9.2 Override Governance

When analysts override model recommendations — upgrading a Decline to a Condition, or downgrading a Proceed to Condition — the override is logged with:
- Original and overridden values
- Analyst's reasoning
- Mitigation rationale
- Reviewer approval
- Post-facto assessment (was the override proved correct?)

Override patterns provide critical intelligence:
- Frequent overrides in one direction suggest systematic model bias
- Override clustering by sector family suggests profile miscalibration
- "Proved correct" rates validate analyst judgment vs. model accuracy

## 9.3 Calibration Memos

The platform generates structured methodology defense documents from live portfolio data:

| Memo Type | Purpose |
|-----------|---------|
| Weighting Defense | Documents and defends the weight choices for a specific profile |
| Calibration Review | Reviews model calibration across all profiles |
| Portfolio Risk Methodology | Documents risk methodology applied to the current portfolio |
| Sector Family Scoring | Documents scoring methodology for a specific family |
| Instrument Logic | Documents instrument-specific decision logic differences |
| Grant/Blended Readiness | Assesses portfolio readiness for concessional capital |

These memos serve multiple audiences:
- **Internal**: Model governance, audit trail, quality assurance
- **Board/Management**: Methodology transparency, confidence in scoring
- **External DFI clients**: Methodology defense for funder due diligence requirements
- **Regulatory**: Documentation for environmental regulatory compliance

---

# 10. Data Coverage: 17 Caribbean Nations

The platform covers the full Caribbean SIDS theater:

| Country | Risk Data | Regulatory Intelligence | Ingestion Status |
|---------|-----------|------------------------|-----------------|
| Jamaica | Full (25+ datasets) | Deep (NEPA: 541 documents) | Live |
| Trinidad & Tobago | Full | Moderate (EMA clearance data) | Live |
| Barbados | Full | Basic | Live |
| Guyana | Full | Moderate (EPA management plans) | Live |
| Belize | Full | Deep (DOE: 480 documents) | Live |
| Bahamas | Full | Basic | Live |
| St. Lucia | Full | Basic | Live |
| Grenada | Full | Basic | Live |
| Dominica | Full | Basic | Live |
| St. Vincent | Full | Basic | Live |
| Antigua & Barbuda | Full | Basic | Live |
| St. Kitts & Nevis | Full | Basic | Live |
| Suriname | Full | Basic | Live |
| Haiti | Full | Basic (WB: 155 documents) | Live |
| Cayman Islands | Partial | Moderate (DOE: 50+ EIAs) | Live |
| Puerto Rico | Partial | Moderate (DRNA declarations) | Live |
| Dominican Republic | Full | Basic | Live |

---

# 11. Technical Architecture Summary

- **Platform**: Web-based intelligence platform with Bloomberg Terminal-style dark UI
- **API**: RESTful API (Express 5, TypeScript) with role-based access control
- **Database**: PostgreSQL with Drizzle ORM
- **Security**: TOTP-mandatory 2FA, AES-256-GCM encryption at rest, bcrypt password hashing, rate limiting
- **Data Ingestion**: 25+ automated pipelines with scheduled refresh (daily/weekly/monthly by priority)
- **Frontend**: React + Vite + Tailwind CSS
- **Authentication**: Email/password + mandatory TOTP, JWT in httpOnly cookies
- **Compliance**: SOC 2 Type II, ISO 27001, IFC Performance Standards control mapping

---

# 12. Competitive Position

No existing platform in the Caribbean development finance space combines:

1. Automated environmental data ingestion across 17 nations
2. Instrument-aware risk scoring (7 instrument types, not just loan/grant)
3. Sector-family methodology profiles with documented rationale
4. Nuanced grant decision logic (6 signals, not binary approve/decline)
5. Integrated service recommendation tied to risk profiles
6. Continuous calibration with validation case tracking

The closest analogs are:
- **IDB's environmental screening tools**: Manual, project-by-project, no portfolio view
- **World Bank ESPF toolkit**: Framework-based, no quantitative scoring
- **Commercial ESG platforms** (MSCI, Sustainalytics): Designed for publicly traded equities, not development finance projects

The ESL Intelligence Platform occupies a unique position: **it is both the risk assessment tool and the service delivery pipeline**. No competitor has this vertical integration.

---

*Document version: 2.0*
*Platform version: VNext*
*Last updated: April 2026*
