# ESL Intelligence Platform — Real Data Source Integration Guide

**Purpose:** Replace simulated/demonstration risk scores with live data from verified environmental, infrastructure, and regulatory sources across the Caribbean. This document provides complete instructions for GPT, Claude, or a developer to implement each data pipeline.

---

## Current State

### What Is Real (From ESL Research Brief)
- **Jamaica 21 data layers** (1.1–4.5): Source names, URLs, quality assessments, formats, coverage areas, and notes — all sourced from the March 2026 ESL tightened research brief
- **Country and region geography**: 14 Caribbean countries with real region/city names
- **Institutional references**: All source URLs point to real agencies (WRA, NEPA, NOAA, WRI, ODPEM, etc.)

### What Is Simulated (Must Be Replaced)
- **Country risk scores**: Generated from hardcoded baselines + random variance (`countryRiskProfiles` in `scripts/src/seed.ts`)
- **CERI (Caribbean Environmental Risk Index)**: Simple average of simulated country risk scores
- **Infrastructure and water stress indices**: Random drift from baselines
- **Sector benchmarks**: Fixed baselines with random temporal drift
- **Data Moat statistics**: Hardcoded numbers (e.g., `labSamples: 4500`)
- **5-year trend data**: Simulated drift per year

---

## Architecture Overview

### Where Simulated Data Lives
```
scripts/src/seed.ts
  └── countryRiskProfiles (lines ~459-474) — hardcoded baselines
  └── Regional data loop (lines ~477-496) — random risk values per region
  └── Regional indices loop (lines ~500-514) — random multi-year scores
  └── Sector benchmarks loop (lines ~518-544) — random sector data

artifacts/api-server/src/routes/regional.ts
  └── /api/regional/authority-summary — dataMoat.labSamples hardcoded to 4500
  └── /api/regional/indices — reads from regional_indices table
  └── /api/regional/benchmarks/sector — reads from sector_benchmarks table
```

### Database Tables to Populate with Real Data
```sql
regional_indices (country, risk_score, infrastructure_score, water_stress_score, confidence, year)
regional_data (country, region, dataset_type, value, unit, timestamp)
sector_benchmarks (sector, metric, avg_risk, avg_confidence, sample_size, year)
```

### Target: `dataProvenance.status` Field
The provenance status is **derived dynamically** — do not hardcode it. The API checks for the presence of a `data_source_freshness` table to determine whether live pipelines are active. Criteria for `LIVE` status:

- At least 3 of the 6 automated source pipelines have successfully run
- Most recent pipeline run is within 30 days
- Data confidence across connected sources averages above 50%

If any criterion fails, status falls back to `"SIMULATED"`. This ensures the transparency label always reflects actual data reality. See the `dataProvenance` block in `artifacts/api-server/src/routes/regional.ts`.

---

## Data Source Integration Instructions

### PRIORITY 1: Direct API Sources (Can Be Automated)

---

#### 1. WRI Aqueduct 4.0 — Water Stress Index
**Layer:** 2.1 | **Quality:** Good | **Impact:** Populates `water_stress_score` for all countries

**API Endpoint:**
```
https://www.wri.org/applications/aqueduct/water-risk-atlas/api/v2/
```

**Steps:**
1. Query Aqueduct API for Caribbean sub-basins:
   ```
   GET /api/v2/widget/5742e7cb-b31e-4ede-a74d-e2bbe5f5c26d
   ?geostore={geostore_id}
   &indicator=w_awr_def_tot_cat    // Overall water risk
   &type=annual
   ```
2. For each Caribbean country, use the country ISO3 code to get water stress indicators:
   - `bws_cat` (baseline water stress)
   - `bwd_cat` (baseline water depletion)
   - `iav_cat` (interannual variability)
   - `sev_cat` (seasonal variability)
   - `gtd_cat` (groundwater table decline)
3. Normalize the 0-5 Aqueduct scale to 0-100 for the platform:
   ```
   platform_score = (aqueduct_value / 5) * 100
   ```
4. Write to `regional_indices.water_stress_score` per country.

**Confidence Scoring:**
- Aqueduct coverage = Good for all Caribbean countries
- Set confidence = 80 for countries with sub-basin resolution, 65 for country-level only

**Automation Feasibility:** HIGH — Public REST API, no auth required, JSON responses.

---

#### 2. NOAA IBTrACS — Hurricane Tracks & Wind History
**Layer:** 1.5 | **Quality:** Good | **Impact:** Component of `risk_score` (environmental hazard)

**Data Source:**
```
https://www.ncei.noaa.gov/data/international-best-track-archive-for-climate-stewardship-ibtracs/v04r01/provisional/csv/
ibtracs.NA.list.v04r01.csv   (North Atlantic basin)
```

**Steps:**
1. Download the North Atlantic CSV (updated monthly, ~15MB)
2. Filter tracks that pass within proximity of each Caribbean country:
   ```
   For each country centroid:
     Filter tracks where any point is within 200km radius
     Count Category 1-5 storms in past 30 years
     Calculate average max wind speed for passing storms
   ```
3. Scoring methodology:
   ```
   hurricane_risk = weighted_average(
     storm_frequency_score * 0.4,     // storms per decade, normalized 0-100
     max_intensity_score * 0.35,      // avg max category, normalized 0-100
     recency_score * 0.25             // weighted toward recent 10 years
   )
   ```
4. Country bounding boxes for proximity filtering:
   ```
   Jamaica: 17.7-18.5°N, 76.2-78.4°W
   Dominican Republic: 17.5-19.9°N, 68.3-72.0°W
   Trinidad & Tobago: 10.0-11.4°N, 60.5-62.0°W
   Barbados: 13.0-13.4°N, 59.4-59.7°W
   Bahamas: 20.9-27.3°N, 72.7-79.3°W
   Haiti: 18.0-20.1°N, 71.6-74.5°W
   Cuba: 19.8-23.3°N, 74.1-84.9°W
   Puerto Rico: 17.9-18.5°N, 65.6-67.3°W
   Belize: 15.9-18.5°N, 87.5-89.2°W
   Guyana: 1.2-8.6°N, 56.5-61.4°W
   Suriname: 1.8-6.0°N, 54.0-58.1°W
   Cayman Islands: 19.2-19.8°N, 79.7-81.4°W
   St. Lucia: 13.7-14.1°N, 60.9-61.1°W
   Grenada: 11.98-12.24°N, 61.59-61.80°W
   ```
5. Write results to `regional_data` with `dataset_type = 'Coastal Risk'` and to the hurricane component of `regional_indices.risk_score`.

**Automation Feasibility:** HIGH — Public CSV download, no auth, well-documented schema.

---

#### 3. Jamaica GOJ ArcGIS Services — Multiple Layers
**Layers:** 1.1, 1.2, 1.4, 3.3, 4.1, 4.2, 4.5 | **Impact:** Jamaica-specific risk scoring

**Base ArcGIS Server URLs:**
```
GOJ Stack: https://services6.arcgis.com/3R3y1KXaPJ9BFnsU/ArcGIS/rest/services/
MSET Stack: https://gis2.mset.gov.jm/server/rest/services/
```

**Available Services (verified in ESL research):**

| Service | URL | Layer |
|---------|-----|-------|
| Flood Boundaries | `{MSET}/Hosted/Flood_Boundaries/FeatureServer` | 1.1 |
| Flood Portal | `{MSET}/Flood_Portal_WFL1/FeatureServer` | 1.1 |
| Port Antonio Coastal Inundation | `{GOJ}/Port_Antonio_coastal_inundation_zones/FeatureServer` | 1.2 |
| Port Maria Coastal Inundation | `{GOJ}/Port_Maria_coastal_inundation_zones/FeatureServer` | 1.2 |
| PRTR (Pollutant Release) | `{MSET}/Pollutant_Release_Transfer_Register_WFL1/FeatureServer` | 1.4 |
| PRTR 2023 | `{MSET}/PRTR2023_WFL1/FeatureServer` | 1.4 |
| All-Cause Mortality | `{GOJ}/All_Cause_mortality/FeatureServer` | 3.3 |
| PYLL by Parish | `{GOJ}/Potential_Years_of_Life_Lost_by_Parish/FeatureServer` | 3.3 |
| Premature Mortality | `{GOJ}/Premature_Mortality_by_Parish/FeatureServer` | 3.3 |
| Protected Areas | `{GOJ}/Protected_Areas_Jamaica/FeatureServer` | 4.1 |
| Planning Proposals | `{GOJ}/Planning/FeatureServer` | 4.2 |
| Planning Area Boundaries | `{GOJ}/All_Island_Local_Planning_Area_Boundaries/FeatureServer` | 4.2 |
| Port Royal JNHT | `{GOJ}/Port_Royal_JNHT/FeatureServer` | 4.5 |

**Query Pattern (same for all ArcGIS FeatureServer endpoints):**
```
GET {service_url}/0/query
  ?where=1=1
  &outFields=*
  &f=json
  &returnGeometry=true
  &resultRecordCount=1000
  &resultOffset=0
```

**Steps for Each Service:**
1. Query the service to get feature count:
   ```
   GET {service_url}/0/query?where=1=1&returnCountOnly=true&f=json
   ```
2. Page through all features (1000 at a time) to download the full dataset
3. Process geometries for spatial analysis:
   - **Flood Boundaries (1.1):** Count flood zones, calculate total area of flood-mapped regions vs national area → flood coverage percentage
   - **PRTR (1.4):** Count contamination facilities, calculate density per parish, identify high-concentration zones
   - **Mortality (3.3):** Extract parish-level rates, normalize to national baseline, identify health-burden hotspots
   - **Protected Areas (4.1):** Calculate total protected area, buffer zones, overlap with development corridors
4. Convert to risk scores:
   ```
   flood_risk = (flood_zone_area / total_coastal_area) * exposure_weight * 100
   contamination_risk = min(100, facility_density_per_km2 * severity_weight * 100)
   health_burden = (parish_mortality_rate / national_avg) * 50  // normalized to 0-100
   ```

**Automation Feasibility:** HIGH — Public REST APIs, JSON responses, no authentication required. Some services may have rate limits.

---

#### 4. WorldPop — Population Density
**Layer:** 3.1 | **Quality:** Good | **Impact:** Community risk scoring

**Data Source:**
```
https://data.worldpop.org/GIS/Population/Global_2000_2020/2020/
{country_code}/{country_code_lower}_ppp_2020.tif
```

**Country Codes:**
```
JAM (Jamaica), DOM (Dominican Republic), TTO (Trinidad & Tobago),
BRB (Barbados), BHS (Bahamas), GUY (Guyana), SUR (Suriname),
HTI (Haiti), CUB (Cuba), PRI (Puerto Rico), CYM (Cayman Islands),
BLZ (Belize), LCA (St. Lucia), GRD (Grenada)
```

**Steps:**
1. Download GeoTIFF for each country (already have Jamaica: 6.56MB)
2. Process the raster to calculate:
   - Total population
   - Population density per km² (mean, median, max)
   - Urban vs rural population split
   - Population in coastal zones (within 1km of coastline)
3. Community risk component:
   ```
   community_exposure = (coastal_population / total_population) * 100
   density_factor = min(100, (pop_density / reference_density) * 100)
   ```
4. Requires: `gdal` or a Node.js GeoTIFF library (`geotiff` npm package)

**Automation Feasibility:** MEDIUM — Requires GeoTIFF processing capability. The `geotiff` npm package can read these in Node.js.

---

#### 5. HydroSHEDS / HydroBASINS — Watershed Drainage
**Layer:** 1.6 | **Quality:** Good | **Impact:** Flood risk and water quality scoring

**Data Source:**
```
https://www.hydrosheds.org/products/hydrobasins
Download: HydroBASINS Level 6 for Central America & Caribbean
```

**Steps:**
1. Download HydroBASINS Shapefile for Central America/Caribbean
2. Filter basins that intersect each country boundary
3. Calculate:
   - Number of major watersheds per country
   - Total drainage area
   - Basin complexity (number of sub-basins)
4. Cross-reference with flood data for watershed flood-risk scoring

**Automation Feasibility:** MEDIUM — Requires shapefile processing. Use `shpjs` or `turf.js` npm packages.

---

### PRIORITY 2: Data Downloads (Requires Processing Pipeline)

---

#### 6. Jamaica Open Data — Sensitive Receptors
**Layer:** 3.2 | **Quality:** Good | **Files Already Downloaded**

**Files in Research Bundle:**
```
JM/raw_data/jm_health_centres_with_geospatial_info.csv  (0.04 MB)
JM/raw_data/jm_hospitals.csv                            (< 0.01 MB)
JM/raw_data/jm_public_health_centres_and_hospitals.csv   (0.06 MB)
```

**Source URLs:**
```
https://data.gov.jm/sites/default/files/healthcentreslatlong_1.csv
https://data.gov.jm/sites/default/files/hospitals.csv
https://data.gov.jm/sites/default/files/Public-Health-Centres-adn-Hospitals.csv
```

**Steps:**
1. Download all three CSVs
2. Parse facility locations (lat/lng columns)
3. For each project site, calculate:
   - Number of sensitive receptors within 1km, 5km, 10km radius
   - Distance to nearest hospital
   - Healthcare access index
4. Score:
   ```
   receptor_density_score = min(100, facilities_within_5km * 10)
   healthcare_access = max(0, 100 - (distance_to_hospital_km * 5))
   ```

**Automation Feasibility:** HIGH — Simple CSV download and parsing, coordinates included.

---

#### 7. OSM / Geofabrik — Road Network & Infrastructure
**Layer:** 2.3 | **Quality:** Good

**Data Source:**
```
https://download.geofabrik.de/central-america/jamaica-latest.osm.pbf
```
Other countries available at: `https://download.geofabrik.de/central-america/`

**Steps:**
1. Download the PBF file for each country
2. Extract road network using `osmium` or `osm-pbf-parser`
3. Calculate:
   - Total road km
   - Road density per km²
   - Distance from any point to nearest primary road
4. Infrastructure score component:
   ```
   road_accessibility = min(100, (road_density / reference_density) * 100)
   ```

**Automation Feasibility:** MEDIUM — Requires PBF parsing. Large files. Consider using the lighter Geofabrik shapefiles instead.

---

#### 8. Climate Central Surging Seas — Sea Level Rise
**Layer:** 1.3 | **Quality:** Proxy

**Data Source:**
```
https://coastal.climatecentral.org/
API: https://coastal.climatecentral.org/api/
```

**Steps:**
1. Query for each Caribbean coastal point of interest
2. Get inundation areas for 1m, 2m, 3m sea level rise scenarios
3. Calculate exposed land area and population per scenario
4. Score:
   ```
   slr_risk = (exposed_area_2m / total_coastal_area) * vulnerability_weight * 100
   ```

**Automation Feasibility:** LOW — Interactive platform, limited API access. May require screenshot/scrape approach or direct contact with Climate Central for data access.

---

### PRIORITY 3: Agency Requests (Requires Human Follow-Up)

These sources require formal data requests to government agencies:

| Layer | Agency | Contact Path | Data Needed |
|-------|--------|-------------|-------------|
| 1.1 | WRA Jamaica | https://www.wra.gov.jm/ | Exportable flood polygon shapefiles |
| 1.2 | ODPEM Jamaica | https://www.odpem.org.jm/ | National storm-surge grid by hurricane category |
| 2.2 | NWC Jamaica | https://www.nwcjamaica.com/ | Water/sewer service area GIS boundaries |
| 2.4 | MGD Jamaica | https://mgd.gov.jm/ | Geological hazard and landslide susceptibility maps |
| 2.5 | OUR / JPS | https://our.org.jm/ | District-level SAIDI/SAIFI reliability data |
| 3.4 | STATIN | https://statinja.gov.jm/ | Official informal settlement polygon boundaries |
| 3.5 | STATIN | https://statinja.gov.jm/ | Parish-level employment by industry GIS |
| 4.4 | MLGCD | https://www.localgovjamaica.gov.jm/ | Standardized permit timeline table by parish |
| 4.5 | JNHT | https://www.jnht.com/ | Unified national heritage GIS layer |

---

## Scoring Methodology

### Overall Risk Score (per country)
```
risk_score = weighted_average(
  environmental_hazard_score * 0.30,    // Layers 1.1-1.6
  infrastructure_score * 0.25,          // Layers 2.1-2.5
  community_risk_score * 0.25,          // Layers 3.1-3.5
  regulatory_risk_score * 0.20          // Layers 4.1-4.5
)
```

### Environmental Hazard Score (Layers 1.1–1.6)
```
environmental = weighted_average(
  flood_risk * 0.25,          // 1.1: WRA flood boundaries coverage
  coastal_storm_risk * 0.20,  // 1.2: Storm surge exposure
  slr_risk * 0.10,            // 1.3: Sea level rise vulnerability
  contamination_risk * 0.15,  // 1.4: PRTR facility proximity
  hurricane_risk * 0.20,      // 1.5: IBTrACS historical frequency
  watershed_risk * 0.10       // 1.6: Watershed drainage complexity
)
```

### Infrastructure Score (Layers 2.1–2.5)
```
infrastructure = weighted_average(
  water_stress * 0.30,        // 2.1: WRI Aqueduct score
  utility_coverage * 0.20,    // 2.2: Water/sewer service area %
  road_access * 0.15,         // 2.3: Road network density
  geological_risk * 0.15,     // 2.4: Geological hazard exposure
  power_reliability * 0.20    // 2.5: SAIDI/SAIFI metrics
)
```

### Community Risk Score (Layers 3.1–3.5)
```
community = weighted_average(
  population_exposure * 0.25,   // 3.1: Coastal population density
  receptor_proximity * 0.25,    // 3.2: Sensitive receptor density
  health_burden * 0.20,         // 3.3: Parish-level mortality rates
  informal_settlement * 0.15,   // 3.4: Informal housing exposure
  employment_dependency * 0.15  // 3.5: Single-sector dependency
)
```

### Regulatory Risk Score (Layers 4.1–4.5)
```
regulatory = weighted_average(
  protected_area_conflict * 0.25,  // 4.1: Overlap with protected areas
  zoning_compliance * 0.20,        // 4.2: Zoning designation alignment
  eia_trigger_score * 0.20,        // 4.3: EIA requirement complexity
  permit_timeline_risk * 0.20,     // 4.4: Average permit processing days
  heritage_conflict * 0.15         // 4.5: Proximity to heritage sites
)
```

### Confidence Score
```
confidence = (
  layers_with_good_quality * 1.0 +
  layers_with_partial_quality * 0.5 +
  layers_with_proxy_quality * 0.25
) / total_layers * 100
```

### CERI (Caribbean Environmental Risk Index)
```
ceri = weighted_average_of_all_country_risk_scores
  // weighted by: portfolio exposure, data confidence, GDP
```

---

## Implementation Plan

### Phase 1: Automated API Pipelines (Week 1-2)
Build a data ingestion service at `artifacts/api-server/src/services/data-ingestion/`

```
data-ingestion/
  index.ts              // Orchestrator - runs all pipelines
  aqueduct.ts           // WRI Aqueduct water stress
  ibtracs.ts            // NOAA hurricane tracks
  arcgis-jamaica.ts     // GOJ ArcGIS services
  worldpop.ts           // Population density
  opendata-jamaica.ts   // Jamaica open data CSVs
  scoring.ts            // Translates raw data → risk scores
  scheduler.ts          // Cron job for periodic refresh
```

**Key Implementation Notes:**
- Each pipeline should be idempotent (safe to re-run)
- Store raw API responses in a `raw_data_cache` table for audit trail
- Calculate scores using the methodology above
- Write final scores to `regional_indices`, `regional_data`, and `sector_benchmarks`
- Set `dataProvenance.status = "LIVE"` when at least 3 automated sources are connected

### Phase 2: Manual Data Upload Portal (Week 3)
Build an admin interface for uploading CSV/GeoJSON files from agency data requests:
- File upload endpoint: `POST /api/admin/data-upload`
- Support formats: CSV, GeoJSON, Shapefile (as ZIP)
- Auto-parse and validate against expected schema per layer
- Preview data before committing to database

### Phase 3: Multi-Country Expansion (Week 4+)
Extend the Jamaica-only verified layers to other Caribbean countries:
- Replicate the `data_layers` table entries for each country
- Use global sources (WRI, NOAA, WorldPop, HydroSHEDS) which already cover all countries
- Build country-specific ArcGIS service inventories for each nation
- Set quality = "Partial" or "Proxy" for countries without local verified sources

---

## API Keys & Authentication Required

| Source | Auth Type | Cost | How to Get |
|--------|-----------|------|------------|
| WRI Aqueduct | None (public API) | Free | N/A |
| NOAA IBTrACS | None (public CSV) | Free | N/A |
| GOJ ArcGIS | None (public services) | Free | N/A |
| WorldPop | None (public download) | Free | N/A |
| HydroSHEDS | None (public download) | Free | N/A |
| Jamaica Open Data | None (public CSVs) | Free | N/A |
| Geofabrik/OSM | None (public download) | Free | N/A |
| Climate Central | API key required | Free/request | Contact Climate Central |

---

## Verification Checklist

When transitioning from simulated to live data:

- [ ] WRI Aqueduct water stress scores populated for all 14 countries
- [ ] IBTrACS hurricane frequency calculated for Caribbean basin
- [ ] Jamaica ArcGIS services queried and scored (1.1, 1.4, 3.3, 4.1)
- [ ] WorldPop population density processed for at least Jamaica
- [ ] Jamaica open data CSVs (health centres, hospitals) parsed
- [ ] Scoring methodology applied consistently across all layers
- [ ] Confidence scores reflect actual data quality, not simulated
- [ ] `dataMoat` statistics derived from actual database counts (remove hardcoded 4500)
- [ ] `dataProvenance.status` set to `"LIVE"` in authority-summary endpoint
- [ ] 5-year trend data: use real year-over-year changes where available
- [ ] Sector benchmarks: derive from actual project portfolio data
- [ ] All raw API responses cached in `raw_data_cache` table for SOC 2 audit trail

---

## Quick-Start for AI Assistant (GPT / Claude)

If you are an AI assistant implementing this:

1. **Start with `aqueduct.ts`** — simplest API, covers all 14 countries, immediate impact on water stress scores
2. **Then `ibtracs.ts`** — download CSV, filter by lat/lng, calculate hurricane risk
3. **Then `arcgis-jamaica.ts`** — query the 13 verified ArcGIS services for Jamaica-specific scoring
4. **Then `opendata-jamaica.ts`** — parse the 3 health facility CSVs
5. **Then `scoring.ts`** — apply the weighted methodology to combine all sources into final risk scores
6. **Finally** — update `regional.ts` to set `dataProvenance.status = "LIVE"` and derive `dataMoat` from real counts

**Critical:** Do not modify the existing `data_layers` table metadata — that data is already accurate from ESL research. Only populate/update `regional_indices`, `regional_data`, and `sector_benchmarks` with real calculated scores.

**Testing:** After each pipeline, compare new scores against the simulated baselines. Scores should be in a similar range (0-100) but may differ significantly. Document any country where the real score differs by more than 20 points from the simulation — this is expected and correct.
