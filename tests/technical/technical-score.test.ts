import assert from "node:assert/strict";
import test from "node:test";
import { calculateTechnicalScore } from "@/lib/analysis/technical-score";
import type { TechnicalIndicatorSnapshot } from "@/lib/analysis/types";

function snapshot(overrides: Partial<TechnicalIndicatorSnapshot> = {}): TechnicalIndicatorSnapshot {
  return {
    lastClose: 100,
    sma20: null,
    sma50: null,
    sma200: null,
    ema12: null,
    ema26: null,
    rsi14: null,
    macd: null,
    macdSignal: null,
    macdHistogram: null,
    support: null,
    resistance: null,
    volumeTrend: "unavailable",
    trendLabel: "Mixed trend",
    momentumLabel: "Momentum unavailable",
    ...overrides,
  };
}

test("missing indicators remain neutral instead of becoming a false sell signal", () => {
  const score = calculateTechnicalScore(snapshot());

  assert.ok(score > 35, `expected a neutral limited-history score, received ${score}`);
  assert.ok(score < 65, `expected a neutral limited-history score, received ${score}`);
});

test("complete constructive indicators preserve a strong technical score", () => {
  const score = calculateTechnicalScore(snapshot({
    lastClose: 120,
    sma20: 115,
    sma50: 108,
    sma200: 90,
    ema12: 116,
    ema26: 110,
    rsi14: 58,
    macd: 3,
    macdSignal: 2,
    macdHistogram: 1,
    support: 100,
    resistance: 118,
    volumeTrend: "increasing",
  }));

  assert.ok(score >= 75, `expected a strong score, received ${score}`);
});
