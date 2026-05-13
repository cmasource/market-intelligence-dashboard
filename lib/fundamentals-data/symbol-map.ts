import type { FundamentalsAssetClass } from "./types";

const yahooSupported = new Set(["AAPL", "SPY", "QQQ", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "KO"]);
const etfSymbols = new Set(["SPY", "QQQ"]);
const cedearSymbols = new Set<string>();
const argentinaEquitySymbols = new Set(["GGAL", "YPFD"]);
const stockSymbols = new Set(["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "KO"]);
const cryptoSymbols = new Set(["BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "AVAX-USD", "LINK-USD", "DOT-USD"]);
const bondSymbols = new Set(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"]);

export function normalizeFundamentalsSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

export function getFundamentalsAssetClass(symbol: string): FundamentalsAssetClass {
  const normalizedSymbol = normalizeFundamentalsSymbol(symbol);

  if (stockSymbols.has(normalizedSymbol)) return "stock";
  if (etfSymbols.has(normalizedSymbol)) return "etf";
  if (cedearSymbols.has(normalizedSymbol)) return "cedear";
  if (argentinaEquitySymbols.has(normalizedSymbol)) return "argentine_equity";
  if (cryptoSymbols.has(normalizedSymbol)) return "crypto";
  if (bondSymbols.has(normalizedSymbol)) return "bond";

  return "unknown";
}

export function getYahooFundamentalsSymbol(symbol: string): string | null {
  const normalizedSymbol = normalizeFundamentalsSymbol(symbol);
  return yahooSupported.has(normalizedSymbol) ? normalizedSymbol : null;
}

export function isFundamentalsRealDataSupported(symbol: string): boolean {
  return getYahooFundamentalsSymbol(symbol) !== null;
}
