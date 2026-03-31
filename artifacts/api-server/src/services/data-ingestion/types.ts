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

export const CARIBBEAN_COUNTRIES: Record<string, { iso3: string; bbox: [number, number, number, number] }> = {
  "Jamaica": { iso3: "JAM", bbox: [17.7, -78.4, 18.5, -76.2] },
  "Dominican Republic": { iso3: "DOM", bbox: [17.5, -72.0, 19.9, -68.3] },
  "Trinidad & Tobago": { iso3: "TTO", bbox: [10.0, -62.0, 11.4, -60.5] },
  "Barbados": { iso3: "BRB", bbox: [13.0, -59.7, 13.4, -59.4] },
  "Bahamas": { iso3: "BHS", bbox: [20.9, -79.3, 27.3, -72.7] },
  "Guyana": { iso3: "GUY", bbox: [1.2, -61.4, 8.6, -56.5] },
  "Suriname": { iso3: "SUR", bbox: [1.8, -58.1, 6.0, -54.0] },
  "Haiti": { iso3: "HTI", bbox: [18.0, -74.5, 20.1, -71.6] },
  "Cuba": { iso3: "CUB", bbox: [19.8, -84.9, 23.3, -74.1] },
  "Puerto Rico": { iso3: "PRI", bbox: [17.9, -67.3, 18.5, -65.6] },
  "Cayman Islands": { iso3: "CYM", bbox: [19.2, -81.4, 19.8, -79.7] },
  "Belize": { iso3: "BLZ", bbox: [15.9, -89.2, 18.5, -87.5] },
  "St. Lucia": { iso3: "LCA", bbox: [13.7, -61.1, 14.1, -60.9] },
  "Grenada": { iso3: "GRD", bbox: [11.98, -61.80, 12.24, -61.59] },
};

export const PIPELINE_SCHEDULES: Record<string, string> = {
  aqueduct: "monthly",
  ibtracs: "weekly",
  "opendata-jamaica": "monthly",
  "arcgis-jamaica": "weekly",
};
