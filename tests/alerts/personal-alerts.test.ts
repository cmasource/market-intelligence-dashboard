import assert from "node:assert/strict";
import test from "node:test";
import { evaluatePersonalAlert } from "../../lib/alerts/personal";
import type { AlertMarketSnapshot, PersonalAlertCondition, PersonalAlertSubscription } from "../../lib/alerts/types";

function marketBars() {
  return Array.from({ length: 220 }, (_, index) => {
    const close = 80 + index * 0.1;
    return { time: new Date(Date.UTC(2026, 0, 1) + index * 86_400_000).toISOString(), open: close - 0.1, high: close + 0.5, low: close - 0.5, close, volume: 1_000 };
  });
}

function snapshot(bars = marketBars()): AlertMarketSnapshot {
  return {
    instrumentId: "stock:MSFT", symbol: "MSFT", name: "Microsoft Corporation", assetType: "stock", market: "us", exchange: "NASDAQ", currency: "USD",
    provider: "yahoo", providerHealthy: true, observedAt: "2026-08-08T00:00:00.000Z", fetchedAt: "2026-08-08T00:02:00.000Z", dataDelay: "eod", bars,
  };
}

function subscription(condition: PersonalAlertCondition, overrides: Partial<PersonalAlertSubscription> = {}): PersonalAlertSubscription {
  return {
    id: "subscription-1", userId: "user-1", watchlistId: "list-1", watchlistItemId: "item-1", instrumentId: "stock:MSFT", instrumentSymbol: "MSFT",
    instrumentName: "Microsoft Corporation", market: "us", exchange: "NASDAQ", currency: "USD", assetType: "stock", condition, targetValue: null,
    thresholdPercent: null, lookbackBars: null, enabled: true, createdAt: "2026-08-07T00:00:00.000Z", updatedAt: "2026-08-07T00:00:00.000Z", ...overrides,
  };
}

const now = new Date("2026-08-08T01:00:00.000Z");

test("price alerts trigger only when the latest close crosses the configured threshold", () => {
  const above = marketBars();
  above[218].close = 99;
  above[219].close = 101;
  assert.equal(evaluatePersonalAlert(snapshot(above), subscription("price_above", { targetValue: 100 }), now).triggered, true);

  const below = marketBars();
  below[218].close = 101;
  below[219].close = 99;
  assert.equal(evaluatePersonalAlert(snapshot(below), subscription("price_below", { targetValue: 100 }), now).triggered, true);
});

test("rapid rise and fall alerts use the latest close-to-close percentage", () => {
  const rise = marketBars();
  rise[218].close = 100;
  rise[219].close = 106;
  assert.equal(evaluatePersonalAlert(snapshot(rise), subscription("rapid_rise", { thresholdPercent: 5 }), now).triggered, true);

  const fall = marketBars();
  fall[218].close = 100;
  fall[219].close = 94;
  assert.equal(evaluatePersonalAlert(snapshot(fall), subscription("rapid_fall", { thresholdPercent: 5 }), now).triggered, true);
});

test("technical proximity alerts compare against EMA 200 and prior period extremes", () => {
  const flat = marketBars().map((bar) => ({ ...bar, open: 100, high: 101, low: 99, close: 100 }));
  assert.equal(evaluatePersonalAlert(snapshot(flat), subscription("near_ema200", { thresholdPercent: 0.5 }), now).triggered, true);

  const nearLow = marketBars().map((bar) => ({ ...bar, open: 100, high: 101, low: 90, close: 100 }));
  nearLow[219] = { ...nearLow[219], open: 91, high: 91, low: 90, close: 90.5 };
  assert.equal(evaluatePersonalAlert(snapshot(nearLow), subscription("near_period_low", { thresholdPercent: 1, lookbackBars: 60 }), now).triggered, true);

  const nearHigh = marketBars().map((bar) => ({ ...bar, open: 100, high: 110, low: 99, close: 100 }));
  nearHigh[219] = { ...nearHigh[219], open: 109, high: 110, low: 109, close: 109.5 };
  assert.equal(evaluatePersonalAlert(snapshot(nearHigh), subscription("near_period_high", { thresholdPercent: 1, lookbackBars: 60 }), now).triggered, true);
});

test("personal alerts are suppressed when provider data is stale or unhealthy", () => {
  const stale = snapshot();
  stale.observedAt = "2026-07-01T00:00:00.000Z";
  assert.equal(evaluatePersonalAlert(stale, subscription("rapid_rise", { thresholdPercent: 0 }), now).triggered, false);

  const unhealthy = snapshot();
  unhealthy.providerHealthy = false;
  assert.equal(evaluatePersonalAlert(unhealthy, subscription("rapid_rise", { thresholdPercent: 0 }), now).triggered, false);
});
