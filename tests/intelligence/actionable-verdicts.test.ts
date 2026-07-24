import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFundamentalVerdict,
  buildIntegratedVerdict,
  buildTechnicalChecklist,
  buildTechnicalVerdict,
} from "@/lib/intelligence/actionable-verdicts";
import type { TechnicalIndicatorSnapshot } from "@/lib/analysis/types";
import type { FundamentalsSnapshot } from "@/lib/fundamentals-data/types";

const constructiveTechnical: TechnicalIndicatorSnapshot = {
  lastClose: 120,
  sma20: 115,
  sma50: 108,
  sma200: 92,
  ema12: 116,
  ema26: 109,
  rsi14: 58,
  macd: 1.2,
  macdSignal: 0.8,
  macdHistogram: 0.4,
  support: 100,
  resistance: 125,
  volumeTrend: "increasing",
  trendLabel: "Constructive uptrend",
  momentumLabel: "Positive momentum",
};

const constructiveFundamentals: FundamentalsSnapshot = {
  trailingPE: 18,
  forwardPE: 16,
  roe: 0.18,
  roa: 0.07,
  revenueGrowth: 0.08,
  earningsGrowth: 0.1,
  debtToEquity: 0.7,
  currentRatio: 1.4,
};

test("technical verdict uses the five-check setup from the prototype", () => {
  const checklist = buildTechnicalChecklist(constructiveTechnical, "es");
  assert.equal(checklist.length, 5);
  assert.equal(checklist.filter((item) => item.passed === true).length, 5);

  const verdict = buildTechnicalVerdict(constructiveTechnical, 82, "es");
  assert.equal(verdict.tone, "positive");
  assert.match(verdict.label, /favorable/i);
});

test("fundamental verdict becomes favorable when coverage and quality are constructive", () => {
  const verdict = buildFundamentalVerdict(constructiveFundamentals, 76, "stock", "es");
  assert.equal(verdict.tone, "positive");
  assert.match(verdict.label, /favorable/i);
});

test("integrated verdict is cautious when one core layer has limited coverage", () => {
  const technical = buildTechnicalVerdict(constructiveTechnical, 82, "es");
  const fundamental = buildFundamentalVerdict({}, null, "stock", "es");
  const integrated = buildIntegratedVerdict(technical, fundamental, "es");

  assert.equal(integrated.tone, "warning");
});
