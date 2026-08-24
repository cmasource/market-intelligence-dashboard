import assert from "node:assert/strict";
import test from "node:test";
import { buildUsdCryptoCircuits } from "../../lib/arbitrage/conversion-circuits";
import type { FxQuote } from "../../lib/arbitrage/types";

const now = new Date("2026-08-14T15:00:00.000Z");

function quote(overrides: Partial<FxQuote>): FxQuote {
  return {
    id: "quote",
    providerId: "plus",
    instrument: "bank_usd",
    transferAsset: "USD_BANK",
    userBuysUsdAt: 1_520,
    userSellsUsdAt: 1_500,
    quoteCurrency: "ARS",
    observedAt: "2026-08-14T14:59:00.000Z",
    fetchedAt: "2026-08-14T15:00:00.000Z",
    sourceUrl: "https://example.com/quote",
    sourceType: "public_endpoint",
    status: "live",
    fees: { confidence: "unknown" },
    warnings: [],
    verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" },
    ...overrides,
  };
}

test("builds documented Fiwind and Lemon circuits without treating Lemon's USD conversion as one-to-one", () => {
  const circuits = buildUsdCryptoCircuits([
    quote({ id: "reba-usd", providerId: "reba", userBuysUsdAt: 1_520 }),
    quote({ id: "fiwind-composite", providerId: "fiwind", instrument: "crypto_usd_route", transferAsset: "USD_BANK", userSellsUsdAt: 1_555 }),
    quote({ id: "lemon-usdt", providerId: "lemoncash", instrument: "usdt", transferAsset: "USDT", userSellsUsdAt: 1_560 }),
  ], 1_000, now);

  assert.equal(circuits.length, 2);
  const fiwind = circuits.find((circuit) => circuit.destinationProviderId === "fiwind");
  const lemon = circuits.find((circuit) => circuit.destinationProviderId === "lemoncash");

  assert.equal(fiwind?.status, "effective_quote");
  assert.equal(fiwind?.effectiveSellRateArs, 1_555);
  assert.equal(fiwind?.grossSpreadUpperBoundArsPerUsd, 35);
  assert.equal(fiwind?.netResultArs, undefined);

  assert.equal(lemon?.status, "conversion_spread_unavailable");
  assert.equal(lemon?.effectiveSellRateArs, undefined);
  assert.equal(lemon?.conversionRateVerified, false);
  assert.equal(lemon?.grossSpreadUpperBoundArsPerUsd, 40);
  assert.equal(lemon?.netResultArs, undefined);
  assert.ok(lemon?.warnings.includes("verify_final_price"));
  assert.ok(lemon?.warnings.includes("same_holder_required"));
});

test("does not create a circuit from stale bank USD or unsupported providers", () => {
  const circuits = buildUsdCryptoCircuits([
    quote({ id: "old-usd", providerId: "reba", observedAt: "2026-08-10T12:00:00.000Z", status: "stale" }),
    quote({ id: "bitso-usdt", providerId: "bitsoalpha", instrument: "usdt", transferAsset: "USDT", userSellsUsdAt: 1_560 }),
    quote({ id: "lemon-usdt", providerId: "lemoncash", instrument: "usdt", transferAsset: "USDT", userSellsUsdAt: 1_560 }),
  ], 1_000, now);
  assert.deepEqual(circuits, []);
});

test("chooses the cheapest recent bank USD source across the full quote universe", () => {
  const circuits = buildUsdCryptoCircuits([
    quote({ id: "expensive", providerId: "plus", userBuysUsdAt: 1_535 }),
    quote({ id: "cheapest", providerId: "reba", userBuysUsdAt: 1_510 }),
    quote({ id: "lemon-usdt", providerId: "lemoncash", instrument: "usdt", transferAsset: "USDT", userSellsUsdAt: 1_550 }),
  ], 500, now);
  assert.equal(circuits[0]?.sourceQuoteId, "cheapest");
  assert.equal(circuits[0]?.grossResultUpperBoundArs, 20_000);
});
