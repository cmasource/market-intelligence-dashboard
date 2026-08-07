import assert from "node:assert/strict";
import test from "node:test";
import { GET } from "@/app/api/research/cauciones/route";
import { expectedCaucionMarketDateKey } from "@/lib/argentina/cauciones";

function currentMarketTimestamp() {
  const [year, month, day] = expectedCaucionMarketDateKey().split("-");
  return `${Number(day)}/${Number(month)}/${year} 12:00:00`;
}

test("cauciones route returns normalized source-backed data without a live provider dependency", async () => {
  const originalFetch = globalThis.fetch;
  const timestamp = currentMarketTimestamp();
  const iolFixture = `
    <table><tbody>
      <tr><td><strong>1</strong></td><td>PESOS</td><td class="tar">1.250.000,00</td><td>1.251.000,00</td><td></td><td data-order="24,50">24,50 %</td><td>${timestamp}</td></tr>
      <tr><td><strong>7</strong></td><td>PESOS</td><td class="tar">980.000,00</td><td>981.000,00</td><td></td><td data-order="23,10">23,10 %</td><td>${timestamp}</td></tr>
    </tbody></table>
  `;

  globalThis.fetch = (async (input) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("iol.invertironline.com")) {
      return new Response(iolFixture, { status: 200, headers: { "Content-Type": "text/html" } });
    }
    return new Response("upstream unavailable in deterministic test", { status: 503 });
  }) as typeof fetch;

  try {
    const response = await GET();
    const payload = await response.json() as {
      quotes: Array<{ termDays: number; rateTna: number }>;
      source: { name: string; url: string };
      methodology: { alertBasis: string };
    };

    assert.equal(response.status, 200);
    assert.deepEqual(payload.quotes.map((quote) => [quote.termDays, quote.rateTna]), [[1, 24.5], [7, 23.1]]);
    assert.equal(payload.source.name, "invertirOnline");
    assert.match(payload.source.url, /^https:\/\//);
    assert.equal(payload.methodology.alertBasis, "intraday_high_or_last_rate_vs_previous_close");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
