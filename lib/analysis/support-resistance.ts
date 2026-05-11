import type { VolumeTrend } from "./types";

function validNumbers(values: number[]) {
  return values.filter(Number.isFinite);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function calculateRecentSupport(closes: number[], lookback = 30) {
  const recentCloses = validNumbers(closes).slice(-lookback);

  if (recentCloses.length === 0) return null;

  return Math.min(...recentCloses);
}

export function calculateRecentResistance(closes: number[], lookback = 30) {
  const recentCloses = validNumbers(closes).slice(-lookback);

  if (recentCloses.length === 0) return null;

  return Math.max(...recentCloses);
}

export function calculateVolumeTrend(volumes: number[], lookback = 20): VolumeTrend {
  const validVolumes = validNumbers(volumes);
  const windowSize = Math.max(2, lookback);

  if (validVolumes.length < windowSize * 2) return "unavailable";

  const recentAverage = average(validVolumes.slice(-windowSize));
  const previousAverage = average(validVolumes.slice(-windowSize * 2, -windowSize));

  if (recentAverage === null || previousAverage === null || previousAverage === 0) return "unavailable";

  const change = (recentAverage - previousAverage) / previousAverage;

  if (change > 0.08) return "increasing";
  if (change < -0.08) return "decreasing";
  return "neutral";
}
