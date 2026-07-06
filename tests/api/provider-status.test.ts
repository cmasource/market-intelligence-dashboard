import assert from "node:assert/strict";
import test from "node:test";
import { getTradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";

test("provider status exposes booleans but never secret values", () => {
  const previous = process.env.TWELVE_DATA_API_KEY;
  const previousBymaSecret = process.env.BYMA_CLIENT_SECRET;
  process.env.TWELVE_DATA_API_KEY = "secret-test-key";
  process.env.BYMA_CLIENT_SECRET = "byma-secret-test";

  try {
    const status = getTradeRadarProviderStatus();
    const serialized = JSON.stringify(status);

    assert.equal(status.hasTwelveDataKey, true);
    assert.equal(serialized.includes("secret-test-key"), false);
    assert.equal(serialized.includes("byma-secret-test"), false);
    assert.equal("TWELVE_DATA_API_KEY" in status, false);
    assert.equal(status.byma.authMode, "oauth_client_credentials");
    assert.equal(typeof status.byma.hasClientSecret, "boolean");
  } finally {
    if (previous === undefined) {
      delete process.env.TWELVE_DATA_API_KEY;
    } else {
      process.env.TWELVE_DATA_API_KEY = previous;
    }
    if (previousBymaSecret === undefined) {
      delete process.env.BYMA_CLIENT_SECRET;
    } else {
      process.env.BYMA_CLIENT_SECRET = previousBymaSecret;
    }
  }
});
