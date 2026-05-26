export type ArgentinaInstrumentType =
  | "equity"
  | "cedear"
  | "sovereign_bond"
  | "corporate_bond"
  | "treasury_bill"
  | "lecaps"
  | "option"
  | "index"
  | "caucion"
  | "other";

export type ArgentinaQuoteSource =
  | "manual"
  | "byma_future"
  | "cnv_future"
  | "broker_future"
  | "mock"
  | "unavailable";

export type ArgentinaSourceMode = "manual" | "future" | "mock";

export type ArgentinaSourceStatus = {
  source: ArgentinaQuoteSource;
  enabled: boolean;
  mode: ArgentinaSourceMode;
  notes: string;
};

export type ArgentinaInstrument = {
  symbol: string;
  displaySymbol: string;
  name: string;
  type: ArgentinaInstrumentType;
  market: "BYMA" | "MAE" | "local";
  currency: string;
  quoteCurrency: string;
  speciesType?: string;
  underlyingSymbol?: string;
  localSymbol?: string;
  localInstrumentType?: ArgentinaInstrumentType;
  cedearRatio?: number;
  maturityDate?: string;
  indexation?: string;
  law?: string;
  sourceStatus: ArgentinaQuoteSource;
  context?: string;
};

export type ArgentinaQuote = {
  symbol: string;
  price: number | null;
  currency: string;
  change?: number | null;
  changePercent?: number | null;
  bid?: number | null;
  ask?: number | null;
  volume?: number | null;
  tradedAmount?: number | null;
  open?: number | null;
  previousClose?: number | null;
  high?: number | null;
  low?: number | null;
  lastUpdated?: string | null;
  source: ArgentinaQuoteSource;
  sourceLabel: string;
  isRealData: boolean;
  isFallback: boolean;
};
