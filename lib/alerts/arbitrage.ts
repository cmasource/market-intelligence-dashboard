import {
  buildOpportunityMatrixForAsset,
  calculateArbitrageOpportunity,
  getFreshnessStatus,
} from "@/lib/arbitrage";
import type { ArbitrageOpportunity, FxQuote } from "@/lib/arbitrage/types";
import type { AlertEvaluation, ArbitrageAlertSubscription } from "./types";

const MAX_RETRIEVAL_AGE_SECONDS = 5 * 60;
const DIFFERENCE_ONLY_AMOUNT_USD = 1;
const NON_COMPARABLE_BLOCKERS = new Set([
  "same_provider",
  "asset_mismatch",
  "instrument_mismatch",
  "missing_buy_price",
  "missing_sell_price",
  "source_unavailable",
  "destination_unavailable",
  "stale_quote",
]);

function ageSeconds(value: string, now: Date) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));
}

function quotePairForOpportunity(opportunity: ArbitrageOpportunity, quotes: FxQuote[]) {
  return {
    sourceQuote: quotes.find((quote) => quote.id === opportunity.sourceQuoteId),
    destinationQuote: quotes.find((quote) => quote.id === opportunity.destinationQuoteId),
  };
}

function quoteIsCurrent(quote: FxQuote, now: Date) {
  const freshness = getFreshnessStatus(quote, now);
  return ageSeconds(quote.fetchedAt, now) <= MAX_RETRIEVAL_AGE_SECONDS
    && (freshness === "fresh" || freshness === "unverifiable")
    && !["stale", "unavailable", "error"].includes(quote.status);
}

function differenceIsComparable(opportunity: ArbitrageOpportunity) {
  return opportunity.grossSpreadPerUsd > 0
    && !opportunity.blockers.some((blocker) => NON_COMPARABLE_BLOCKERS.has(blocker));
}

function selectRouteCandidate(subscription: ArbitrageAlertSubscription, quotes: FxQuote[], now: Date) {
  if (!subscription.sourceProviderId || !subscription.destinationProviderId) return null;
  const sourceQuote = quotes
    .filter((quote) => quote.transferAsset === subscription.transferAsset && quote.providerId === subscription.sourceProviderId && (quote.userBuysUsdAt ?? 0) > 0)
    .toSorted((left, right) => (left.userBuysUsdAt ?? Number.POSITIVE_INFINITY) - (right.userBuysUsdAt ?? Number.POSITIVE_INFINITY))[0];
  const destinationQuote = quotes
    .filter((quote) => quote.transferAsset === subscription.transferAsset && quote.providerId === subscription.destinationProviderId && (quote.userSellsUsdAt ?? 0) > 0)
    .toSorted((left, right) => (right.userSellsUsdAt ?? 0) - (left.userSellsUsdAt ?? 0))[0];
  if (!sourceQuote || !destinationQuote) return null;
  return {
    opportunity: calculateArbitrageOpportunity(sourceQuote, destinationQuote, DIFFERENCE_ONLY_AMOUNT_USD, undefined, now),
    sourceQuote,
    destinationQuote,
  };
}

function selectAnyVerifiedCandidate(subscription: ArbitrageAlertSubscription, quotes: FxQuote[], now: Date) {
  return buildOpportunityMatrixForAsset(quotes, subscription.transferAsset, DIFFERENCE_ONLY_AMOUNT_USD, now)
    .map((opportunity) => ({ opportunity, ...quotePairForOpportunity(opportunity, quotes) }))
    .filter((candidate): candidate is { opportunity: ArbitrageOpportunity; sourceQuote: FxQuote; destinationQuote: FxQuote } => Boolean(candidate.sourceQuote && candidate.destinationQuote))
    .filter(({ opportunity, sourceQuote, destinationQuote }) => differenceIsComparable(opportunity) && quoteIsCurrent(sourceQuote, now) && quoteIsCurrent(destinationQuote, now))
    .toSorted((left, right) => right.opportunity.grossSpreadPerUsd - left.opportunity.grossSpreadPerUsd)[0] ?? null;
}

export function arbitrageInstrumentId(subscription: ArbitrageAlertSubscription) {
  if (subscription.scope === "any_verified") return `arbitrage:${subscription.transferAsset}:any-verified`;
  return `arbitrage:${subscription.transferAsset}:${subscription.sourceProviderId}:${subscription.destinationProviderId}`;
}

export type ArbitrageAlertEvaluation = {
  evaluation: AlertEvaluation;
  opportunity: ArbitrageOpportunity;
  sourceQuote: FxQuote;
  destinationQuote: FxQuote;
};

export function evaluateArbitrageAlert(
  subscription: ArbitrageAlertSubscription,
  quotes: FxQuote[],
  providerNames: Map<string, string>,
  now = new Date(),
): ArbitrageAlertEvaluation | null {
  const candidate = subscription.scope === "any_verified"
    ? selectAnyVerifiedCandidate(subscription, quotes, now)
    : selectRouteCandidate(subscription, quotes, now);
  if (!candidate) return null;
  const { opportunity, sourceQuote, destinationQuote } = candidate;

  const sourceDataIsUsable = quoteIsCurrent(sourceQuote, now) && quoteIsCurrent(destinationQuote, now);
  const comparableDifference = differenceIsComparable(opportunity);
  const triggered = sourceDataIsUsable && comparableDifference && opportunity.grossSpreadPerUsd >= subscription.minimumGrossSpreadArs;
  const sourceName = providerNames.get(opportunity.sourceProviderId) ?? opportunity.sourceProviderId;
  const destinationName = providerNames.get(opportunity.destinationProviderId) ?? opportunity.destinationProviderId;
  const sourceHasTime = Boolean(sourceQuote.observedAt);
  const destinationHasTime = Boolean(destinationQuote.observedAt);
  const sourceObservedAt = sourceQuote.observedAt ?? sourceQuote.fetchedAt;
  const destinationObservedAt = destinationQuote.observedAt ?? destinationQuote.fetchedAt;
  const sourceTimeLabel = sourceHasTime ? "hora informada por la fuente" : "hora de consulta de CMA; la fuente no informa hora propia";
  const destinationTimeLabel = destinationHasTime ? "hora informada por la fuente" : "hora de consulta de CMA; la fuente no informa hora propia";
  const freshnessStatus = sourceDataIsUsable ? "fresh" as const : "stale" as const;
  const formattedBuy = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(opportunity.buyRate);
  const formattedSell = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(opportunity.sellRate);
  const formattedSpread = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(opportunity.grossSpreadPerUsd);

  const limitations = [
    "La alerta confirma una diferencia bruta entre cotizaciones consultadas recientemente; no confirma ganancia neta ni una operación ejecutable.",
    "El monto, los costos, los límites y la acreditación pueden modificar o eliminar el resultado; deben evaluarse en la calculadora y en cada proveedor.",
    "El sistema informa la oportunidad y nunca ejecuta operaciones.",
    ...(!sourceHasTime || !destinationHasTime ? ["Al menos una fuente no informa hora propia; se utilizó la hora de consulta de CMA, con una antigüedad máxima de cinco minutos."] : []),
  ];

  return {
    opportunity,
    sourceQuote,
    destinationQuote,
    evaluation: {
      ruleId: "arbitrage_opportunity",
      ruleVersion: 4,
      category: "arbitrage_opportunity",
      triggered,
      severity: triggered ? "medium" : "informational",
      confidenceScore: triggered ? (sourceHasTime && destinationHasTime ? 0.9 : 0.75) : 0.35,
      direction: "up",
      title: {
        es: `Diferencia de cotización detectada: ${sourceName} → ${destinationName}`,
        en: `Quote difference detected: ${sourceName} → ${destinationName}`,
      },
      summary: {
        es: `Compra de referencia a ${formattedBuy} y venta a ${formattedSell}: ${formattedSpread} de diferencia bruta por USD. El monto y el resultado final se calculan por separado.`,
        en: `Reference buy at ${formattedBuy} and sell at ${formattedSell}: ${formattedSpread} gross difference per USD. Amount and final result are calculated separately.`,
      },
      reasons: [
        "Las dos cotizaciones fueron consultadas por CMA dentro de los últimos cinco minutos y son comparables para el mismo activo.",
        `La diferencia por unidad alcanzó ${opportunity.grossSpreadPerUsd.toFixed(2)} ARS; el umbral configurado es ${subscription.minimumGrossSpreadArs.toFixed(2)} ARS.`,
      ],
      evidence: [
        { key: "source_buy_rate", label: `Compra en ${sourceName}`, value: opportunity.buyRate, unit: "ARS", provider: sourceName, observedAt: sourceObservedAt },
        { key: "destination_sell_rate", label: `Venta en ${destinationName}`, value: opportunity.sellRate, unit: "ARS", provider: destinationName, observedAt: destinationObservedAt },
        { key: "source_timestamp_basis", label: sourceTimeLabel, value: sourceObservedAt, provider: sourceName, observedAt: sourceObservedAt },
        { key: "destination_timestamp_basis", label: destinationTimeLabel, value: destinationObservedAt, provider: destinationName, observedAt: destinationObservedAt },
        { key: "gross_spread_per_usd", label: "Diferencia bruta por USD", value: opportunity.grossSpreadPerUsd, unit: "ARS", provider: "CMA deterministic engine", observedAt: now.toISOString() },
      ],
      limitations,
      evaluatedAt: now.toISOString(),
      freshnessStatus,
    },
  };
}
