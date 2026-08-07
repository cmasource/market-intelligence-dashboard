import assert from "node:assert/strict";
import test from "node:test";
import { canReactivate, classifyAlertAssetType, deduplicationKey, evaluateAlertRules } from "../../lib/alerts/engine";
import type { AlertMarketSnapshot } from "../../lib/alerts/types";
import { shouldEvaluateOnThisRun } from "../../lib/alerts/scheduler";

function bars(options: { latestMove?: number; latestVolume?: number; volatileTail?: boolean } = {}) {
  const result = Array.from({ length: 80 }, (_, index) => {
    const base = 100 + index * 0.04 + Math.sin(index / 3) * 0.18;
    return { time: new Date(Date.UTC(2026, 7, 1) - (79 - index) * 86_400_000).toISOString(), open: base - 0.1, high: base + 0.35, low: base - 0.35, close: base, volume: 1_000 };
  });
  if (options.volatileTail) {
    for (let index = 70; index < 80; index += 1) {
      const close = 104 + (index % 2 ? 1 : -1) * (index - 68) * 0.8;
      result[index] = { ...result[index], open: close - 0.2, high: close + 0.5, low: close - 0.5, close };
    }
  }
  if (options.latestMove) {
    const previous = result.at(-2)!.close;
    const close = previous * (1 + options.latestMove);
    result[79] = { ...result[79], open: previous, high: Math.max(previous, close) + 0.2, low: Math.min(previous, close) - 0.2, close };
  }
  if (options.latestVolume) result[79].volume = options.latestVolume;
  return result;
}

function snapshot(overrides: Partial<AlertMarketSnapshot> = {}): AlertMarketSnapshot {
  return {
    instrumentId: "us-stock-aapl", symbol: "AAPL", name: "Apple", assetType: "stock", market: "us", exchange: "NASDAQ", currency: "USD",
    provider: "yahoo", providerHealthy: true, observedAt: "2026-08-01T00:00:00.000Z", fetchedAt: "2026-08-01T00:05:00.000Z", dataDelay: "eod", bars: bars(), ...overrides,
  };
}

const now = new Date("2026-08-01T01:00:00.000Z");

test("classifies supported equity, crypto and fixed-income identities", () => {
  assert.equal(classifyAlertAssetType("argentine_equity"), "stock");
  assert.equal(classifyAlertAssetType("CEDEAR"), "cedear");
  assert.equal(classifyAlertAssetType("corporate_bond"), "corporate_bond");
  assert.equal(classifyAlertAssetType("unknown"), "other");
});

test("triggers volatility-adjusted price, volume, trend and multi-signal opportunity rules", () => {
  const evaluations = evaluateAlertRules(snapshot({ bars: bars({ latestMove: 0.1, latestVolume: 4_000 }) }), now);
  for (const ruleId of ["unusual_price_move", "unusual_volume", "trend_change", "multi_signal_opportunity"]) {
    const evaluation = evaluations.find((item) => item.ruleId === ruleId);
    assert.equal(evaluation?.triggered, true, `${ruleId} should trigger`);
    assert.ok((evaluation?.confidenceScore ?? 0) >= 0.6);
    assert.ok((evaluation?.evidence.length ?? 0) >= 2);
  }
});

test("detects elevated volatility against the instrument's own baseline", () => {
  const evaluation = evaluateAlertRules(snapshot({ bars: bars({ volatileTail: true }) }), now).find((item) => item.ruleId === "elevated_volatility");
  assert.equal(evaluation?.triggered, true);
});

test("suppresses every trigger for stale, incomplete or unhealthy provider data", () => {
  const volatileBars = bars({ latestMove: 0.12, latestVolume: 5_000 });
  const stale = evaluateAlertRules(snapshot({ observedAt: "2026-07-01T00:00:00.000Z", bars: volatileBars }), now);
  const incomplete = evaluateAlertRules(snapshot({ bars: volatileBars.slice(-30) }), now);
  const unhealthy = evaluateAlertRules(snapshot({ providerHealthy: false, bars: volatileBars }), now);
  assert.ok(stale.every((item) => !item.triggered));
  assert.ok(incomplete.every((item) => !item.triggered));
  assert.ok(unhealthy.every((item) => !item.triggered));
});

test("does not apply technical equity rules to unsupported bond data", () => {
  assert.deepEqual(evaluateAlertRules(snapshot({ assetType: "bond" }), now), []);
});

test("deduplication is stable and cooldown gates reactivation", () => {
  const evaluation = evaluateAlertRules(snapshot({ bars: bars({ latestMove: 0.1 }) }), now).find((item) => item.triggered)!;
  const first = deduplicationKey({ userId: "u1", instrumentId: "aapl", evaluation, window: "2026-08-01T01" });
  const second = deduplicationKey({ userId: "u1", instrumentId: "aapl", evaluation, window: "2026-08-01T01" });
  assert.equal(first, second);
  assert.equal(canReactivate("2026-08-01T00:30:00.000Z", 60, now), false);
  assert.equal(canReactivate("2026-07-31T23:30:00.000Z", 60, now), true);
});

test("evaluation cadence follows instrument market instead of polling every asset every hour", () => {
  assert.equal(shouldEvaluateOnThisRun("crypto", "crypto", new Date("2026-08-01T10:00:00Z")), true);
  assert.equal(shouldEvaluateOnThisRun("stock", "argentina", new Date("2026-08-03T21:00:00Z")), true);
  assert.equal(shouldEvaluateOnThisRun("stock", "us", new Date("2026-08-03T22:00:00Z")), true);
  assert.equal(shouldEvaluateOnThisRun("stock", "us", new Date("2026-08-03T18:00:00Z")), false);
  assert.equal(shouldEvaluateOnThisRun("stock", "us", new Date("2026-08-02T22:00:00Z")), false);
});
