import type { MACDResult } from "@/types/finance";

function isValidPeriod(period: number) {
  return Number.isInteger(period) && period > 0;
}

function average(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

// Retornos simples: precio actual / precio anterior - 1.
export function calculateSimpleReturns(prices: number[]) {
  return prices.map((price, index) => {
    if (index === 0) return null;

    const previousPrice = prices[index - 1];

    if (!Number.isFinite(price) || !Number.isFinite(previousPrice) || previousPrice === 0) return null;

    return price / previousPrice - 1;
  });
}

// SMA suaviza una serie usando el promedio de una ventana fija.
export function calculateSMA(values: number[], period: number) {
  if (!isValidPeriod(period)) return values.map(() => null);

  return values.map((_, index) => {
    if (index + 1 < period) return null;

    const window = values.slice(index + 1 - period, index + 1);

    if (window.some((value) => !Number.isFinite(value))) return null;

    return average(window);
  });
}

// EMA da mayor peso a los valores recientes.
export function calculateEMA(values: number[], period: number) {
  if (!isValidPeriod(period)) return values.map(() => null);

  const multiplier = 2 / (period + 1);
  const ema: (number | null)[] = values.map(() => null);

  values.forEach((value, index) => {
    if (!Number.isFinite(value)) return;

    if (index + 1 === period) {
      const initialWindow = values.slice(0, period);
      ema[index] = initialWindow.some((item) => !Number.isFinite(item)) ? null : average(initialWindow);
      return;
    }

    if (index + 1 > period) {
      const previousEMA = ema[index - 1];
      ema[index] = previousEMA === null ? null : (value - previousEMA) * multiplier + previousEMA;
    }
  });

  return ema;
}

// RSI compara ganancias y perdidas promedio para estimar sobrecompra o sobreventa.
export function calculateRSI(values: number[], period = 14) {
  if (!isValidPeriod(period)) return values.map(() => null);

  return values.map((_, index) => {
    if (index < period) return null;

    const changes = values.slice(index + 1 - period, index + 1).map((value, changeIndex, window) => {
      if (changeIndex === 0) {
        return value - values[index - period];
      }

      return value - window[changeIndex - 1];
    });

    if (changes.some((change) => !Number.isFinite(change))) return null;

    const gains = changes.map((change) => Math.max(change, 0));
    const losses = changes.map((change) => Math.max(-change, 0));
    const averageGain = average(gains);
    const averageLoss = average(losses);

    if (averageLoss === 0) return 100;

    const relativeStrength = averageGain / averageLoss;

    return 100 - 100 / (1 + relativeStrength);
  });
}

// MACD resta una EMA lenta a una EMA rapida y agrega una linea de senal.
export function calculateMACD(values: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9): MACDResult {
  const fastEMA = calculateEMA(values, fastPeriod);
  const slowEMA = calculateEMA(values, slowPeriod);
  const macdLine = values.map((_, index) => {
    const fast = fastEMA[index];
    const slow = slowEMA[index];

    return fast === null || slow === null ? null : fast - slow;
  });
  const compactMacdValues = macdLine.filter((value): value is number => value !== null);
  const compactSignal = calculateEMA(compactMacdValues, signalPeriod);
  let compactIndex = 0;
  const signalLine = macdLine.map((value) => {
    if (value === null) return null;

    const signal = compactSignal[compactIndex] ?? null;
    compactIndex += 1;

    return signal;
  });
  const histogram = macdLine.map((value, index) => {
    const signal = signalLine[index];

    return value === null || signal === null ? null : value - signal;
  });

  return {
    macdLine,
    signalLine,
    histogram,
  };
}
