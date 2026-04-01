export type SectorFamilyKey =
  | "hard_infrastructure"
  | "soft_social_infrastructure"
  | "agriculture_food_systems"
  | "ecosystems_natural_capital"
  | "governance_institutional"
  | "disaster_response_recovery"
  | "programmatic_multi_sector"
  | "private_sector_productive";

export interface SectorFamilyDef {
  key: SectorFamilyKey;
  name: string;
  description: string;
  projectTypes: { type: string; subtypes: string[] }[];
}

export const SECTOR_FAMILIES: SectorFamilyDef[] = [
  {
    key: "hard_infrastructure",
    name: "Hard Infrastructure",
    description: "Physical built-environment assets: transport, energy, water, waste, flood defense, housing.",
    projectTypes: [
      { type: "Roads", subtypes: ["highway", "rural road", "bridge approach"] },
      { type: "Bridge", subtypes: ["vehicular", "pedestrian", "rail"] },
      { type: "Port", subtypes: ["cargo", "cruise", "fishing"] },
      { type: "Airport", subtypes: ["international", "regional", "helipad"] },
      { type: "Industrial Park", subtypes: ["light industrial", "heavy industrial", "logistics hub"] },
      { type: "Energy Generation", subtypes: ["solar", "wind", "geothermal", "hydro", "thermal"] },
      { type: "Transmission", subtypes: ["high voltage", "distribution", "substation"] },
      { type: "Water Treatment", subtypes: ["potable", "desalination", "rainwater harvesting"] },
      { type: "Wastewater", subtypes: ["treatment plant", "collection system", "reuse"] },
      { type: "Drainage", subtypes: ["stormwater", "urban drainage", "canal"] },
      { type: "Flood Defense", subtypes: ["seawall", "levee", "retention basin", "green infrastructure"] },
      { type: "Solid Waste", subtypes: ["landfill", "recycling", "composting", "waste-to-energy"] },
      { type: "Housing", subtypes: ["social housing", "estate development", "low-income"] },
      { type: "Urban Infrastructure", subtypes: ["streetscape", "public space", "utility corridor"] },
    ],
  },
  {
    key: "soft_social_infrastructure",
    name: "Soft / Social Infrastructure",
    description: "Health, education, community, and social service delivery facilities.",
    projectTypes: [
      { type: "Hospital", subtypes: ["regional", "specialty", "field"] },
      { type: "Clinic", subtypes: ["primary care", "community health", "mobile"] },
      { type: "Health Network", subtypes: ["telemedicine", "laboratory network", "supply chain"] },
      { type: "School", subtypes: ["primary", "secondary", "vocational"] },
      { type: "Training Center", subtypes: ["technical", "agricultural", "digital skills"] },
      { type: "Emergency Shelter", subtypes: ["hurricane", "earthquake", "multi-hazard"] },
      { type: "Community Center", subtypes: ["multipurpose", "youth", "elderly"] },
      { type: "Service Delivery Platform", subtypes: ["social protection", "public health", "extension services"] },
    ],
  },
  {
    key: "agriculture_food_systems",
    name: "Agriculture & Food Systems",
    description: "Agricultural production, processing, value chains, fisheries, and food security.",
    projectTypes: [
      { type: "Irrigation", subtypes: ["drip", "canal", "sprinkler", "rainwater"] },
      { type: "Agro-Processing", subtypes: ["grain milling", "fruit processing", "cocoa", "coffee"] },
      { type: "Input Distribution", subtypes: ["seed", "fertilizer", "equipment"] },
      { type: "Value Chain", subtypes: ["export crop", "domestic market", "organic"] },
      { type: "Storage & Cold Chain", subtypes: ["warehouse", "cold storage", "pack house"] },
      { type: "Rural Market", subtypes: ["market infrastructure", "trading platform"] },
      { type: "Food Security Program", subtypes: ["nutrition", "school feeding", "food bank"] },
      { type: "Fisheries", subtypes: ["artisanal", "commercial", "aquaculture", "mariculture"] },
    ],
  },
  {
    key: "ecosystems_natural_capital",
    name: "Ecosystems & Natural Capital",
    description: "Ecosystem restoration, biodiversity protection, nature-based solutions, and natural resource management.",
    projectTypes: [
      { type: "Mangrove Restoration", subtypes: ["planting", "hydrological restoration", "community managed"] },
      { type: "Reef Restoration", subtypes: ["coral gardening", "artificial reef", "marine protected area"] },
      { type: "Watershed Management", subtypes: ["integrated", "upper watershed", "coastal watershed"] },
      { type: "Forestry", subtypes: ["plantation", "agroforestry", "silvopasture"] },
      { type: "Reforestation", subtypes: ["native species", "carbon offset", "riparian"] },
      { type: "Coastal Resilience", subtypes: ["beach nourishment", "dune restoration", "living shoreline"] },
      { type: "Ecosystem Rehabilitation", subtypes: ["wetland", "grassland", "marine"] },
      { type: "Biodiversity Protection", subtypes: ["protected area management", "species recovery", "corridor"] },
      { type: "Land Restoration", subtypes: ["degraded land", "mine closure", "brownfield"] },
      { type: "Nature-Based Solutions", subtypes: ["green infrastructure", "ecosystem services", "bio-engineering"] },
    ],
  },
  {
    key: "governance_institutional",
    name: "Governance & Institutional",
    description: "Public sector reform, regulatory systems, institutional capacity building, and digital governance.",
    projectTypes: [
      { type: "Public Financial Management", subtypes: ["budgeting", "procurement", "audit"] },
      { type: "Environmental Governance", subtypes: ["EIA system", "permitting", "enforcement"] },
      { type: "Regulatory Systems", subtypes: ["standards", "licensing", "compliance monitoring"] },
      { type: "Land Administration", subtypes: ["cadastre", "titling", "surveying"] },
      { type: "Permitting Modernization", subtypes: ["digital permitting", "one-stop shop", "streamlining"] },
      { type: "Monitoring Systems", subtypes: ["environmental", "climate", "early warning"] },
      { type: "Digital Public Infrastructure", subtypes: ["e-government", "data platform", "GIS"] },
      { type: "Policy Reform", subtypes: ["environmental law", "climate policy", "fiscal reform"] },
      { type: "Institutional Strengthening", subtypes: ["capacity building", "organizational development", "staffing"] },
      { type: "Technical Assistance", subtypes: ["advisory", "training", "knowledge transfer"] },
    ],
  },
  {
    key: "disaster_response_recovery",
    name: "Disaster Response & Recovery",
    description: "Emergency response, post-disaster reconstruction, resilience retrofits, and recovery systems.",
    projectTypes: [
      { type: "Emergency Shelter", subtypes: ["temporary", "transitional", "permanent replacement"] },
      { type: "Post-Hurricane Reconstruction", subtypes: ["housing", "infrastructure", "public buildings"] },
      { type: "Resilience Retrofits", subtypes: ["structural", "roof strapping", "flood proofing"] },
      { type: "Debris Clearance", subtypes: ["emergency", "environmental", "demolition"] },
      { type: "Rapid Recovery Systems", subtypes: ["logistics", "supply chain", "communications"] },
      { type: "Continuity Infrastructure", subtypes: ["backup power", "emergency water", "communications"] },
    ],
  },
  {
    key: "programmatic_multi_sector",
    name: "Programmatic / Multi-Sector",
    description: "Cross-cutting programs spanning multiple sectors, geographies, or intervention types.",
    projectTypes: [
      { type: "Resilience Program", subtypes: ["community", "urban", "coastal"] },
      { type: "Urban Upgrading", subtypes: ["informal settlement", "neighborhood", "infrastructure"] },
      { type: "Community Adaptation", subtypes: ["climate", "livelihood", "ecosystem-based"] },
      { type: "Livelihoods Program", subtypes: ["skills training", "microenterprise", "cooperatives"] },
      { type: "Social Protection Climate", subtypes: ["adaptive social protection", "insurance", "cash transfer"] },
      { type: "Integrated Watershed Community", subtypes: ["watershed + livelihood", "water + agriculture", "ecosystem + community"] },
    ],
  },
  {
    key: "private_sector_productive",
    name: "Private Sector / Productive Investment",
    description: "Commercial and private-sector assets generating revenue and employment.",
    projectTypes: [
      { type: "Tourism Resort", subtypes: ["beach", "eco-lodge", "heritage"] },
      { type: "Manufacturing", subtypes: ["light manufacturing", "food & beverage", "assembly"] },
      { type: "Agro-Industrial", subtypes: ["plantation", "processing plant", "export facility"] },
      { type: "Logistics Facility", subtypes: ["warehouse", "distribution", "free zone"] },
      { type: "Commercial Renewable Energy", subtypes: ["solar farm", "wind farm", "biomass"] },
      { type: "Export-Oriented", subtypes: ["garment", "electronics", "commodity processing"] },
    ],
  },
];

export function lookupSectorFamily(projectType: string): SectorFamilyKey {
  const typeLower = projectType.toLowerCase();
  for (const family of SECTOR_FAMILIES) {
    for (const pt of family.projectTypes) {
      if (pt.type.toLowerCase() === typeLower) return family.key;
      for (const st of pt.subtypes) {
        if (st.toLowerCase() === typeLower) return family.key;
      }
    }
  }

  const legacyMap: Record<string, SectorFamilyKey> = {
    "solar": "hard_infrastructure",
    "wind": "hard_infrastructure",
    "geothermal": "hard_infrastructure",
    "dam": "hard_infrastructure",
    "power plant": "hard_infrastructure",
    "road": "hard_infrastructure",
    "industrial": "hard_infrastructure",
    "mining": "hard_infrastructure",
    "chemical processing": "hard_infrastructure",
    "waste management": "hard_infrastructure",
    "hotel": "private_sector_productive",
    "agriculture": "agriculture_food_systems",
    "aquaculture": "agriculture_food_systems",
    "food processing": "agriculture_food_systems",
    "cold chain": "agriculture_food_systems",
    "coral reef protection": "ecosystems_natural_capital",
    "forest conservation": "ecosystems_natural_capital",
    "carbon sequestration": "ecosystems_natural_capital",
    "mangrove restoration": "ecosystems_natural_capital",
    "watershed management": "ecosystems_natural_capital",
    "regulatory capacity": "governance_institutional",
    "environmental agency": "governance_institutional",
    "land registry": "governance_institutional",
    "monitoring network": "governance_institutional",
    "emergency shelter": "disaster_response_recovery",
    "early warning system": "disaster_response_recovery",
    "debris management": "disaster_response_recovery",
    "infrastructure repair": "disaster_response_recovery",
    "community centre": "soft_social_infrastructure",
    "market": "soft_social_infrastructure",
    "housing": "soft_social_infrastructure",
    "school": "soft_social_infrastructure",
    "hospital": "soft_social_infrastructure",
  };

  return legacyMap[typeLower] ?? "hard_infrastructure";
}

export function getAllProjectTypes(): { family: SectorFamilyKey; familyName: string; type: string; subtypes: string[] }[] {
  const result: { family: SectorFamilyKey; familyName: string; type: string; subtypes: string[] }[] = [];
  for (const family of SECTOR_FAMILIES) {
    for (const pt of family.projectTypes) {
      result.push({ family: family.key, familyName: family.name, type: pt.type, subtypes: pt.subtypes });
    }
  }
  return result;
}
