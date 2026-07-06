import {
  normalizeBars,
  normalizeProviderSymbol,
  parseFiniteNumber,
  ProviderError,
  type MarketDataProvider,
  type OhlcvBar,
  type ProviderRequest,
  type ProviderResponse,
} from "./base";

type AlphaSeries = Record<string, {
  "1. open"?: string;
  "2. high"?: string;
  "3. low"?: string;
  "4. close"?: string;
  "5. volume"?: string;
}>;

type AlphaResponse = {
  "Time Series (60min)"?: AlphaSeries;
  "Time Series (Daily)"?: AlphaSeries;
  "Error Message"?: string;
  Note?: string;
  Information?: string;
};

function apiKey() {
  return process.env.ALPHA_VANTAGE_API_KEY?.trim() ?? "";
}

function parseSeries(series: AlphaSeries | undefined): OhlcvBar[] {
  return normalizeBars(
    Object.entries(series ?? {}).flatMap(([time, values]) => {
      const open = parseFiniteNumber(values["1. open"]);
      const high = parseFiniteNumber(values["2. high"]);
      const low = parseFiniteNumber(values["3. low"]);
      const close = parseFiniteNumber(values["4. close"]);
      if ([open, high, low, close].some((value) => value === null)) return [];

      return [{
        time: new Date(time).toISOString(),
        open: open as number,
        high: high as number,
        low: low as number,
        close: close as number,
        volume: parseFiniteNumber(values["5. volume"]) ?? 0,
      }];
    }),
  );
}

function aggregateFourHour(hourlyBars: OhlcvBar[]): OhlcvBar[] {
  const buckets = new Map<number, OhlcvBar[]>();

  for (const bar of hourlyBars) {
    const date = new Date(bar.time);
    date.setUTCMinutes(0, 0, 0);
    date.setUTCHours(Math.floor(date.getUTCHours() / 4) * 4);
    const key = date.getTime();
    buckets.set(key, [...(buckets.get(key) ?? []), bar]);
  }

  return normalizeBars(
    Array.from(buckets.entries()).map(([time, bars]) => ({
      time: new Date(time).toISOString(),
      open: bars[0].open,
      high: Math.max(...bars.map((bar) => bar.high)),
      low: Math.min(...bars.map((bar) => bar.low)),
      close: bars.at(-1)?.close ?? bars[0].close,
      volume: bars.reduce((total, bar) => total + bar.volume, 0),
    })),
  );
}

export const alphaVantageProvider: MarketDataProvider = {
  name: "alphaVantage",
  async getOhlcv(request: ProviderRequest): Promise<ProviderResponse> {
    const key = apiKey();
    if (!key) {
      throw new ProviderError("alphaVantage", "Missing ALPHA_VANTAGE_API_KEY.", {
        missingEnv: "ALPHA_VANTAGE_API_KEY",
      });
    }

    const symbol = normalizeProviderSymbol(request.symbol);
    const url = new URL("https://www.alphavantage.co/query");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("apikey", key);
    url.searchParams.set("outputsize", "full");

    if (request.interval === "1d") {
      url.searchParams.set("function", "TIME_SERIES_DAILY");
    } else {
      url.searchParams.set("function", "TIME_SERIES_INTRADAY");
      url.searchParams.set("interval", "60min");
    }

    const response = await fetch(url, { next: { revalidate: request.interval === "1d" ? 300 : 120 } });
    if (!response.ok) {
      throw new ProviderError("alphaVantage", `Alpha Vantage returned HTTP ${response.status}.`, {
        statusCode: response.status,
      });
    }

    const data = await response.json() as AlphaResponse;
    const providerMessage = data["Error Message"] ?? data.Note ?? data.Information;
    if (providerMessage) throw new ProviderError("alphaVantage", providerMessage);

    const rawBars = request.interval === "1d"
      ? parseSeries(data["Time Series (Daily)"])
      : parseSeries(data["Time Series (60min)"]);
    const ohlcv = request.interval === "4h" ? aggregateFourHour(rawBars) : rawBars;
    if (!ohlcv.length) throw new ProviderError("alphaVantage", "Alpha Vantage returned no usable OHLCV bars.");

    return {
      symbol,
      resolvedSymbol: symbol,
      market: request.market,
      provider: "alphaVantage",
      interval: request.interval,
      currency: "USD",
      dataDelay: request.interval === "1d" ? "eod" : "delayed",
      ohlcv: ohlcv.slice(-260),
      sourceLabel: "Alpha Vantage time series",
      fetchedAt: new Date().toISOString(),
    };
  },
};
