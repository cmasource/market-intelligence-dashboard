import type { ArbitrageIssueCode, CostConfidence, FxInstrument, ProviderStatus, ProviderType, QuoteStatus, VerificationLevel } from "./types";

export type ArbitrageTranslate = (key: string, params?: Record<string, string | number>) => string;

const issueKeys: Record<ArbitrageIssueCode, string> = {
  same_provider: "arbitrageIssueSameProvider",
  missing_buy_price: "arbitrageIssueMissingBuyPrice",
  missing_sell_price: "arbitrageIssueMissingSellPrice",
  invalid_amount: "arbitrageIssueInvalidAmount",
  asset_mismatch: "arbitrageIssueAssetMismatch",
  instrument_mismatch: "arbitrageIssueInstrumentMismatch",
  source_withdrawal_unavailable: "arbitrageIssueSourceWithdrawal",
  destination_deposit_unavailable: "arbitrageIssueDestinationDeposit",
  transfer_capability_unverified: "arbitrageIssueCapabilityUnknown",
  same_holder_required: "arbitrageIssueSameHolder",
  source_unavailable: "arbitrageIssueSourceUnavailable",
  destination_unavailable: "arbitrageIssueDestinationUnavailable",
  stale_quote: "arbitrageIssueStale",
  below_minimum: "arbitrageIssueBelowMinimum",
  above_maximum: "arbitrageIssueAboveMaximum",
  above_daily_maximum: "arbitrageIssueAboveDaily",
  above_monthly_maximum: "arbitrageIssueAboveMonthly",
  costs_unverified: "arbitrageIssueCostsUnknown",
  observed_at_unavailable: "arbitrageIssueObservedUnknown",
  verify_final_price: "arbitrageIssueVerifyPrice",
  provider_partial_data: "arbitrageIssuePartial",
  settlement_delay: "arbitrageIssueSettlement",
  volume_specific_quote: "arbitrageIssueReferenceVolume",
};

const instrumentKeys: Record<FxInstrument, string> = {
  bank_usd: "arbitrageBankUsd",
  official_usd: "arbitrageOfficialUsd",
  usd_24_7: "arbitrageUsd247",
  mep: "arbitrageMep",
  usdt: "arbitrageUsdt",
  usdc: "arbitrageUsdc",
  crypto_usd_route: "arbitrageCryptoRoute",
};

const providerTypeKeys: Record<ProviderType, string> = {
  bank: "arbitrageBank",
  wallet: "arbitrageWallet",
  broker: "arbitrageBroker",
  exchange: "arbitrageExchange",
  exchange_agency: "arbitrageExchangeAgency",
  aggregator: "arbitrageAggregator",
};

const quoteStatusKeys: Record<QuoteStatus, string> = {
  live: "arbitrageLive",
  delayed: "arbitrageDelayed",
  stale: "arbitrageStale",
  unavailable: "arbitrageUnavailable",
  error: "arbitrageError",
};

const providerStatusKeys: Record<ProviderStatus, string> = {
  active: "arbitrageActive",
  temporarily_unavailable: "arbitrageTemporarilyUnavailable",
  unsupported: "arbitrageUnsupported",
};

const costKeys: Record<CostConfidence | "verified" | "estimated" | "unknown", string> = {
  confirmed: "arbitrageCostVerified",
  verified: "arbitrageCostVerified",
  estimated: "arbitrageCostEstimated",
  unknown: "arbitrageCostUnknown",
};

export const getIssueLabel = (issue: ArbitrageIssueCode, t: ArbitrageTranslate) => t(issueKeys[issue]);
export const getInstrumentLabel = (instrument: FxInstrument, t: ArbitrageTranslate) => t(instrumentKeys[instrument]);
export const getProviderTypeLabel = (type: ProviderType, t: ArbitrageTranslate) => t(providerTypeKeys[type]);
export const getQuoteStatusLabel = (status: QuoteStatus, t: ArbitrageTranslate) => t(quoteStatusKeys[status]);
export const getProviderStatusLabel = (status: ProviderStatus, t: ArbitrageTranslate) => t(providerStatusKeys[status]);
export const getCostLabel = (status: CostConfidence | "verified", t: ArbitrageTranslate) => t(costKeys[status]);

const verificationKeys: Record<VerificationLevel, string> = {
  verified: "arbitrageVerifiedQuote",
  partially_verified: "arbitragePartiallyVerified",
  reference_only: "arbitrageInformationalReference",
  unverified: "arbitrageUnverifiedCapability",
};

export const getVerificationLabel = (level: VerificationLevel, t: ArbitrageTranslate) => t(verificationKeys[level]);
