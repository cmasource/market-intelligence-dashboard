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

type BinanceKline = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string,
];

const intervalMap: Record<TradeRadarInterval, string> = {
  "1h": "1h",
  "4h": "4h",
  "1d": "1d",
};

const commonCryptoPairs: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  BNB: "BNBUSDT",
  XRP: "XRPUSDT",
  ADA: "ADAUSDT",
  DOGE: "DOGEUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  DOT: "DOTUSDT",
  "BTC-USD": "BTCUSDT",
  "ETH-USD": "ETHUSDT",
  "SOL-USD": "SOLUSDT",
};

function toBinanceSymbol(symbol: string) {
  const normalized = normalizeProviderSymbol(symbol).replace("/", "-");
  if (commonCryptoPairs[normalized]) return commonCryptoPairs[normalized];
  if (normalized.endsWith("-USD")) return `${normalized.replace("-USD", "")}USDT`;
  if (normalized.endsWith("USDT")) return normalized;
  return `${normalized}USDT`;
}

function parseKlines(data: BinanceKline[]): OhlcvBar[] {
  return normalizeBars(
    data.map((item) => {
      const open = parseFiniteNumber(item[1]) ?? 0;
      const high = parseFiniteNumber(item[2]) ?? open;
      const low = parseFiniteNumber(item[3]) ?? open;
      const close = parseFiniteNumber(item[4]) ?? open;
      const volume = parseFiniteNumber(item[5]) ?? 0;

      return {
        time: new Date(item[0]).toISOString(),
        open,
        high: Math.max(high, open, close),
        low: Math.min(low, open, close),
        close,
        volume,
      };
    }),
  );
}

export const binanceProvider: MarketDataProvider = {
  name: "binance",
  async getOhlcv(request: ProviderRequest): Promise<ProviderResponse> {
    const resolvedSymbol = toBinanceSymbol(request.symbol);
    const baseUrl = process.env.BINANCE_BASE_URL?.trim() || "https://api.binance.com";
    const url = new URL("/api/v3/klines", baseUrl);
    url.searchParams.set("symbol", resolvedSymbol);
    url.searchParams.set("interval", intervalMap[request.interval]);
    url.searchParams.set("limit", "260");

    const response = await fetch(url, {
      headers: { "User-Agent": "CMA Trade Radar" },
      next: { revalidate: request.interval === "1d" ? 60 : 30 },
    });

    if (!response.ok) {
      throw new ProviderError("binance", `Binance returned HTTP ${response.status}.`, {
        statusCode: response.status,
      });
    }

    const data = await response.json();
    if (!Array.isArray(data)) throw new ProviderError("binance", "Binance returned an unexpected response.");

    const ohlcv = parseKlines(data as BinanceKline[]);
    if (!ohlcv.length) throw new ProviderError("binance", "Binance returned no usable OHLCV bars.");

    return {
      symbol: normalizeProviderSymbol(request.symbol),
      resolvedSymbol,
      market: "crypto",
      provider: "binance",
      interval: request.interval,
      currency: "USD",
      dataDelay: "realtime",
      ohlcv,
      sourceLabel: "Binance public market data",
      fetchedAt: new Date().toISOString(),
    };
  },
};
