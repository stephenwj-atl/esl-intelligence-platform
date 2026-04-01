# VNext Database Schema

## New Tables

### sector_families
Stores the 8 sector family definitions with project type taxonomies.

### methodology_profiles
Stores methodology profile configurations with weights, relevance factors, and metadata.

### project_outcomes
Per-project theory of change, output/outcome summaries, and delivery risk scores.

### outcome_metrics
Quantifiable outcome indicators with target/current values and verification methods.

### disbursement_milestones
Ordered milestone-based disbursement gates with status tracking.

### transition_pathways
Instrument transition definitions with triggers, validation criteria, and conditions.

### methodology_evidence
Supporting evidence for methodology profiles (framework alignment, empirical, literature, expert judgment).

### calibration_memos
Generated calibration and methodology defense memos with structured content (JSON).

### validation_cases
Predicted vs. observed risk/outcome tracking for model calibration.

### validation_observations
Observations attached to validation cases for detailed model feedback.

### override_decisions
Analyst override records with governance trail and post-facto assessment.

## New Columns on projects
| Column | Type | Description |
|--------|------|-------------|
| sector_family | text | Sector family key |
| project_subtype | text | Project subtype |
| instrument_type | text | LOAN/GRANT/BLENDED/etc. |
| methodology_profile | text | Profile key used |
| country_context_score | real | Layer 1 score |
| project_exposure_score | real | Layer 2 score |
| sector_sensitivity_score | real | Layer 3 score |
| intervention_delivery_score | real | Layer 4 score |
| instrument_structure_score | real | Layer 5 score |
| outcome_delivery_score | real | Layer 6 score |
| disbursement_readiness | text | READY/CONDITIONALLY_READY/NOT_READY |
| transition_readiness | text | LOAN_READY/BLENDED_ELIGIBLE/GRANT_PHASE/PRE_READINESS |
| layered_breakdown | jsonb | Full layered assessment result |

## Schema Files
- `lib/db/src/schema/projects.ts`
- `lib/db/src/schema/sector-families.ts`
- `lib/db/src/schema/project-outcomes.ts`
- `lib/db/src/schema/methodology-defense.ts`
