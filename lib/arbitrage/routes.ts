import { getFreshnessStatus } from "./freshness";
import { getArbitrageProvider, supportsDeposit, supportsWithdrawal } from "./provider-registry";
import type { ArbitrageIssueCode, FxQuote, TransferRoute, VerificationLevel } from "./types";

function unique(items: ArbitrageIssueCode[]) {
  return [...new Set(items)];
}

function instrumentsAreCompatible(source: FxQuote, destination: FxQuote) {
  if (source.instrument === destination.instrument) return true;
  const bankUsdInstruments = new Set(["bank_usd", "usd_24_7", "crypto_usd_route"]);
  return source.transferAsset === "USD_BANK"
    && destination.transferAsset === "USD_BANK"
    && bankUsdInstruments.has(source.instrument)
    && bankUsdInstruments.has(destination.instrument);
}

export function buildTransferRoute(source: FxQuote, destination: FxQuote, amountUsd: number): TransferRoute {
  const sourceProvider = getArbitrageProvider(source.providerId);
  const destinationProvider = getArbitrageProvider(destination.providerId);
  const blockers: ArbitrageIssueCode[] = [];
  const warnings: ArbitrageIssueCode[] = [];

  if (!Number.isFinite(amountUsd) || amountUsd <= 0) blockers.push("invalid_amount");
  if (source.providerId === destination.providerId) blockers.push("same_provider");
  if (source.transferAsset !== destination.transferAsset) blockers.push("asset_mismatch");
  if (!instrumentsAreCompatible(source, destination)) blockers.push("instrument_mismatch");
  if (!source.userBuysUsdAt) blockers.push("missing_buy_price");
  if (!destination.userSellsUsdAt) blockers.push("missing_sell_price");
  if (!sourceProvider || sourceProvider.status !== "active") blockers.push("source_unavailable");
  if (!destinationProvider || destinationProvider.status !== "active") blockers.push("destination_unavailable");
  if (getFreshnessStatus(source) === "stale" || getFreshnessStatus(destination) === "stale") blockers.push("stale_quote");

  if (sourceProvider && source.transferAsset === destination.transferAsset) {
    const canWithdraw = supportsWithdrawal(sourceProvider, source.transferAsset);
    if (canWithdraw === false) blockers.push("source_withdrawal_unavailable");
    if (canWithdraw === undefined) blockers.push("transfer_capability_unverified");
  }
  if (destinationProvider && source.transferAsset === destination.transferAsset) {
    const canDeposit = supportsDeposit(destinationProvider, destination.transferAsset);
    if (canDeposit === false) blockers.push("destination_deposit_unavailable");
    if (canDeposit === undefined) blockers.push("transfer_capability_unverified");
  }

  const limits = source.limits;
  if (limits?.minimumUsd !== undefined && amountUsd < limits.minimumUsd) blockers.push("below_minimum");
  if (limits?.maximumUsd !== undefined && amountUsd > limits.maximumUsd) blockers.push("above_maximum");
  if (limits?.dailyMaximumUsd !== undefined && amountUsd > limits.dailyMaximumUsd) blockers.push("above_daily_maximum");
  if (limits?.monthlyMaximumUsd !== undefined && amountUsd > limits.monthlyMaximumUsd) blockers.push("above_monthly_maximum");

  const requiresSameHolder = Boolean(sourceProvider?.requiresSameHolderAccount || destinationProvider?.requiresSameHolderAccount);
  if (requiresSameHolder) warnings.push("same_holder_required");
  warnings.push(...source.warnings, ...destination.warnings);

  const routeChecks: VerificationLevel[] = [
    source.verification.transferAsset,
    destination.verification.transferAsset,
    sourceProvider?.verification.withdrawal ?? "unverified",
    destinationProvider?.verification.deposit ?? "unverified",
    sourceProvider?.verification.sameHolder ?? "unverified",
    destinationProvider?.verification.sameHolder ?? "unverified",
  ];
  const verificationLevel: VerificationLevel = routeChecks.every((level) => level === "verified")
    ? "verified"
    : routeChecks.some((level) => level === "reference_only")
      ? "reference_only"
      : routeChecks.some((level) => level === "partially_verified")
        ? "partially_verified"
        : "unverified";

  return {
    id: `${source.id}--${destination.id}`,
    sourceProviderId: source.providerId,
    destinationProviderId: destination.providerId,
    sourceInstrument: source.instrument,
    destinationInstrument: destination.instrument,
    transferredAsset: source.transferAsset,
    isCompatible: blockers.length === 0,
    estimatedTransferMinutes: source.transferAsset === "USD_BANK" ? 30 : undefined,
    blockers: unique(blockers),
    warnings: unique(warnings),
    requiresSameHolderAccount: requiresSameHolder || undefined,
    costConfidence: "unknown",
    verificationLevel,
  };
}
