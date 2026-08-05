import assert from "node:assert/strict";
import test from "node:test";
import { parseBnaBilleteHtml } from "../../lib/arbitrage/adapters/bna";
import { normalizeDolarApiExchangePayload } from "../../lib/arbitrage/adapters/dolar-api";
import { errorResult } from "../../lib/arbitrage/adapters/shared";
import { normalizePlusPayload } from "../../lib/arbitrage/adapters/plus";
import { getFreshnessStatus } from "../../lib/arbitrage/freshness";
import { getArbitrageProvider } from "../../lib/arbitrage/provider-registry";

const fetchedAt = "2026-08-04T20:10:00.000Z";

test("normalizes Plus sell/buy fields to the user perspective", () => {
  const result = normalizePlusPayload([{ code: "usd", sell: "1519.00", buy: "1479.00", date: "2026-08-04 17:05:23" }], fetchedAt);
  const quote = result.quotes[0];
  assert.equal(quote?.userBuysUsdAt, 1519);
  assert.equal(quote?.userSellsUsdAt, 1479);
  assert.equal(quote?.originalBuyLabel, "sell");
  assert.equal(quote?.originalSellLabel, "buy");
  assert.equal(quote?.fees?.confidence, "confirmed");
});

test("Plus parses the real Argentina timestamp separately from fetchedAt and preserves genuine staleness", () => {
  const realPayloadSanitized = [{ code: "usd", sell: "1510.00", buy: "1470.00", date: "2026-08-05 13:54:02" }];
  const result = normalizePlusPayload(realPayloadSanitized, "2026-08-05T17:39:41.139Z");
  const quote = result.quotes[0];
  assert.equal(quote?.observedAt, "2026-08-05T13:54:02-03:00");
  assert.equal(quote?.fetchedAt, "2026-08-05T17:39:41.139Z");
  assert.equal(getFreshnessStatus(quote!, new Date("2026-08-05T17:39:41.139Z")), "stale");
  assert.equal(quote?.status, "stale");
});

test("normalizes BNA entity Compra/Venta labels to the user perspective", () => {
  const result = parseBnaBilleteHtml(`
    <div class="tab-pane fade" id="billetes">
      <table><thead><tr><th class="fechaCot">4/8/2026</th><th>Compra</th><th>Venta</th></tr></thead>
      <tbody><tr><td class="tit">Dolar U.S.A</td><td>1465,00</td><td>1515,00</td></tr></tbody></table>
      <div class="legal">Hora Actualización: 17:07</div>
    </div><div class="tab-pane" id="divisas"></div>
  `, fetchedAt);
  const quote = result.quotes[0];
  assert.equal(quote?.userBuysUsdAt, 1515);
  assert.equal(quote?.userSellsUsdAt, 1465);
  assert.equal(quote?.originalBuyLabel, "Venta");
  assert.equal(quote?.originalSellLabel, "Compra");
});

test("DolarApi keeps stablecoin assets separate and preserves partial data", () => {
  const result = normalizeDolarApiExchangePayload([
    { exchange: "belo", compra: 1581, venta: 1561, criptomonedaBase: "USDT" },
    { exchange: "dolarapp", compra: 1563.35, venta: 1560.93, criptomonedaBase: "USDC" },
    { exchange: "satoshitango", compra: 1554.4, venta: null, criptomonedaBase: "USDT" },
    { exchange: "belo", compra: 1500, venta: 1490, criptomonedaBase: "USD_AR" },
  ], fetchedAt);
  assert.equal(result.status, "partial");
  assert.equal(result.quotes.length, 3);
  assert.deepEqual(result.quotes.map((quote) => quote.transferAsset), ["USDT", "USDC", "USDT"]);
  assert.equal(result.quotes[2]?.userSellsUsdAt, undefined);
  assert.ok(result.quotes.every((quote) => quote.warnings.includes("observed_at_unavailable")));
  assert.ok(result.quotes.every((quote) => quote.observedAt === undefined));
  assert.ok(result.quotes.every((quote) => getFreshnessStatus(quote) === "unverifiable"));
  assert.ok(result.quotes.every((quote) => quote.verification.quote === "reference_only"));
});

test("Fiwind remains unavailable while documented USD transfer capabilities are modeled independently", () => {
  const fiwind = getArbitrageProvider("fiwind");
  assert.equal(fiwind?.status, "temporarily_unavailable");
  assert.equal(fiwind?.sourceType, "unavailable");
  assert.equal(fiwind?.verification.deposit, "verified");
  assert.equal(fiwind?.verification.withdrawal, "verified");
  assert.equal(fiwind?.verification.sameHolder, "verified");
});

test("invalid payloads and provider failures expose safe error codes", () => {
  assert.equal(normalizePlusPayload([], fetchedAt).errorCode, "invalid_payload");
  assert.equal(parseBnaBilleteHtml("<html></html>", fetchedAt).errorCode, "invalid_payload");
  const failure = errorResult("plus", new Error("secret upstream detail"));
  assert.equal(failure.status, "error");
  assert.equal(failure.errorCode, "upstream_unavailable");
  assert.equal(JSON.stringify(failure).includes("secret upstream detail"), false);
});
