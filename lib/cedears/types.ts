export type CedearStatus = "local_provider" | "provider_underlying" | "mock" | "future" | "unavailable";

export type CedearInstrument = {
  localSymbol: string;
  underlyingSymbol: string;
  underlyingName: string;
  localMarket: "BYMA";
  underlyingMarket: "NASDAQ" | "NYSE" | "NYSE_ARCA";
  localCurrency: "ARS";
  underlyingCurrency: "USD";
  ratio: number | null;
  localPrice: number | null;
  underlyingPrice?: number;
  impliedCcl?: number;
  cclSpread?: number;
  sourceLabel: string;
  isMock: boolean;
  status: CedearStatus;
};

export type CedearInterpretation = {
  label: string;
  tone: "positive" | "neutral" | "negative" | "warning";
  summary: string;
  bulletPoints: string[];
};

export type CedearAnalytics = {
  localSymbol: string;
  underlyingSymbol: string;
  underlyingName: string;
  ratio: number | null;
  localPrice: number | null;
  underlyingPrice: number | null;
  impliedCcl: number | null;
  referenceCcl?: number;
  cclSpread?: number | null;
  sourceLabel: string;
  isMock: boolean;
  status: CedearStatus;
  interpretation: CedearInterpretation;
  warnings?: string[];
};
