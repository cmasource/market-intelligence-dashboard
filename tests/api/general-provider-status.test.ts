import assert from "node:assert/strict";
import test from "node:test";
import { getProviderStatus } from "@/lib/providers/provider-status";

test("provider status exposes providers without presenting the terminal unavailable state as one", () => {
  const status = getProviderStatus();
  const groups = [status.marketData, status.fundamentals, status.news];

  for (const group of groups) {
    assert.ok(group.length > 0);
    assert.equal(group.some((item) => item.provider === "unavailable"), false);
  }

  assert.equal(status.fallbackChain.includes("unavailable"), false);
  assert.ok(status.marketData.some((item) => item.provider === status.activeMarketDataProvider));
  assert.ok(status.fundamentals.some((item) => item.provider === status.activeFundamentalsProvider));
  assert.ok(status.news.some((item) => item.provider === status.activeNewsProvider));
});
