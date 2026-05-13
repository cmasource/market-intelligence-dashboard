export type ProviderName = "fmp" | "finnhub" | "alpha_vantage" | "yahoo" | "google_news_rss" | "mock";

export type ProviderLayer = "marketData" | "fundamentals" | "news";

export type ProviderAvailability = {
  provider: ProviderName;
  enabled: boolean;
  reason?: string;
};

export type ProviderStatus = {
  marketData: ProviderAvailability[];
  fundamentals: ProviderAvailability[];
  news: ProviderAvailability[];
  activeMarketDataProvider: ProviderName;
  activeFundamentalsProvider: ProviderName;
  activeNewsProvider: ProviderName;
};

export type ProviderResult<T> =
  | { ok: true; provider: ProviderName; data: T }
  | { ok: false; provider: ProviderName; error: string; disabled?: boolean };
