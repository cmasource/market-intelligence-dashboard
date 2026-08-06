import { getFreshnessStatus } from "./freshness";
import { buildTransferRoute } from "./routes";
import type { ArbitrageIssueCode, ArbitrageOpportunity, CostConfidence, FxQuote, QuoteFees, TransferRoute } from "./types";

function feeInArs(fees: QuoteFees | undefined, arsValue: number, usdRate: number) {
  if (!fees) return 0;
  return (fees.fixedArs ?? 0) + (fees.percentage ?? 0) * arsValue + (fees.fixedUsd ?? 0) * usdRate;
}

function resolveCostStatus(confidences: Array<CostConfidence | undefined>): ArbitrageOpportunity["costStatus"] {
  if (confidences.some((confidence) => confidence === undefined || confidence === "unknown")) return "unknown";
  if (confidences.some((confidence) => confidence === "estimated")) return "estimated";
  return "verified";
}

function unique(items: ArbitrageIssueCode[]) {
  return [...new Set(items)];
}

export function calculateArbitrageOpportunity(
  source: FxQuote,
  destination: FxQuote,
  amountUsd: number,
  route: TransferRoute = buildTransferRoute(source, destination, amountUsd),
  now = new Date(),
): ArbitrageOpportunity {
  const buyRate = source.userBuysUsdAt ?? 0;
  const sellRate = destination.userSellsUsdAt ?? 0;
  const capitalRequiredArs = buyRate * Math.max(0, amountUsd);
  const grossSpreadPerUsd = sellRate - buyRate;
  const grossProfitArs = grossSpreadPerUsd * Math.max(0, amountUsd);
  const saleValueArs = sellRate * Math.max(0, amountUsd);
  const sourceFeesArs = feeInArs(source.fees, capitalRequiredArs, buyRate);
  const destinationFeesArs = feeInArs(destination.fees, saleValueArs, sellRate);
  const transferFeesArs = (route.estimatedTransferFeeArs ?? 0) + (route.estimatedTransferFeeUsd ?? 0) * buyRate;
  const estimatedCostsArs = sourceFeesArs + destinationFeesArs + transferFeesArs;
  const costStatus = resolveCostStatus([source.fees?.confidence, destination.fees?.confidence, route.costConfidence]);
  const netProfitArs = costStatus === "unknown" ? undefined : grossProfitArs - estimatedCostsArs;
  const netReturnPercentage = netProfitArs !== undefined && capitalRequiredArs > 0 ? (netProfitArs / capitalRequiredArs) * 100 : undefined;
  const sourceFreshness = getFreshnessStatus(source, now);
  const destinationFreshness = getFreshnessStatus(destination, now);
  const freshnessStatus = sourceFreshness === "stale" || destinationFreshness === "stale"
    ? "stale"
    : sourceFreshness === "unverifiable" || destinationFreshness === "unverifiable"
      ? "unverifiable"
      : sourceFreshness === "warning" || destinationFreshness === "warning" ? "warning" : "fresh";
  const blockers = [...route.blockers];
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) blockers.push("invalid_amount");
  if (!buyRate) blockers.push("missing_buy_price");
  if (!sellRate) blockers.push("missing_sell_price");
  const warnings = [...route.warnings];
  if (costStatus === "unknown") warnings.push("costs_unverified");

  const isCompatible = route.isCompatible && freshnessStatus !== "stale" && blockers.length === 0;
  const limitsVerified = source.verification.limits === "verified" && destination.verification.limits === "verified";
  const quotesVerified = source.verification.quote === "verified" && destination.verification.quote === "verified";
  const verificationLevel = quotesVerified && route.verificationLevel === "verified" && costStatus === "verified" && limitsVerified
    ? "verified"
    : source.verification.quote === "reference_only" || destination.verification.quote === "reference_only"
      ? "reference_only"
      : "partially_verified";
  const isProfitable = isCompatible
    && freshnessStatus === "fresh"
    && verificationLevel === "verified"
    && netProfitArs !== undefined
    && netProfitArs > 0;
  const isPotentiallyProfitable = isCompatible && grossProfitArs > 0 && !isProfitable;
  const classification = isProfitable
    ? "verified_opportunity"
    : isPotentiallyProfitable
      ? "potential_gross_difference"
      : verificationLevel === "reference_only"
        ? "informational_reference"
        : "unavailable";

  return {
    id: `${route.id}--${amountUsd}`,
    sourceProviderId: source.providerId,
    destinationProviderId: destination.providerId,
    sourceQuoteId: source.id,
    destinationQuoteId: destination.id,
    routeId: route.id,
    amountUsd,
    buyRate,
    sellRate,
    grossSpreadPerUsd,
    grossProfitArs,
    estimatedCostsArs,
    netProfitArs,
    netReturnPercentage,
    capitalRequiredArs,
    isCompatible,
    isProfitable,
    isPotentiallyProfitable,
    classification,
    verificationLevel,
    costStatus,
    freshnessStatus,
    blockers: unique(blockers),
    warnings: unique(warnings),
    calculatedAt: now.toISOString(),
  };
}

export function buildOpportunityMatrix(quotes: FxQuote[], amountUsd: number, now = new Date()) {
  const buyQuotes = rankBuyQuotes(quotes);
  const sellQuotes = rankSellQuotes(quotes);
  return buyQuotes.flatMap((source) => sellQuotes.map((destination) => calculateArbitrageOpportunity(source, destination, amountUsd, undefined, now)));
}

export function rankBuyQuotes(quotes: FxQuote[]) {
  return quotes
    .filter((quote) => typeof quote.userBuysUsdAt === "number" && quote.userBuysUsdAt > 0)
    .toSorted((left, right) => (left.userBuysUsdAt ?? Infinity) - (right.userBuysUsdAt ?? Infinity));
}

export function rankSellQuotes(quotes: FxQuote[]) {
  return quotes
    .filter((quote) => typeof quote.userSellsUsdAt === "number" && quote.userSellsUsdAt > 0)
    .toSorted((left, right) => (right.userSellsUsdAt ?? 0) - (left.userSellsUsdAt ?? 0));
}

export function findBestOpportunity(opportunities: ArbitrageOpportunity[]) {
  return opportunities
    .filter((opportunity) => opportunity.classification === "verified_opportunity")
    .toSorted((left, right) => (right.netProfitArs ?? Number.NEGATIVE_INFINITY) - (left.netProfitArs ?? Number.NEGATIVE_INFINITY))[0];
}

export function findBestPotentialDifference(opportunities: ArbitrageOpportunity[]) {
  return opportunities
    .filter((opportunity) => opportunity.classification === "potential_gross_difference")
    .toSorted((left, right) => right.grossProfitArs - left.grossProfitArs)[0];
}
