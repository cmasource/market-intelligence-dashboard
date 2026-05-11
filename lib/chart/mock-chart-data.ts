import type { OHLCVPoint, Timeframe } from "@/types/chart";

const timeframes: Timeframe[] = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];

const candleCounts: Record<Timeframe, number> = {
  "1D": 48,
  "5D": 120,
  "1M": 22,
  "6M": 126,
  YTD: 96,
  "1Y": 252,
  "5Y": 260,
};

const stepSeconds: Record<Timeframe, number> = {
  "1D": 30 * 60,
  "5D": 60 * 60,
  "1M": 24 * 60 * 60,
  "6M": 24 * 60 * 60,
  YTD: 24 * 60 * 60,
  "1Y": 24 * 60 * 60,
  "5Y": 7 * 24 * 60 * 60,
};

const fixedEndTimestamp = Date.UTC(2026, 4, 6, 20, 0, 0) / 1000;

function hashSymbol(symbol: string) {
  return symbol
    .toUpperCase()
    .split("")
    .reduce((hash, character) => hash + character.charCodeAt(0), 0);
}

function getBasePrice(symbol: string) {
  const normalizedSymbol = symbol.toUpperCase();
  const hash = hashSymbol(normalizedSymbol);

  if (normalizedSymbol.includes("BTC")) return 64000 + (hash % 1200);
  if (normalizedSymbol.includes("ETH")) return 3100 + (hash % 220);
  if (normalizedSymbol.startsWith("GGAL")) return 4200 + (hash % 480);
  if (normalizedSymbol.startsWith("YPF")) return 29000 + (hash % 2200);
  if (normalizedSymbol.startsWith("AL") || normalizedSymbol.startsWith("GD")) return 55 + (hash % 12);
  if (normalizedSymbol.startsWith("TX")) return 130 + (hash % 24);
  if (normalizedSymbol === "SPY") return 520 + (hash % 20);
  if (normalizedSymbol === "QQQ") return 440 + (hash % 25);

  return 120 + (hash % 110);
}

function getVolatility(symbol: string, timeframe: Timeframe) {
  const normalizedSymbol = symbol.toUpperCase();
  const hash = hashSymbol(normalizedSymbol);
  const baseVolatility = normalizedSymbol.includes("BTC") || normalizedSymbol.includes("ETH")
    ? 0.018
    : normalizedSymbol.startsWith("GGAL") || normalizedSymbol.startsWith("AL") || normalizedSymbol.startsWith("GD")
      ? 0.014
      : 0.008;
  const timeframeMultiplier = timeframe === "1D" || timeframe === "5D" ? 0.55 : timeframe === "5Y" ? 1.35 : 1;

  return (baseVolatility + (hash % 7) / 10000) * timeframeMultiplier;
}

function seededNoise(seed: number, index: number) {
  const x = Math.sin(seed * 97.13 + index * 37.77) * 10000;
  return x - Math.floor(x);
}

function roundPrice(value: number, price: number) {
  if (price >= 1000) return Math.round(value);
  if (price >= 100) return Math.round(value * 10) / 10;
  return Math.round(value * 100) / 100;
}

function roundVolume(value: number) {
  return Math.max(1, Math.round(value));
}

export function getAvailableTimeframes(): Timeframe[] {
  return [...timeframes];
}

export function getDefaultTimeframeForAsset(symbol: string): Timeframe {
  const normalizedSymbol = symbol.toUpperCase();

  if (normalizedSymbol.includes("BTC") || normalizedSymbol.includes("ETH")) return "1M";
  if (normalizedSymbol.startsWith("AL") || normalizedSymbol.startsWith("GD") || normalizedSymbol.startsWith("TX")) return "1Y";
  if (normalizedSymbol === "AAPL" || normalizedSymbol === "SPY" || normalizedSymbol === "QQQ") return "6M";

  return "1M";
}

export function generateMockOHLCV(symbol: string, timeframe: Timeframe): OHLCVPoint[] {
  const count = candleCounts[timeframe];
  const step = stepSeconds[timeframe];
  const seed = hashSymbol(symbol) + timeframe.length * 19;
  const basePrice = getBasePrice(symbol);
  const volatility = getVolatility(symbol, timeframe);
  const startingTimestamp = fixedEndTimestamp - (count - 1) * step;
  let previousClose = basePrice;

  // Datos OHLCV simulados: esta serie mock permite validar UI e interacciones.
  // En una integracion futura se reemplazara por datos reales de mercado normalizados.
  return Array.from({ length: count }, (_, index) => {
    const drift = Math.sin(index / 12 + seed / 20) * volatility * 0.45;
    const shock = (seededNoise(seed, index) - 0.5) * volatility * 1.8;
    const open = previousClose;
    const close = Math.max(open * (1 + drift + shock), open * 0.65);
    const wickNoise = seededNoise(seed + 17, index) * volatility;
    const high = Math.max(open, close) * (1 + wickNoise * 0.85);
    const low = Math.min(open, close) * (1 - wickNoise * 0.75);
    const baseVolume = 180000 + (seed % 120) * 4200;
    const volumePulse = 1 + Math.abs(close - open) / Math.max(open, 1) * 18 + seededNoise(seed + 31, index) * 0.7;

    previousClose = close;

    return {
      time: Math.round(startingTimestamp + index * step),
      open: roundPrice(open, basePrice),
      high: roundPrice(Math.max(high, open, close), basePrice),
      low: roundPrice(Math.min(low, open, close), basePrice),
      close: roundPrice(close, basePrice),
      volume: roundVolume(baseVolume * volumePulse),
    };
  });
}
