import assert from "node:assert/strict";
import test from "node:test";
import { calculatePeriodReturns } from "../../lib/analysis/technical-analysis-service";
import type { MarketDataCandle } from "../../lib/market-data/types";

function candle(day: string, close: number): MarketDataCandle {
  return {
    time: Date.parse(`${day}T00:00:00Z`) / 1000,
    open: close,
    high: close,
    low: close,
    close,
    volume: 1,
  };
}

test("calculates ranking returns from the shared OHLCV series", () => {
  const returns = calculatePeriodReturns([
    candle("2026-01-02", 100),
    candle("2026-01-31", 110),
    candle("2026-06-30", 120),
    candle("2026-07-30", 132),
  ]);

  assert.equal(returns["30D"], 10);
  assert.equal(returns["180D"], 20);
  assert.equal(returns.YTD, 32);
});
