import type { InstrumentDataCoverage } from "./types";

const providerEquitySymbols = new Set(["AAPL", "SPY", "QQQ", "MSFT", "NVDA", "TSLA", "AMZN", "META", "GOOGL", "KO"]);
const providerCryptoSymbols = new Set(["BTC-USD", "ETH-USD", "BNB-USD", "SOL-USD", "XRP-USD", "ADA-USD", "DOGE-USD", "AVAX-USD", "LINK-USD", "DOT-USD"]);
const fixedIncomeSymbols = new Set(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"]);
const argentinaEquitySymbols = new Set(["GGAL", "YPFD"]);

export const DATA_COVERAGE_BY_SYMBOL: Record<string, InstrumentDataCoverage> = {
  AAPL: {
    symbol: "AAPL",
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "provider",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
    notes: ["USA market data is provider-based; CEDEAR local market coverage is modeled for future integration."],
  },
  SPY: {
    symbol: "SPY",
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "provider",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
  },
  QQQ: {
    symbol: "QQQ",
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "provider",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
  },
  "BTC-USD": {
    symbol: "BTC-USD",
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "not_applicable",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
  },
  "ETH-USD": {
    symbol: "ETH-USD",
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "not_applicable",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
  },
};

for (const symbol of providerEquitySymbols) {
  DATA_COVERAGE_BY_SYMBOL[symbol] ??= {
    symbol,
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "provider",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
    notes: ["USA market data and fundamentals use provider adapters with fallback-safe behavior."],
  };
}

for (const symbol of providerCryptoSymbols) {
  DATA_COVERAGE_BY_SYMBOL[symbol] ??= {
    symbol,
    price: "provider",
    chart: "provider",
    technical: "provider",
    fundamentals: "not_applicable",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
    notes: ["Crypto market data uses public provider adapters with fallback-safe behavior."],
  };
}

function buildFixedIncomeCoverage(symbol: string): InstrumentDataCoverage {
  return {
    symbol,
    price: "mock",
    chart: "mock",
    technical: "mock",
    fundamentals: "not_applicable",
    fixedIncome: "mock",
    news: "future",
    aiSummary: "mock",
    notes: ["Argentina fixed income values use structured mock data until local market integrations are enabled."],
  };
}

for (const symbol of fixedIncomeSymbols) {
  DATA_COVERAGE_BY_SYMBOL[symbol] = buildFixedIncomeCoverage(symbol);
}

for (const symbol of argentinaEquitySymbols) {
  DATA_COVERAGE_BY_SYMBOL[symbol] = {
    symbol,
    price: "mock",
    chart: "mock",
    technical: "mock",
    fundamentals: "mock",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "mock",
  };
}

export function getDefaultCoverage(symbol: string): InstrumentDataCoverage {
  const normalized = symbol.trim().toUpperCase();

  if (providerEquitySymbols.has(normalized) || providerCryptoSymbols.has(normalized)) {
    return DATA_COVERAGE_BY_SYMBOL[normalized];
  }

  return {
    symbol: normalized,
    price: "future",
    chart: "future",
    technical: "future",
    fundamentals: "future",
    fixedIncome: "not_applicable",
    news: "future",
    aiSummary: "future",
    notes: ["Coverage is modeled in the instrument universe and awaits data integration."],
  };
}
