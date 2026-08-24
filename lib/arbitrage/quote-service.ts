import "server-only";
import { BnaQuoteAdapter } from "./adapters/bna";
import { ComparaDolarUsdAdapter } from "./adapters/comparadolar";
import { CriptoYaStablecoinAdapter } from "./adapters/criptoya";
import { errorResult } from "./adapters/shared";
import { PlusQuoteAdapter } from "./adapters/plus";
import { ARBITRAGE_PROVIDERS } from "./provider-registry";
import { buildUsdCryptoCircuits } from "./conversion-circuits";
import type { ArbitrageQuoteProvider, ArbitrageQuotesResponse, ProviderQuoteResult } from "./types";

const adapters: ArbitrageQuoteProvider[] = [new PlusQuoteAdapter(), new BnaQuoteAdapter(), new CriptoYaStablecoinAdapter(), new ComparaDolarUsdAdapter()];
const cache = new Map<string, { result: ProviderQuoteResult; expiresAt: number }>();
const inFlight = new Map<string, Promise<ProviderQuoteResult>>();

function staleFallback(result: ProviderQuoteResult): ProviderQuoteResult {
  return {
    ...result,
    status: "partial",
    cacheStatus: "stale_fallback",
    quotes: result.quotes.map((quote) => ({
      ...quote,
      status: "stale",
      warnings: [...new Set([...quote.warnings, "provider_partial_data" as const, "stale_quote" as const])],
    })),
  };
}

async function loadAdapter(adapter: ArbitrageQuoteProvider, forceRefresh: boolean) {
  const now = Date.now();
  const cached = cache.get(adapter.id);
  if (!forceRefresh && cached && cached.expiresAt > now) return { ...cached.result, cacheStatus: "fresh" as const };
  const running = inFlight.get(adapter.id);
  if (running) return running;

  const request = adapter.fetchQuotes()
    .then((result) => {
      const normalized = { ...result, cacheStatus: "refreshed" as const };
      if (result.quotes.length) cache.set(adapter.id, { result: normalized, expiresAt: Date.now() + adapter.ttlSeconds * 1000 });
      return normalized;
    })
    .catch((error) => cached ? staleFallback(cached.result) : errorResult(adapter.id, error))
    .finally(() => inFlight.delete(adapter.id));
  inFlight.set(adapter.id, request);
  return request;
}

export async function getArbitrageQuotes(forceRefresh = false): Promise<ArbitrageQuotesResponse> {
  const settled = await Promise.allSettled(adapters.map((adapter) => loadAdapter(adapter, forceRefresh)));
  const providerResults = settled.map((result, index) => result.status === "fulfilled"
    ? result.value
    : errorResult(adapters[index]?.id ?? "unknown", result.reason));
  const quotes = providerResults.flatMap((result) => result.quotes);
  return {
    generatedAt: new Date().toISOString(),
    providers: ARBITRAGE_PROVIDERS,
    quotes,
    usdCryptoCircuits: buildUsdCryptoCircuits(quotes),
    providerResults,
    cache: { plusTtlSeconds: 60, bnaTtlSeconds: 300, criptoYaTtlSeconds: 60, comparaDolarTtlSeconds: 60 },
    disclaimer: "informational_only",
  };
}
