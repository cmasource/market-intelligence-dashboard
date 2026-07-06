import {
  normalizeBars,
  normalizeProviderSymbol,
  parseFiniteNumber,
  ProviderError,
  type MarketDataProvider,
  type OhlcvBar,
  type ProviderRequest,
  type ProviderResponse,
  type TradeRadarInterval,
} from "./base";

type FmpHistoricalResponse = {
  historical?: Array<{ date?: string; open?: number; high?: number; low?: number; close?: number; volume?: number }>;
  "Error Message"?: string;
};

type FmpIntradayBar = {
  date?: string;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

function apiKey() {
  return process.env.FMP_API_KEY?.trim() ?? "";
}

function parseFmpBars(values: FmpIntradayBar[]): OhlcvBar[] {
  return normalizeBars(
    values.flatMap((item) => {
      if (!item.date) return [];
      const open = parseFiniteNumber(item.open);
      const high = parseFiniteNumber(item.high);
      const low = parseFiniteNumber(item.low);
      const close = parseFiniteNumber(item.close);
      if ([open, high, low, close].some((value) => value === null)) return [];
      return [{
        time: new Date(item.date).toISOString(),
        open: open as number,
        high: high as number,
        low: low as number,
        close: close as number,
        volume: parseFiniteNumber(item.volume) ?? 0,
      }];
    }),
  );
}

function fmpInterval(interval: TradeRadarInterval) {
  if (interval === "1h") return "1hour";
  if (interval === "4h") return "4hour";
  return "1day";
}

export const fmpRadarProvider: MarketDataProvider = {
  name: "fmp",
  async getOhlcv(request: ProviderRequest): Promise<ProviderResponse> {
    const key = apiKey();
    if (!key) {
      throw new ProviderError("fmp", "Missing FMP_API_KEY.", { missingEnv: "FMP_API_KEY" });
    }

    const symbol = normalizeProviderSymbol(request.symbol);
    const url = request.interval === "1d"
      ? new URL(`https://financialmodelingprep.com/api/v3/historical-price-full/${encodeURIComponent(symbol)}`)
      : new URL(`https://financialmodelingprep.com/api/v3/historical-chart/${fmpInterval(request.interval)}/${encodeURIComponent(symbol)}`);
    url.searchParams.set("apikey", key);
    if (request.interval === "1d") url.searchParams.set("timeseries", "260");

    const response = await fetch(url, { next: { revalidate: request.interval === "1d" ? 300 : 120 } });
    if (!response.ok) {
      throw new ProviderError("fmp", `FMP returned HTTP ${response.status}.`, { statusCode: response.status });
    }

    const data = await response.json() as FmpHistoricalResponse | FmpIntradayBar[];
    const providerMessage = Array.isArray(data) ? undefined : data["Error Message"];
    if (providerMessage) throw new ProviderError("fmp", providerMessage);

    const rows = Array.isArray(data) ? data : data.historical ?? [];
    const ohlcv = parseFmpBars(rows).slice(-260);
    if (!ohlcv.length) throw new ProviderError("fmp", "FMP returned no usable OHLCV bars.");

    return {
      symbol,
      resolvedSymbol: symbol,
      market: request.market,
      provider: "fmp",
      interval: request.interval,
      currency: "USD",
      dataDelay: request.interval === "1d" ? "eod" : "delayed",
      ohlcv,
      sourceLabel: "FMP historical chart",
      fetchedAt: new Date().toISOString(),
    };
  },
};
