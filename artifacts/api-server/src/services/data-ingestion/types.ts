export interface SourceAdapter {
  name: string;
  sourceKey: string;
  run(): Promise<IngestionResult>;
}

export interface IngestionResult {
  pipelineName: string;
  status: "success" | "partial" | "failed";
  recordsRead: number;
  recordsWritten: number;
  countriesAffected: string[];
  confidence: number;
  summary: Record<string, unknown>;
  error?: string;
}

export interface CountryRiskComponents {
  country: string;
  environmental: number | null;
  infrastructure: number | null;
  community: number | null;
  regulatory: number | null;
  overallRisk: number | null;
  confidence: number;
  sources: string[];
}

export interface WaterStressResult {
  country: string;
  score: number;
  confidence: number;
  indicators: Record<string, number>;
}

export interface HurricaneExposure {
  country: string;
  frequencyScore: number;
  intensityScore: number;
  recencyScore: number;
  compositeScore: number;
  stormCount: number;
  avgMaxWind: number;
}

export interface HealthFacility {
  name: string;
  type: string;
  lat: number;
  lng: number;
  parish?: string;
}

export interface ArcGISFeature {
  attributes: Record<string, unknown>;
  geometry?: {
    x?: number;
    y?: number;
    rings?: number[][][];
    paths?: number[][][];
  };
}

export interface ArcGISQueryResponse {
  features: ArcGISFeature[];
  exceededTransferLimit?: boolean;
}

export interface ArcGISServiceConfig {
  name: string;
  layerId: string;
  url: string;
  layerIndex: number;
  category: string;
  fetchGeometry: boolean;
}

export const SCORING_WEIGHTS = {
  ENVIRONMENTAL: 0.30,
  INFRASTRUCTURE: 0.25,
  COMMUNITY: 0.25,
  REGULATORY: 0.20,
} as const;

export const HURRICANE_WEIGHTS = {
  FREQUENCY: 0.40,
  INTENSITY: 0.35,
  RECENCY: 0.25,
} as const;

export const CONFIDENCE_THRESHOLDS = {
  HIGH_RESOLUTION: 80,
  COUNTRY_LEVEL: 65,
  PROXY: 40,
  MISSING: 0,
} as const;

export const PROVENANCE_CRITERIA = {
  MIN_SUCCESSFUL_PIPELINES: 3,
  MAX_STALENESS_DAYS: 30,
  MIN_AVG_CONFIDENCE: 50,
} as const;

export const CARIBBEAN_COUNTRIES: Record<string, { iso3: string; iso2: string; bbox: [number, number, number, number] }> = {
  "Jamaica": { iso3: "JAM", iso2: "JM", bbox: [17.7, -78.4, 18.5, -76.2] },
  "Dominican Republic": { iso3: "DOM", iso2: "DO", bbox: [17.5, -72.0, 19.9, -68.3] },
  "Trinidad & Tobago": { iso3: "TTO", iso2: "TT", bbox: [10.0, -62.0, 11.4, -60.5] },
  "Barbados": { iso3: "BRB", iso2: "BB", bbox: [13.0, -59.7, 13.4, -59.4] },
  "Bahamas": { iso3: "BHS", iso2: "BS", bbox: [20.9, -79.3, 27.3, -72.7] },
  "Guyana": { iso3: "GUY", iso2: "GY", bbox: [1.2, -61.4, 8.6, -56.5] },
  "Suriname": { iso3: "SUR", iso2: "SR", bbox: [1.8, -58.1, 6.0, -54.0] },
  "Haiti": { iso3: "HTI", iso2: "HT", bbox: [18.0, -74.5, 20.1, -71.6] },
  "Cuba": { iso3: "CUB", iso2: "CU", bbox: [19.8, -84.9, 23.3, -74.1] },
  "Puerto Rico": { iso3: "PRI", iso2: "PR", bbox: [17.9, -67.3, 18.5, -65.6] },
  "Cayman Islands": { iso3: "CYM", iso2: "KY", bbox: [19.2, -81.4, 19.8, -79.7] },
  "Belize": { iso3: "BLZ", iso2: "BZ", bbox: [15.9, -89.2, 18.5, -87.5] },
  "St. Lucia": { iso3: "LCA", iso2: "LC", bbox: [13.7, -61.1, 14.1, -60.9] },
  "Grenada": { iso3: "GRD", iso2: "GD", bbox: [11.98, -61.80, 12.24, -61.59] },
  "Antigua & Barbuda": { iso3: "ATG", iso2: "AG", bbox: [16.99, -62.35, 17.73, -61.66] },
  "St. Vincent & the Grenadines": { iso3: "VCT", iso2: "VC", bbox: [12.58, -61.46, 13.38, -61.12] },
  "Dominica": { iso3: "DMA", iso2: "DM", bbox: [15.20, -61.48, 15.65, -61.24] },
};

export const PIPELINE_SCHEDULES: Record<string, { frequency: string; intervalHours: number; priority: "critical" | "standard" | "low" }> = {
  "coral-reef-watch": { frequency: "daily", intervalHours: 24, priority: "critical" },
  "usgs-earthquake": { frequency: "daily", intervalHours: 24, priority: "critical" },
  ibtracs: { frequency: "weekly", intervalHours: 168, priority: "standard" },
  "nepa-eia": { frequency: "3-day", intervalHours: 72, priority: "standard" },
  "caribbean-eia": { frequency: "3-day", intervalHours: 72, priority: "standard" },
  "arcgis-jamaica": { frequency: "weekly", intervalHours: 168, priority: "standard" },
  "opendata-jamaica": { frequency: "monthly", intervalHours: 720, priority: "standard" },
  "noaa-slr": { frequency: "weekly", intervalHours: 168, priority: "standard" },
  "jrc-flood": { frequency: "weekly", intervalHours: 168, priority: "standard" },
  "osm-infrastructure": { frequency: "2-week", intervalHours: 336, priority: "low" },
  "unesco-whc": { frequency: "monthly", intervalHours: 720, priority: "low" },
  aqueduct: { frequency: "monthly", intervalHours: 720, priority: "low" },
  wdpa: { frequency: "monthly", intervalHours: 720, priority: "low" },
  worldpop: { frequency: "monthly", intervalHours: 720, priority: "low" },
  soilgrids: { frequency: "monthly", intervalHours: 720, priority: "low" },
  "world-bank": { frequency: "monthly", intervalHours: 720, priority: "low" },
  "who-gho": { frequency: "monthly", intervalHours: 720, priority: "low" },
  hydrosheds: { frequency: "monthly", intervalHours: 720, priority: "low" },
  "open-buildings": { frequency: "monthly", intervalHours: 720, priority: "low" },
};
