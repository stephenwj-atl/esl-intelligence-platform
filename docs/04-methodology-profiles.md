# Methodology Profiles

## Profile Architecture
Each methodology profile defines:
- **Weights**: How much each scoring layer contributes to final PERS
- **Relevance factors**: How much each contextual data source matters for this family
- **Capital suitability**: Which instruments are appropriate
- **Rationale, assumptions, and known limitations**: Methodology defense documentation

## Active Profiles

| Profile | Family | CC | PO | SE | IR | OR | ISM |
|---------|--------|----|----|----|----|----|----|
| PERS_DEFAULT_V1 | Universal | 50% | 25% | 15% | 10% | 0% | 0% |
| PERS_INFRA_V1 | Hard Infrastructure | 40% | 30% | 15% | 15% | 0% | 0% |
| PERS_SOCIAL_V1 | Social Infrastructure | 40% | 20% | 25% | 15% | 5% | 0% |
| PERS_AGRI_V1 | Agriculture | 35% | 25% | 20% | 10% | 10% | 0% |
| PERS_ECOSYSTEMS_V1 | Ecosystems | 35% | 20% | 20% | 10% | 15% | 0% |
| PERS_GOVERNANCE_V1 | Governance | 45% | 10% | 15% | 20% | 10% | 0% |
| PERS_DISASTER_V1 | Disaster Response | 35% | 20% | 15% | 20% | 10% | 0% |
| PERS_PROGRAMMATIC_V1 | Programmatic | 40% | 15% | 20% | 10% | 15% | 0% |

Legend: CC=Country Context, PO=Project Overlay, SE=Sensitivity, IR=Intervention Risk, OR=Outcome Risk Modifier, ISM=Instrument Structure Modifier

## Relevance Factors
Each profile has family-specific relevance factors (0.0-1.0) for:
- Hazard relevance
- Biodiversity relevance
- Governance relevance
- Disaster history relevance
- Community vulnerability relevance
- Outcome complexity
- Monitoring needs

## Validation Status
All profiles are currently **PROVISIONAL** — expert-derived and framework-aligned but not empirically calibrated against observed outcomes.

## Files
- `artifacts/api-server/src/lib/methodology-profiles.ts`
- `lib/db/src/schema/sector-families.ts` (DB storage)
