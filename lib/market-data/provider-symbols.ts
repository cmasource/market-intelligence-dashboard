import { normalizeSymbol } from "./symbol-map";

export const providerQuoteSymbols = new Set([
  "AAPL",
  "MSFT",
  "NVDA",
  "TSLA",
  "AMZN",
  "META",
  "GOOGL",
  "KO",
  "SPY",
  "QQQ",
  "BTC-USD",
  "ETH-USD",
  "SOL-USD",
  "BNB-USD",
]);

export function isProviderQuoteSupported(symbol: string) {
  return providerQuoteSymbols.has(normalizeSymbol(symbol));
}
