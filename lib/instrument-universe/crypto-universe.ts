import type { InstrumentUniverseItem } from "./types";

const realSupported = new Set([
  "BTC-USD",
  "ETH-USD",
  "BNB-USD",
  "SOL-USD",
  "XRP-USD",
  "ADA-USD",
  "DOGE-USD",
  "AVAX-USD",
  "LINK-USD",
  "DOT-USD",
  "MATIC-USD",
  "POL-USD",
  "LTC-USD",
  "BCH-USD",
]);
const cryptoNames: Record<string, string> = {
  "BTC-USD": "Bitcoin",
  "ETH-USD": "Ethereum",
  "BNB-USD": "BNB",
  "SOL-USD": "Solana",
  "XRP-USD": "XRP",
  "ADA-USD": "Cardano",
  "DOGE-USD": "Dogecoin",
  "AVAX-USD": "Avalanche",
  "LINK-USD": "Chainlink",
  "DOT-USD": "Polkadot",
  "MATIC-USD": "Polygon",
  "POL-USD": "Polygon Ecosystem Token",
  "LTC-USD": "Litecoin",
  "BCH-USD": "Bitcoin Cash",
};

// TODO: expand this mock roadmap toward the top 50 crypto assets by market relevance.
export const CRYPTO_INSTRUMENT_UNIVERSE: InstrumentUniverseItem[] = [
  "BTC-USD",
  "ETH-USD",
  "BNB-USD",
  "SOL-USD",
  "XRP-USD",
  "ADA-USD",
  "DOGE-USD",
  "AVAX-USD",
  "LINK-USD",
  "DOT-USD",
  "MATIC-USD",
  "POL-USD",
  "LTC-USD",
  "BCH-USD",
].map((symbol, index) => ({
  symbol,
  displayName: cryptoNames[symbol] ?? symbol.replace("-USD", ""),
  category: "crypto",
  country: "GLOBAL",
  market: "CRYPTO",
  currency: "USD",
  globalTicker: symbol,
  displayCurrency: "USD",
  tradingCurrency: "USD",
  settlementCurrency: "USD",
  primarySymbol: symbol,
  underlyingSymbol: symbol,
  relatedSymbols: [symbol],
  relationType: "crypto_pair",
  isPrimary: true,
  isSearchable: true,
  sourceStatus: realSupported.has(symbol) ? "real_supported" : "future_supported",
  dataCoverage: {
    price: realSupported.has(symbol),
    technical: realSupported.has(symbol),
    fundamentals: false,
    fixedIncome: false,
    news: false,
  },
  searchableAliases: [symbol.replace("-USD", ""), cryptoNames[symbol] ?? "", `${symbol} crypto`, "top 50 crypto"],
  tags: ["crypto", "usd pair", "future top 50"],
  priority: realSupported.has(symbol) ? 8 : 4 - index * 0.1,
  descriptionEn:
    realSupported.has(symbol)
      ? "Current live/fallback market data support."
      : "Searchable mock roadmap entry for future crypto expansion.",
  descriptionEs:
    realSupported.has(symbol)
      ? "Soporte actual con datos reales o fallback."
      : "Entrada simulada buscable para futura expansion cripto.",
}));
