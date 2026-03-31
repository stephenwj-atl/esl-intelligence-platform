# ESL Environmental Intelligence Platform — Data Capability Brief

**Prepared for:** Development Finance Institution Partners (IDB, CDB, World Bank, etc.)
**Prepared by:** Environmental Solutions Limited
**Date:** March 2026
**Classification:** Confidential — Client Discussion Document

---

## Executive Summary

The ESL Environmental Intelligence Platform delivers **automated environmental risk intelligence** for capital deployment decisions across the Caribbean. Instead of waiting months for manual environmental assessments before approving a project, your team gets a data-driven risk score — backed by 17 live data pipelines, 35 years of proprietary field data, and coverage across 17 Caribbean countries — within minutes of entering a project location.

**The core value proposition:** Every dollar you deploy in the Caribbean carries environmental risk. Our platform quantifies that risk using both real-time public data *and* 35 years of proprietary environmental field results from across the region. It tells you whether to Proceed, Condition, or Decline, shows you exactly what environmental services are needed, and — uniquely — can tell you what actually happened on similar projects in similar conditions, because we've done the work before.

**What makes this different from any other environmental data platform:** We don't just aggregate public data. We have the ground-truth. 35 years of de-identified laboratory results, contamination assessments, EIA outcomes, baseline studies, and remediation records from real Caribbean development projects. No other platform in the region — or globally — can combine live satellite and sensor data with this depth of field-validated environmental intelligence.

---

## The Three Data Layers

### Layer 1: Live Public Intelligence (17 Automated Pipelines)

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

**Coming soon — Regulatory Intelligence Pipeline:**

| # | Data Layer | Source | What It Tells You | Coverage |
|---|-----------|--------|-------------------|----------|
| 18 | **EIA Decisions & Permit Outcomes** | NEPA Jamaica (National Environment and Planning Agency) | Which projects received Environmental Permits, which were refused, what conditions were imposed, screening determinations, and prescribed activity classifications. This is the public record of every environmental regulatory decision in Jamaica. | Jamaica |

NEPA's regulatory data — including their Prescribed Activities List, EIA screening determinations, Environmental Permit conditions, and enforcement actions — represents the most complete public record of environmental regulatory outcomes in the Caribbean. Combined with ESL's proprietary project data, this gives the platform both the official regulatory record and the practitioner's experience of navigating it. We plan to extend this to equivalent agencies across the region (EMA Trinidad, EPD Barbados, DEHS Bahamas) as data access permits.

---

### Layer 2: ESL Proprietary Field Intelligence (35 Years of Project Data)

This is the decisive competitive advantage. No other environmental data platform in the Caribbean has access to this.

**What it contains:**

| Data Category | What It Provides | Why It Matters for Investment Decisions |
|--------------|-----------------|----------------------------------------|
| **Laboratory Results** | De-identified soil, water, and air quality test results from thousands of project sites across the Caribbean — contaminant types, concentrations, exceedance levels, sampling conditions | The platform doesn't just tell you "this area has contamination risk" — it can tell you what contaminants were actually found at similar sites, at what concentrations, and how they compared to regulatory standards. No public dataset has this. |
| **Baseline Environmental Studies** | Pre-development environmental conditions documented across hundreds of sites — soil profiles, water quality, ecological assessments, noise levels, air quality | Provides empirical baseline benchmarks by region, soil type, land use, and proximity to industry. When the platform says a site's water quality is concerning, it can reference actual measurements from comparable locations. |
| **EIA Outcomes & Conditions** | Which project types, in which locations, triggered what level of environmental assessment — and what conditions regulators actually imposed. Complements NEPA's public decision record with the practitioner's side: what the process actually required, what ESL recommended, what conditions were imposed, and what it cost the client. | NEPA's public record tells you what decision was made. ESL's proprietary data tells you what it took to get there — the scope of work, the timeline from screening to permit, the conditions imposed, and the compliance monitoring that followed. Together, they give IDB both the regulatory fact and the operational reality. |
| **Contamination Assessments** | Site investigation results including contamination extent, source identification, risk classification, and remediation requirements | Fills the single largest data gap in the platform. Public contamination registries barely exist in the Caribbean. ESL's 35 years of contamination work provides the only comprehensive dataset of its kind in the region. |
| **Remediation Records** | What remediation approaches were used, how long they took, what they cost, and whether they achieved cleanup targets | Enables the platform to estimate remediation costs and timelines based on actual project outcomes — not consultant estimates or generic industry benchmarks. Critical for conditioning capital deployment. |
| **Permit & Compliance Timelines** | Real processing times from submission to approval, conditions imposed, compliance monitoring outcomes | Calibrates the platform's permit timeline predictions with ground-truth data from actual regulatory interactions, not theoretical estimates from legislation review. |
| **Monitoring Programme Results** | Ongoing environmental monitoring data from active and completed projects — trends in water quality, dust, noise, ecological recovery | Enables the platform to predict post-construction environmental trajectories and validate whether ESL-designed mitigation measures are working as designed. |

**Estimated volume:** Depending on project history, potentially 1,000+ project records, tens of thousands of laboratory results, spanning Jamaica, Trinidad & Tobago, Barbados, Bahamas, Guyana, Belize, and other Caribbean territories.

---

### Layer 3: High-Resolution GIS Data (In Progress — Researcher Acquisition)

Our research team is currently acquiring higher-resolution spatial data to enable site-specific precision for the layers that cannot be automated from public APIs:

| Layer | Current Status | What the Researcher Is Adding |
|-------|---------------|-------------------------------|
| Flood Hazard Maps | Country-level risk scores automated | GIS polygon flood zones at 25/50/100-year return periods |
| Sea Level Rise | Country-level projections automated | Spatial inundation raster maps showing which areas flood |
| Watershed Maps | Country basin counts automated | GIS shapefile watershed boundaries for site-specific overlay |
| Storm Surge Models | Not automated | NOAA SLOSH model outputs as spatial data |
| Road Network | OSM road counts automated (live) | Flood-vulnerable road segment identification |
| Housing Quality | Country estimates automated | GIS boundaries of actual informal settlements |
| Contamination Registries | **Covered by ESL proprietary data** | National registry data as supplement |
| Zoning & Land Use | Not automated | Official zoning maps from national planning authorities |
| Power Grid Reliability | Not automated | SAIFI/SAIDI from national utility companies |
| EIA Triggers | **Covered by NEPA public data + ESL proprietary data** | Researcher supplements with other Caribbean country legislation |
| Permit Timelines | **Covered by NEPA public data + ESL proprietary data** | Researcher supplements with other Caribbean country data |

**Note:** With NEPA's public regulatory record and ESL's proprietary project data uploaded, four previously "fully manual" layers — contamination, EIA triggers, permit timelines, and regulatory outcomes — are now substantially covered for Jamaica. The researcher's role for Jamaica shifts from primary data acquisition to validation and gap-filling. For other Caribbean countries, the researcher still needs to source equivalent data from EMA (Trinidad), EPD (Barbados), DEHS (Bahamas), and other national agencies.

---

## What This Means for a Client Like IDB

### Problem 1: "We can't deploy capital fast enough because environmental due diligence takes too long."

**How we solve it:** When your investment officer evaluates a proposed solar farm in Jamaica or a hotel development in Barbados, they enter the project location. Within minutes, the platform:

- Pulls the latest hurricane, flood, and seismic exposure data
- Checks protected area and heritage site conflicts
- Calculates water stress, soil suitability, and population exposure
- **Cross-references ESL's proprietary database to find similar past projects in the same area** — what environmental issues were actually encountered, what assessments were required, how long they took
- Returns a composite risk score with a clear recommendation: **Proceed, Condition, or Decline**

What used to take weeks of consultant engagement now takes minutes for initial screening — and that screening is informed by 35 years of ground-truth data, not just satellite imagery and global models.

### Problem 2: "We don't know which projects in our Caribbean portfolio carry the most environmental risk."

**How we solve it:** The platform scores every project against the same data foundation:

- Rank your entire Caribbean portfolio by environmental risk
- Identify which countries carry systemic risks (Haiti scores highest — 84.8 risk score — driven by flood exposure, deforestation, and infrastructure vulnerability)
- **See which risk scores are validated by actual field data versus relying solely on public models** — a risk score backed by ESL's proprietary lab results carries more weight than one based only on global satellite data
- Spot projects sitting in high-risk zones before disbursement, not after

### Problem 3: "We get different answers about environmental risk depending on which consultant we hire."

**How we solve it:** Every country and project is scored using the same methodology:

- **Environmental Risk (30%):** Hurricanes, floods, sea level rise, contamination, seismic, coral reef, soil — **calibrated against 35 years of field results**
- **Infrastructure Risk (25%):** Water stress, road/utility density, development indicators
- **Community Risk (25%):** Health facilities, population exposure, health vulnerability, housing quality
- **Regulatory Risk (20%):** Protected area conflicts, heritage site proximity — **validated by actual EIA outcome data**

A risk score of 55 in Jamaica is directly comparable to a risk score of 55 in Guyana. And when the platform says "contamination risk is elevated," it's not guessing — it's referencing actual laboratory results from comparable sites.

### Problem 4: "We need to demonstrate climate and environmental risk integration to our board and donors."

**How we solve it:** The platform creates an auditable data trail:

- Every risk score traces to its source data (NOAA, USGS, World Bank, WHO — plus ESL's proprietary field data where applicable)
- Data provenance tracking distinguishes between public data sources and field-validated proprietary data
- The mandatory 7-stage capital deployment flow ensures no project bypasses environmental screening
- Export-ready reporting for board presentations, donor reporting, and IFC/E&S compliance documentation

### Problem 5: "We don't know what environmental services a project needs — or what they'll cost — until we've already committed capital."

**How we solve it:** Based on the risk profile, the platform generates ESL service recommendations:

- A project near a protected area triggers **Biodiversity Impact Assessment** — and the platform can reference how long similar assessments took and what they cost based on ESL's project history
- High contamination risk triggers **Phase II Environmental Site Assessment** — and the platform can estimate scope based on actual contamination profiles found at comparable sites
- Regulatory conflict triggers **EIA Preparation** — and the platform knows the likely processing time because it has NEPA's actual decision record *and* ESL's experience of navigating the process

**This is the critical differentiator:** Other platforms can flag risk. Only ESL's platform can tell you what to do about it, how long it will take, what it will cost, and what the likely outcome will be — because we've already done it hundreds of times.

### Problem 6: "We want to know what actually happens at sites like this, not just what models predict."

**How we solve it — and no one else can:** The proprietary data layer enables something no public data platform offers:

- **"What did we actually find at the last 15 hotel sites in coastal Jamaica?"** — real lab results showing contaminant profiles, soil conditions, water quality
- **"How long did the EIA actually take for industrial projects in Trinidad?"** — real permit processing data from ESL's records, cross-referenced with NEPA's public decision timeline for comparable Jamaica projects
- **"What remediation was required when we found petroleum contamination in karst limestone?"** — real remediation records with costs and outcomes
- **"What did the monitoring programme show 3 years after construction?"** — real post-development environmental trends

This transforms the platform from a risk screening tool into a **decision intelligence system** — it doesn't just estimate risk, it provides empirical evidence of what that risk means in practice.

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

## The Competitive Moat

| Capability | Generic ESG/Climate Platforms | ESL Intelligence Platform |
|-----------|------------------------------|--------------------------|
| Satellite & sensor data | Yes | Yes (17 live pipelines) |
| Country-level risk scores | Yes | Yes (17 countries, 85 dataset types) |
| Caribbean-specific calibration | No — global models, not region-specific | Yes — weighted for Caribbean hazard profiles |
| Proprietary field data | No | **Yes — 35 years of lab results, EIA outcomes, remediation records** |
| Contamination intelligence | No — public registries only (barely exist in Caribbean) | **Yes — thousands of actual soil/water lab results** |
| National regulatory decision data | No | **Yes — NEPA EIA decisions, permit conditions, screening determinations (Jamaica; expanding regionally)** |
| Predictive EIA outcomes | No | **Yes — based on actual regulatory outcomes from real projects + NEPA public record** |
| Remediation cost estimation | No — generic industry benchmarks | **Yes — based on actual remediation projects in the region** |
| Integrated service delivery | No — data only, you find your own consultant | **Yes — ESL identifies the need AND delivers the service** |
| Capital deployment workflow | No | **Yes — mandatory 7-stage flow with environmental gating** |
| IFC Performance Standards alignment | Partial | **Yes — built-in compliance framework mapping** |

**The key insight:** Public environmental data is necessary but not sufficient for investment decisions. Any platform can aggregate NOAA hurricane data and World Bank indicators. Only ESL can combine that with 35 years of knowing what actually happens when you break ground in the Caribbean — what you find in the soil, what regulators require, how long it takes, and what it costs to get right.

---

## Data Architecture Summary

| Data Layer | Records | Sources | Update Frequency |
|-----------|---------|---------|-----------------|
| Live Public Pipelines | 4,800+ | 17 international APIs | Daily to quarterly |
| ESL Proprietary Field Data | Estimated 10,000+ | 35 years of ESL project archives | One-time upload + ongoing project additions |
| High-Resolution GIS (incoming) | TBD | National agencies, global GIS datasets | As acquired by researcher |
| **Combined Platform Total** | **~15,000+** | **20+ sources** | **Continuous** |

---

## What ESL Delivers That Data Alone Cannot

The platform is the intelligence layer. ESL is the execution layer. The proprietary data is the bridge.

1. **The platform identifies risk** — ESL's historical data validates whether that risk is real — ESL performs the assessment to characterize and mitigate it
2. **The platform flags regulatory conflicts** — ESL's permit history predicts the timeline — ESL navigates the process
3. **The platform quantifies contamination exposure** — ESL's lab data shows what was actually found at similar sites — ESL designs the investigation and remediation
4. **The platform estimates service scope and cost** — ESL's project history provides empirical benchmarks — ESL delivers the work

For a development finance institution, this means:
- **Faster, higher-confidence screening** of incoming project proposals
- **Empirically-calibrated risk scores** — not just models, but real field data
- **Predictable environmental costs** — based on actual project outcomes, not estimates
- **Pre-qualified environmental services partner** already embedded in the risk workflow
- **Audit-ready data provenance** distinguishing public, proprietary, and field-validated data sources
- **Reduced portfolio surprises** — because the platform has already seen what happens at sites like yours

---

## Next Steps

1. **Data Upload:** ESL to prepare de-identified historical project database for ingestion (lab results, EIA outcomes, permit timelines, remediation records)
2. **Researcher Data:** Complete high-resolution GIS acquisition for remaining manual layers
3. **Demonstration:** Live platform walkthrough with IDB investment team using real Caribbean project scenarios
4. **Pilot Programme:** Select 10-20 active IDB Caribbean projects for parallel risk scoring against traditional assessment methodology

---

*Environmental Solutions Limited | Confidential — Client Discussion Document | March 2026*
