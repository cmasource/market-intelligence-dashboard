import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "@/app/api/trade-radar/search/route";

test("trade radar search endpoint waits for at least two characters", async () => {
  const response = await GET(new Request("http://localhost/api/trade-radar/search?q=a&limit=25"));
  const data = await response.json() as { results: unknown[] };

  assert.equal(response.status, 200);
  assert.deepEqual(data.results, []);
});

test("trade radar search endpoint can return an expanded instrument set", async () => {
  const response = await GET(new Request("http://localhost/api/trade-radar/search?q=CEDEAR&limit=100"));
  const data = await response.json() as { results: Array<{ assetClass: string }> };

  assert.equal(response.status, 200);
  assert.equal(data.results.length > 25, true);
  assert.equal(data.results.some((item) => item.assetClass === "cedear" || item.assetClass === "cedear_etf"), true);
});
