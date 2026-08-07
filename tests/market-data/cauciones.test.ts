import assert from "node:assert/strict";
import test from "node:test";
import {
  expectedCaucionMarketDateKey,
  parseIolCauciones,
  parsePpiCauciones,
} from "../../lib/argentina/cauciones";

function ppiHtml(instrument: Record<string, unknown>) {
  return `<html><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
    props: { pageProps: { instruments: [instrument] } },
  })}</script></html>`;
}

test("caucion alert remains active after an intraday spike retreats", () => {
  const payload = parsePpiCauciones(ppiHtml({
    ticker: "PESOS1",
    description: "PESOS 1",
    lastPrice: 35,
    variation: 75,
    pricePurchase: 40,
    priceSale: 40.1,
    volumen: 6_422_305_832_033,
    previousClosing: 20,
    minDay: 20.5,
    maxDay: 45,
    lastQuote: "2026-07-30T16:40:14-03:00",
    expirationDate: "2026-07-31T00:00:00-03:00",
    currency: { id: 10000 },
  }));

  assert.equal(payload.quotes[0]?.rateTna, 35);
  assert.equal(payload.alert?.basis, "intraday_high");
  assert.equal(payload.alert?.rateTna, 45);
  assert.equal(payload.alert?.currentRateTna, 35);
  assert.equal(payload.alert?.increasePoints, 25);
  assert.equal(payload.alert?.increasePercent, 125);
});

test("caucion alert uses relative variation rather than percentage points", () => {
  const payload = parsePpiCauciones(ppiHtml({
    ticker: "PESOS1",
    description: "PESOS 1",
    lastPrice: 22.5,
    previousClosing: 20,
    minDay: 20,
    maxDay: 22.5,
    currency: { id: 10000 },
  }));

  assert.equal(payload.alert?.increasePoints, 2.5);
  assert.equal(payload.alert?.increasePercent, 12.5);
});

test("IOL parser reads the current pesos wheel and ignores dollars", () => {
  const payload = parseIolCauciones(`
    <table><tbody>
      <tr><td><strong>3</strong></td><td>PESOS</td><td class="tar">4.083.627.457.006,00</td><td>4.091.866.580.634,22</td><td></td><td data-order="25,70">25,70 %</td><td>31/7/2026 12:04:01</td></tr>
      <tr><td><strong>1</strong></td><td>PESOS</td><td class="tar">0,00</td><td>0,00</td><td></td><td data-order="0,00">0,00 %</td><td>31/7/2026 12:04:01</td></tr>
      <tr><td><strong>3</strong></td><td>DOLARES</td><td>354.425.055,00</td><td>354.466.444,86</td><td></td><td>01,39 %</td><td>31/7/2026 12:03:59</td></tr>
    </tbody></table>
  `);

  assert.equal(payload.source.name, "invertirOnline");
  assert.equal(payload.updatedAt, "2026-07-31T12:04:01-03:00");
  assert.deepEqual(payload.quotes.map((quote) => [quote.termDays, quote.rateTna, quote.volume]), [[3, 25.7, 4_083_627_457_006]]);
  assert.equal(payload.alert, null);
});

test("expected caucion session uses the previous business day before market open", () => {
  assert.equal(expectedCaucionMarketDateKey(new Date("2026-08-07T09:36:00-03:00")), "2026-08-06");
  assert.equal(expectedCaucionMarketDateKey(new Date("2026-08-10T10:59:00-03:00")), "2026-08-07");
  assert.equal(expectedCaucionMarketDateKey(new Date("2026-08-09T12:00:00-03:00")), "2026-08-07");
});

test("expected caucion session switches to the current business day at market open", () => {
  assert.equal(expectedCaucionMarketDateKey(new Date("2026-08-07T11:00:00-03:00")), "2026-08-07");
  assert.equal(expectedCaucionMarketDateKey(new Date("2026-08-10T11:00:00-03:00")), "2026-08-10");
});
