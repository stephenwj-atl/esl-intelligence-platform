# Layered PERS Scoring Architecture v2.0

## Overview
The Project Environmental Risk Score (PERS) v2.0 uses a 6-layer scoring architecture that replaces the fixed-weight v1.0 formula with family-specific methodology profiles and instrument-aware decision logic.

## Formula
```
PERS = (CountryContext × W1) + (ProjectExposure × W2) + (SectorSensitivity × W3) 
     + (InterventionDelivery × W4) + (OutcomeDelivery × M1) + (InstrumentStructure × M2)
```

Weights (W1-W4) and modifiers (M1-M2) are set by the sector family methodology profile.

## 6 Scoring Layers

### 1. Country Context Score
Governance quality (CPI), INFORM risk index, environmental baseline. Captures the national-level operating environment. Weight varies 35-50% across families.

### 2. Project Exposure Score
Site-specific hazard, sector complexity overlay. Reduced by SEA (0.85×) and ESIA (0.90×). Weight varies 10-30%.

### 3. Sector Sensitivity Score
Community vulnerability, governance quality, disaster loss history. Weight varies 15-25%.

### 4. Intervention Delivery Score
Delivery modality risk. Five profiles: Physical Infrastructure, Social/Programmatic, Environmental, Governance, Disaster. Weight varies 10-20%.

### 5. Instrument Structure Score (Modifier)
Instrument-specific risk factors. Computed by the instrument logic engine for LOAN, GRANT, BLENDED, GUARANTEE, TA, PROGRAMMATIC, EMERGENCY.

### 6. Outcome Delivery Score (Modifier)
Theory of change credibility, implementation capacity, outcome complexity. Active for ecosystems (15%), agriculture (10%), programmatic (15%).

## Decision Thresholds
- PROCEED: PERS < 40
- CONDITION: PERS 40-70
- DECLINE: PERS > 70

## Confidence Adjustment
When data confidence < 50%, PERS is inflated by the confidence influence factor (default 15%) to penalize data-poor assessments.

## Files
- `artifacts/api-server/src/lib/layered-pers-engine.ts` — Core layered engine
- `artifacts/api-server/src/lib/pers-engine.ts` — Legacy v1.0 engine (still used for base calculations)
- `artifacts/api-server/src/lib/methodology-profiles.ts` — Profile definitions
