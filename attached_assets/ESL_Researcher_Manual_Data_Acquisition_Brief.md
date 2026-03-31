# ESL Platform — Manual Data Acquisition Brief for Researcher

**Prepared by:** ESL Platform Team
**Date:** March 2026 (Updated)
**Classification:** Confidential — Internal Use Only

---

## 1. Context

The ESL Environmental Intelligence Platform has **18 automated data ingestion pipelines** that pull live data from free/open APIs for all **17 Caribbean countries**. These pipelines cover the following layers automatically — **you do not need to acquire data for these:**

| Layer ID | Layer Name | Automated Source | Status |
|----------|-----------|-----------------|--------|
| 1.1 (partial) | Flood Hazard — Country-Level Risk Scores | JRC Global Flood Model (country-level proxy) | AUTOMATED |
| 1.3 (partial) | Sea Level Rise — Projections & Coastal Exposure | NOAA Tides & Currents API + IPCC projections | AUTOMATED |
| 1.5 | Hurricane Track & Wind Speed History | NOAA IBTrACS API | LIVE |
| 1.6 (partial) | Watershed & Drainage Basin Data | HydroSHEDS / WWF reference data | AUTOMATED |
| 2.1 | Water Stress Index | WRI Aqueduct | LIVE |
| 2.3 (partial) | Road Network & Infrastructure Density | OpenStreetMap Overpass API (live counts) + reference | AUTOMATED |
| 2.4 | Geotechnical / Soil Data | SoilGrids REST API (250m) | AUTOMATED |
| 3.1 | Population Density Grids | WorldPop API | AUTOMATED |
| 3.2 | Sensitive Receptor Mapping (partial) | Open-Data Jamaica + OpenStreetMap | LIVE (Jamaica) |
| 3.3 | Health Burden Data | WHO Global Health Observatory API | AUTOMATED |
| 3.4 (partial) | Informal Settlement / Housing Quality — Country-Level Estimates | Google Open Buildings reference data | AUTOMATED |
| 3.5 | Employment & Livelihood Data | World Bank Development Indicators API | AUTOMATED |
| 4.1 | Protected Area Boundaries | WDPA / Protected Planet API | AUTOMATED |
| 4.5 | Cultural Heritage & Indigenous Sites | UNESCO World Heritage API | AUTOMATED |
| — | Coral Reef & Sea Surface Temperature | NOAA Coral Reef Watch API | AUTOMATED |
| — | Seismic Risk | USGS Earthquake Hazards API | AUTOMATED |
| 4.2 | NEPA EIA Regulatory Intelligence | NEPA Jamaica (nepa.gov.jm) web scraping | AUTOMATED (Jamaica) |
| — | ArcGIS Jamaica (planning, mortality, protected areas) | GOJ MSET ArcGIS FeatureServer | LIVE (Jamaica) |

**What the platform now covers automatically:** 18 pipelines producing 4,844+ data records across 101 dataset types for all 17 countries.

**Your assignment now covers a reduced set of layers** — several previously manual layers are now partially automated. You are needed for **high-resolution national data upgrades** and the layers that cannot be automated at all.

---

## 2. Layers You Need to Acquire

### Priority A — Critical Layers (High-Resolution Upgrades)

These layers have **country-level automated proxies already in the platform**, but higher-resolution GIS data would significantly improve risk scoring precision. Your job is to find and download the high-resolution national versions.

#### Layer 1.1 — Flood Hazard Maps (HIGH-RES UPGRADE)
- **Platform already has:** Country-level flood risk scores from JRC Global Flood Model (25yr and 100yr return periods, coastal/river exposure scores)
- **What you need to find:** Sub-national GIS flood zone polygons at 25-, 50-, and 100-year return periods
- **Format needed:** GIS shapefiles (polygons) or GeoTIFF raster
- **Start here (free):**
  - FATHOM Global Flood Model — check for Caribbean coverage at [fathom.global](https://www.fathom.global)
  - JRC Global Flood Map — [data.jrc.ec.europa.eu](https://data.jrc.ec.europa.eu) — download the actual raster tiles (not just the stats we have)
  - CDEMA GeoCRIS — [geocris2.cdema.org](https://geocris2.cdema.org)
  - CCRIF SPC — [ccrif.org](https://www.ccrif.org) (may require data request)
- **Then try national:**
  - Jamaica: ODPEM, Water Resources Authority
  - Trinidad: ODPM
  - Barbados: Department of Emergency Management
- **Value add:** Converts our country-level risk score into site-specific flood zone classification

#### Layer 1.2 — Coastal Inundation & Storm Surge Models
- **Platform already has:** Sea level rise projections and coastal exposure percentages
- **What you need to find:** Storm surge height projections for Category 1–5 hurricane scenarios as spatial data
- **Format needed:** GeoTIFF raster or vector contour polygons
- **Start here:**
  - NOAA SLOSH model outputs — [nhc.noaa.gov/surge/slosh.php](https://www.nhc.noaa.gov/surge/slosh.php)
  - CDEMA GeoCRIS storm surge layers
  - Caribbean Community Climate Change Centre (5Cs) — [caribbeanclimate.bz](https://www.caribbeanclimate.bz)
- **Acceptable proxy:** NOAA SLOSH composite outputs for the Caribbean basin

#### Layer 1.3 — Sea Level Rise Projections (HIGH-RES UPGRADE)
- **Platform already has:** Country-level SLR projections (current rate mm/yr, RCP4.5 and RCP8.5 at 2050 and 2100, low-elevation coastal zone %, coastline length, composite risk scores)
- **What you need to find:** Spatial inundation raster layers showing which specific areas flood under SLR scenarios
- **Format needed:** Raster inundation layers (GeoTIFF) by coastal segment
- **Start here:**
  - NASA Sea Level Portal — [sealevel.nasa.gov](https://sealevel.nasa.gov)
  - Climate Central Coastal Risk Screening Tool — [coastal.climatecentral.org](https://coastal.climatecentral.org) (interactive, may need to request bulk data)
- **Value add:** Converts our country-level SLR risk score into site-specific inundation maps

#### Layer 1.4 — Soil & Groundwater Contamination
- **Platform does NOT have any automated data for this layer**
- **What:** Registered contaminated sites, brownfield registries, industrial discharge records, landfill locations
- **Format needed:** Point data (lat/long) with contamination type and severity, or polygon boundaries
- **National sources (formal data request likely required):**
  - Jamaica: NEPA — contaminated sites register, industrial discharge permits
  - Trinidad: EMA — Certificate of Environmental Clearance database
  - Barbados: Environmental Protection Department
  - Bahamas: Department of Environmental Health Services
- **Regional fallback:** PAHO environmental health country profiles, WHO WASH data
- **IMPORTANT:** This layer will likely require formal written data requests. Document agency name, contact email, and request status in the Source Contact List even if data is not received.

#### Layer 1.6 — Watershed & Drainage Basin Maps (HIGH-RES UPGRADE)
- **Platform already has:** Country-level watershed data (major basins, sub-basins, total stream length, drainage density, floodplain %, major river names, watershed flood risk scores)
- **What you need to find:** The actual GIS shapefiles showing watershed boundaries and river networks
- **Format needed:** GIS polygons (watersheds) + polylines (rivers/streams)
- **Start here (free download):**
  - HydroSHEDS — [hydrosheds.org](https://www.hydrosheds.org) — download HydroBASINS Level 8-12 for Central America & Caribbean region
  - This is a file download, not an API. Download the "Central America and Caribbean" region files.
- **Value add:** Enables site-specific watershed overlay rather than just country averages

---

### Priority B — Important Layers (Tier 1 countries first)

#### Layer 2.2 — Utility Infrastructure Maps (UPGRADE FROM OSM PROXY)
- **Platform already has:** Road and infrastructure counts/density from OpenStreetMap (total roads, primary roads, bridges, power lines, hospitals per country) with vulnerability scores
- **What you need to find:** Official water supply, power grid, and sewerage/wastewater network coverage areas from national utilities
- **Format needed:** GIS polygons (service areas) or polylines (networks)
- **National sources:**
  - Jamaica: NWC (water), JPS (power), National Works Agency
  - Trinidad: WASA (water), T&TEC (power)
  - Barbados: BWA (water), BLPC (power)
  - Bahamas: WSC (water), BPL (power)
- **Priority:** Tier 1 countries only. Platform OSM proxy is acceptable for Tier 3.

#### Layer 2.3 — Road Network Flood Vulnerability
- **Platform already has:** Total road counts from OSM Overpass API (live data: 61K segments Jamaica, 203K Dominican Republic) and road density per country
- **What you still need:** Identification of flood-vulnerable road segments — this data is not available from OSM
- **Where to look:** National Works Agencies, post-disaster road damage reports, CDEMA assessments
- **Priority:** Jamaica and Trinidad only for this assignment

#### Layer 2.5 — Power Grid Reliability
- **Platform does NOT have any automated data for this layer**
- **What:** Average outage frequency (SAIFI) and duration (SAIDI) by service district
- **Format needed:** Tabular data by grid district or parish
- **Sources:**
  - CARILEC — [carilec.org](https://www.carilec.org) — may publish aggregate statistics
  - National utility annual reports (JPS Jamaica, T&TEC Trinidad, BLPC Barbados, BPL Bahamas)
  - Office of Utilities Regulation (OUR) Jamaica — publishes JPS performance data
- **Acceptable format:** Even a PDF annual report table showing SAIFI/SAIDI by parish is useful — we can digitize it.

#### Layer 3.4 — Informal Settlement / Housing Quality (HIGH-RES UPGRADE)
- **Platform already has:** Country-level estimates (total buildings, building density, avg building area, informal settlement %, coastal building %, housing vulnerability scores)
- **What you need to find:** Actual GIS boundaries of informal settlements and building footprint data
- **Format needed:** GIS polygons or classified satellite imagery
- **Start here:**
  - Google Open Buildings — [sites.research.google/open-buildings](https://sites.research.google/open-buildings) — download Caribbean building footprints
  - UN-Habitat urban profiles for Caribbean countries
- **Then try national:** STATIN (Jamaica), Central Statistical Office (Trinidad)
- **Priority countries:** Haiti, Jamaica, Trinidad, Dominican Republic, Guyana

#### Layer 4.2 — Zoning & Land Use Designations
- **Platform does NOT have any automated data for this layer**
- **What:** Official land use zoning maps
- **Format needed:** GIS polygons with zoning classification
- **National sources only:**
  - Jamaica: National Land Agency, Town & Country Planning Authority
  - Trinidad: Town and Country Planning Division
  - Barbados: Town and Country Development Planning Office
- **Acceptable proxy for Tier 3:** ESA WorldCover 10m satellite land cover classification — download from [esa-worldcover.org](https://esa-worldcover.org)

#### Layer 4.3 — EIA Requirement Triggers
- **Platform does NOT have any automated data for this layer**
- **What:** Which project types/sizes require full EIA, screening, or exemption by location
- **Format needed:** Structured table (project type x size x location → EIA requirement level)
- **Sources:**
  - Jamaica: NRCA Act + NEPA Prescribed Activities List
  - Trinidad: EMA Act + CEC Designated Activities Rules
  - Barbados: Environmental Protection Act
- **Note:** This is legal/regulatory research, not GIS data. Deliver as a structured spreadsheet with columns: Country | Project Type | Size Threshold | Location Trigger | EIA Level Required | Legal Reference

#### Layer 4.4 — Permit Processing Timelines
- **Platform does NOT have any automated data for this layer**
- **What:** Historical permit approval timelines by project type and parish/district
- **Format needed:** Tabular — average/median/90th-percentile processing days
- **Sources:**
  - World Bank Doing Business — Construction Permits sub-indicator (archived)
  - Jamaica: NEPA annual report, Planning Institute of Jamaica
  - Trinidad: EMA annual report
- **Priority:** Tier 1 countries only for this assignment

---

## 3. Countries (Priority Order)

Complete in this exact order. Jamaica must be fully done first.

| Priority | Countries | ISO Codes |
|----------|----------|-----------|
| 1 — Immediate | Jamaica | JM |
| 2 | Trinidad & Tobago | TT |
| 3 | Barbados, Bahamas | BB, BS |
| 4 | Dominican Republic, Guyana | DO, GY |
| 5 | Belize, Antigua & Barbuda, St. Lucia | BZ, AG, LC |
| 6 — Final | Haiti, Suriname, Grenada, St. Vincent & the Grenadines, Dominica | HT, SR, GD, VC, DM |

---

## 4. File Organization

Use this exact folder structure for every country:

```
caribbean_geodata/
├── JM/
│   ├── raw_data/          ← All downloaded files exactly as received
│   ├── derived_metadata/  ← Clipped layers, reprojected files, quality notes
│   └── JM_data_inventory.xlsx
├── TT/
│   ├── raw_data/
│   ├── derived_metadata/
│   └── TT_data_inventory.xlsx
├── [repeat for all 17 country codes]
└── 00_REGIONAL/           ← Basin-wide datasets stored once here
    ├── raw_data/
    └── derived_metadata/
```

**Regional datasets** (HydroSHEDS, FATHOM flood, NOAA SLOSH) that cover the entire Caribbean go in `00_REGIONAL/`, not duplicated per country.

---

## 5. Inventory Spreadsheet Format

One spreadsheet per country: `[CODE]_data_inventory.xlsx`. Each row = one layer. Required columns:

| Column | Description |
|--------|-------------|
| Layer ID | e.g. 1.1, 1.2, 2.2 |
| Layer Name | Full descriptive name |
| Country | ISO code |
| Source Name | Organization name |
| Source URL | Direct link or portal |
| Date Downloaded | YYYY-MM-DD |
| Format | Shapefile / GeoTIFF / CSV / PDF |
| Resolution / Scale | e.g. 30m, 1:25,000 |
| Coverage Area | National / Coastal / Parish |
| Access Method | Public download / Request / Purchase |
| Cost | Free / USD estimate |
| Quality Assessment | Good / Partial / Proxy / Missing |
| Platform Proxy Status | Whether the platform already has a country-level proxy for this layer |
| File Path | Relative path in folder |
| Notes | Caveats, gaps, licence restrictions |

**Every layer must have a row** — even if the data was not found. Use quality rating "Missing" and explain in Notes.

**NEW COLUMN — Platform Proxy Status:** For layers marked "HIGH-RES UPGRADE" in this brief, note "Country-level proxy exists — this is a resolution upgrade" in this column. For layers with no automated proxy, note "No automated proxy — manual data required."

---

## 6. Quality Ratings

| Rating | Meaning |
|--------|---------|
| Good | National or high-resolution regional data. Resolution meets requirement. Licence permits commercial use. |
| Partial | Data found with limitations: spatial gaps, outdated (>5 years), or resolution below requirement. |
| Proxy | No country-specific data. A credible global/regional substitute is used. Document source and limitations. |
| Missing | No data and no credible proxy. Escalate to ESL project lead. |

---

## 7. Deliverables Checklist

| # | Deliverable | Description |
|---|------------|-------------|
| 1 | Data Inventory Spreadsheets (17) | One per country in the format above. Every layer must have an entry. |
| 2 | Raw Data Files | All downloaded shapefiles, rasters, CSVs in `/raw_data` folders exactly as received. |
| 3 | Coverage Gap Report | Consolidated document listing every layer that could not be sourced, with recommended proxy and rationale. |
| 4 | Source Contact List | Agency name, contact person, email, data request process for layers requiring formal requests. |
| 5 | Licence / Usage Notes | Restrictions on data use, redistribution, or commercial application. Flag any layers that cannot be used commercially. |

---

## 8. Layers You Do NOT Need to Acquire

The following are fully handled by the platform's **17 automated pipelines**. **Do not spend time on these:**

- Layer 1.5 — Hurricane Tracks (IBTrACS — automated, 9,880 Caribbean storm track points)
- Layer 2.1 — Water Stress (Aqueduct — automated)
- Layer 2.4 — Soil Data (SoilGrids — automated)
- Layer 3.1 — Population Density (WorldPop — automated)
- Layer 3.2 — Sensitive Receptors (automated for health facilities; OSM for schools/markets)
- Layer 3.3 — Health Burden (WHO GHO — automated, 7 indicators per country)
- Layer 3.5 — Employment/Livelihoods (World Bank — automated, 10 indicators per country)
- Layer 4.1 — Protected Areas (WDPA — automated)
- Layer 4.5 — Cultural Heritage (UNESCO — automated)
- Coral Reef/SST data (NOAA Coral Reef Watch — automated)
- Seismic data (USGS — automated, 2,000+ events over 20 years)

**Layers with country-level proxies (you ARE upgrading these to high-res):**

- Layer 1.1 — Flood Hazard (JRC proxy: 25yr/100yr flood %, coastal/river exposure — you provide GIS polygons)
- Layer 1.3 — Sea Level Rise (NOAA/IPCC proxy: rates, projections, coastal zone % — you provide inundation rasters)
- Layer 1.6 — Watersheds (HydroSHEDS proxy: basin counts, stream length, drainage density — you provide GIS shapefiles)
- Layer 2.3 — Road Network (OSM proxy: road counts, density, classification — you provide flood-vulnerable segments)
- Layer 3.4 — Housing Quality (Open Buildings proxy: building counts, informal %, vulnerability — you provide GIS boundaries)

**However:** If you find higher-resolution national versions of any fully automated layer (e.g., Jamaica's NEPA has a more detailed protected areas dataset than WDPA), please download it and note it in the inventory as a potential upgrade.

---

## 9. How Your Data Will Be Used

Once you deliver the files, the ESL platform team will:

1. **Ingest** your GIS files into the platform's data pipeline (adding to the existing 4,800+ automated records)
2. **Index** them so that when a user drops a pin on the map, the system queries all layers at that GPS coordinate
3. **Score** each layer's contribution to the four risk subscores (Environmental, Infrastructure, Human Exposure, Regulatory)
4. **Display** the results on the platform dashboard — fully automated, no manual input

The goal is: **a user enters a project address, and the system computes all risk scores automatically from your data + our 17 API pipelines.**

Your high-resolution data will **replace** the country-level proxies where available, giving site-specific rather than country-average risk assessments.

---

## 10. Summary of What's Changed

| Status | Before (12 pipelines) | After (17 pipelines) |
|--------|----------------------|---------------------|
| Flood Hazard (1.1) | Manual — you sourced everything | Platform has country-level proxy — you upgrade to GIS polygons |
| Storm Surge (1.2) | Manual | Still manual — no API source found |
| Sea Level Rise (1.3) | Manual | Platform has country-level projections — you upgrade to inundation rasters |
| Contamination (1.4) | Manual | Still manual — national registries only |
| Watersheds (1.6) | Manual | Platform has country stats — you upgrade to GIS shapefiles |
| Utility Infrastructure (2.2) | Manual | Platform has OSM proxy — you upgrade with official utility maps |
| Road Network (2.3) | Manual | Platform has OSM road counts (live Overpass API) — you add flood-vulnerable segments |
| Power Grid (2.5) | Manual | Still manual — SAIFI/SAIDI from utility companies |
| Housing Quality (3.4) | Manual | Platform has country estimates — you upgrade with GIS boundaries |
| Zoning (4.2) | Manual | Still manual — national planning authorities |
| EIA Triggers (4.3) | Manual | Still manual — legal/regulatory research |
| Permit Timelines (4.4) | Manual | Still manual — regulatory research |

**Net result:** Your scope reduced from 9 fully manual layers to **4 fully manual + 5 high-res upgrades.**

---

## 11. Questions / Escalation

- For data access issues: Contact Stephen Jones, Managing Director
- For technical format questions: Contact ESL Platform Team
- For formal data requests that require institutional letterhead: Flag in Source Contact List deliverable and notify Stephen Jones

---

*Environmental Solutions Limited | Confidential — Internal Use Only | March 2026*
