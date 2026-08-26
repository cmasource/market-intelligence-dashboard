import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizeFundamentalsResponse,
  sanitizeMergedAdrSnapshot,
} from "@/lib/fundamentals-data/provider-quality";
import type { FundamentalsResponse } from "@/lib/fundamentals-data/types";

function response(overrides: Partial<FundamentalsResponse>): FundamentalsResponse {
  return {
    symbol: "YPF",
    provider: "finnhub",
    assetClass: "stock",
    sourceLabel: "Test provider",
    isFallback: false,
    snapshot: {},
    interpretation: { label: "", tone: "neutral", summary: "", bulletPoints: [] },
    ...overrides,
  };
}

test("foreign reporting currency is not mixed into an Argentine ADR snapshot", () => {
  const sanitized = sanitizeFundamentalsResponse(response({
    snapshot: {
      marketPrice: 50.11,
      marketCap: 32_524_678_000_000,
      eps: -2775,
      fiftyTwoWeekHigh: 87_225,
      currency: "ARS",
    },
  }), { providerSymbol: "YPF" });

  assert.deepEqual(sanitized.snapshot, { marketPrice: 50.11, currency: "USD" });
  assert.match(sanitized.warnings?.join(" ") ?? "", /no mezclarlas/i);
});

test("Alpha Vantage ADR ratios with an obvious currency mismatch are excluded", () => {
  const sanitized = sanitizeFundamentalsResponse(response({
    provider: "alpha_vantage",
    snapshot: { priceToSales: 0.0007, priceToBook: 1.6, beta: -0.073, currency: "USD" },
  }), { providerSymbol: "YPF" });

  assert.equal(sanitized.snapshot.priceToSales, undefined);
  assert.equal(sanitized.snapshot.beta, undefined);
  assert.equal(sanitized.snapshot.priceToBook, 1.6);
});

test("merged ADR fundamentals cannot reintroduce per-share values from a different reporting currency", () => {
  const sanitized = sanitizeMergedAdrSnapshot({
    currency: "USD",
    reportingCurrency: "ARS",
    eps: 0.37,
    bookValuePerShare: 3.57,
    trailingPE: 117.43,
    forwardPE: 3.31,
    pegRatio: 0.18,
    priceToBook: 1.16,
    roe: 0.07,
  }, { providerSymbol: "GGAL" });

  assert.equal(sanitized.snapshot.eps, undefined);
  assert.equal(sanitized.snapshot.bookValuePerShare, undefined);
  assert.equal(sanitized.snapshot.trailingPE, undefined);
  assert.equal(sanitized.snapshot.forwardPE, undefined);
  assert.equal(sanitized.snapshot.pegRatio, undefined);
  assert.equal(sanitized.snapshot.priceToBook, 1.16);
  assert.equal(sanitized.snapshot.roe, 0.07);
  assert.match(sanitized.warnings.join(" "), /conversion ADR verificable/i);
});

test("ADR per-share fundamentals remain available when statements and listing use USD", () => {
  const sanitized = sanitizeMergedAdrSnapshot({
    currency: "USD",
    reportingCurrency: "USD",
    eps: 3.02,
    trailingPE: 16.62,
  }, { providerSymbol: "YPF" });

  assert.equal(sanitized.snapshot.eps, 3.02);
  assert.equal(sanitized.snapshot.trailingPE, 16.62);
  assert.deepEqual(sanitized.warnings, []);
});
