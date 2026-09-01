import assert from "node:assert/strict";
import test from "node:test";
import { calculateMarketSignalScore } from "@/lib/analysis/market-signal";
import type { TechnicalIndicatorSnapshot } from "@/lib/analysis/types";
import type { FundamentalsResponse } from "@/lib/fundamentals-data/types";
import { buildIntegratedOutlook } from "@/lib/intelligence/integrated-outlook";

const technicalSnapshot: TechnicalIndicatorSnapshot = {
  lastClose: 120,
  sma20: 115,
  sma50: 108,
  sma200: 92,
  ema12: 116,
  ema26: 109,
  rsi14: 58.4,
  macd: 1.2,
  macdSignal: 0.8,
  macdHistogram: 0.4,
  support: 100,
  resistance: 125,
  volumeTrend: "increasing",
  trendLabel: "Tendencia alcista",
  momentumLabel: "Momentum positivo",
};

const fundamentals: FundamentalsResponse = {
  symbol: "ORCL",
  provider: "fmp",
  assetClass: "stock",
  sourceLabel: "FMP",
  isFallback: false,
  fundamentalScore: 82,
  coverageRatio: 0.9,
  snapshot: {
    trailingPE: 24.5,
    roe: 0.28,
    revenueGrowth: 0.12,
    debtToEquity: 1.1,
  },
  interpretation: {
    label: "Constructivo",
    tone: "positive",
    summary: "Fundamentos favorables.",
    bulletPoints: [],
  },
};

test("integrated outlook preserves deterministic scores and verified evidence", () => {
  const marketSignal = calculateMarketSignalScore({
    technicalScore: 74,
    fundamentalScore: fundamentals.fundamentalScore,
    assetType: "stock",
    language: "es",
  });
  const outlook = buildIntegratedOutlook({
    symbol: "ORCL",
    language: "es",
    technicalScore: 74,
    technicalSnapshot,
    fundamentals,
    marketSignal,
  });

  assert.equal(outlook.method, "deterministic");
  assert.match(outlook.summary, /74\/100/);
  assert.match(outlook.summary, /82\/100/);
  assert.ok(outlook.technicalEvidence.some((item) => item.includes("RSI 14")));
  assert.ok(outlook.fundamentalEvidence.some((item) => item.includes("P/E")));
  assert.match(outlook.confirmation, /125/);
  assert.match(outlook.risk, /100/);
});

test("integrated outlook states partial coverage when a core layer is missing", () => {
  const partialFundamentals = { ...fundamentals, fundamentalScore: null, snapshot: {} };
  const marketSignal = calculateMarketSignalScore({
    technicalScore: 70,
    fundamentalScore: null,
    assetType: "stock",
    language: "es",
  });
  const outlook = buildIntegratedOutlook({
    symbol: "TEST",
    language: "es",
    technicalScore: 70,
    technicalSnapshot,
    fundamentals: partialFundamentals,
    marketSignal,
  });

  assert.match(outlook.summary, /N\/D/);
  assert.match(outlook.scenario, /parcial/i);
});
