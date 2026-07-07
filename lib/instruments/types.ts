import type { TradeRadarMarket, TradeRadarProviderName } from "@/lib/market-data/providers/base";

export type InstrumentAssetClass =
  | "stock"
  | "etf"
  | "adr"
  | "cedear"
  | "cedear_etf"
  | "bond"
  | "bill"
  | "corporate_bond"
  | "mutual_fund"
  | "crypto"
  | "index";

export type InstrumentMarket = "us" | "argentina" | "crypto" | "global";

export type InstrumentDataCapability =
  | "technical_full"
  | "technical_underlying"
  | "quote_only"
  | "fundamentals_full"
  | "fundamentals_underlying"
  | "unsupported";

export type InstrumentSource = "seed" | "byma" | "csv" | "manual";

export type Instrument = {
  id: string;
  symbol: string;
  displaySymbol: string;
  name: string;
  assetClass: InstrumentAssetClass;
  market: InstrumentMarket;
  exchange: string;
  country: string;
  currency: string;
  providerSymbol?: string;
  tradingViewSymbol?: string;
  bymaSymbol?: string;
  bymaSecurityId?: string;
  isin?: string;
  underlyingSymbol?: string;
  underlyingExchange?: string;
  underlyingMarket?: InstrumentMarket;
  underlyingCurrency?: string;
  ratio?: number;
  settlementPeriods?: string[];
  sector?: string;
  industry?: string;
  aliases?: string[];
  tags: string[];
  dataCapabilities: InstrumentDataCapability[];
  warnings: string[];
  source: InstrumentSource;
  enabled: boolean;
};

export type InstrumentLayer = {
  symbol: string;
  market: TradeRadarMarket;
  provider?: TradeRadarProviderName;
  status: "ok" | "not_configured" | "unavailable" | "unsupported";
  description: string;
};

export type InstrumentResolution = {
  instrument: Instrument;
  technicalLayer: InstrumentLayer | null;
  localLayer: InstrumentLayer | null;
  localAlternatives: Instrument[];
  warnings: string[];
  dataCoverage: InstrumentDataCapability[];
};

export type InstrumentSearchResult = Instrument & {
  matchScore: number;
  badges: string[];
};
