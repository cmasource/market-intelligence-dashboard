import type { OhlcvBar } from "@/lib/market-data/providers/base";

export type TechnicalLevel = {
  level: number;
  type: "horizontal" | "ema20" | "ema50" | "ma200";
  strength: number;
};

type DynamicLevelInput = {
  ema20: number | null;
  ema50: number | null;
  ma200: number | null;
};

type Cluster = {
  level: number;
  touches: number;
  recencyScore: number;
};

function roundLevel(value: number) {
  if (value >= 1000) return Math.round(value * 10) / 10;
  if (value >= 10) return Math.round(value * 100) / 100;
  return Math.round(value * 10000) / 10000;
}

function localExtrema(bars: OhlcvBar[]) {
  const extrema: Array<{ level: number; index: number }> = [];

  for (let index = 2; index < bars.length - 2; index += 1) {
    const bar = bars[index];
    const previous = bars.slice(index - 2, index);
    const next = bars.slice(index + 1, index + 3);
    if (previous.every((item) => bar.low <= item.low) && next.every((item) => bar.low <= item.low)) {
      extrema.push({ level: bar.low, index });
    }
    if (previous.every((item) => bar.high >= item.high) && next.every((item) => bar.high >= item.high)) {
      extrema.push({ level: bar.high, index });
    }
  }

  return extrema;
}

function clusterLevels(points: Array<{ level: number; index: number }>, tolerance: number, lastIndex: number) {
  const clusters: Cluster[] = [];

  for (const point of points.sort((a, b) => a.level - b.level)) {
    const cluster = clusters.find((item) => Math.abs(item.level - point.level) <= tolerance);
    const recencyScore = Math.max(0, 1 - (lastIndex - point.index) / Math.max(lastIndex, 1));
    if (!cluster) {
      clusters.push({ level: point.level, touches: 1, recencyScore });
      continue;
    }
    cluster.level = (cluster.level * cluster.touches + point.level) / (cluster.touches + 1);
    cluster.touches += 1;
    cluster.recencyScore = Math.max(cluster.recencyScore, recencyScore);
  }

  return clusters.map((cluster) => ({
    level: roundLevel(cluster.level),
    type: "horizontal" as const,
    strength: Math.min(95, Math.round(35 + cluster.touches * 13 + cluster.recencyScore * 22)),
  }));
}

function dynamicLevel(level: number | null, type: TechnicalLevel["type"], price: number): TechnicalLevel | null {
  if (level === null || !Number.isFinite(level)) return null;
  const proximity = Math.max(0, 1 - Math.abs(price - level) / Math.max(price * 0.08, 1));
  const base = type === "ma200" ? 68 : type === "ema50" ? 62 : 56;
  return { level: roundLevel(level), type, strength: Math.min(90, Math.round(base + proximity * 20)) };
}

function uniqueByLevel(levels: TechnicalLevel[], tolerance: number) {
  const selected: TechnicalLevel[] = [];
  for (const level of levels.sort((a, b) => b.strength - a.strength)) {
    if (selected.some((item) => Math.abs(item.level - level.level) <= tolerance && item.type === level.type)) continue;
    selected.push(level);
  }
  return selected;
}

export function calculateSupportResistance(
  bars: OhlcvBar[],
  price: number,
  atr: number | null,
  dynamic: DynamicLevelInput,
) {
  const relevantBars = bars.slice(-120);
  const tolerance = Math.max((atr ?? price * 0.01) * 0.35, price * 0.001);
  const horizontal = clusterLevels(localExtrema(relevantBars), tolerance, relevantBars.length - 1);
  const dynamicLevels = [
    dynamicLevel(dynamic.ema20, "ema20", price),
    dynamicLevel(dynamic.ema50, "ema50", price),
    dynamicLevel(dynamic.ma200, "ma200", price),
  ].filter((level): level is TechnicalLevel => level !== null);

  const allLevels = uniqueByLevel([...horizontal, ...dynamicLevels], tolerance);

  return {
    supports: allLevels
      .filter((level) => level.level < price)
      .sort((a, b) => b.level - a.level || b.strength - a.strength)
      .slice(0, 5),
    resistances: allLevels
      .filter((level) => level.level > price)
      .sort((a, b) => a.level - b.level || b.strength - a.strength)
      .slice(0, 5),
  };
}
