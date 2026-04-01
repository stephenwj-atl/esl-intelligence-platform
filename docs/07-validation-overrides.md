# Validation Cases and Override Governance

## Validation Cases
Track predicted vs. observed outcomes for model calibration.

### Fields
- **case_type**: post_implementation, mid_term_review, annual_assessment
- **predicted_risk**: PERS score at time of assessment
- **observed_risk**: Actual risk observed (recorded later)
- **predicted_outcome**: Model's decision recommendation
- **observed_outcome**: What actually happened
- **sector_family**: Which family the project belongs to
- **profile_used**: Which methodology profile was applied

### Observations
Each validation case can have multiple observations:
- **observation_type**: initial_assessment, mid_term_update, final_review
- **description**: What was observed
- **impact**: Effect on model confidence
- **recommendation**: Suggested model adjustment

## Override Decisions
Track when analysts override model recommendations.

### Fields
- **override_type**: decision_upgrade, decision_downgrade, score_adjustment, instrument_change
- **original_value / overridden_value**: What was changed
- **reason**: Why the override was made
- **reviewer**: Who approved
- **mitigation_rationale**: How risks of the override are managed
- **proved_correct**: Post-facto assessment (null until reviewed)

## Governance Purpose
Override patterns provide critical model improvement feedback:
1. Frequent overrides in one direction suggest systematic bias
2. Override clustering by family suggests profile miscalibration
3. "Proved correct" tracking validates analyst judgment vs. model accuracy

## API Endpoints
- `GET /api/validation/cases` — List validation cases
- `POST /api/validation/cases` — Create validation case
- `GET /api/validation/cases/:id/observations` — Get observations
- `POST /api/validation/cases/:id/observations` — Add observation
- `GET /api/overrides` — List override decisions
- `POST /api/overrides` — Record override decision

## Files
- `lib/db/src/schema/methodology-defense.ts`
- `artifacts/api-server/src/routes/methodology.ts`
