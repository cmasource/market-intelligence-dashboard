import assert from "node:assert/strict";
import test from "node:test";
import { parseBnaBilleteHtml } from "../../lib/arbitrage/adapters/bna";
import { normalizeComparaDolarUsdPayload } from "../../lib/arbitrage/adapters/comparadolar";
import { normalizeCriptoYaPayloads } from "../../lib/arbitrage/adapters/criptoya";
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
  assert.equal(quote?.instrument, "bank_usd");
  assert.equal(quote?.fees?.confidence, "confirmed");
});

test("Plus is registered as bank USD without a verified 24/7 claim", () => {
  const plus = getArbitrageProvider("plus");
  assert.equal(plus?.operates24x7, false);
  assert.equal(plus?.verification.availability24x7, "unverified");
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

test("CriptoYa normalizes effective stablecoin prices, assets, timestamps and reference volume", () => {
  const result = normalizeCriptoYaPayloads({
    USDT: {
      fiwind: { ask: 1578, totalAsk: 1580, bid: 1565, totalBid: 1563, time: 1785959274 },
      belo: { ask: 1584, totalAsk: 1584, bid: 1564, totalBid: 1564, time: 1785959272 },
      unsupported: { ask: 1, bid: 1, time: 1785959272 },
    },
    USDC: {
      dolarapp: { ask: 1570.68, totalAsk: 1570.68, bid: 1567.411, totalBid: 1567.411, time: 1785959355 },
    },
  }, "2026-08-05T20:00:00.000Z");
  assert.equal(result.status, "success");
  assert.equal(result.quotes.length, 3);
  assert.deepEqual(result.quotes.map((quote) => quote.transferAsset), ["USDT", "USDT", "USDC"]);
  assert.equal(result.quotes[0]?.userBuysUsdAt, 1580);
  assert.equal(result.quotes[0]?.userSellsUsdAt, 1563);
  assert.equal(result.quotes[0]?.observedAt, "2026-08-05T19:47:54.000Z");
  assert.equal(result.quotes[0]?.quotedAmountUsd, 1000);
  assert.ok(result.quotes.every((quote) => quote.warnings.includes("volume_specific_quote")));
  assert.ok(result.quotes.every((quote) => quote.verification.quote === "reference_only"));
});

test("CriptoYa invalid or future timestamps are never treated as fresh observations", () => {
  const result = normalizeCriptoYaPayloads({
    USDT: { fiwind: { ask: 1578, bid: 1565, time: 4_000_000_000 } },
  }, "2026-08-05T18:30:00.000Z");
  const quote = result.quotes[0];
  assert.equal(result.status, "partial");
  assert.equal(quote?.observedAt, undefined);
  assert.equal(quote?.status, "stale");
  assert.equal(getFreshnessStatus(quote!), "stale");
  assert.ok(quote?.warnings.includes("observed_at_unavailable"));
});

test("CriptoYa includes timestamped quotes from the expanded wallet and exchange coverage", () => {
  const result = normalizeCriptoYaPayloads({
    USDT: {
      buenbit: { totalAsk: 1590, totalBid: 1560, time: 1785959274 },
      binancep2p: { totalAsk: 1580, totalBid: 1570, time: 1785959274 },
      huobip2p: { totalAsk: 0, totalBid: 1500, time: 1785959274 },
    },
  }, "2026-08-05T20:00:00.000Z");
  assert.deepEqual(result.quotes.map((quote) => quote.providerId), ["buenbit", "binancep2p"]);
  assert.ok(result.quotes.every((quote) => quote.observedAt));
});

test("Fiwind is integrated as an aggregator reference without upgrading route capabilities", () => {
  const fiwind = getArbitrageProvider("fiwind");
  assert.equal(fiwind?.status, "active");
  assert.equal(fiwind?.sourceType, "aggregator");
  assert.equal(fiwind?.verification.deposit, "partially_verified");
  assert.equal(fiwind?.verification.withdrawal, "partially_verified");
  assert.equal(fiwind?.verification.sameHolder, "verified");
});

test("ComparaDólar preserves the user perspective and never invents observation time", () => {
  const result = normalizeComparaDolarUsdPayload([
    { slug: "plus", bid: 1475, ask: 1515 },
    { slug: "banco-hipotecario", bid: "1490.25", ask: "1520.50" },
    { slug: "fiwind-cripto", bid: 1504, ask: 1532 },
    { slug: "uala", bid: 1_480_000, ask: 1_515_000 },
  ], fetchedAt);

  assert.equal(result.status, "partial");
  assert.deepEqual(result.quotes.map((quote) => quote.providerId), ["banco-hipotecario", "fiwind"]);
  const bank = result.quotes[0];
  assert.equal(bank?.userBuysUsdAt, 1520.5);
  assert.equal(bank?.userSellsUsdAt, 1490.25);
  assert.equal(bank?.observedAt, undefined);
  assert.equal(getFreshnessStatus(bank!), "unverifiable");
  assert.equal(bank?.verification.quote, "reference_only");
  assert.equal(bank?.sourcePollingIntervalSeconds, 300);

  const fiwind = result.quotes[1];
  assert.equal(fiwind?.instrument, "crypto_usd_route");
  assert.equal(fiwind?.transferAsset, "USD_BANK");
  assert.equal(fiwind?.userBuysUsdAt, 1532);
  assert.equal(fiwind?.userSellsUsdAt, 1504);
  assert.match(fiwind?.originalSellLabel ?? "", /USD → USDT → ARS/);
});

test("ComparaDólar rejects inverted or unusably scaled curated rows", () => {
  const result = normalizeComparaDolarUsdPayload([
    { slug: "banco-ciudad", bid: 1490, ask: 1520 },
    { slug: "reba", bid: 1600, ask: 1500 },
    { slug: "uala", bid: 1_480_000, ask: 1_515_000 },
  ], fetchedAt);
  assert.deepEqual(result.quotes.map((quote) => quote.providerId), ["banco-ciudad"]);
});

test("invalid payloads and provider failures expose safe error codes", () => {
  assert.equal(normalizePlusPayload([], fetchedAt).errorCode, "invalid_payload");
  assert.equal(parseBnaBilleteHtml("<html></html>", fetchedAt).errorCode, "invalid_payload");
  const failure = errorResult("plus", new Error("secret upstream detail"));
  assert.equal(failure.status, "error");
  assert.equal(failure.errorCode, "upstream_unavailable");
  assert.equal(JSON.stringify(failure).includes("secret upstream detail"), false);
});
