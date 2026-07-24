export type ProviderName = "unavailable" | "fmp" | "finnhub" | "alpha_vantage" | "yahoo" | "crypto" | "google_news_rss" | "mock";

export type ProviderLayer = "marketData" | "fundamentals" | "news";

export type ProviderAvailability = {
  provider: ProviderName;
  enabled: boolean;
  reason?: string;
};

export type ProviderDiagnosticReason =
  | "missing_key"
  | "http_error"
  | "empty_response"
  | "invalid_response_shape"
  | "invalid_price"
  | "rate_limited"
  | "plan_restricted"
  | "unknown_error";

export type ProviderTraceEntry = {
  provider: ProviderName;
  attempted: true;
  success: boolean;
  reason?: ProviderDiagnosticReason;
  statusCode?: number;
  endpointName?: string;
  sourceLabel?: string;
};

export type ProviderStatus = {
  marketData: ProviderAvailability[];
  fundamentals: ProviderAvailability[];
  news: ProviderAvailability[];
  activeMarketDataProvider: ProviderName;
  activeFundamentalsProvider: ProviderName;
  activeNewsProvider: ProviderName;
  configuredActiveMarketDataProvider: ProviderName;
  configuredActiveFundamentalsProvider: ProviderName;
  configuredActiveNewsProvider: ProviderName;
  actualProviderDependsOnEndpoint: boolean;
  fallbackChain: ProviderName[];
};

export type ProviderResult<T> =
  | { ok: true; provider: ProviderName; data: T }
  | {
      ok: false;
      provider: ProviderName;
      error: string;
      disabled?: boolean;
      reason?: ProviderDiagnosticReason;
      statusCode?: number;
      endpointName?: string;
    };
