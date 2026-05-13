import type { InstrumentUniverseItem } from "./types";

const realSupported = new Set(["AAPL", "SPY", "QQQ", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "KO"]);

const usItems = [
  ["AAPL", "Apple Inc.", "NASDAQ", "Technology"],
  ["MSFT", "Microsoft Corporation", "NASDAQ", "Technology"],
  ["NVDA", "NVIDIA Corporation", "NASDAQ", "Technology"],
  ["TSLA", "Tesla Inc.", "NASDAQ", "Consumer Discretionary"],
  ["AMZN", "Amazon.com Inc.", "NASDAQ", "Consumer Discretionary"],
  ["META", "Meta Platforms Inc.", "NASDAQ", "Communication Services"],
  ["GOOGL", "Alphabet Inc.", "NASDAQ", "Communication Services"],
  ["KO", "The Coca-Cola Company", "NYSE", "Consumer Staples"],
  ["SPY", "SPDR S&P 500 ETF Trust", "NYSE_ARCA", "ETF"],
  ["QQQ", "Invesco QQQ Trust", "NASDAQ", "ETF"],
] as const;

export const US_INSTRUMENT_UNIVERSE: InstrumentUniverseItem[] = usItems.map(
  ([symbol, displayName, market, sector], index) => ({
    symbol,
    displayName,
    category: sector === "ETF" ? "etf" : "equity",
    country: "US",
    market,
    currency: "USD",
    globalTicker: symbol,
    displayCurrency: "USD",
    tradingCurrency: "USD",
    settlementCurrency: "USD",
    sector,
    exchange: market,
    primarySymbol: symbol,
    underlyingSymbol: symbol,
    relatedSymbols: [symbol],
    isPrimary: true,
    isSearchable: true,
    sourceStatus: realSupported.has(symbol) ? "real_supported" : "future_supported",
    dataCoverage: {
      price: realSupported.has(symbol),
      technical: realSupported.has(symbol),
      fundamentals: realSupported.has(symbol),
      fixedIncome: false,
      news: false,
    },
    searchableAliases: [`${symbol} USA`, `${symbol} US stock`, `${symbol} NYSE`, `${symbol} NASDAQ`],
    tags: ["usa", "stock", sector.toLowerCase()],
    priority: realSupported.has(symbol) ? 9 - index * 0.05 : 5 - index * 0.1,
  }),
);
