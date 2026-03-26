# ESL Environmental Intelligence Platform

## Geospatial Data Requirements for Automated Risk Scoring

### Research Assignment — 14 Caribbean Markets

---

## Executive Summary

The ESL platform currently uses manual risk inputs (0-10 sliders) to generate environmental risk scores for development projects. To automate these scores using real geospatial data, we need specific environmental, infrastructure, population, and regulatory datasets from each of the 14 Caribbean countries the platform covers.

The goal: a user enters a **project address** (or drops a pin on a map), and the system automatically computes all four risk subscores from verified data layers — no manual input required.

This document specifies every data layer needed, organized by which risk subscore it feeds, what format is required, and where to source it. It is designed to be handed to a researcher for data acquisition.

---

## Target Countries (14)

| Tier | Countries | Expected Data Quality |
|------|-----------|----------------------|
| **Tier 1** (good) | Jamaica, Trinidad & Tobago, Barbados, Bahamas | Digital GIS layers, environmental registries, zoning data likely available |
| **Tier 2** (partial) | Dominican Republic, Guyana, Belize, Antigua & Barbuda, St. Lucia | Some GIS layers available, gaps in contamination and permitting records |
| **Tier 3** (limited) | Haiti, Suriname, Grenada, St. Vincent & the Grenadines, Dominica | Significant gaps — will rely on satellite-derived proxies and regional models |

---

## How the Data Gets Used

For each project, the platform will:

1. **Geocode** the project address to latitude/longitude
2. **Retrieve the parcel boundary** (shapefile/polygon) from land records
3. **Generate buffer zones** — 500m, 1km, 5km rings around the parcel
4. **Query every data layer** against the parcel geometry and buffers
5. **Compute risk subscores** (0-100) from the spatial intersection results
6. **Set data confidence** based on which layers had real data vs. proxy estimates

---

## Data Layer 1: Environmental Risk

*Feeds: Environmental Risk Subscore (flood, coastal exposure, contamination)*

### 1.1 Flood Hazard Maps

| Attribute | Requirement |
|-----------|-------------|
| What | Flood zone classifications at 25-year, 50-year, and 100-year return periods |
| Format | GIS shapefiles (polygons) or georeferenced raster (GeoTIFF) |
| Resolution | Parcel-level (1:10,000 or better preferred) |
| Coverage | All 14 countries, focus on development zones and coastal areas |
| Sources to check | National meteorological offices, CCRIF SPC, World Bank Open Data, CDEMA, UNDP Caribbean risk profiles |
| What we extract | Flood zone classification for the project parcel (Zone A/V/X equivalent), expected flood depth in meters |

### 1.2 Coastal Inundation & Storm Surge Models

| Attribute | Requirement |
|-----------|-------------|
| What | Storm surge height projections under Category 1-5 hurricane scenarios |
| Format | GIS raster layers (GeoTIFF) or vector contour polygons |
| Resolution | 30m DEM-based or better |
| Coverage | All coastal zones across 14 countries |
| Sources to check | NOAA SLOSH model outputs, CDEMA, Caribbean Community Climate Change Centre (5Cs), national disaster offices |
| What we extract | Expected surge height in meters at the project GPS coordinate for each hurricane category |

### 1.3 Sea Level Rise Projections

| Attribute | Requirement |
|-----------|-------------|
| What | Projected sea level rise under RCP 4.5 and RCP 8.5 scenarios at 2030, 2050, 2100 horizons |
| Format | Raster inundation layers or tabular data by coastal segment |
| Resolution | Coastal grid cells, ideally <1km |
| Sources to check | IPCC AR6 downscaled projections, Climate Central Coastal Risk Screening Tool, 5Cs, NASA Sea Level Portal |
| What we extract | Whether the project parcel will be below projected sea level within the loan/grant term (10-30 years) |

### 1.4 Soil & Groundwater Contamination

| Attribute | Requirement |
|-----------|-------------|
| What | Registered contaminated sites, brownfield registries, industrial discharge records, landfill locations |
| Format | Point data (lat/long) with contamination type and severity, or polygon boundaries |
| Coverage | All 14 countries — priority on Tier 1 and Tier 2 |
| Sources to check | National environment agencies (NEPA in Jamaica, EMA in Trinidad, etc.), EPA equivalents, industrial licensing records, PAHO environmental health reports |
| What we extract | Number and type of contamination sources within 500m, 1km, 5km of the project parcel |

### 1.5 Hurricane Track & Wind Speed History

| Attribute | Requirement |
|-----------|-------------|
| What | Historical hurricane/tropical storm tracks with associated maximum sustained wind speeds |
| Format | Vector lines with attributes (category, wind speed, date) or gridded wind speed fields |
| Coverage | Caribbean basin, 1950-present |
| Sources to check | NOAA IBTrACS (International Best Track Archive), CCRIF parametric event data, HURDAT2 |
| What we extract | Number of Category 3+ storms within 100km of the project site in the last 30 years, maximum recorded wind speed |

### 1.6 Watershed & Drainage Basin Maps

| Attribute | Requirement |
|-----------|-------------|
| What | Watershed boundaries, river networks, drainage basin delineations |
| Format | GIS polygons (watershed boundaries) + polylines (rivers/streams) |
| Coverage | All 14 countries |
| Sources to check | National water authorities, FAO AQUASTAT, HydroSHEDS (global), HydroBASINS |
| What we extract | Which watershed the project sits in, upstream land use, runoff/contamination exposure |

---

## Data Layer 2: Infrastructure Risk

*Feeds: Infrastructure Risk Subscore (water stress, built environment quality)*

### 2.1 Water Stress Index

| Attribute | Requirement |
|-----------|-------------|
| What | Water stress, water depletion, and seasonal variability scores by watershed or administrative area |
| Format | Tabular or GIS polygons with scores |
| Coverage | All 14 countries |
| Sources to check | WRI Aqueduct Water Risk Atlas (freely available, global coverage), national water commissions, FAO AQUASTAT |
| What we extract | Water stress score (0-5 scale) for the watershed containing the project |

### 2.2 Utility Infrastructure Maps

| Attribute | Requirement |
|-----------|-------------|
| What | Water supply network coverage, power grid coverage, sewerage/wastewater coverage |
| Format | GIS polygons (service areas) or polylines (pipe/line networks) |
| Coverage | Priority: Tier 1 countries; Tier 2-3 as available |
| Sources to check | National water commissions (NWC Jamaica, WASA Trinidad), power utilities (JPS, T&TEC), municipal sewer authorities |
| What we extract | Distance from project parcel to nearest water main, power line, sewer connection; whether parcel is within serviced area |

### 2.3 Road Network & Access Vulnerability

| Attribute | Requirement |
|-----------|-------------|
| What | Road network with classification (highway, primary, secondary, unpaved), known flood-prone road segments |
| Format | GIS polylines with attributes |
| Coverage | All 14 countries |
| Sources to check | OpenStreetMap (freely available), national works/transport agencies, post-disaster road damage reports |
| What we extract | Road access quality to the project site, number of flood-vulnerable road segments on primary access route |

### 2.4 Geotechnical / Soil Data

| Attribute | Requirement |
|-----------|-------------|
| What | Soil type, bearing capacity, liquefaction susceptibility, landslide hazard zones |
| Format | GIS polygons or raster |
| Coverage | Priority: Tier 1 countries |
| Sources to check | National geological surveys, Mines & Geology Division (Jamaica), SoilGrids (global, 250m resolution) |
| What we extract | Soil classification and geotechnical risk at the project parcel |

### 2.5 Power Grid Reliability

| Attribute | Requirement |
|-----------|-------------|
| What | Average outage frequency (SAIFI) and duration (SAIDI) by service district |
| Format | Tabular data by grid district/parish |
| Coverage | All 14 countries |
| Sources to check | National power utilities, Caribbean Electric Utility Services Corporation (CARILEC), utility annual reports |
| What we extract | Expected annual outage hours at the project location |

---

## Data Layer 3: Human Exposure Risk

*Feeds: Human Exposure Risk Subscore (population density, sensitive receptors, health)*

### 3.1 Population Density Grids

| Attribute | Requirement |
|-----------|-------------|
| What | Gridded population estimates at fine resolution |
| Format | Raster (GeoTIFF) at 100m or 1km resolution |
| Coverage | All 14 countries |
| Sources to check | WorldPop (freely available, 100m resolution for Caribbean), national census agencies (STATIN Jamaica, CSO Trinidad), Facebook/Meta High Resolution Population Density Maps |
| What we extract | Population count within 500m, 1km, 5km of the project parcel |

### 3.2 Sensitive Receptor Mapping

| Attribute | Requirement |
|-----------|-------------|
| What | Locations of schools, hospitals, clinics, markets, churches, daycare centers, elderly care facilities |
| Format | Point data (lat/long) with type classification |
| Coverage | All 14 countries |
| Sources to check | OpenStreetMap (freely available), Google Places API, national education/health ministry registries, Healthsites.io |
| What we extract | Count and type of sensitive receptors within 500m and 1km of project parcel |

### 3.3 Health Burden Data

| Attribute | Requirement |
|-----------|-------------|
| What | Rates of waterborne disease (cholera, typhoid, leptospirosis, dengue), respiratory illness, environmental health indicators |
| Format | Tabular data by parish/district/country |
| Coverage | All 14 countries |
| Sources to check | PAHO Health Information Platform, national Ministries of Health, WHO Global Health Observatory, CARPHA (Caribbean Public Health Agency) |
| What we extract | Baseline health vulnerability index for the project's district |

### 3.4 Informal Settlement / Housing Quality

| Attribute | Requirement |
|-----------|-------------|
| What | Locations and boundaries of informal settlements, housing quality assessments |
| Format | GIS polygons or classified satellite imagery |
| Coverage | Priority: Haiti, Jamaica, Trinidad, Dominican Republic, Guyana |
| Sources to check | UN-Habitat, national housing agencies, World Bank urban assessments, satellite-derived building footprints (Google Open Buildings) |
| What we extract | Proximity of informal/vulnerable housing to the project site, displacement risk |

### 3.5 Employment & Livelihood Data

| Attribute | Requirement |
|-----------|-------------|
| What | Employment by sector (agriculture, fishing, tourism), livelihood dependency maps |
| Format | Tabular by parish/district |
| Coverage | All 14 countries |
| Sources to check | National census/labor force surveys, FAO, World Bank development indicators, Caribbean Development Bank country assessments |
| What we extract | Economic disruption potential — how many livelihoods could be affected by the project or by environmental events |

---

## Data Layer 4: Regulatory Risk

*Feeds: Regulatory Risk Subscore (compliance burden, permitting complexity)*

### 4.1 Protected Area Boundaries

| Attribute | Requirement |
|-----------|-------------|
| What | National parks, forest reserves, marine protected areas, wetlands, Ramsar sites, UNESCO World Heritage buffer zones |
| Format | GIS polygons with protection category |
| Coverage | All 14 countries |
| Sources to check | World Database on Protected Areas (WDPA, freely available), national forestry/environment agencies, Ramsar Sites Information Service, UNESCO WHC |
| What we extract | Whether the project parcel is within, adjacent to (within 1km), or near (within 5km) a protected area, and the protection category |

### 4.2 Zoning & Land Use Designations

| Attribute | Requirement |
|-----------|-------------|
| What | Official land use zoning maps showing permitted uses (residential, commercial, industrial, agricultural, conservation) |
| Format | GIS polygons with zoning classification |
| Coverage | Priority: Tier 1 countries; Tier 2-3 as available |
| Sources to check | National Land Agency (Jamaica), Town & Country Planning authorities, parish/municipal councils, development order maps |
| What we extract | Current zoning designation at the project parcel, whether the proposed project type is a permitted use |

### 4.3 EIA Requirement Triggers

| Attribute | Requirement |
|-----------|-------------|
| What | Which project types and sizes require Environmental Impact Assessment (full EIA, screening, or exemption) by location |
| Format | Tabular/structured data — project type x size x location → EIA requirement level |
| Coverage | All 14 countries |
| Sources to check | National environmental protection laws, NEPA prescribed activities list (Jamaica), EMA rules (Trinidad), equivalent legislation per country |
| What we extract | Whether this project at this location triggers full EIA, limited screening, or is exempt |

### 4.4 Permit Processing Timelines

| Attribute | Requirement |
|-----------|-------------|
| What | Historical permit approval timelines by project type and parish/district |
| Format | Tabular data — average/median/90th percentile processing days |
| Coverage | Priority: Tier 1 countries |
| Sources to check | Planning authority annual reports, developer surveys, World Bank Doing Business sub-indicators (construction permits), transparency portals |
| What we extract | Expected permitting delay in months for the project type at the project location |

### 4.5 Cultural Heritage & Indigenous Sites

| Attribute | Requirement |
|-----------|-------------|
| What | Locations of cultural heritage sites, archaeological sites, indigenous territories |
| Format | Point data or GIS polygons |
| Coverage | All 14 countries |
| Sources to check | National heritage trusts, Jamaica National Heritage Trust, UNESCO World Heritage List, national museums/archaeology departments |
| What we extract | Proximity of project parcel to heritage/cultural sites, additional assessment requirements |

---

## The Parcel Layer — Project Site Geometry

For each project assessed, the platform needs:

| Component | Description | Source |
|-----------|-------------|--------|
| **GPS coordinates** | Latitude/longitude of the project site | User input (address geocoding or map pin drop) |
| **Parcel boundary** | Polygon shapefile of the actual project footprint | National land agencies, title registries, surveyor data |
| **Buffer zones** | 500m, 1km, 5km concentric rings | Auto-generated from parcel centroid |
| **Elevation** | Ground elevation at the site | SRTM 30m DEM (freely available), national LiDAR where available |
| **Slope & aspect** | Terrain slope and facing direction | Derived from DEM |

### Geocoding Services for Caribbean Addresses

Caribbean addresses are often informal (no standard postal codes in many countries). Recommended approach:

- **Google Maps Geocoding API** — best coverage for Jamaica, Trinidad, Barbados, Bahamas
- **OpenStreetMap Nominatim** — free, reasonable coverage for Tier 1 countries
- **What3Words** — useful for locations without formal addresses
- **Manual pin drop** — fallback for rural or informal areas

---

## Deliverable Format

For each country, the researcher should deliver:

1. **Data inventory spreadsheet** — listing every layer found, source, format, resolution, coverage area, access method (public/request/purchase), cost, and quality assessment
2. **Raw data files** — downloaded shapefiles, rasters, CSVs, or API access credentials
3. **Coverage gap report** — which layers are missing for which countries, and recommended proxy alternatives
4. **Source contact list** — agency name, contact person, email, data request process for layers that require formal requests
5. **License/usage notes** — any restrictions on data use, redistribution, or commercial application

---

## Priority Order

1. **Jamaica** (Tier 1) — most projects, most data availability, prove the automated pipeline first
2. **Trinidad & Tobago** (Tier 1) — second-largest Caribbean economy, strong environmental agency
3. **Barbados, Bahamas** (Tier 1) — complete the Tier 1 set
4. **Dominican Republic, Guyana** (Tier 2) — large development pipelines
5. **Belize, Antigua, St. Lucia** (Tier 2) — climate fund activity
6. **Haiti, Suriname, Grenada, St. Vincent, Dominica** (Tier 3) — satellite proxies + regional models fill gaps

---

## Free / Open Data Sources (Start Here)

These are available immediately at no cost:

| Source | Layers Covered | URL |
|--------|---------------|-----|
| WRI Aqueduct | Water stress index | aqueduct.wri.org |
| WDPA | Protected area boundaries | protectedplanet.net |
| WorldPop | Population density grids | worldpop.org |
| OpenStreetMap | Roads, buildings, sensitive receptors | openstreetmap.org |
| NOAA IBTrACS | Hurricane tracks | ncdc.noaa.gov/ibtracs |
| HydroSHEDS | Watershed boundaries | hydrosheds.org |
| SoilGrids | Soil classification | soilgrids.org |
| SRTM | Digital elevation model (30m) | earthdata.nasa.gov |
| Climate Central | Coastal flood screening | coastal.climatecentral.org |
| Google Open Buildings | Building footprints | sites.research.google/open-buildings |

---

*Document Version: 1.0*
*Purpose: Research Assignment — Data Acquisition for Automated Risk Scoring*
*Platform: ESL Environmental Intelligence Platform*
*Last Updated: March 2026*
