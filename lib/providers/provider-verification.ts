import { getMarketQuote } from "@/lib/market-data";
import { getProviderStatus } from "./provider-status";
import type { ProviderName, ProviderTraceEntry } from "./types";

export type ProviderVerificationResult = {
  symbol: string;
  configuredProvider: ProviderName;
  actualProvider: ProviderName;
  price: number | null;
  currency: string;
  sourceLabel: string;
  providerTrace: ProviderTraceEntry[];
  isFallback: boolean;
  fallbackChain: ProviderName[];
  checkedAt: string;
};

export async function verifyQuoteProvider(symbol: string): Promise<ProviderVerificationResult> {
  const status = getProviderStatus();
  const quote = await getMarketQuote(symbol);

  return {
    symbol: quote.symbol,
    configuredProvider: status.configuredActiveMarketDataProvider,
    actualProvider: quote.provider,
    price: quote.price,
    currency: quote.currency,
    sourceLabel: quote.sourceLabel,
    providerTrace: quote.providerTrace ?? [],
    isFallback: quote.isFallback,
    fallbackChain: status.fallbackChain,
    checkedAt: new Date().toISOString(),
  };
}
