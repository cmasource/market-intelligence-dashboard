import {
  buildOpportunityMatrixForAsset,
  calculateArbitrageOpportunity,
  findBestOpportunity,
  findBestPotentialDifference,
  getFreshnessStatus,
} from "@/lib/arbitrage";
import type { ArbitrageOpportunity, FxQuote } from "@/lib/arbitrage/types";
import type { AlertEvaluation, ArbitrageAlertSubscription } from "./types";

const MAX_RETRIEVAL_AGE_SECONDS = 10 * 60;

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
    opportunity: calculateArbitrageOpportunity(sourceQuote, destinationQuote, subscription.amountUsd, undefined, now),
    sourceQuote,
    destinationQuote,
  };
}

function selectAnyVerifiedCandidate(subscription: ArbitrageAlertSubscription, quotes: FxQuote[], now: Date) {
  const matrix = buildOpportunityMatrixForAsset(quotes, subscription.transferAsset, subscription.amountUsd, now);
  const opportunity = findBestOpportunity(matrix)
    ?? findBestPotentialDifference(matrix)
    ?? matrix
      .filter((candidate) => !candidate.blockers.includes("same_provider") && !candidate.blockers.includes("asset_mismatch"))
      .toSorted((left, right) => right.grossSpreadPerUsd - left.grossSpreadPerUsd)[0];
  if (!opportunity) return null;
  const { sourceQuote, destinationQuote } = quotePairForOpportunity(opportunity, quotes);
  if (!sourceQuote || !destinationQuote) return null;
  return { opportunity, sourceQuote, destinationQuote };
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

  const sourceFreshness = getFreshnessStatus(sourceQuote, now);
  const destinationFreshness = getFreshnessStatus(destinationQuote, now);
  const retrievalIsCurrent = [sourceQuote, destinationQuote].every((quote) => ageSeconds(quote.fetchedAt, now) <= MAX_RETRIEVAL_AGE_SECONDS);
  const sourceDataIsUsable = ![sourceFreshness, destinationFreshness].includes("stale") && retrievalIsCurrent;
  const isVerifiedOpportunity = opportunity.classification === "verified_opportunity";
  const triggered = sourceDataIsUsable && isVerifiedOpportunity && opportunity.grossSpreadPerUsd >= subscription.minimumGrossSpreadArs;
  const sourceName = providerNames.get(opportunity.sourceProviderId) ?? opportunity.sourceProviderId;
  const destinationName = providerNames.get(opportunity.destinationProviderId) ?? opportunity.destinationProviderId;
  const sourceHasTime = Boolean(sourceQuote.observedAt);
  const destinationHasTime = Boolean(destinationQuote.observedAt);
  const sourceObservedAt = sourceQuote.observedAt ?? sourceQuote.fetchedAt;
  const destinationObservedAt = destinationQuote.observedAt ?? destinationQuote.fetchedAt;
  const sourceTimeLabel = sourceHasTime ? "hora informada por la fuente" : "hora de consulta de CMA; la fuente no informa hora propia";
  const destinationTimeLabel = destinationHasTime ? "hora informada por la fuente" : "hora de consulta de CMA; la fuente no informa hora propia";
  const freshnessStatus = !sourceDataIsUsable
    ? "stale" as const
    : sourceHasTime && destinationHasTime
      ? "fresh" as const
      : "invalid" as const;
  const formattedAmount = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(subscription.amountUsd);
  const formattedSpread = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(opportunity.grossSpreadPerUsd);
  const formattedNet = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(opportunity.netProfitArs ?? 0);

  const limitations = [
    "La verificación confirma datos, costos, límites y compatibilidad según la información disponible; no garantiza que la ejecución mantenga el mismo resultado.",
    "El sistema informa la oportunidad y nunca ejecuta operaciones.",
    ...(!sourceHasTime || !destinationHasTime ? ["Al menos una fuente no informa hora propia; por lo tanto esta diferencia no se clasifica como oportunidad verificada."] : []),
    ...(opportunity.blockers.length ? [`Ruta no confirmada: ${opportunity.blockers.join(", ")}.`] : []),
  ];

  return {
    opportunity,
    sourceQuote,
    destinationQuote,
    evaluation: {
      ruleId: "arbitrage_opportunity",
      ruleVersion: 3,
      category: "arbitrage_opportunity",
      triggered,
      severity: triggered ? "medium" : "informational",
      confidenceScore: triggered ? 0.95 : sourceHasTime && destinationHasTime ? 0.6 : 0.35,
      direction: "up",
      title: {
        es: `Oportunidad de arbitraje verificada: ${sourceName} → ${destinationName}`,
        en: `Verified arbitrage opportunity: ${sourceName} → ${destinationName}`,
      },
      summary: {
        es: `Para USD ${formattedAmount}, el resultado neto verificado estimado es ${formattedNet} (${formattedSpread} de diferencia bruta por unidad). Verificá nuevamente antes de operar.`,
        en: `For USD ${formattedAmount}, the estimated verified net result is ${formattedNet} (${formattedSpread} gross difference per unit). Verify again before trading.`,
      },
      reasons: [
        "La ruta cumple los controles determinísticos de frescura, cotizaciones, costos, límites y compatibilidad.",
        `La diferencia por unidad alcanzó ${opportunity.grossSpreadPerUsd.toFixed(2)} ARS; el umbral configurado es ${subscription.minimumGrossSpreadArs.toFixed(2)} ARS.`,
      ],
      evidence: [
        { key: "source_buy_rate", label: `Compra en ${sourceName}`, value: opportunity.buyRate, unit: "ARS", provider: sourceName, observedAt: sourceObservedAt },
        { key: "destination_sell_rate", label: `Venta en ${destinationName}`, value: opportunity.sellRate, unit: "ARS", provider: destinationName, observedAt: destinationObservedAt },
        { key: "source_timestamp_basis", label: sourceTimeLabel, value: sourceObservedAt, provider: sourceName, observedAt: sourceObservedAt },
        { key: "destination_timestamp_basis", label: destinationTimeLabel, value: destinationObservedAt, provider: destinationName, observedAt: destinationObservedAt },
        { key: "verified_net_result", label: "Resultado neto estimado con costos verificados", value: opportunity.netProfitArs ?? 0, unit: "ARS", provider: "CMA deterministic engine", observedAt: now.toISOString() },
      ],
      limitations,
      evaluatedAt: now.toISOString(),
      freshnessStatus,
    },
  };
}
