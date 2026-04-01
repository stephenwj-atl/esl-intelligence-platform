# ESL Caribbean Environmental Intelligence Platform
## Technical & Strategic Overview — April 2026

---

## 1. What We Do

ESL operates the Caribbean's first environmental decision-intelligence platform purpose-built for development finance. We transform raw environmental, social, and regulatory data from 23 live sources across 17 Caribbean markets into actionable investment signals — automated risk scoring, lender compliance mapping, and capital structuring guidance.

Think of it as a Bloomberg Terminal for environmental risk in Caribbean development finance. Instead of traders watching stock prices, ESL analysts watch hurricane exposure trends, regulatory density shifts, and climate vulnerability scores — all feeding a composite Country Environmental Risk Index (CERI) that drives capital deployment decisions.

**Core thesis:** In Caribbean development finance, environmental risk IS financial risk. Every dollar deployed without rigorous environmental intelligence carries hidden exposure — regulatory delays, climate damage, community opposition, reputational liability. ESL eliminates that blindness.

---

## 2. Problems We Solve

### 2.1 The Information Gap
Caribbean development finance institutions currently operate with fragmented, stale, or nonexistent environmental data. A typical lender might check one or two datasets before approving a $50M infrastructure loan in a country where 11 distinct natural hazards, rising sea levels, and weak regulatory frameworks create compounding risk. ESL closes that gap by aggregating 1,955 data points across 177 indicators for every Caribbean market.

### 2.2 The Compliance Maze
Multilateral lenders (IDB, World Bank, CDB, GCF) each have different environmental and social safeguard requirements. A project seeking IDB ESPF funding requires different assessments than one seeking GCF Category A approval. ESL automatically maps project profiles to lender-specific requirements across 6 major frameworks:
- **IDB ESPF** (Environmental and Social Policy Framework)
- **CDB ESRP** (Environmental and Social Review Procedures)
- **World Bank ESF** (Environmental and Social Framework)
- **GCF** (Green Climate Fund Investment Framework)
- **EIB** (European Investment Bank Environmental Standards)
- **Equator Principles (EP4)**

### 2.3 The Assessment Hierarchy Problem
The industry conflates three fundamentally different instruments:
- **SEA (Strategic Environmental Assessment)** — Pre-investment strategic guidance; informs whether and how to invest
- **ESIA (Environmental and Social Impact Assessment)** — Primary due diligence tool for multilateral lending
- **EIA (Environmental Impact Assessment)** — National permitting compliance only

ESL enforces this hierarchy: SEA/ESIA are the primary investment guidance tools; EIA is strictly for regulatory permitting. This distinction matters because lenders who treat EIA as sufficient due diligence expose themselves to social, reputational, and financial risks that EIA was never designed to address.

### 2.4 The "Gut Feel" Decision
Without quantitative environmental intelligence, capital deployment decisions default to institutional memory and relationship-based judgments. ESL replaces this with a transparent, auditable scoring framework:
- **PROCEED (risk < 40):** Standard due diligence sufficient
- **CONDITION (risk 40–70):** Specific mitigations required before deployment
- **DECLINE (risk > 70):** Risk exceeds acceptable thresholds

### 2.5 Mandatory Capital Deployment Flow
ESL enforces a 7-stage lifecycle that every investment must pass through:
1. **Intake Screening** — Initial risk triage
2. **Baseline Formation** — Environmental baseline establishment
3. **Risk Characterisation** — Quantitative risk assessment
4. **Decision / Sequencing** — Capital structure determination
5. **Deployment Control** — Covenant and monitoring setup
6. **Transition Validation** — Handover verification
7. **Risk Resolution** — Post-deployment monitoring

---

## 3. How We Do It — Technical Architecture

### 3.1 Scoring Engine
The platform computes a **Country Environmental Risk Index (CERI)** for each of the 17 Caribbean markets using a 4-pillar weighted model:

| Pillar | Weight | Components |
|--------|--------|------------|
| **Environmental** | 30% | Hurricane Exposure (22%), Flood Risk (18%), Sea Level Rise (12%), Contamination (12%), Seismic (12%), Watershed Flood (10%), Coral Reef (7%), Soil Risk (7%) |
| **Infrastructure** | 25% | Water Stress (35%), Infrastructure Vulnerability (35%), Development Vulnerability (30%) |
| **Community** | 25% | Health Vulnerability (40%), Housing Vulnerability (25%), Population Exposure (20%), Health Facility Density (15%) |
| **Regulatory** | 20% | Protected Area Conflict (45%), Heritage Risk (30%), Regulatory Density (25%) |

**SEA Mitigation Factor:** When a country has a functioning Strategic Environmental Assessment framework, the regulatory risk score is reduced by 15% (multiplied by 0.85), reflecting the risk-reduction value of strategic environmental planning.

**Confidence Index:** Each score carries a confidence rating based on data coverage (how many of 18 required datasets are available) multiplied by source quality (high-resolution = 80%, country-level = 65%, proxy = 40%).

### 3.2 Data Pipeline Architecture
23 automated pipelines run on configurable schedules with priority-based stale detection:
- **Critical (daily):** Coral reef alerts, earthquake monitoring
- **Standard (3-day to weekly):** Hurricane tracking, regulatory document scraping, flood risk, sea level rise
- **Low (monthly to quarterly):** Census data, soil surveys, climate projections

Each pipeline follows a standardized pattern: fetch → validate → normalize → upsert (deduplication on country + region + dataset_type) → freshness tracking → scoring trigger.

### 3.3 Financial Translation Engine
Environmental risk scores are translated into financial terms:
- **Rate premiums:** +0.5% to +1.5% based on risk level
- **Confidence penalties:** +0.5% when confidence < 50%
- **Insurance uplifts:** Up to 60% for high-hazard zones
- **Capital mode recommendation:** Loan (low risk) vs. Blended (moderate) vs. Grant (high risk, low confidence)

---

## 4. Data Sources — Current (Live)

### 4.1 Environmental / Natural Hazard Sources

| # | Source | Provider | Data Type | Update Freq | Records | Coverage | Cost |
|---|--------|----------|-----------|-------------|---------|----------|------|
| 1 | **Aqueduct** | World Resources Institute (WRI) | Water stress, variability, depletion, seasonal risk | Monthly | 17 countries | All 17 | Free |
| 2 | **IBTrACS** | NOAA/NCEI | Historical hurricane tracks — frequency, intensity, recency, max wind speed | Weekly | 9,880 storm points | All 17 | Free |
| 3 | **Coral Reef Watch** | NOAA CRW | Sea surface temperature, bleaching alert levels, degree heating weeks | Daily | 17 countries | All 17 | Free |
| 4 | **USGS Earthquake** | US Geological Survey | Seismic events, magnitude, frequency, risk scoring | Daily | 17 countries | All 17 | Free |
| 5 | **JRC Global Flood** | EU Joint Research Centre | River/coastal flood risk, population exposure, return periods | Weekly | 17 countries | All 17 | Free |
| 6 | **NOAA Sea Level Rise** | NOAA Tides & Currents | Current SLR rate (mm/yr), RCP4.5/8.5 projections at 2050/2100, coastal zone % | Weekly | 17 countries | All 17 | Free |
| 7 | **HydroSHEDS** | WWF / USGS | Watershed basins, stream length, drainage density, floodplain area % | Monthly | 17 countries | All 17 | Free |
| 8 | **SoilGrids** | ISRIC | Clay/sand content, soil pH, bulk density, geotechnical risk scoring | Monthly | 17 countries | All 17 (partial) | Free |
| 9 | **ThinkHazard** | GFDRR / World Bank | 11 natural hazard classifications per country (flood, earthquake, cyclone, volcano, tsunami, wildfire, water scarcity, extreme heat, landslide) | Monthly | 220 records | All 17 | Free |

### 4.2 Climate Projection Sources

| # | Source | Provider | Data Type | Update Freq | Records | Coverage | Cost |
|---|--------|----------|-----------|-------------|---------|----------|------|
| 10 | **WB Climate (CCKP)** | World Bank Climate Change Knowledge Portal | CMIP6 projections: temperature/precipitation baselines + SSP245/SSP585 at 2050/2080 | Quarterly | 119 data points | All 17 | Free |
| 11 | **ND-GAIN** | Notre Dame Global Adaptation Initiative | Climate vulnerability, readiness, and overall adaptation scores (45 indicators) | Quarterly | 15 countries | 15 (excl. Cayman, PR) | Free |

### 4.3 Socioeconomic / Infrastructure Sources

| # | Source | Provider | Data Type | Update Freq | Records | Coverage | Cost |
|---|--------|----------|-----------|-------------|---------|----------|------|
| 12 | **World Bank WDI** | World Bank | GDP per capita, electricity access, water access, mobile subscriptions | Monthly | 17 countries | All 17 | Free |
| 13 | **WHO GHO** | World Health Organization | Life expectancy, physician density, hospital bed density, health expenditure | Monthly | 17 countries | All 17 | Free |
| 14 | **WorldPop** | University of Southampton | Population density, urbanization rate | Monthly | 17 countries | All 17 | Free |
| 15 | **Google Open Buildings** | Google Research | Building count/density, informal settlement %, coastal building exposure | Monthly | 17 countries | All 17 | Free |
| 16 | **OSM Infrastructure** | OpenStreetMap / Overpass API | Road segments, bridges, power lines, ports, water infrastructure | Bi-weekly | 17 countries | All 17 | Free |

### 4.4 Regulatory / Environmental Assessment Sources

| # | Source | Provider | Data Type | Update Freq | Records | Coverage | Cost |
|---|--------|----------|-----------|-------------|---------|----------|------|
| 17 | **WDPA** | UNEP-WCMC / Protected Planet | Protected area coverage (land and marine %), IUCN categories | Monthly | 17 countries | All 17 | Free |
| 18 | **UNESCO WHC** | UNESCO | World Heritage Sites, danger status, heritage risk scoring | Monthly | 17 countries | All 17 | Free |
| 19 | **NEPA EIA** | Jamaica National Environment & Planning Agency | 541 regulatory documents: 116 EIAs, 5 SEA, 4 EIS, 99 board decisions, enforcement actions, public consultations | 3-day | 541 docs | Jamaica only | Free |
| 20 | **Caribbean EIA** | Multi-agency (Belize DOE, Cayman DOE, Trinidad EMA, Guyana EPA, Puerto Rico DRNA) | EIA documents, CEC clearances, compliance plans, regulatory framework metadata for all 17 countries | 3-day | 480+ docs (Belize), 12 (PR), 2 (T&T) | 5 agencies scraped, 17 frameworks catalogued | Free |
| 21 | **WB Documents** | World Bank Documents & Reports API | Environmental Assessment documents: EIA, ESIA, ESMP, ESMF, ESCP, RAP, Safeguards reports for World Bank-funded Caribbean projects | Monthly | 470 documents | 13 countries | Free |

### 4.5 Jamaica-Specific Sources

| # | Source | Provider | Data Type | Update Freq | Records | Coverage | Cost |
|---|--------|----------|-----------|-------------|---------|----------|------|
| 22 | **OpenData Jamaica** | Statistical Institute of Jamaica | Parish-level health facilities, demographics, land use | Monthly | Jamaica (14 parishes) | Jamaica only | Free |
| 23 | **ArcGIS Jamaica** | Government of Jamaica GIS Portal | Protected areas, land parcels, coastal zones, watersheds, infrastructure (7 layers) | Weekly | Jamaica (14 parishes) | Jamaica only (3/7 layers responding) | Free |

---

## 5. Current Platform Statistics

| Metric | Value |
|--------|-------|
| Total unique data records | 1,955 |
| Unique dataset types (indicators) | 177 |
| Countries covered | 17 |
| Live data pipelines | 23 |
| Environmental Assessment documents catalogued | 1,500+ (NEPA 541 + Belize 480 + WB 470 + others) |
| Scoring pillars | 4 (Environmental, Infrastructure, Community, Regulatory) |
| Scoring sub-indicators | 18 |
| Lender frameworks mapped | 6 (IDB, CDB, WB, GCF, EIB, Equator Principles) |

### Data Coverage by Country (dataset types available)

| Country | Dataset Types | WB EA Docs | Notable Gaps |
|---------|---------------|------------|--------------|
| Jamaica | 168 | 56 | Full coverage — NEPA scraping + ArcGIS + parish-level data |
| Belize | 122 | 48 | Strong — DOE provides 480 EIA/compliance documents |
| Guyana | 120 | 48 | EPA site intermittent (HTTP 406) |
| Haiti | 118 | 155 | Strongest WB doc coverage; local MDE site unreliable |
| Dominican Republic | 117 | 35 | MIMARENA uses SPA framework (harder to scrape) |
| Trinidad & Tobago | 117 | 7 | EMA CEC register is form-based (not publicly listed) |
| St. Lucia | 117 | 32 | No local EIA portal; reliant on WB docs |
| Suriname | 116 | 11 | NIMOS has EIA repository (Google Sites, currently 404) |
| Grenada | 115 | 17 | No local EIA portal |
| Barbados | 113 | 3 | New Environmental Management Act 2024; EPD site has no EIA docs |
| St. Vincent & the Grenadines | 110 | 27 | No local EIA portal |
| Dominica | 110 | 26 | No local EIA portal |
| Antigua & Barbuda | 108 | 5 | DOE website minimal |
| Cuba | 105 | 0 | CITMA site not accessible for scraping |
| Bahamas | 103 | 0 | BEST commission has no public document portal |
| Puerto Rico | 103 | 0 | DRNA site restructured; limited EIA declarations |
| Cayman Islands | 93 | 0 | DOE returns HTTP 403 — needs formal data-sharing agreement |

---

## 6. Recommended Paid / Premium Data Sources

### 6.1 High-Resolution Hazard & Climate Analytics

| Source | Provider | What It Adds | Why It Matters | Pricing Model |
|--------|----------|-------------|----------------|---------------|
| **Jupiter Intelligence** | Jupiter Intelligence Inc. | Asset-level physical climate risk: flooding, wind, heat, wildfire projections at building/parcel resolution. Forward-looking models to 2100. | Current platform uses country-level hazard data. Jupiter adds project-site-specific risk — critical for underwriting individual loans. | Enterprise (quote-based, typically $50K–$200K/yr depending on resolution and geography) |
| **Verisk Maplecroft** | Verisk Analytics | 32 natural hazard indices + 190+ political/social/governance risk indices at subnational level. Full REST API. Quarterly updates. | Best-in-class for development finance risk profiling. Adds governance risk, political stability, social unrest indicators — not currently covered. | Enterprise (quote-based, $30K–$100K/yr per module) |
| **Munich Re NatCatSERVICE** | Munich Re | Historical natural catastrophe loss database — insured and economic losses by event, country, and peril. 50+ years of data. | Insurance-grade loss data enables actual loss-frequency modeling. Current platform has hazard exposure but not historical loss data. | Enterprise (quote-based via Munich Re consultants) |
| **Swiss Re CatNet** | Swiss Re | Global natural hazard maps — flood zones, earthquake zones, windstorm return periods, volcanic hazard at high resolution. | Swiss Re's proprietary hazard maps are considered the insurance industry gold standard. Adds return-period modeling. | Enterprise (typically bundled with Swiss Re advisory) |

### 6.2 Social & Governance Risk

| Source | Provider | What It Adds | Why It Matters | Pricing Model |
|--------|----------|-------------|----------------|---------------|
| **INFORM Risk Index** | EU DRMKC / OCHA | Composite disaster risk: hazard, exposure, vulnerability, coping capacity. Country-level, free CSV. | Currently available as CSV download. We could integrate the country-level data (it's free). Subnational data requires partnership. | Free (country-level CSV), Partnership (subnational) |
| **Fragile States Index** | Fund for Peace | Country fragility scoring — 12 indicators including state legitimacy, public services, group grievance, economic decline. | Relevant for Haiti, Guyana, Suriname where institutional fragility affects project viability. | Free (basic data), $5K–$15K/yr (API access + subnational) |
| **V-Dem** | University of Gothenburg | Democratic governance indicators — rule of law, corruption, judicial independence, civil liberties. 400+ variables. | Governance quality directly affects regulatory reliability and project execution risk. | Free (academic license), Donation-based |
| **Transparency International CPI** | Transparency International | Corruption Perceptions Index — annual scoring for all Caribbean countries. | Corruption risk is a material factor in infrastructure lending. Complement to regulatory density scoring. | Free (annual report), API available |

### 6.3 Environmental & Biodiversity Intelligence

| Source | Provider | What It Adds | Why It Matters | Pricing Model |
|--------|----------|-------------|----------------|---------------|
| **Global Forest Watch** | World Resources Institute | Deforestation alerts (near real-time), tree cover loss, primary forest extent, fires. | Forest and land-use change is a key ESG metric for development finance. Not currently tracked. | Free (API available) |
| **GBIF** | Global Biodiversity Information Facility | Species occurrence records — presence of endangered/endemic species by location. | Biodiversity risk is a growing lender requirement (TNFD framework). Critical for ESIA scoping. | Free (API available) |
| **Allen Coral Atlas** | Vulcan Inc. / Arizona State | High-resolution coral reef maps and benthic habitat classification. | Caribbean-specific — adds reef proximity analysis for coastal development projects. | Free (research use), Contact for commercial |
| **Copernicus Climate Data Store** | ECMWF / EU | ERA5 reanalysis data: hourly climate variables (temp, precipitation, wind) at 0.25° resolution. Global. | Higher temporal and spatial resolution than WB CCKP. Enables site-specific climate analysis. | Free (registration required) |
| **Sentinel Hub** | Sinergise / ESA | Satellite imagery processing — land use change, flood extent, vegetation indices (NDVI), urban expansion. | Enables visual verification and change detection for project sites. Essential for monitoring. | Free tier (limited), $100–$500/mo (production) |

### 6.4 Financial / Market Risk

| Source | Provider | What It Adds | Why It Matters | Pricing Model |
|--------|----------|-------------|----------------|---------------|
| **EM-DAT** | CRED / UCLouvain | International Disaster Database — event-level records of disasters, deaths, damages, people affected since 1900. | Links hazard data to actual humanitarian and economic impact. Enables loss modeling. | Free (registration for academic/humanitarian use) |
| **Fitch Climate Risk Scores** | Fitch Ratings | Sovereign climate vulnerability and transition risk scores for rated countries. | Direct integration with credit risk frameworks used by DFIs. | Enterprise (part of Fitch subscription) |
| **Moody's ESG Solutions** | Moody's Analytics | ESG risk scores, climate-adjusted credit risk, physical risk exposure for sovereign and corporate issuers. | Industry-standard for integrating ESG into credit decisions. | Enterprise ($50K–$200K/yr) |

---

## 7. Known Gaps & Limitations

### 7.1 Data Gaps
- **Subnational resolution:** Most data is country-level. Parish/district-level data only available for Jamaica (ArcGIS + OpenData Jamaica). Asset-level resolution requires paid sources (Jupiter, Verisk).
- **Forward-looking climate models:** Current climate projections are from WB CCKP (CMIP6 SSP scenarios). Higher-resolution downscaled projections (e.g., CORDEX Caribbean) would improve accuracy.
- **Governance/political risk:** Platform currently has no political stability, corruption, or institutional quality indicators. This is a material gap for Haiti, Guyana, and Cuba.
- **Biodiversity data:** No species or habitat data beyond WDPA protected areas. Increasingly required under TNFD and IFC PS6.
- **Real-time satellite monitoring:** No satellite imagery integration for construction monitoring, deforestation alerts, or flood extent verification.
- **Historical disaster losses:** Platform tracks hazard exposure but not actual historical economic/human losses from past events.

### 7.2 Technical Limitations
- **Cayman Islands DOE** returns HTTP 403 — requires formal data-sharing MOU.
- **Guyana EPA** site intermittently returns HTTP 406 — unreliable for scheduled scraping.
- **Cuba CITMA** — no publicly accessible data portal.
- **ArcGIS Jamaica** — 3 of 7 government GIS layers are unreachable on GOJ side.
- **SoilGrids** — API returns incomplete soil profiles for some Caribbean coordinates.
- **Scoring confidence** averages 61.8% across countries — reflecting country-level (not site-level) resolution.

### 7.3 Methodological Limitations
- **Equal country weighting:** All 17 countries are scored using the same 18-indicator model, but data availability varies significantly (Jamaica has 168 dataset types vs. Cayman with 93).
- **No temporal trend analysis:** Scores are point-in-time snapshots. Trend detection (improving/worsening risk) requires historical score storage and analysis.
- **SEA mitigation factor is binary:** The 15% regulatory risk reduction for SEA frameworks is applied uniformly. In practice, SEA quality varies dramatically between countries.

---

## 8. Improvement Opportunities

### 8.1 Quick Wins (Free, Immediate Integration)
1. **INFORM Risk Index** — Free CSV download adds composite disaster risk scoring (hazard + exposure + vulnerability + coping capacity). Already computed for all Caribbean countries.
2. **Global Forest Watch** — Free API adds real-time deforestation alerts and tree cover change. Relevant for agricultural and mining project assessments.
3. **Transparency International CPI** — Free annual data adds corruption risk indicator. Simple to integrate, high value for governance gap.
4. **EM-DAT** — Free registration gives access to historical disaster impact data. Converts hazard exposure into actual loss history.
5. **Copernicus ERA5** — Free registration gives hourly climate reanalysis at 0.25° resolution. Upgrades climate intelligence from country-level to grid-level.

### 8.2 Medium-Term Enhancements (Partnerships / Moderate Cost)
1. **GBIF Biodiversity Data** — Free API. Critical for TNFD compliance and ESIA scoping. Adds endangered species proximity risk.
2. **Sentinel Hub** — Affordable satellite imagery processing. Enables visual monitoring of project sites and environmental change detection.
3. **V-Dem Governance Data** — Free/donation-based. Adds 400+ governance indicators covering rule of law, judicial independence, civil liberties.
4. **Allen Coral Atlas** — Caribbean-specific reef mapping at high resolution. Directly relevant for coastal tourism and infrastructure projects.

### 8.3 Transformative Upgrades (Enterprise Investment)
1. **Jupiter Intelligence or Swiss Re CatNet** — Upgrades hazard analysis from country-level to asset-level. Essential for project-specific underwriting.
2. **Verisk Maplecroft** — Adds 190+ social/political/governance risk indices. Fills the biggest current gap.
3. **Moody's ESG Solutions** — Connects environmental risk to credit risk frameworks used by DFIs.

---

## 9. Technical Stack Summary

| Component | Technology |
|-----------|-----------|
| Backend | Express 5 (TypeScript), Node.js |
| Database | PostgreSQL (Drizzle ORM) |
| Frontend | React (Vite), TailwindCSS, Recharts |
| Authentication | Email/password + mandatory TOTP 2FA |
| Encryption | AES-256-GCM at rest for sensitive fields |
| API Security | JWT (httpOnly cookies), Helmet CSP, rate limiting, CORS |
| Data Ingestion | 23 TypeScript pipeline adapters, cron-style scheduler |
| Scoring | 4-pillar weighted model, 18 sub-indicators |
| Hosting | Replit (development), cloud deployment ready |

---

## 10. Contact & Data Partnership Opportunities

ESL is actively seeking:
- **Data-sharing agreements** with Caribbean national environmental agencies (particularly Cayman DOE, Bahamas BEST, Cuba CITMA)
- **API partnerships** with multilateral development banks for project-level environmental safeguard data
- **Academic partnerships** for subnational climate downscaling (CORDEX Caribbean, UWI Climate Studies Group)
- **Insurance industry partnerships** for historical loss data integration (Munich Re, Swiss Re)
- **Advisory input** on scoring methodology, indicator weighting, and data source prioritization

---

*Document generated April 2026. Platform statistics reflect live production data.*
