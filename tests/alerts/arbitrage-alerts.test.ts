import assert from "node:assert/strict";
import test from "node:test";
import { evaluateArbitrageAlert } from "../../lib/alerts/arbitrage";
import type { ArbitrageAlertSubscription } from "../../lib/alerts/types";
import type { FxQuote } from "../../lib/arbitrage/types";

const now = new Date("2026-08-11T14:00:00.000Z");
const subscription: ArbitrageAlertSubscription = {
  id: "subscription-1",
  userId: "user-1",
  scope: "route",
  sourceProviderId: "reba",
  destinationProviderId: "fiwind",
  transferAsset: "USD_BANK",
  amountUsd: 1000,
  minimumGrossSpreadArs: 1.5,
  enabled: true,
  createdAt: now.toISOString(),
  updatedAt: now.toISOString(),
};

function quote(overrides: Partial<FxQuote>): FxQuote {
  return {
    id: "quote",
    providerId: "reba",
    instrument: "bank_usd",
    transferAsset: "USD_BANK",
    userBuysUsdAt: 1500,
    userSellsUsdAt: 1490,
    quoteCurrency: "ARS",
    fetchedAt: "2026-08-11T13:59:30.000Z",
    sourceType: "aggregator",
    status: "delayed",
    sourcePollingIntervalSeconds: 300,
    fees: { confidence: "unknown" },
    warnings: ["observed_at_unavailable", "costs_unverified"],
    verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" },
    ...overrides,
  };
}

test("configured comparison triggers on a recent gross difference without claiming net profit", () => {
  const evaluated = evaluateArbitrageAlert(subscription, [
    quote({ id: "reba-usd" }),
    quote({ id: "fiwind-usd", providerId: "fiwind", instrument: "crypto_usd_route", userBuysUsdAt: 1525, userSellsUsdAt: 1501.72 }),
  ], new Map([["reba", "Reba"], ["fiwind", "Fiwind"]]), now);
  assert.equal(evaluated?.evaluation.triggered, true);
  assert.ok(Math.abs((evaluated?.opportunity.grossSpreadPerUsd ?? 0) - 1.72) < 0.000001);
  assert.match(evaluated?.evaluation.title.es ?? "", /Reba → Fiwind/);
  assert.match(evaluated?.evaluation.title.es ?? "", /Diferencia de cotización detectada/i);
  assert.doesNotMatch(evaluated?.evaluation.summary.es ?? "", /USD 1[.,]000|resultado neto/i);
  assert.equal(evaluated?.evaluation.freshnessStatus, "fresh");
  assert.ok(evaluated?.evaluation.limitations.some((item) => /no confirma ganancia neta/i.test(item)));
});

test("global difference monitor scans every route and selects the largest current spread", () => {
  const evaluated = evaluateArbitrageAlert({
    ...subscription,
    scope: "any_verified",
    sourceProviderId: null,
    destinationProviderId: null,
    minimumGrossSpreadArs: 0.01,
  }, [
    quote({ id: "reba-usd" }),
    quote({ id: "fiwind-usd", providerId: "fiwind", instrument: "crypto_usd_route", userBuysUsdAt: 1525, userSellsUsdAt: 1502.68 }),
    quote({ id: "bna-usd", providerId: "bna", userBuysUsdAt: 1510, userSellsUsdAt: 1495 }),
  ], new Map([["reba", "Reba"], ["fiwind", "Fiwind"]]), now);
  assert.equal(evaluated?.opportunity.sourceProviderId, "reba");
  assert.equal(evaluated?.opportunity.destinationProviderId, "fiwind");
  assert.equal(evaluated?.evaluation.triggered, true);
  assert.match(evaluated?.evaluation.summary.es ?? "", /2,68|2\.68/);
});

test("quote-difference evaluation is independent of the legacy stored amount", () => {
  const quotes = [
    quote({ id: "reba-usd" }),
    quote({ id: "fiwind-usd", providerId: "fiwind", userSellsUsdAt: 1506 }),
  ];
  const small = evaluateArbitrageAlert({ ...subscription, amountUsd: 1, minimumGrossSpreadArs: 5 }, quotes, new Map(), now);
  const large = evaluateArbitrageAlert({ ...subscription, amountUsd: 100_000, minimumGrossSpreadArs: 5 }, quotes, new Map(), now);
  assert.equal(small?.evaluation.triggered, true);
  assert.equal(large?.evaluation.triggered, true);
  assert.equal(small?.opportunity.grossSpreadPerUsd, large?.opportunity.grossSpreadPerUsd);
});

test("configured arbitrage alert does not trigger below threshold or with old retrievals", () => {
  const below = evaluateArbitrageAlert(subscription, [
    quote({ id: "reba-usd" }),
    quote({ id: "fiwind-usd", providerId: "fiwind", userSellsUsdAt: 1501 }),
  ], new Map(), now);
  assert.equal(below?.evaluation.triggered, false);

  const stale = evaluateArbitrageAlert(subscription, [
    quote({ id: "reba-usd", fetchedAt: "2026-08-11T13:00:00.000Z" }),
    quote({ id: "fiwind-usd", providerId: "fiwind", userSellsUsdAt: 1502, fetchedAt: "2026-08-11T13:00:00.000Z" }),
  ], new Map(), now);
  assert.equal(stale?.evaluation.triggered, false);
  assert.equal(stale?.evaluation.freshnessStatus, "stale");
});
