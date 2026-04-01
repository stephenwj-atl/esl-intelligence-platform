# Instrument-Specific Decision Logic

## 7 Instrument Types

### LOAN
- Signals: PROCEED, CONDITION, DECLINE
- PERS < 40: PROCEED, PERS 40-70: CONDITION, PERS > 70: DECLINE
- Low confidence adds requirement for independent baseline verification
- Structure risk = PERS × 0.6 + (100 - confidence) × 0.4

### GRANT
- Signals: PROCEED, PROCEED_WITH_CONTROLS, RESEQUENCE, NARROW_SCOPE, DEFER_PENDING_BASELINE, DO_NOT_FUND
- Key principle: High PERS does NOT automatically decline. Risk is the rationale for concessional capital.
- DO_NOT_FUND: PERS > 85 AND implementation capacity < 30
- PROCEED_WITH_CONTROLS: PERS > 70 with feasible outcome delivery
- NARROW_SCOPE: High risk + weak outcome confidence
- DEFER_PENDING_BASELINE: Disbursement readiness < 40
- RESEQUENCE: Low outcome delivery + low implementation capacity
- Structure risk = weighted combination of PERS, outcome delivery, implementation capacity, disbursement readiness

### BLENDED
- Signals: PROCEED, PROCEED_WITH_CONTROLS, CONDITION, DO_NOT_FUND
- Grant-first sequencing: concessional capital deploys before commercial tranche
- Transition triggers defined by PERS threshold reduction
- Recommended grant component percentage calculated from risk level

### GUARANTEE
- Signals: PROCEED, CONDITION, DECLINE
- PERS > 75: DECLINE (call rate too high)
- Cap coverage at 50% above PERS 40

### TECHNICAL ASSISTANCE
- Signals: PROCEED, DEFER_PENDING_BASELINE, NARROW_SCOPE
- Implementation capacity is the primary driver
- Focus on deliverable feasibility

### PROGRAMMATIC
- Signals: PROCEED, PROCEED_WITH_CONTROLS, DEFER_PENDING_BASELINE, DO_NOT_FUND
- Multi-site complexity, results chain coherence
- Phased deployment with pilot sites

### EMERGENCY
- Signals: PROCEED, PROCEED_WITH_CONTROLS, NARROW_SCOPE
- Reduced confidence penalties — urgency outweighs data completeness
- Build-back-better compliance mandatory

## Files
- `artifacts/api-server/src/lib/instrument-logic.ts`
