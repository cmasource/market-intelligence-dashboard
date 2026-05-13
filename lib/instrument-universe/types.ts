export type InstrumentCountry = "AR" | "US" | "GLOBAL" | "UNKNOWN";

export type InstrumentMarket = "BYMA" | "NYSE" | "NASDAQ" | "NYSE_ARCA" | "CRYPTO" | "UNKNOWN";

export type InstrumentCategory =
  | "equity"
  | "adr"
  | "cedear"
  | "etf"
  | "sovereign_bond"
  | "global_bond"
  | "cer_bond"
  | "dollar_linked_bond"
  | "corporate_bond"
  | "letra"
  | "lecap"
  | "crypto"
  | "fx_reference"
  | "index"
  | "unknown";

export type InstrumentRelationType =
  | "same_underlying"
  | "peso_species"
  | "dollar_mep_species"
  | "dollar_cable_species"
  | "adr"
  | "cedear"
  | "underlying_stock"
  | "crypto_pair"
  | "benchmark"
  | "unknown";

export type InstrumentSourceStatus = "real_supported" | "mock_supported" | "future_supported";

export type InstrumentDataCoverage = {
  price: boolean;
  technical: boolean;
  fundamentals: boolean;
  fixedIncome: boolean;
  news: boolean;
};

export type InstrumentUniverseItem = {
  symbol: string;
  displayName: string;
  displayNameEn?: string;
  displayNameEs?: string;
  shortName?: string;
  category: InstrumentCategory;
  country: InstrumentCountry;
  market: InstrumentMarket;
  currency: string;
  localTicker?: string;
  globalTicker?: string;
  isin?: string;
  cusip?: string;
  displayCurrency?: string;
  quoteCurrency?: string;
  tradingCurrency?: string;
  settlementCurrency?: string;
  settlementContext?: string;
  settlementContextEn?: string;
  settlementContextEs?: string;
  indexationType?: string;
  marketConventionLabel?: string;
  marketConventionLabelEn?: string;
  marketConventionLabelEs?: string;
  sector?: string;
  industry?: string;
  exchange?: string;
  sourceStatus: InstrumentSourceStatus;
  dataCoverage: InstrumentDataCoverage;
  searchableAliases?: string[];
  priority?: number;
  primarySymbol?: string;
  underlyingSymbol?: string;
  relatedSymbols: string[];
  relationType?: InstrumentRelationType;
  isPrimary: boolean;
  isSearchable: boolean;
  tags?: string[];
  description?: string;
  descriptionEs?: string;
  descriptionEn?: string;
};

export type RelatedInstrument = {
  symbol: string;
  displayName: string;
  category: InstrumentCategory;
  relationType: InstrumentRelationType;
  currency: string;
  market: InstrumentMarket;
  href: string;
  label: string;
  labelEs: string;
  labelEn: string;
  isPrimary: boolean;
};
