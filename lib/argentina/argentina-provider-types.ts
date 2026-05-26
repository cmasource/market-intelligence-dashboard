import type { ArgentinaQuote, ArgentinaQuoteSource, ArgentinaSourceStatus } from "./types";

export type ArgentinaProviderName = "manual" | "byma" | "cnv" | "broker" | "mock";

export type ArgentinaProviderQuoteResult = ArgentinaQuote & {
  provider: ArgentinaProviderName;
};

export type ArgentinaProviderCapability = {
  provider: ArgentinaProviderName;
  source: ArgentinaQuoteSource;
  status: ArgentinaSourceStatus;
  supportsQuotes: boolean;
  supportsFundamentals: boolean;
  supportsFilings: boolean;
};
