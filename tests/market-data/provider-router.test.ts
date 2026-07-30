import assert from "node:assert/strict";
import test from "node:test";
import { fetchTradeRadarOhlcv } from "@/lib/market-data/providerRouter";
import type { ResolvedTradeRadarSymbol } from "@/lib/market-data/resolveSymbol";

function withoutEnv(names: string[], run: () => Promise<void>) {
  const previous = new Map(names.map((name) => [name, process.env[name]]));
  for (const name of names) delete process.env[name];

  return run().finally(() => {
    for (const [name, value] of previous) {
      if (value === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = value;
      }
    }
  });
}

const resolvedSpy: ResolvedTradeRadarSymbol = {
  inputSymbol: "SPY",
  resolvedSymbol: "SPY",
  market: "us",
  notes: [],
};

test("US auto provider uses public OHLCV when API keys are missing", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json({
    chart: {
      result: [{
        timestamp: [1_700_000_000],
        indicators: {
          quote: [{ open: [100], high: [102], low: [99], close: [101], volume: [1_000] }],
        },
      }],
      error: null,
    },
  }));

  await withoutEnv(["TWELVE_DATA_API_KEY", "ALPHA_VANTAGE_API_KEY", "FMP_API_KEY"], async () => {
    const result = await fetchTradeRadarOhlcv(resolvedSpy, "1d", "auto");
    assert.equal(result.response.provider, "yahoo");
    assert.equal(result.response.ohlcv.length, 1);
  });
});

test("US auto provider returns a clear error when every OHLCV source fails", async (context) => {
  context.mock.method(globalThis, "fetch", async () => new Response(null, { status: 503 }));
  const resolved: ResolvedTradeRadarSymbol = {
    inputSymbol: "SPY",
    resolvedSymbol: "SPY",
    market: "us",
    notes: [],
  };

  await withoutEnv(["TWELVE_DATA_API_KEY", "ALPHA_VANTAGE_API_KEY", "FMP_API_KEY"], async () => {
    await assert.rejects(
      () => fetchTradeRadarOhlcv(resolved, "1d", "auto"),
      /No hay proveedor OHLCV disponible para acciones US\. Configurar TWELVE_DATA_API_KEY o ALPHA_VANTAGE_API_KEY/,
    );
  });
});
