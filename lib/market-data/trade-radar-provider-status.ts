export type TradeRadarProviderStatus = {
  hasTwelveDataKey: boolean;
  hasAlphaVantageKey: boolean;
  hasFmpKey: boolean;
  hasBymaKey: boolean;
  binanceBaseUrl: string;
  byma: {
    hasClientId: boolean;
    hasClientSecret: boolean;
    hasScope: boolean;
    baseUrl: string;
    defaultFeed: "snapshot" | "delay20" | "eod";
    authMode: "oauth_client_credentials";
  };
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

export function getTradeRadarProviderStatus(): TradeRadarProviderStatus {
  const bymaBaseUrl = process.env.BYMA_BASE_URL?.trim() || "https://apigw.byma.com.ar";
  const bymaDefaultFeed = process.env.BYMA_DEFAULT_FEED?.trim();
  const normalizedFeed = bymaDefaultFeed === "snapshot" || bymaDefaultFeed === "eod" || bymaDefaultFeed === "delay20"
    ? bymaDefaultFeed
    : "delay20";
  const hasBymaOAuth = hasEnv("BYMA_CLIENT_ID") && hasEnv("BYMA_CLIENT_SECRET");

  return {
    hasTwelveDataKey: hasEnv("TWELVE_DATA_API_KEY"),
    hasAlphaVantageKey: hasEnv("ALPHA_VANTAGE_API_KEY"),
    hasFmpKey: hasEnv("FMP_API_KEY"),
    hasBymaKey: hasBymaOAuth || hasEnv("BYMA_API_KEY"),
    binanceBaseUrl: process.env.BINANCE_BASE_URL?.trim() || "https://api.binance.com",
    byma: {
      hasClientId: hasEnv("BYMA_CLIENT_ID"),
      hasClientSecret: hasEnv("BYMA_CLIENT_SECRET"),
      hasScope: hasEnv("BYMA_SCOPE"),
      baseUrl: bymaBaseUrl,
      defaultFeed: normalizedFeed,
      authMode: "oauth_client_credentials",
    },
  };
}
