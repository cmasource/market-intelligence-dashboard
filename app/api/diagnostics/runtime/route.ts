import packageJson from "@/package.json";
import { getProviderStatus } from "@/lib/providers/provider-status";
import { getProviderKeys } from "@/lib/providers/provider-config";

export async function GET() {
  const providerStatus = getProviderStatus();
  const providerKeys = getProviderKeys();
  const buildTimestamp =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_BUILD_TIMESTAMP ??
    process.env.BUILD_TIMESTAMP ??
    null;

  return Response.json({
    app: "CMA Market Intelligence",
    version: packageJson.version,
    nodeEnvironment: process.env.NODE_ENV ?? "unknown",
    buildTimestamp,
    vercelEnvironment: process.env.VERCEL_ENV ?? "local",
    configuredMarketProvider: providerKeys.marketDataProvider,
    configuredNewsProvider: providerKeys.newsProvider,
    configuredFundamentalsProvider: providerStatus.configuredActiveFundamentalsProvider,
    activeMarketDataProvider: providerStatus.activeMarketDataProvider,
    activeFundamentalsProvider: providerStatus.activeFundamentalsProvider,
    activeNewsProvider: providerStatus.activeNewsProvider,
    providerFlags: {
      fmpKeyPresent: providerKeys.fmp.length > 0,
      finnhubKeyPresent: providerKeys.finnhub.length > 0,
      alphaVantageKeyPresent: providerKeys.alphaVantage.length > 0,
      logoDevTokenPresent: Boolean(process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim()),
      yahooFallbackEnabled: providerStatus.marketData.some((provider) => provider.provider === "yahoo" && provider.enabled),
      mockFallbackEnabled: providerStatus.marketData.some((provider) => provider.provider === "mock" && provider.enabled),
    },
    fmpEnabled: providerStatus.marketData.some((provider) => provider.provider === "fmp" && provider.enabled),
    fmpKeyPresent: providerKeys.fmp.length > 0,
    logoDevTokenPresent: Boolean(process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN?.trim()),
    yahooFallbackEnabled: providerStatus.marketData.some((provider) => provider.provider === "yahoo" && provider.enabled),
    mockFallbackEnabled: providerStatus.marketData.some((provider) => provider.provider === "mock" && provider.enabled),
    fallbackProvidersEnabled: providerStatus.marketData
      .filter((provider) => ["yahoo", "mock"].includes(provider.provider) && provider.enabled)
      .map((provider) => provider.provider),
    newsSanitization: "lib/news/sanitize-news",
    secretsExposed: false,
  });
}
