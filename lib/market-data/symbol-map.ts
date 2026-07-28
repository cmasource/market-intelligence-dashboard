import type { MarketDataAssetClass } from "./types";
import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";

const seededYahooSymbols = [
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
  "DESP",
  "BABA",
  "VALE",
  "PBR",
  "XLE",
  "BRK-B",
  "TX",
  "CRESY",
  "IRS",
  "EDN",
  "TEO",
  "ALUA.BA",
  "COME.BA",
  "BYMA.BA",
  "VALO.BA",
  "TRAN.BA",
  "TGNO4.BA",
  "MIRG.BA",
  "METR.BA",
  "AGRO.BA",
  "HARG.BA",
  "MOLI.BA",
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
];
const providerMarketSymbols = instrumentMasterSeed
  .filter((instrument) =>
    (instrument.dataCapabilities.includes("technical_full") || instrument.dataCapabilities.includes("technical_underlying"))
    && instrument.providerSymbol
    && instrument.assetClass !== "crypto",
  )
  .flatMap((instrument) => [instrument.providerSymbol as string, instrument.underlyingSymbol ?? ""])
  .filter(Boolean);
const yahooSymbols = new Set([...seededYahooSymbols, ...providerMarketSymbols]);
const etfSymbols = new Set(instrumentMasterSeed
  .filter((instrument) => instrument.assetClass === "etf" && instrument.providerSymbol)
  .map((instrument) => instrument.providerSymbol as string));
const stockSymbols = new Set([...yahooSymbols].filter((symbol) => !etfSymbols.has(symbol)));
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
const argentinaSymbols = new Set([
  "GGAL", "YPFD", "PAMP", "TGSU2", "BMA", "BBAR", "SUPV", "LOMA", "CEPU", "TECO2",
  "ALUA", "COME", "BYMA", "VALO", "TRAN", "TGNO4", "MIRG", "METR", "AGRO", "HARG", "MOLI",
  "TXAR", "CRES", "IRSA", "EDN", "DESP",
]);
const bondSymbols = new Set(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26", "AE38", "AE38D", "GD35", "GD35D", "GD38", "GD38D", "AL35", "AL35D", "TZX26", "DICP", "PARP", "S31L6", "S30N6", "D31L6"]);
const argentinaProviderAliases: Record<string, string> = {
  YPFD: "YPF",
  PAMP: "PAM",
  TGSU2: "TGS",
  TECO2: "TEO",
  TXAR: "TX",
  CRES: "CRESY",
  IRSA: "IRS",
  BRKB: "BRK-B",
  ALUA: "ALUA.BA",
  COME: "COME.BA",
  BYMA: "BYMA.BA",
  VALO: "VALO.BA",
  TRAN: "TRAN.BA",
  TGNO4: "TGNO4.BA",
  MIRG: "MIRG.BA",
  METR: "METR.BA",
  AGRO: "AGRO.BA",
  HARG: "HARG.BA",
  MOLI: "MOLI.BA",
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
