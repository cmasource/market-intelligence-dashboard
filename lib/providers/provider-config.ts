import type { ProviderAvailability, ProviderName } from "./types";

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getProviderKeys() {
  return {
    fmp: process.env.FMP_API_KEY?.trim() ?? "",
    finnhub: process.env.FINNHUB_API_KEY?.trim() ?? "",
    alphaVantage: process.env.ALPHA_VANTAGE_API_KEY?.trim() ?? "",
    newsProvider: process.env.NEWS_PROVIDER?.trim() || "fallback",
    marketDataProvider: process.env.MARKET_DATA_PROVIDER?.trim() || "yahoo_fallback",
  };
}

function availability(provider: ProviderName, envName?: string): ProviderAvailability {
  if (!envName) return { provider, enabled: true };
  return hasEnv(envName)
    ? { provider, enabled: true }
    : { provider, enabled: false, reason: `Missing ${envName}` };
}

export function getMarketDataProviderPriority(): ProviderAvailability[] {
  return [
    availability("fmp", "FMP_API_KEY"),
    availability("finnhub", "FINNHUB_API_KEY"),
    availability("alpha_vantage", "ALPHA_VANTAGE_API_KEY"),
    availability("yahoo"),
    availability("mock"),
  ];
}

export function getFundamentalsProviderPriority(): ProviderAvailability[] {
  return [
    availability("fmp", "FMP_API_KEY"),
    availability("finnhub", "FINNHUB_API_KEY"),
    availability("alpha_vantage", "ALPHA_VANTAGE_API_KEY"),
    availability("yahoo"),
    availability("mock"),
  ];
}

export function getNewsProviderPriority(): ProviderAvailability[] {
  return [
    availability("fmp", "FMP_API_KEY"),
    availability("finnhub", "FINNHUB_API_KEY"),
    availability("alpha_vantage", "ALPHA_VANTAGE_API_KEY"),
    availability("google_news_rss"),
    availability("mock"),
  ];
}

export function getFirstEnabledProvider(providers: ProviderAvailability[]): ProviderName {
  return providers.find((provider) => provider.enabled)?.provider ?? "mock";
}
