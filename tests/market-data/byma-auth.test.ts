import assert from "node:assert/strict";
import test from "node:test";
import { hasBymaOAuthCredentials } from "@/lib/market-data/providers/bymaAuth";

test("BYMA OAuth credential detection uses client credentials", () => {
  const previousId = process.env.BYMA_CLIENT_ID;
  const previousSecret = process.env.BYMA_CLIENT_SECRET;
  process.env.BYMA_CLIENT_ID = "client-id";
  process.env.BYMA_CLIENT_SECRET = "client-secret";

  try {
    assert.equal(hasBymaOAuthCredentials(), true);
  } finally {
    if (previousId === undefined) {
      delete process.env.BYMA_CLIENT_ID;
    } else {
      process.env.BYMA_CLIENT_ID = previousId;
    }
    if (previousSecret === undefined) {
      delete process.env.BYMA_CLIENT_SECRET;
    } else {
      process.env.BYMA_CLIENT_SECRET = previousSecret;
    }
  }
});
