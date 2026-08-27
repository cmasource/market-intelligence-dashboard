import assert from "node:assert/strict";
import test from "node:test";
import { getMarketQuote } from "@/lib/market-data/quote-service";
import { getYahooQuoteSnapshot } from "@/lib/market-data/yahoo-provider";

const yahooResult = {
  chart: {
    result: [{
      meta: {
        currency: "USD",
        regularMarketPrice: 222.33,
        regularMarketTime: 1_787_837_400,
        exchangeDataDelayedBy: 0,
      },
      timestamp: [1_787_578_200, 1_787_664_600, 1_787_751_000, 1_787_837_400],
      indicators: {
        quote: [{
          open: [214, 208, 210, 222.86],
          high: [220, 214, 214, 225.43],
          low: [207, 207, 208, 221.22],
          close: [214, 208.48, 209.66, 222.33],
          volume: [1_000, 1_100, 1_200, 1_300],
        }],
      },
    }],
    error: null,
  },
};

test("Yahoo quote computes the daily move against the previous session close", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json(yahooResult));

  const quote = await getYahooQuoteSnapshot("NVDA");

  assert.equal(quote.price, 222.33);
  assert.ok(quote.change !== null && Math.abs(quote.change - 12.67) < 0.0001);
  assert.ok(quote.changePercent !== null && Math.abs(quote.changePercent - 6.0431) < 0.001);
  assert.equal(quote.observedAt, "2026-08-27T13:30:00.000Z");
  assert.equal(quote.provider, "yahoo");
});

test("market quote does not confuse the last five-minute candle with the daily variation", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json(yahooResult));

  const quote = await getMarketQuote("NVDA", { instrumentId: "stock:NVDA" });

  assert.equal(quote.currency, "USD");
  assert.equal(quote.price, 222.33);
  assert.ok(quote.changePercent !== null && quote.changePercent > 6 && quote.changePercent < 6.1);
  assert.equal(quote.provider, "yahoo");
});

test("explicit CEDEAR quotes cannot relabel an underlying USD quote as ARS", async () => {
  const quote = await getMarketQuote("NVDA", { instrumentId: "cedear:NVDA" });

  assert.equal(quote.currency, "ARS");
  assert.equal(quote.price, null);
  assert.equal(quote.provider, "unavailable");
  assert.match(quote.error ?? "", /Argentina quote endpoint/);
});
