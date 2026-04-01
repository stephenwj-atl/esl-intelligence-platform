# Outcomes Framework

## Theory of Change
Each project can define a theory of change (IF-THEN logic), outputs summary, and outcomes summary. These drive the outcome delivery risk assessment.

## Outcome Metrics
Quantifiable indicators tracked per project:
- **metric_key**: Machine-readable identifier
- **metric_name**: Human-readable name
- **category**: Classification (climate_resilience, economic, social, environmental, governance)
- **target_value / current_value**: Progress tracking
- **unit**: Measurement unit
- **verification_method**: How the metric is verified
- **status**: planned, in_progress, achieved, at_risk, abandoned

## Outcome Delivery Risk
Calculated from:
- Outcome delivery risk score (0-100)
- Implementation capacity score (0-100)
- Outcome complexity relevance (from methodology profile)

## Disbursement Milestones
Milestone-based disbursement tracking:
- **milestone_type**: technical, fiduciary, physical, environmental, social
- **gating_effect**: gates_first_tranche, gates_construction, gates_second_tranche, informational
- **sequence_order**: Ordered progression
- **current_status**: pending, in_progress, completed, blocked, waived

## Disbursement Readiness
- READY: Score >= 70
- CONDITIONALLY_READY: Score 40-70
- NOT_READY: Score < 40

## Transition Readiness
- LOAN_READY: PERS < 45 and confidence > 60%
- BLENDED_ELIGIBLE: PERS < 60 and confidence > 50%
- GRANT_PHASE: PERS < 75
- PRE_READINESS: PERS >= 75

## Transition Pathways
Define how projects transition between instruments:
- From/to instrument types
- Transition triggers (PERS threshold, confidence threshold)
- Validation criteria
- Time horizon
- Required conditions (JSON)
- Responsible reviewer

## API Endpoints
- `GET /api/projects/:id/outcomes` — Full outcome data
- `POST /api/projects/:id/outcomes` — Create/update outcomes
- `POST /api/projects/:id/metrics` — Add metrics
- `PATCH /api/metrics/:id` — Update metric progress
- `POST /api/projects/:id/milestones` — Add milestones
- `PATCH /api/milestones/:id` — Update milestone status
- `POST /api/projects/:id/transitions` — Add transition pathways

## Files
- `lib/db/src/schema/project-outcomes.ts`
- `artifacts/api-server/src/routes/outcomes.ts`
