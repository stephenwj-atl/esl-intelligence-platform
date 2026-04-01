# ESL Service Catalog

## 16 Service Categories

| # | Service | Typical Duration | Fee Range (USD) |
|---|---------|-----------------|-----------------|
| 1 | ESIA | 12-24 weeks | $75K-$350K |
| 2 | EIA | 8-16 weeks | $40K-$200K |
| 3 | SEA | 16-36 weeks | $100K-$500K |
| 4 | Environmental Monitoring | 6-12 weeks | $30K-$120K |
| 5 | Laboratory Testing | 4-10 weeks | $15K-$80K |
| 6 | Climate Risk Assessment | 8-16 weeks | $50K-$200K |
| 7 | Biodiversity/Habitat Assessment | 10-20 weeks | $60K-$250K |
| 8 | Watershed/Hydrology Assessment | 8-16 weeks | $45K-$180K |
| 9 | Contamination/Remediation | 6-20 weeks | $35K-$300K |
| 10 | Stakeholder/Social Impact | 8-16 weeks | $40K-$150K |
| 11 | Resettlement/Livelihood | 12-24 weeks | $80K-$400K |
| 12 | Governance/Institutional Support | 8-24 weeks | $50K-$200K |
| 13 | Baseline/Monitoring Design | 6-14 weeks | $35K-$120K |
| 14 | Audit/Verification | 3-8 weeks | $20K-$80K |
| 15 | Emergency Environmental Response | 2-8 weeks | $25K-$150K |
| 16 | Transition Validation | 4-10 weeks | $30K-$100K |

## Smart Recommendation Engine
The service recommendation engine maps services by:
- Sector family
- Instrument type
- PERS score
- Data confidence
- Risk factors (environmental, human exposure, regulatory)

Priority levels: CRITICAL, RECOMMENDED, OPTIONAL

## API Endpoints
- `GET /api/esl-services/catalog` — Full service catalog
- `POST /api/esl-services/recommend` — Get recommendations for a project context

## Files
- `artifacts/api-server/src/lib/esl-services-expanded.ts`
- `artifacts/api-server/src/routes/methodology.ts`
