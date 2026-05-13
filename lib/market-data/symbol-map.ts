import type { MarketDataAssetClass } from "./types";

const yahooSymbols = new Set(["AAPL", "SPY", "QQQ", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "KO"]);
const stockSymbols = new Set(["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "KO"]);
const etfSymbols = new Set(["SPY", "QQQ"]);
const cryptoSymbols: Record<string, string> = {
  "BTC-USD": "BTCUSDT",
  "ETH-USD": "ETHUSDT",
  "BNB-USD": "BNBUSDT",
  "SOL-USD": "SOLUSDT",
  "XRP-USD": "XRPUSDT",
  "ADA-USD": "ADAUSDT",
  "DOGE-USD": "DOGEUSDT",
  "AVAX-USD": "AVAXUSDT",
  "LINK-USD": "LINKUSDT",
  "DOT-USD": "DOTUSDT",
};
const argentinaSymbols = new Set(["GGAL", "YPFD"]);
const bondSymbols = new Set(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"]);

export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function getAssetClassForMarketData(symbol: string): MarketDataAssetClass {
  const normalizedSymbol = normalizeSymbol(symbol);

  if (stockSymbols.has(normalizedSymbol)) return "stock";
  if (etfSymbols.has(normalizedSymbol)) return "etf";
  if (cryptoSymbols[normalizedSymbol]) return "crypto";
  if (argentinaSymbols.has(normalizedSymbol)) return "argentina";
  if (bondSymbols.has(normalizedSymbol)) return "bond";

  return "unknown";
}

export function getYahooSymbol(symbol: string): string | null {
  const normalizedSymbol = normalizeSymbol(symbol);
  return yahooSymbols.has(normalizedSymbol) ? normalizedSymbol : null;
}

export function getCryptoSymbol(symbol: string): string | null {
  const normalizedSymbol = normalizeSymbol(symbol);
  return cryptoSymbols[normalizedSymbol] ?? null;
}

export function isRealDataSupported(symbol: string): boolean {
  return getYahooSymbol(symbol) !== null || getCryptoSymbol(symbol) !== null;
}
