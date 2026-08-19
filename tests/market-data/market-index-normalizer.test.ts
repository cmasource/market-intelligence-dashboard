import assert from "node:assert/strict";
import test from "node:test";
import { normalizeMarketIndexSnapshot } from "@/lib/market-data/market-index-normalizer";

test("market index variation uses the prior daily close instead of incompatible metadata", () => {
  const snapshot = normalizeMarketIndexSnapshot({
    regularMarketPrice: 2_976_595.36,
    regularMarketTime: 1_786_640_573,
    currency: "ARS",
    timestamps: [1_786_467_600, 1_786_554_000, 1_786_640_400],
    closes: [3_022_485, 2_999_524, 2_976_595.36],
  });

  assert.equal(snapshot.previousClose, 2_999_524);
  assert.ok(snapshot.changePercent !== null);
  assert.ok(Math.abs(snapshot.changePercent - -0.7644) < 0.001);
});

test("market index normalization preserves the provider scale", () => {
  const snapshot = normalizeMarketIndexSnapshot({
    regularMarketPrice: 7_795.69,
    regularMarketTime: 1_786_641_772,
    timestamps: [1_786_381_800, 1_786_468_200, 1_786_554_600, 1_786_641_000],
    closes: [7_728.2, 7_748.5, 7_709.96, 7_795.69],
  });

  assert.equal(snapshot.value, 7_795.69);
  assert.equal(snapshot.previousClose, 7_709.96);
});
