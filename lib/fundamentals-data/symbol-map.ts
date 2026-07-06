import type { FundamentalsAssetClass } from "./types";

const yahooSupported = new Set([
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
  "DESP",
  "GLOB",
  "TEO",
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
const etfSymbols = new Set(["SPY", "QQQ", "DIA", "IWM", "GLD", "SLV", "TLT", "HYG", "VOO", "VTI"]);
const cedearSymbols = new Set(["AAPL", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "AMD", "INTC", "NFLX", "MELI", "KO", "PEP", "WMT", "SPY", "QQQ", "DIA", "IWM", "GLD", "SLV", "XOM", "CVX"]);
const argentinaEquitySymbols = new Set(["GGAL", "YPFD", "PAMP", "TGSU2", "BMA", "BBAR", "SUPV", "LOMA", "CEPU", "TECO2"]);
const stockSymbols = new Set([...yahooSupported].filter((symbol) => !etfSymbols.has(symbol)));
const cryptoSymbols = new Set(["BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "AVAX-USD", "LINK-USD", "DOT-USD", "MATIC-USD", "POL-USD", "LTC-USD", "BCH-USD"]);
const bondSymbols = new Set(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26", "AE38", "AE38D", "GD35", "GD35D", "GD38", "GD38D", "AL35", "AL35D", "TZX26", "DICP", "PARP", "S31Y6"]);
const fundamentalsAliases: Record<string, string> = {
  YPFD: "YPF",
  PAMP: "PAM",
  TGSU2: "TGS",
  TECO2: "TEO",
};

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
  const alias = fundamentalsAliases[normalizedSymbol];
  if (alias && yahooSupported.has(alias)) return alias;
  return yahooSupported.has(normalizedSymbol) ? normalizedSymbol : null;
}

export function isFundamentalsRealDataSupported(symbol: string): boolean {
  return getYahooFundamentalsSymbol(symbol) !== null;
}
