import { CARIBBEAN_COUNTRIES } from "../types";

const EARTH_RADIUS_KM = 6371;

export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function isPointInBBox(
  lat: number, lon: number,
  bbox: [number, number, number, number],
  bufferKm: number = 0
): boolean {
  const bufferDeg = bufferKm / 111;
  const [minLat, minLon, maxLat, maxLon] = bbox;
  return (
    lat >= minLat - bufferDeg &&
    lat <= maxLat + bufferDeg &&
    lon >= minLon - bufferDeg &&
    lon <= maxLon + bufferDeg
  );
}

export function getCountryForPoint(
  lat: number, lon: number,
  bufferKm: number = 200
): string[] {
  const matches: string[] = [];
  for (const [country, info] of Object.entries(CARIBBEAN_COUNTRIES)) {
    if (isPointInBBox(lat, lon, info.bbox, bufferKm)) {
      matches.push(country);
    }
  }
  return matches;
}

export function getCountryCentroid(country: string): { lat: number; lon: number } | null {
  const info = CARIBBEAN_COUNTRIES[country];
  if (!info) return null;
  const [minLat, minLon, maxLat, maxLon] = info.bbox;
  return {
    lat: (minLat + maxLat) / 2,
    lon: (minLon + maxLon) / 2,
  };
}
