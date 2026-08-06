import assert from "node:assert/strict";
import test from "node:test";
import { buildOpportunityMatrix, buildTransferRoute, calculateArbitrageOpportunity, rankBuyQuotes, rankSellQuotes } from "../../lib/arbitrage";
import type { FxQuote, TransferRoute } from "../../lib/arbitrage/types";

function quote(overrides: Partial<FxQuote> & Pick<FxQuote, "id" | "providerId">): FxQuote {
  const now = new Date().toISOString();
  return {
    instrument: "bank_usd",
    transferAsset: "USD_BANK",
    userBuysUsdAt: 1500,
    userSellsUsdAt: 1490,
    quoteCurrency: "ARS",
    observedAt: now,
    fetchedAt: now,
    sourceType: "public_endpoint",
    status: "live",
    fees: { fixedArs: 0, percentage: 0, fixedUsd: 0, confidence: "confirmed" },
    warnings: [],
    verification: { quote: "verified", costs: "verified", limits: "verified", transferAsset: "verified" },
    ...overrides,
  };
}

function compatibleRoute(source: FxQuote, destination: FxQuote, amountUsd: number, overrides: Partial<TransferRoute> = {}): TransferRoute {
  return {
    ...buildTransferRoute(source, destination, amountUsd),
    isCompatible: true,
    blockers: [],
    warnings: [],
    costConfidence: "confirmed",
    verificationLevel: "verified",
    ...overrides,
  };
}

test("ranks user buy prices ascending and user sell prices descending", () => {
  const quotes = [
    quote({ id: "plus", providerId: "plus", userBuysUsdAt: 1519, userSellsUsdAt: 1479 }),
    quote({ id: "bna", providerId: "bna", userBuysUsdAt: 1515, userSellsUsdAt: 1465 }),
  ];
  assert.deepEqual(rankBuyQuotes(quotes).map((item) => item.id), ["bna", "plus"]);
  assert.deepEqual(rankSellQuotes(quotes).map((item) => item.id), ["plus", "bna"]);
});

test("calculates positive spread, gross profit, known costs and return", () => {
  const source = quote({ id: "plus", providerId: "plus", userBuysUsdAt: 1500, fees: { fixedArs: 100, percentage: 0.001, confidence: "confirmed" } });
  const destination = quote({ id: "bna", providerId: "bna", userSellsUsdAt: 1520, fees: { fixedArs: 50, percentage: 0.002, confidence: "confirmed" } });
  const route = compatibleRoute(source, destination, 1000, { estimatedTransferFeeArs: 200 });
  const result = calculateArbitrageOpportunity(source, destination, 1000, route);
  assert.equal(result.grossSpreadPerUsd, 20);
  assert.equal(result.grossProfitArs, 20_000);
  assert.equal(result.capitalRequiredArs, 1_500_000);
  assert.equal(result.estimatedCostsArs, 4_890);
  assert.equal(result.netProfitArs, 15_110);
  assert.ok(Math.abs((result.netReturnPercentage ?? 0) - 1.0073333333333334) < 1e-9);
  assert.equal(result.isProfitable, true);
});

test("mandatory negative Plus to Fiwind example is not profitable", () => {
  const source = quote({ id: "plus", providerId: "plus", userBuysUsdAt: 1519 });
  const destination = quote({ id: "fiwind", providerId: "fiwind", userSellsUsdAt: 1501.92 });
  const result = calculateArbitrageOpportunity(source, destination, 1000, compatibleRoute(source, destination, 1000));
  assert.ok(Math.abs(result.grossSpreadPerUsd - (-17.08)) < 1e-9);
  assert.ok(Math.abs(result.grossProfitArs - (-17_080)) < 1e-6);
  assert.equal(result.isProfitable, false);
});

test("converts fixed USD fees once at the applicable rate", () => {
  const source = quote({ id: "plus", providerId: "plus", userBuysUsdAt: 1500, fees: { fixedUsd: 2, confidence: "confirmed" } });
  const destination = quote({ id: "bna", providerId: "bna", userSellsUsdAt: 1510 });
  const result = calculateArbitrageOpportunity(source, destination, 1000, compatibleRoute(source, destination, 1000, { estimatedTransferFeeUsd: 1 }));
  assert.equal(result.estimatedCostsArs, 4_500);
  assert.equal(result.netProfitArs, 5_500);
});

test("unknown costs preserve gross result but do not claim a net profit", () => {
  const source = quote({ id: "plus", providerId: "plus", userBuysUsdAt: 1500, fees: undefined });
  const destination = quote({ id: "bna", providerId: "bna", userSellsUsdAt: 1510 });
  const result = calculateArbitrageOpportunity(source, destination, 1000, compatibleRoute(source, destination, 1000, { costConfidence: "unknown" }));
  assert.equal(result.grossProfitArs, 10_000);
  assert.equal(result.netProfitArs, undefined);
  assert.equal(result.costStatus, "unknown");
  assert.equal(result.isProfitable, false);
  assert.equal(result.isPotentiallyProfitable, true);
  assert.equal(result.classification, "potential_gross_difference");
  assert.ok(result.warnings.includes("costs_unverified"));
});

test("a verified opportunity requires fresh quotes, verified route, costs and limits", () => {
  const source = quote({ id: "plus", providerId: "plus", userBuysUsdAt: 1500 });
  const destination = quote({ id: "bna", providerId: "bna", userSellsUsdAt: 1510 });
  const verified = calculateArbitrageOpportunity(source, destination, 1000, compatibleRoute(source, destination, 1000));
  assert.equal(verified.classification, "verified_opportunity");

  const limitsUnknown = quote({ id: "bna-limits", providerId: "bna", userSellsUsdAt: 1510, verification: { quote: "verified", costs: "verified", limits: "unverified", transferAsset: "verified" } });
  const partial = calculateArbitrageOpportunity(source, limitsUnknown, 1000, compatibleRoute(source, limitsUnknown, 1000));
  assert.equal(partial.isProfitable, false);
  assert.equal(partial.classification, "potential_gross_difference");
});

test("rejects zero and negative amounts", () => {
  const source = quote({ id: "plus", providerId: "plus" });
  const destination = quote({ id: "bna", providerId: "bna" });
  for (const amount of [0, -10]) {
    const result = calculateArbitrageOpportunity(source, destination, amount);
    assert.equal(result.isCompatible, false);
    assert.ok(result.blockers.includes("invalid_amount"));
  }
});

test("validates minimum and maximum limits", () => {
  const source = quote({ id: "plus", providerId: "plus", limits: { minimumUsd: 100, maximumUsd: 1000 } });
  const destination = quote({ id: "bna", providerId: "bna" });
  assert.ok(buildTransferRoute(source, destination, 50).blockers.includes("below_minimum"));
  assert.ok(buildTransferRoute(source, destination, 1500).blockers.includes("above_maximum"));
});

test("blocks same providers, incompatible assets and stale quotes", () => {
  const source = quote({ id: "plus-usd", providerId: "plus" });
  const same = quote({ id: "plus-usd-2", providerId: "plus" });
  assert.ok(buildTransferRoute(source, same, 1000).blockers.includes("same_provider"));

  const stablecoin = quote({ id: "belo-usdt", providerId: "belo", instrument: "usdt", transferAsset: "USDT" });
  assert.ok(buildTransferRoute(source, stablecoin, 1000).blockers.includes("asset_mismatch"));

  const mep = quote({ id: "bna-mep", providerId: "bna", instrument: "mep" });
  assert.ok(buildTransferRoute(source, mep, 1000).blockers.includes("instrument_mismatch"));

  const stale = quote({ id: "bna-stale", providerId: "bna", observedAt: "2020-01-01T00:00:00.000Z", status: "stale" });
  assert.ok(buildTransferRoute(source, stale, 1000).blockers.includes("stale_quote"));
});

test("partial quotes remain in rankings only for their available side", () => {
  const partial = quote({ id: "partial", providerId: "plus", userBuysUsdAt: 1500, userSellsUsdAt: undefined });
  assert.equal(rankBuyQuotes([partial]).length, 1);
  assert.equal(rankSellQuotes([partial]).length, 0);
  assert.equal(buildOpportunityMatrix([partial], 1000).length, 0);
});
