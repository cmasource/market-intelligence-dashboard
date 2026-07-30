export type TradeRadarMarket = "us" | "argentina" | "cedear" | "crypto" | "bond" | "auto";

export type TradeRadarInterval = "1h" | "4h" | "1d";

export type TradeRadarProviderName = "auto" | "yahoo" | "twelveData" | "alphaVantage" | "fmp" | "byma" | "binance";

export type DataDelay = "realtime" | "delayed" | "eod" | "unknown";

export type BymaFeed = "snapshot" | "delay20" | "eod";

export type OhlcvBar = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type ProviderRequest = {
  symbol: string;
  market: Exclude<TradeRadarMarket, "auto">;
  interval: TradeRadarInterval;
};

export type ProviderResponse = {
  symbol: string;
  resolvedSymbol: string;
  market: Exclude<TradeRadarMarket, "auto">;
  provider: Exclude<TradeRadarProviderName, "auto">;
  interval: TradeRadarInterval;
  currency: string;
  dataDelay: DataDelay;
  ohlcv: OhlcvBar[];
  localQuote?: BymaQuote;
  sourceLabel: string;
  fetchedAt: string;
};

export type BymaQuote = {
  provider: "byma";
  feed: BymaFeed;
  securityId: string | null;
  symbol: string;
  category: string | null;
  categoryDesc: string | null;
  market: string | null;
  operativeForm: string | null;
  currency: string;
  settlPeriod: string | null;
  lastPrice: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  close: number | null;
  vwap: number | null;
  trades: number | null;
  volume: number | null;
  amount: number | null;
  imbalance: number | null;
  bestBid: number | null;
  bidSize: number | null;
  bestAsk: number | null;
  askSize: number | null;
  broadcastTime: string | null;
  date: string | null;
};

export type ProviderFailure = {
  provider: Exclude<TradeRadarProviderName, "auto">;
  message: string;
  missingEnv?: string;
  statusCode?: number;
};

export type MarketDataProvider = {
  name: Exclude<TradeRadarProviderName, "auto">;
  getOhlcv(request: ProviderRequest): Promise<ProviderResponse>;
};

export class ProviderError extends Error {
  provider: Exclude<TradeRadarProviderName, "auto">;
  missingEnv?: string;
  statusCode?: number;

  constructor(
    provider: Exclude<TradeRadarProviderName, "auto">,
    message: string,
    options: { missingEnv?: string; statusCode?: number } = {},
  ) {
    super(message);
    this.name = "ProviderError";
    this.provider = provider;
    this.missingEnv = options.missingEnv;
    this.statusCode = options.statusCode;
  }
}

export function normalizeProviderSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export function parseFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function normalizeBars(bars: OhlcvBar[]) {
  return bars
    .filter((bar) =>
      [bar.open, bar.high, bar.low, bar.close, bar.volume].every(Number.isFinite)
      && bar.high >= Math.max(bar.open, bar.close)
      && bar.low <= Math.min(bar.open, bar.close)
      && Number.isFinite(Date.parse(bar.time)),
    )
    .sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
}
