export type FxInstrument =
  | "bank_usd"
  | "official_usd"
  | "usd_24_7"
  | "mep"
  | "usdt"
  | "usdc"
  | "crypto_usd_route";

export type TransferAsset = "USD_BANK" | "USDT" | "USDC";

export type ProviderType = "bank" | "wallet" | "broker" | "exchange" | "exchange_agency" | "aggregator";
export type ProviderSourceType = "official_api" | "public_endpoint" | "public_page" | "aggregator" | "manual" | "unavailable";
export type QuoteSourceType = Exclude<ProviderSourceType, "unavailable">;
export type ProviderStatus = "active" | "temporarily_unavailable" | "unsupported";
export type QuoteStatus = "live" | "delayed" | "stale" | "unavailable" | "error";
export type CostConfidence = "confirmed" | "estimated" | "unknown";
export type FreshnessStatus = "fresh" | "warning" | "stale";

export type ArbitrageIssueCode =
  | "same_provider"
  | "missing_buy_price"
  | "missing_sell_price"
  | "invalid_amount"
  | "asset_mismatch"
  | "instrument_mismatch"
  | "source_withdrawal_unavailable"
  | "destination_deposit_unavailable"
  | "transfer_capability_unverified"
  | "same_holder_required"
  | "source_unavailable"
  | "destination_unavailable"
  | "stale_quote"
  | "below_minimum"
  | "above_maximum"
  | "above_daily_maximum"
  | "above_monthly_maximum"
  | "costs_unverified"
  | "observed_at_unavailable"
  | "verify_final_price"
  | "provider_partial_data"
  | "settlement_delay";

export type FxProvider = {
  id: string;
  name: string;
  legalName?: string;
  providerType: ProviderType;
  websiteUrl?: string;
  logoUrl?: string;
  operates24x7?: boolean;
  supportsArsDeposit?: boolean;
  supportsArsWithdrawal?: boolean;
  supportsUsdDeposit?: boolean;
  supportsUsdWithdrawal?: boolean;
  supportsUsdtDeposit?: boolean;
  supportsUsdtWithdrawal?: boolean;
  supportsUsdcDeposit?: boolean;
  supportsUsdcWithdrawal?: boolean;
  requiresSameHolderAccount?: boolean;
  sourceType: ProviderSourceType;
  status: ProviderStatus;
};

export type QuoteFees = {
  fixedArs?: number;
  percentage?: number;
  fixedUsd?: number;
  description?: string;
  confidence: CostConfidence;
};

export type QuoteLimits = {
  minimumUsd?: number;
  maximumUsd?: number;
  dailyMaximumUsd?: number;
  monthlyMaximumUsd?: number;
};

export type FxQuote = {
  id: string;
  providerId: string;
  instrument: FxInstrument;
  transferAsset: TransferAsset;
  userBuysUsdAt?: number;
  userSellsUsdAt?: number;
  originalBuyLabel?: string;
  originalSellLabel?: string;
  quoteCurrency: "ARS";
  observedAt: string;
  fetchedAt: string;
  sourceUrl?: string;
  sourceType: QuoteSourceType;
  status: QuoteStatus;
  estimatedDelaySeconds?: number;
  fees?: QuoteFees;
  limits?: QuoteLimits;
  warnings: ArbitrageIssueCode[];
};

export type ProviderQuoteResult = {
  providerId: string;
  quotes: FxQuote[];
  status: "success" | "partial" | "error";
  fetchedAt: string;
  errorCode?: "timeout" | "upstream_unavailable" | "invalid_payload" | "unexpected_error";
  cacheStatus?: "fresh" | "refreshed" | "stale_fallback";
};

export interface ArbitrageQuoteProvider {
  id: string;
  ttlSeconds: number;
  fetchQuotes(): Promise<ProviderQuoteResult>;
}

export type TransferRoute = {
  id: string;
  sourceProviderId: string;
  destinationProviderId: string;
  sourceInstrument: FxInstrument;
  destinationInstrument: FxInstrument;
  transferredAsset: TransferAsset;
  isCompatible: boolean;
  estimatedTransferMinutes?: number;
  blockers: ArbitrageIssueCode[];
  warnings: ArbitrageIssueCode[];
  requiresSameHolderAccount?: boolean;
  estimatedTransferFeeArs?: number;
  estimatedTransferFeeUsd?: number;
  costConfidence: CostConfidence;
};

export type ArbitrageOpportunity = {
  id: string;
  sourceProviderId: string;
  destinationProviderId: string;
  sourceQuoteId: string;
  destinationQuoteId: string;
  routeId: string;
  amountUsd: number;
  buyRate: number;
  sellRate: number;
  grossSpreadPerUsd: number;
  grossProfitArs: number;
  estimatedCostsArs: number;
  netProfitArs?: number;
  netReturnPercentage?: number;
  capitalRequiredArs: number;
  isCompatible: boolean;
  isProfitable: boolean;
  costStatus: "verified" | "estimated" | "unknown";
  freshnessStatus: FreshnessStatus;
  blockers: ArbitrageIssueCode[];
  warnings: ArbitrageIssueCode[];
  calculatedAt: string;
};

export type ArbitrageQuotesResponse = {
  generatedAt: string;
  providers: FxProvider[];
  quotes: FxQuote[];
  providerResults: ProviderQuoteResult[];
  cache: {
    plusTtlSeconds: number;
    bnaTtlSeconds: number;
    dolarApiTtlSeconds: number;
  };
  disclaimer: "informational_only";
};
