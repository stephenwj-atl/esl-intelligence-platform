# ESL Environmental Intelligence Platform — Data Capability Brief

**Prepared for:** Development Finance Institution Partners (IDB, CDB, World Bank, etc.)
**Prepared by:** Environmental Solutions Limited
**Date:** March 2026
**Classification:** Confidential — Client Discussion Document

---

## Executive Summary

The ESL Environmental Intelligence Platform delivers **automated environmental risk intelligence** for capital deployment decisions across the Caribbean. Instead of waiting months for manual environmental assessments before approving a project, your team gets a data-driven risk score — backed by 17 live data pipelines covering 17 Caribbean countries — within minutes of entering a project location.

**The core value proposition:** Every dollar you deploy in the Caribbean carries environmental risk. Our platform quantifies that risk automatically, tells you whether to Proceed, Condition, or Decline, and shows you exactly what environmental services are needed before capital can safely flow.

---

## What We've Built: The Data Foundation

### 17 Automated Data Pipelines — Live and Verified

The platform continuously ingests environmental, infrastructure, social, and regulatory data from authoritative international sources. This is not static data — these pipelines pull fresh information from live APIs and update automatically.

| # | Data Layer | Source | What It Tells You | Coverage |
|---|-----------|--------|-------------------|----------|
| 1 | **Hurricane Exposure** | NOAA IBTrACS | Historical hurricane tracks, wind speeds, and frequency near a project site. How often has this area been hit, and how hard? | 17 countries, 9,880 storm track points, 20+ years |
| 2 | **Water Stress** | WRI Aqueduct | How much pressure is on local water resources. Will your project compete for scarce water, or face drought risk? | 17 countries |
| 3 | **Flood Hazard Risk** | EU JRC Global Flood Model | What percentage of the country is flood-prone at 25-year and 100-year return periods. Coastal vs. river flood exposure. | 17 countries |
| 4 | **Sea Level Rise** | NOAA Tides & Currents + IPCC | Current rate of sea level rise, projections to 2050 and 2100 under different climate scenarios, and what percentage of coastal land is at risk. | 17 countries |
| 5 | **Seismic Risk** | USGS Earthquake Hazards | 20 years of earthquake data (magnitude 3.0+) — event frequency, maximum magnitude, and proximity to population centres. | 17 countries, 2,000+ events |
| 6 | **Coral Reef & Ocean Temperature** | NOAA Coral Reef Watch | Sea surface temperature anomalies, degree heating weeks, and bleaching alert levels — critical for coastal and tourism projects. | 17 countries |
| 7 | **Soil Classification** | ISRIC SoilGrids | Clay content, sand content, pH, and organic carbon levels — determines foundation suitability and land use constraints. | 17 countries |
| 8 | **Watershed & Drainage** | HydroSHEDS (WWF) | Major drainage basins, river networks, drainage density, and floodplain area — tells you if a project sits in a flood-conveyance zone. | 17 countries |
| 9 | **Road & Infrastructure Density** | OpenStreetMap (Live API) | Road network density, primary road coverage, bridges, power line coverage, and hospital access — measures infrastructure vulnerability and connectivity. | 17 countries, live Overpass API |
| 10 | **Population Density & Exposure** | WorldPop | How many people live near a project site and urban density patterns — critical for social impact assessment and receptor mapping. | 17 countries |
| 11 | **Health Infrastructure** | WHO Global Health Observatory | Life expectancy, mortality rates, physician density, hospital bed density, health expenditure — measures community health resilience. | 17 countries, 7 indicators |
| 12 | **Development Indicators** | World Bank | GDP per capita, electricity access, water/sanitation coverage, unemployment, poverty rates, CO2 emissions — measures development vulnerability. | 17 countries, 10 indicators |
| 13 | **Protected Areas** | WDPA / Protected Planet | National parks, marine reserves, and conservation zones — identifies regulatory conflict risk for projects near protected land. | 17 countries |
| 14 | **Cultural Heritage Sites** | UNESCO World Heritage | World Heritage sites and heritage risk — flags projects that may trigger cultural heritage review requirements. | 17 countries |
| 15 | **Building Density & Housing** | Google Open Buildings | Building counts, informal settlement percentages, coastal building exposure — measures community vulnerability and housing quality. | 17 countries |
| 16 | **Health Facilities (Jamaica)** | Jamaica Open Data Portal | 345 geo-located health facilities — enables precise receptor mapping for Jamaican projects. | Jamaica (345 facilities) |
| 17 | **Planning & Land Use (Jamaica)** | Government of Jamaica ArcGIS | Planning proposals (131K records), protected areas, mortality data, planning area boundaries — high-resolution Jamaica intelligence. | Jamaica (4 active services) |

**Total: 4,800+ data records across 85 dataset types, 17 Caribbean countries.**

---

## What This Means for a Client Like IDB

### Problem 1: "We can't deploy capital fast enough because environmental due diligence takes too long."

**How we solve it:** When your investment officer is evaluating a proposed solar farm in Jamaica or a hotel development in Barbados, they enter the project location. Within minutes, the platform:

- Pulls the latest hurricane track data to show storm exposure history
- Checks if the site sits in a flood zone (25-year or 100-year return period)
- Identifies whether it's near a protected area or World Heritage site
- Calculates water stress and soil suitability
- Assesses population exposure and health infrastructure proximity
- Returns a composite risk score with a clear recommendation: **Proceed, Condition, or Decline**

What used to take weeks of consultant engagement now takes minutes for initial screening.

### Problem 2: "We don't know which projects in our Caribbean portfolio carry the most environmental risk."

**How we solve it:** The platform scores every project against the same data foundation, so you can:

- Rank your entire Caribbean portfolio by environmental risk
- Identify which countries carry systemic risks (Haiti scores highest — 84.8 risk score — driven by flood exposure, deforestation, and infrastructure vulnerability)
- Spot projects sitting in high-risk zones before disbursement, not after
- Compare risk across countries using the same methodology and data sources

### Problem 3: "Our environmental assessments use inconsistent data and methodologies across countries."

**How we solve it:** Every country is scored using the same 17 data pipelines and the same weighted methodology:

- **Environmental Risk (30%):** Hurricanes, floods, sea level rise, contamination, seismic, coral reef, soil
- **Infrastructure Risk (25%):** Water stress, road/utility density, development indicators
- **Community Risk (25%):** Health facilities, population exposure, health vulnerability, housing quality
- **Regulatory Risk (20%):** Protected area conflicts, heritage site proximity

This means a risk score of 55 in Jamaica is directly comparable to a risk score of 55 in Guyana. No more apples-to-oranges comparisons between country teams.

### Problem 4: "We need to demonstrate that our investments account for climate and environmental risk."

**How we solve it:** The platform creates an auditable data trail:

- Every risk score is traced back to its source data (NOAA, USGS, World Bank, WHO — all authoritative international sources)
- Data provenance tracking shows when each pipeline last ran and its confidence level
- The mandatory 7-stage capital deployment flow ensures no project bypasses environmental screening
- Export-ready reporting for board presentations, donor reporting, and compliance documentation

### Problem 5: "We don't know what environmental services a project actually needs until we've spent money finding out."

**How we solve it:** Based on the risk profile, the platform automatically generates ESL service recommendations:

- A project near a protected area triggers a recommendation for **Biodiversity Impact Assessment**
- High flood risk triggers **Drainage & Flood Mitigation Study**
- Projects near heritage sites trigger **Cultural Heritage Assessment**
- Each recommendation includes scope, deliverables, timeline, and estimated cost

This means ESL becomes your pre-qualified environmental services partner — the platform tells you what's needed, and ESL delivers it.

---

## Data Still Being Acquired (Manual — In Progress)

The 17 automated pipelines provide country-level intelligence. To enable **site-specific precision**, our research team is currently acquiring higher-resolution data for the following layers:

### High-Resolution Upgrades (Platform has country-level proxy — researcher adding GIS detail)

| Layer | What the Platform Has Now | What the Researcher Is Adding |
|-------|--------------------------|-------------------------------|
| Flood Hazard Maps | Country-level flood risk percentages | GIS polygon flood zones at 25/50/100-year return periods — tells you if a specific parcel is in a flood zone |
| Sea Level Rise | Country-level projections (rate, 2050/2100 scenarios) | Spatial inundation raster maps — shows which specific coastal areas flood under each SLR scenario |
| Watershed Maps | Country basin counts, stream lengths, drainage density | GIS shapefile watershed boundaries — enables site-specific watershed overlay |
| Road Network | OSM road counts and density (live) | Flood-vulnerable road segment identification — shows which access roads flood during storms |
| Housing Quality | Country building counts and informal settlement % | GIS boundary polygons of actual informal settlements — enables precise community impact mapping |

### Fully Manual Layers (No automated proxy — requires national data requests)

| Layer | What It Provides | Status |
|-------|-----------------|--------|
| **Soil & Groundwater Contamination** | Brownfield registries, contaminated site locations, industrial discharge records | Requires formal data requests to national environmental agencies (NEPA Jamaica, EMA Trinidad, etc.) |
| **Storm Surge Models** | Category 1–5 storm surge height projections as spatial data | NOAA SLOSH model outputs need manual download |
| **Power Grid Reliability** | Outage frequency (SAIFI) and duration (SAIDI) by district | Only available from national utility companies — requires data sharing agreements |
| **Zoning & Land Use** | Official land use zoning maps | National planning authorities only — no global source exists |
| **EIA Requirement Triggers** | Which project types/sizes trigger environmental impact assessment | Legal/regulatory research from environmental legislation per country |
| **Permit Processing Timelines** | Historical permit approval timelines by project type | Government agency annual reports and transparency portals |

### What Happens When This Data Arrives

Once the researcher delivers these files, the platform team will ingest them into the same pipeline infrastructure. The result:

- **Country-level risk scores** upgrade to **site-specific risk scores** — instead of "Jamaica has 14.5% flood-prone area," the platform will say "this specific parcel at 18.02N, 76.80W is inside a 100-year flood zone"
- **Contamination data** fills the biggest current gap in the Environmental risk pillar
- **Zoning data** enables automatic regulatory conflict detection — the platform will flag if a proposed project conflicts with local land use designations
- **EIA trigger data** lets the platform automatically determine what level of environmental assessment a project requires based on its type, size, and location

---

## Country Coverage

| Country | Risk Score | Risk Level | Key Risk Drivers |
|---------|-----------|------------|-----------------|
| Haiti | 84.8 | DECLINE | Extreme flood exposure (16.5%), deforestation, lowest infrastructure scores, highest informal settlement % (35%) |
| Jamaica | ~65 | CONDITION | Hurricane exposure (Cat 5 history), moderate flood risk, strong institutional capacity partially offsets |
| Dominican Republic | ~62 | CONDITION | Hurricane + flood exposure, large coastal population, moderate development indicators |
| Guyana | ~58 | CONDITION | Extreme coastal flood exposure (35% low-elevation), river flood risk from Essequibo basin |
| Bahamas | ~55 | CONDITION | Very high coastal exposure (42% low-elevation), sea level rise vulnerability, low population density helps |
| Trinidad & Tobago | ~50 | CONDITION | Moderate across all pillars, industrial contamination risk, relatively strong infrastructure |
| Barbados | ~42 | PROCEED | High coastal exposure offset by strong institutions, small footprint, good health infrastructure |
| Cayman Islands | ~40 | PROCEED | Extreme coastal exposure (52% low-elevation) offset by very high infrastructure quality and GDP |
| Suriname | ~38 | PROCEED | Coastal flood risk offset by low population density and large forest cover (93%) |

*Risk Scale: 0-100. PROCEED < 40, CONDITION 40-70, DECLINE > 70.*

---

## Technical Credibility

- **All data from authoritative international sources:** NOAA, USGS, WHO, World Bank, UNESCO, EU JRC, ISRIC, WWF — no proprietary or unverifiable data
- **Live API connections:** USGS earthquake, World Bank indicators, WHO health data, and OSM infrastructure are queried live from source APIs
- **Transparent methodology:** Weighted scoring formula is documented and auditable; every risk component traces to its source dataset
- **17 countries covered uniformly:** Same data, same methodology, same scoring — enables portfolio-wide comparison
- **4,800+ data records:** Comprehensive coverage across 85 environmental, infrastructure, social, and regulatory dataset types

---

## What ESL Delivers That Data Alone Cannot

The platform is the intelligence layer. ESL is the execution layer.

1. **The platform identifies risk** — ESL performs the environmental assessment to characterize and mitigate it
2. **The platform flags regulatory conflicts** — ESL navigates the permitting process
3. **The platform quantifies environmental exposure** — ESL designs the monitoring program to track it
4. **The platform recommends services** — ESL delivers them with 20+ years of Caribbean environmental consulting experience

For a development finance institution, this means:
- **Faster screening** of incoming project proposals
- **Consistent risk methodology** across your Caribbean portfolio
- **Pre-qualified environmental services partner** already embedded in the risk workflow
- **Audit-ready data provenance** for every investment decision

---

*Environmental Solutions Limited | Confidential — Client Discussion Document | March 2026*
