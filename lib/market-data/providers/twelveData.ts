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

type TwelveDataBar = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
};

type TwelveDataResponse = {
  values?: TwelveDataBar[];
  meta?: { currency?: string; symbol?: string; exchange?: string };
  status?: string;
  message?: string;
  code?: number;
};

const intervalMap: Record<TradeRadarInterval, string> = {
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
};

function apiKey() {
  return process.env.TWELVE_DATA_API_KEY?.trim() ?? "";
}

function parseBars(values: TwelveDataBar[] | undefined): OhlcvBar[] {
  return normalizeBars(
    (values ?? []).flatMap((item) => {
      if (!item.datetime) return [];
      const open = parseFiniteNumber(item.open);
      const high = parseFiniteNumber(item.high);
      const low = parseFiniteNumber(item.low);
      const close = parseFiniteNumber(item.close);
      if ([open, high, low, close].some((value) => value === null)) return [];

      return [{
        time: new Date(item.datetime).toISOString(),
        open: open as number,
        high: high as number,
        low: low as number,
        close: close as number,
        volume: parseFiniteNumber(item.volume) ?? 0,
      }];
    }),
  );
}

export const twelveDataProvider: MarketDataProvider = {
  name: "twelveData",
  async getOhlcv(request: ProviderRequest): Promise<ProviderResponse> {
    const key = apiKey();
    if (!key) {
      throw new ProviderError("twelveData", "Missing TWELVE_DATA_API_KEY.", {
        missingEnv: "TWELVE_DATA_API_KEY",
      });
    }

    const symbol = normalizeProviderSymbol(request.symbol);
    const url = new URL("https://api.twelvedata.com/time_series");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", intervalMap[request.interval]);
    url.searchParams.set("outputsize", "260");
    url.searchParams.set("apikey", key);

    const response = await fetch(url, { next: { revalidate: request.interval === "1d" ? 120 : 60 } });
    if (!response.ok) {
      throw new ProviderError("twelveData", `Twelve Data returned HTTP ${response.status}.`, {
        statusCode: response.status,
      });
    }

    const data = await response.json() as TwelveDataResponse;
    if (data.status === "error") throw new ProviderError("twelveData", data.message ?? "Twelve Data returned an error.");

    const ohlcv = parseBars(data.values);
    if (!ohlcv.length) throw new ProviderError("twelveData", "Twelve Data returned no usable OHLCV bars.");

    return {
      symbol,
      resolvedSymbol: data.meta?.symbol ?? symbol,
      market: request.market,
      provider: "twelveData",
      interval: request.interval,
      currency: data.meta?.currency ?? "USD",
      dataDelay: request.interval === "1d" ? "eod" : "delayed",
      ohlcv,
      sourceLabel: "Twelve Data time series",
      fetchedAt: new Date().toISOString(),
    };
  },
};
