import type { MarketDataAssetClass } from "./types";

const yahooSymbols = new Set(["AAPL", "SPY", "QQQ"]);
const stockSymbols = new Set(["AAPL"]);
const etfSymbols = new Set(["SPY", "QQQ"]);
const cryptoSymbols: Record<string, string> = {
  "BTC-USD": "BTCUSDT",
  "ETH-USD": "ETHUSDT",
};
const argentinaSymbols = new Set(["GGAL", "YPFD"]);
const bondSymbols = new Set(["AL30", "GD30", "TX26"]);

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
