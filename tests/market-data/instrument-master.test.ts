import assert from "node:assert/strict";
import test from "node:test";
import { GET as getInstrumentStatus } from "@/app/api/instruments/status/route";
import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
import { searchInstruments } from "@/lib/instruments/searchInstruments";

test("instrument search prioritizes exact US symbols and includes CEDEAR alternatives", () => {
  const results = searchInstruments({ query: "MSFT", limit: 5 });

  assert.equal(results[0].id, "stock:MSFT");
  assert.equal(results[0].dataCapabilities.includes("technical_full"), true);
  assert.equal(results.some((result) => result.id === "cedear:MSFT"), true);
});

test("instrument search supports company names", () => {
  const results = searchInstruments({ query: "Microsoft", limit: 5 });

  assert.equal(results.some((result) => result.id === "stock:MSFT"), true);
  assert.equal(results.some((result) => result.id === "cedear:MSFT"), true);
});

test("CEDEAR resolution points technical layer to US underlying", () => {
  const resolution = resolveInstrument({ instrumentId: "cedear:MSFT" });

  assert.equal(resolution?.instrument.assetClass, "cedear");
  assert.equal(resolution?.technicalLayer?.symbol, "MSFT");
  assert.equal(resolution?.technicalLayer?.market, "us");
  assert.equal(resolution?.localLayer?.market, "argentina");
  assert.equal(resolution?.dataCoverage.includes("technical_underlying"), true);
});

test("local Argentine equity resolution uses associated ADR when available", () => {
  const resolution = resolveInstrument({ instrumentId: "ar-equity:GGAL" });

  assert.equal(resolution?.instrument.market, "argentina");
  assert.equal(resolution?.instrument.underlyingSymbol, "GGAL");
  assert.equal(resolution?.technicalLayer?.symbol, "GGAL");
  assert.equal(resolution?.localLayer?.provider, "byma");
});

test("fixed income instruments are quote only", () => {
  const resolution = resolveInstrument({ symbol: "AL30" });

  assert.equal(resolution?.instrument.assetClass, "bond");
  assert.equal(resolution?.technicalLayer, null);
  assert.deepEqual(resolution?.dataCoverage, ["quote_only"]);
});

test("crypto instruments resolve to Binance technical layer", () => {
  const resolution = resolveInstrument({ symbol: "BTCUSDT" });

  assert.equal(resolution?.instrument.market, "crypto");
  assert.equal(resolution?.technicalLayer?.market, "crypto");
  assert.equal(resolution?.technicalLayer?.description, "Binance OHLCV");
});

test("instrument status endpoint does not expose environment secrets", async () => {
  const previous = process.env.BYMA_CLIENT_SECRET;
  process.env.BYMA_CLIENT_SECRET = "instrument-secret-test";

  try {
    const response = await getInstrumentStatus();
    const serialized = JSON.stringify(await response.json());

    assert.equal(response.status, 200);
    assert.equal(serialized.includes("instrument-secret-test"), false);
    assert.equal(serialized.includes("BYMA_CLIENT_SECRET"), false);
  } finally {
    if (previous === undefined) {
      delete process.env.BYMA_CLIENT_SECRET;
    } else {
      process.env.BYMA_CLIENT_SECRET = previous;
    }
  }
});
