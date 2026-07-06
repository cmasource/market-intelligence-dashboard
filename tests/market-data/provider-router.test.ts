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

test("US auto provider returns a clear error when OHLCV keys are missing", async () => {
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
