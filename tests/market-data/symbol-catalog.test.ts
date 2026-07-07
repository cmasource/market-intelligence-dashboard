import assert from "node:assert/strict";
import test from "node:test";
import { findSymbolCatalogItem, searchSymbolCatalog } from "@/lib/market-data/symbol-catalog";

test("symbol catalog search returns curated US symbols by prefix", () => {
  const results = searchSymbolCatalog({ query: "ms", market: "us", limit: 5 });
  assert.equal(results[0].symbol, "MSFT");
  assert.equal(results[0].providerSymbol, "MSFT");
  assert.equal(results[0].tradingViewSymbol, "NASDAQ:MSFT");
});

test("symbol catalog search supports crypto provider symbols", () => {
  const results = searchSymbolCatalog({ query: "BTC", market: "crypto", limit: 3 });
  assert.equal(results[0].symbol, "BTCUSDT");
  assert.equal(results[0].providerSymbol, "BTCUSDT");
  assert.equal(results[0].exchange, "Binance");
});

test("symbol catalog search can search across all markets", () => {
  const results = searchSymbolCatalog({ query: "T", limit: 25 });
  const symbols = results.map((item) => item.symbol);
  assert.equal(symbols.includes("TSLA"), true);
  assert.equal(symbols.includes("TSM"), true);
  assert.equal(symbols.includes("BTCUSDT"), true);
});

test("findSymbolCatalogItem resolves provider symbols", () => {
  const item = findSymbolCatalogItem("ETHUSDT");
  assert.equal(item?.market, "crypto");
  assert.equal(item?.tradingViewSymbol, "BINANCE:ETHUSDT");
});
