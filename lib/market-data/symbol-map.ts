import type { MarketDataAssetClass } from "./types";

const yahooSymbols = new Set([
  "AAPL",
  "MSFT",
  "NVDA",
  "AMZN",
  "META",
  "GOOGL",
  "TSLA",
  "NFLX",
  "AMD",
  "INTC",
  "JPM",
  "BAC",
  "KO",
  "PEP",
  "WMT",
  "DIS",
  "V",
  "MA",
  "XOM",
  "CVX",
  "UNH",
  "JNJ",
  "PG",
  "COST",
  "MCD",
  "NKE",
  "CRM",
  "ORCL",
  "IBM",
  "MELI",
  "GGAL",
  "YPF",
  "PAM",
  "TGS",
  "BMA",
  "BBAR",
  "SUPV",
  "LOMA",
  "CEPU",
  "GLOB",
  "SPY",
  "QQQ",
  "DIA",
  "IWM",
  "GLD",
  "SLV",
  "TLT",
  "HYG",
  "VOO",
  "VTI",
]);
const stockSymbols = new Set([...yahooSymbols].filter((symbol) => !["SPY", "QQQ", "DIA", "IWM", "GLD", "SLV", "TLT", "HYG", "VOO", "VTI"].includes(symbol)));
const etfSymbols = new Set(["SPY", "QQQ", "DIA", "IWM", "GLD", "SLV", "TLT", "HYG", "VOO", "VTI"]);
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
  "MATIC-USD": "MATICUSDT",
  "POL-USD": "POLUSDT",
  "LTC-USD": "LTCUSDT",
  "BCH-USD": "BCHUSDT",
};
const argentinaSymbols = new Set(["GGAL", "YPFD", "PAMP", "TGSU2", "BMA", "BBAR", "SUPV", "LOMA", "CEPU", "TECO2"]);
const bondSymbols = new Set(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26", "AE38", "AE38D", "GD35", "GD35D", "GD38", "GD38D", "AL35", "AL35D", "TZX26", "DICP", "PARP", "S31Y6"]);
const argentinaProviderAliases: Record<string, string> = {
  YPFD: "YPF",
  PAMP: "PAM",
  TGSU2: "TGS",
  TECO2: "TEO",
};

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
  const alias = argentinaProviderAliases[normalizedSymbol];
  if (alias && yahooSymbols.has(alias)) return alias;
  return yahooSymbols.has(normalizedSymbol) ? normalizedSymbol : null;
}

export function getCryptoSymbol(symbol: string): string | null {
  const normalizedSymbol = normalizeSymbol(symbol);
  return cryptoSymbols[normalizedSymbol] ?? null;
}

export function isRealDataSupported(symbol: string): boolean {
  return getYahooSymbol(symbol) !== null || getCryptoSymbol(symbol) !== null;
}
