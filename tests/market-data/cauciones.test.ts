import assert from "node:assert/strict";
import test from "node:test";
import { parsePpiCauciones } from "../../lib/argentina/cauciones";

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
