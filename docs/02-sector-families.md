# Sector Family Taxonomy

## 8 Sector Families

### 1. Hard Infrastructure
Physical built-environment assets: transport, energy, water, waste, flood defense, housing.
- 14 project types, 50+ subtypes
- Profile: PERS_INFRA_V1 (CC=40%, PO=30%, SE=15%, IR=15%)
- High hazard relevance (0.8), low biodiversity relevance (0.2)

### 2. Soft / Social Infrastructure
Health, education, community, and social service delivery facilities.
- 8 project types
- Profile: PERS_SOCIAL_V1 (CC=40%, PO=20%, SE=25%, IR=15%, OR=5%)
- High community vulnerability relevance (0.7)

### 3. Agriculture & Food Systems
Agricultural production, processing, value chains, fisheries, food security.
- 8 project types
- Profile: PERS_AGRI_V1 (CC=35%, PO=25%, SE=20%, IR=10%, OR=10%)
- High outcome complexity (0.7), elevated biodiversity relevance (0.4)

### 4. Ecosystems & Natural Capital
Ecosystem restoration, biodiversity protection, nature-based solutions.
- 10 project types
- Profile: PERS_ECOSYSTEMS_V1 (CC=35%, PO=20%, SE=20%, IR=10%, OR=15%)
- Near-maximum biodiversity relevance (0.9), highest outcome complexity (0.9)

### 5. Governance & Institutional
Public sector reform, regulatory systems, institutional capacity building.
- 10 project types
- Profile: PERS_GOVERNANCE_V1 (CC=45%, PO=10%, SE=15%, IR=20%, OR=10%)
- Near-maximum governance relevance (0.9), minimal hazard relevance (0.1)

### 6. Disaster Response & Recovery
Emergency response, post-disaster reconstruction, resilience retrofits.
- 6 project types
- Profile: PERS_DISASTER_V1 (CC=35%, PO=20%, SE=15%, IR=20%, OR=10%)
- Near-maximum disaster history relevance (0.9)

### 7. Programmatic / Multi-Sector
Cross-cutting programs spanning multiple sectors, geographies, or intervention types.
- 6 project types
- Profile: PERS_PROGRAMMATIC_V1 (CC=40%, PO=15%, SE=20%, IR=10%, OR=15%)
- High outcome complexity (0.9), community vulnerability (0.7)

### 8. Private Sector / Productive Investment
Commercial and private-sector assets generating revenue and employment.
- 6 project types
- Uses default profile (PERS_DEFAULT_V1)

## Lookup Logic
Projects are assigned to a sector family based on their project type. Legacy types are mapped via a compatibility table.

## Files
- `artifacts/api-server/src/lib/sector-families.ts`
- `lib/db/src/schema/sector-families.ts`
