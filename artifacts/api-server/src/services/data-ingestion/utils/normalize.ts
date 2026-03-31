export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeToScale(
  value: number,
  sourceMin: number,
  sourceMax: number,
  targetMin: number = 0,
  targetMax: number = 100
): number {
  if (sourceMax === sourceMin) return (targetMin + targetMax) / 2;
  const ratio = (value - sourceMin) / (sourceMax - sourceMin);
  return clamp(targetMin + ratio * (targetMax - targetMin), targetMin, targetMax);
}

export function roundTo(value: number, decimals: number = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function weightedAverage(
  components: Array<{ value: number | null; weight: number }>
): number | null {
  let totalWeight = 0;
  let weightedSum = 0;

  for (const { value, weight } of components) {
    if (value !== null && value !== undefined) {
      weightedSum += value * weight;
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;
  return roundTo(weightedSum / totalWeight);
}

export function parseFloatSafe(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value));
  return isNaN(num) ? null : num;
}

export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
