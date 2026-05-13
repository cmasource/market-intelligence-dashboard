import {
  getFirstEnabledProvider,
  getFundamentalsProviderPriority,
  getMarketDataProviderPriority,
  getNewsProviderPriority,
} from "./provider-config";
import type { ProviderStatus } from "./types";

export function getProviderStatus(): ProviderStatus {
  const marketData = getMarketDataProviderPriority();
  const fundamentals = getFundamentalsProviderPriority();
  const news = getNewsProviderPriority();

  return {
    marketData,
    fundamentals,
    news,
    activeMarketDataProvider: getFirstEnabledProvider(marketData),
    activeFundamentalsProvider: getFirstEnabledProvider(fundamentals),
    activeNewsProvider: getFirstEnabledProvider(news),
    configuredActiveMarketDataProvider: getFirstEnabledProvider(marketData),
    configuredActiveFundamentalsProvider: getFirstEnabledProvider(fundamentals),
    configuredActiveNewsProvider: getFirstEnabledProvider(news),
    actualProviderDependsOnEndpoint: true,
    fallbackChain: ["fmp", "yahoo", "mock"],
  };
}
