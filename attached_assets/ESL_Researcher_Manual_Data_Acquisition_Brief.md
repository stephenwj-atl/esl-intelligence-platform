# ESL Platform — Manual Data Acquisition Brief for Researcher

**Prepared by:** ESL Platform Team
**Date:** March 2026
**Classification:** Confidential — Internal Use Only

---

## 1. Context

The ESL Environmental Intelligence Platform has **12 automated data ingestion pipelines** that pull live data from free/open APIs for all 14 Caribbean countries. These pipelines cover the following layers automatically — **you do not need to acquire data for these:**

| Layer ID | Layer Name | Automated Source | Status |
|----------|-----------|-----------------|--------|
| 1.5 | Hurricane Track & Wind Speed History | NOAA IBTrACS API | LIVE |
| 2.1 | Water Stress Index | WRI Aqueduct | LIVE |
| 2.4 | Geotechnical / Soil Data | SoilGrids REST API (250m) | AUTOMATED |
| 3.1 | Population Density Grids | WorldPop API | AUTOMATED |
| 3.2 | Sensitive Receptor Mapping (partial) | Open-Data Jamaica + OpenStreetMap | LIVE (Jamaica) |
| 3.3 | Health Burden Data | WHO Global Health Observatory API | AUTOMATED |
| 3.5 | Employment & Livelihood Data | World Bank Development Indicators API | AUTOMATED |
| 4.1 | Protected Area Boundaries | WDPA / Protected Planet API | AUTOMATED |
| 4.5 | Cultural Heritage & Indigenous Sites | UNESCO World Heritage API | AUTOMATED |
| — | Coral Reef & Sea Surface Temperature | NOAA Coral Reef Watch API | AUTOMATED |
| — | Seismic Risk | USGS Earthquake Hazards API | AUTOMATED |
| — | ArcGIS Jamaica (planning, mortality, protected areas) | GOJ MSET ArcGIS FeatureServer | LIVE (Jamaica) |

**Your assignment covers the remaining layers that cannot be automated** because the data exists only as downloadable GIS files, national registry records, or information requiring formal data requests.

---

## 2. Layers You Need to Acquire

### Priority A — Critical Layers (acquire for all 14 countries)

#### Layer 1.1 — Flood Hazard Maps
- **What:** Flood zone classifications at 25-, 50-, and 100-year return periods
- **Format needed:** GIS shapefiles (polygons) or GeoTIFF raster
- **Start here (free):**
  - FATHOM Global Flood Model — check for Caribbean coverage at [fathom.global](https://www.fathom.global)
  - JRC Global Flood Map — [data.jrc.ec.europa.eu](https://data.jrc.ec.europa.eu)
  - CDEMA GeoCRIS — [geocris2.cdema.org](https://geocris2.cdema.org)
  - CCRIF SPC — [ccrif.org](https://www.ccrif.org) (may require data request)
- **Then try national:**
  - Jamaica: Office of Disaster Preparedness and Emergency Management (ODPEM), Water Resources Authority
  - Trinidad: Office of Disaster Preparedness and Management (ODPM)
  - Barbados: Department of Emergency Management
  - Others: National disaster/met offices
- **Acceptable proxy for Tier 3 countries:** JRC Global Flood Map or FATHOM

#### Layer 1.2 — Coastal Inundation & Storm Surge Models
- **What:** Storm surge height projections for Category 1–5 hurricane scenarios
- **Format needed:** GeoTIFF raster or vector contour polygons
- **Start here:**
  - NOAA SLOSH model outputs — [nhc.noaa.gov/surge/slosh.php](https://www.nhc.noaa.gov/surge/slosh.php)
  - CDEMA GeoCRIS storm surge layers
  - Caribbean Community Climate Change Centre (5Cs) — [caribbeanclimate.bz](https://www.caribbeanclimate.bz)
- **Then try national:** National disaster offices, coastal zone management units
- **Acceptable proxy:** NOAA SLOSH composite outputs for the Caribbean basin

#### Layer 1.3 — Sea Level Rise Projections
- **What:** Projected SLR under RCP 4.5 and RCP 8.5 at 2030, 2050, and 2100
- **Format needed:** Raster inundation layers or tabular data by coastal segment
- **Start here:**
  - NASA Sea Level Portal — [sealevel.nasa.gov](https://sealevel.nasa.gov)
  - Climate Central Coastal Risk Screening Tool — [coastal.climatecentral.org](https://coastal.climatecentral.org) (interactive, may need to request bulk data)
  - IPCC AR6 downscaled projections
- **Note:** Climate Central does not offer bulk data download. If unable to get raster files, document the web tool URL and note "interactive only — no bulk download available" in the inventory.

#### Layer 1.4 — Soil & Groundwater Contamination
- **What:** Registered contaminated sites, brownfield registries, industrial discharge records, landfill locations
- **Format needed:** Point data (lat/long) with contamination type and severity, or polygon boundaries
- **National sources (formal data request likely required):**
  - Jamaica: NEPA (National Environment and Planning Agency) — contaminated sites register, industrial discharge permits
  - Trinidad: EMA (Environmental Management Authority) — Certificate of Environmental Clearance database
  - Barbados: Environmental Protection Department
  - Bahamas: Department of Environmental Health Services
  - Others: Equivalent environment ministries
- **Regional fallback:** PAHO environmental health country profiles, WHO WASH data
- **Acceptable proxy for Tier 3:** Satellite-detected industrial activity via Google Earth Engine + known landfill locations from OpenStreetMap
- **IMPORTANT:** This layer will likely require formal written data requests. Document agency name, contact email, and request status in the Source Contact List even if data is not received during this assignment.

#### Layer 1.6 — Watershed & Drainage Basin Maps
- **What:** Watershed boundaries, river networks, drainage basin delineations
- **Format needed:** GIS polygons (watersheds) + polylines (rivers/streams)
- **Start here (free download):**
  - HydroSHEDS — [hydrosheds.org](https://www.hydrosheds.org) — download HydroBASINS Level 8-12 for Central America & Caribbean region
  - This is a file download, not an API. Download the "Central America and Caribbean" region files.
- **Then try national:** Water Resources Authority (Jamaica), Water and Sewerage Authority (Trinidad)
- **Note:** HydroSHEDS should cover all 14 countries at reasonable resolution. National data only needed if higher resolution exists.

---

### Priority B — Important Layers (acquire for Tier 1 countries first, then expand)

#### Layer 2.2 — Utility Infrastructure Maps
- **What:** Water supply, power grid, and sewerage/wastewater network coverage areas
- **Format needed:** GIS polygons (service areas) or polylines (networks)
- **National sources only — no global source exists:**
  - Jamaica: NWC (National Water Commission), JPS (Jamaica Public Service — power), National Works Agency
  - Trinidad: WASA (Water and Sewerage Authority), T&TEC (power)
  - Barbados: BWA (Barbados Water Authority), BLPC (power)
  - Bahamas: WSC (Water and Sewerage Corporation), BPL (Bahamas Power and Light)
- **Acceptable proxy:** OpenStreetMap infrastructure data (waterways, power lines tagged in OSM)
- **Priority:** Tier 1 countries first. For Tier 3, OSM proxy is acceptable.

#### Layer 2.3 — Road Network & Access Vulnerability
- **What:** Road network with classification and known flood-prone segments
- **Format needed:** GIS polylines with attributes
- **Start here:**
  - OpenStreetMap — download country extracts from [download.geofabrik.de](https://download.geofabrik.de) for Central America & Caribbean
  - This covers road classification (highway, primary, secondary, unpaved) for all 14 countries
- **Then try national:** National Works Agencies for flood-vulnerable road segment data
- **Note:** OSM road network data is generally good for Tier 1 countries. The hard part is identifying flood-vulnerable segments — this may only be available from post-disaster road damage reports from national agencies.

#### Layer 2.5 — Power Grid Reliability
- **What:** Average outage frequency (SAIFI) and duration (SAIDI) by service district
- **Format needed:** Tabular data by grid district or parish
- **Sources:**
  - CARILEC (Caribbean Electric Utility Services Corporation) — [carilec.org](https://www.carilec.org) — may publish aggregate statistics
  - National utility annual reports (JPS Jamaica, T&TEC Trinidad, BLPC Barbados, BPL Bahamas)
  - Office of Utilities Regulation (OUR) Jamaica — publishes JPS performance data
- **Acceptable format:** Even a PDF annual report table showing SAIFI/SAIDI by parish is useful — we can digitize it.

#### Layer 3.4 — Informal Settlement / Housing Quality
- **What:** Locations and boundaries of informal settlements; housing quality assessments
- **Format needed:** GIS polygons or classified satellite imagery
- **Start here:**
  - Google Open Buildings — [sites.research.google/open-buildings](https://sites.research.google/open-buildings) — download Caribbean building footprints
  - UN-Habitat urban profiles for Caribbean countries
- **Then try national:** Statistical Institute of Jamaica (STATIN), Central Statistical Office (Trinidad)
- **Priority countries:** Haiti, Jamaica, Trinidad, Dominican Republic, Guyana
- **Acceptable proxy:** Google Open Buildings density analysis + ESA WorldCover 10m land cover classification

#### Layer 4.2 — Zoning & Land Use Designations
- **What:** Official land use zoning maps
- **Format needed:** GIS polygons with zoning classification
- **National sources only:**
  - Jamaica: National Land Agency, Town & Country Planning Authority, Parish Council development order maps
  - Trinidad: Town and Country Planning Division
  - Barbados: Town and Country Development Planning Office
  - Others: Equivalent planning authorities
- **Acceptable proxy for Tier 3:** ESA WorldCover 10m satellite land cover classification — download from [esa-worldcover.org](https://esa-worldcover.org)

#### Layer 4.3 — EIA Requirement Triggers
- **What:** Which project types/sizes require full EIA, screening, or exemption by location
- **Format needed:** Structured table (project type x size x location → EIA requirement level)
- **Sources:**
  - Jamaica: NRCA Act + NEPA Prescribed Activities List
  - Trinidad: EMA Act + CEC Designated Activities Rules
  - Barbados: Environmental Protection Act
  - Each country: Review the primary environmental legislation and extract the trigger thresholds
- **Note:** This is legal/regulatory research, not GIS data. Deliver as a structured spreadsheet with columns: Country | Project Type | Size Threshold | Location Trigger | EIA Level Required | Legal Reference

#### Layer 4.4 — Permit Processing Timelines
- **What:** Historical permit approval timelines by project type and parish/district
- **Format needed:** Tabular — average/median/90th-percentile processing days
- **Sources:**
  - World Bank Doing Business — Construction Permits sub-indicator (historical data, discontinued but archived)
  - Jamaica: NEPA annual report, Planning Institute of Jamaica
  - Trinidad: EMA annual report
  - Others: Planning authority annual reports, transparency portals
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
├── [repeat for all 14 country codes]
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
| File Path | Relative path in folder |
| Notes | Caveats, gaps, licence restrictions |

**Every layer must have a row** — even if the data was not found. Use quality rating "Missing" and explain in Notes.

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
| 1 | Data Inventory Spreadsheets (14) | One per country in the format above. Every layer must have an entry. |
| 2 | Raw Data Files | All downloaded shapefiles, rasters, CSVs in `/raw_data` folders exactly as received. |
| 3 | Coverage Gap Report | Consolidated document listing every layer that could not be sourced, with recommended proxy and rationale. |
| 4 | Source Contact List | Agency name, contact person, email, data request process for layers requiring formal requests. |
| 5 | Licence / Usage Notes | Restrictions on data use, redistribution, or commercial application. Flag any layers that cannot be used commercially. |

---

## 8. Layers You Do NOT Need to Acquire

The following are handled by the platform's automated pipelines. **Do not spend time on these:**

- Layer 1.5 — Hurricane Tracks (IBTrACS — automated)
- Layer 2.1 — Water Stress (Aqueduct — automated)
- Layer 2.4 — Soil Data (SoilGrids — automated)
- Layer 3.1 — Population Density (WorldPop — automated)
- Layer 3.2 — Sensitive Receptors (automated for health facilities; OSM for schools/markets)
- Layer 3.3 — Health Burden (WHO GHO — automated)
- Layer 3.5 — Employment/Livelihoods (World Bank — automated)
- Layer 4.1 — Protected Areas (WDPA — automated)
- Layer 4.5 — Cultural Heritage (UNESCO — automated)
- Coral Reef/SST data (NOAA Coral Reef Watch — automated)
- Seismic data (USGS — automated)

**However:** If you find higher-resolution national versions of any automated layer (e.g., Jamaica's NEPA has a more detailed protected areas dataset than WDPA), please download it and note it in the inventory as a potential upgrade.

---

## 9. How Your Data Will Be Used

Once you deliver the files, the ESL platform team will:

1. **Ingest** your GIS files into the platform's data pipeline
2. **Index** them so that when a user drops a pin on the map, the system queries all layers at that GPS coordinate
3. **Score** each layer's contribution to the four risk subscores (Environmental, Infrastructure, Human Exposure, Regulatory)
4. **Display** the results on the platform dashboard — fully automated, no manual input

The goal is: **a user enters a project address, and the system computes all risk scores automatically from your data + our API pipelines.**

---

## 10. Questions / Escalation

- For data access issues: Contact Stephen Jones, Managing Director
- For technical format questions: Contact ESL Platform Team
- For formal data requests that require institutional letterhead: Flag in Source Contact List deliverable and notify Stephen Jones

---

*Environmental Solutions Limited | Confidential — Internal Use Only | March 2026*
