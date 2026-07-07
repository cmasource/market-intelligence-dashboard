import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "@/app/api/trade-radar/search/route";

test("trade radar search endpoint waits for at least two characters", async () => {
  const response = await GET(new Request("http://localhost/api/trade-radar/search?q=a&limit=25"));
  const data = await response.json() as { results: unknown[] };

  assert.equal(response.status, 200);
  assert.deepEqual(data.results, []);
});
