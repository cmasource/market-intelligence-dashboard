import type { OhlcvBar } from "@/lib/market-data/providers/base";

function isValidPeriod(period: number) {
  return Number.isInteger(period) && period > 0;
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function sma(values: number[], period: number): Array<number | null> {
  if (!isValidPeriod(period)) return values.map(() => null);

  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const window = values.slice(index + 1 - period, index + 1);
    if (window.some((value) => !Number.isFinite(value))) return null;
    return average(window);
  });
}

export function ema(values: number[], period: number): Array<number | null> {
  if (!isValidPeriod(period)) return values.map(() => null);

  const result: Array<number | null> = values.map(() => null);
  const multiplier = 2 / (period + 1);

  values.forEach((value, index) => {
    if (!Number.isFinite(value)) return;
    if (index + 1 === period) {
      const seed = values.slice(0, period);
      result[index] = seed.some((item) => !Number.isFinite(item)) ? null : average(seed);
      return;
    }
    if (index + 1 > period) {
      const previous = result[index - 1];
      result[index] = previous === null ? null : (value - previous) * multiplier + previous;
    }
  });

  return result;
}

export function rsiWilder(closes: number[], period = 14): Array<number | null> {
  if (!isValidPeriod(period)) return closes.map(() => null);
  const result: Array<number | null> = closes.map(() => null);
  if (closes.length <= period) return result;

  let gainSum = 0;
  let lossSum = 0;

  for (let index = 1; index <= period; index += 1) {
    const change = closes[index] - closes[index - 1];
    if (!Number.isFinite(change)) return result;
    gainSum += Math.max(change, 0);
    lossSum += Math.max(-change, 0);
  }

  let averageGain = gainSum / period;
  let averageLoss = lossSum / period;
  result[period] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);

  for (let index = period + 1; index < closes.length; index += 1) {
    const change = closes[index] - closes[index - 1];
    if (!Number.isFinite(change)) continue;
    averageGain = (averageGain * (period - 1) + Math.max(change, 0)) / period;
    averageLoss = (averageLoss * (period - 1) + Math.max(-change, 0)) / period;
    result[index] = averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
  }

  return result;
}

function trueRange(current: OhlcvBar, previous?: OhlcvBar) {
  if (!previous) return current.high - current.low;
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close),
  );
}

export function atrWilder(bars: OhlcvBar[], period = 14): Array<number | null> {
  if (!isValidPeriod(period)) return bars.map(() => null);
  const result: Array<number | null> = bars.map(() => null);
  if (bars.length < period) return result;

  const ranges = bars.map((bar, index) => trueRange(bar, bars[index - 1]));
  const initial = ranges.slice(0, period);
  if (initial.some((value) => !Number.isFinite(value))) return result;

  let atr = average(initial);
  result[period - 1] = atr;

  for (let index = period; index < ranges.length; index += 1) {
    atr = (atr * (period - 1) + ranges[index]) / period;
    result[index] = atr;
  }

  return result;
}

export function avgVolume(bars: OhlcvBar[], period = 20): Array<number | null> {
  return sma(bars.map((bar) => bar.volume), period);
}

export function latestNumber(values: Array<number | null>) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
}
