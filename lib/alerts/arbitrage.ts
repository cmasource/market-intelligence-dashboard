import { calculateArbitrageOpportunity, getFreshnessStatus } from "@/lib/arbitrage";
import type { ArbitrageOpportunity, FxQuote } from "@/lib/arbitrage/types";
import type { AlertEvaluation, ArbitrageAlertSubscription } from "./types";

const MAX_RETRIEVAL_AGE_SECONDS = 10 * 60;

function ageSeconds(value: string, now: Date) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.floor((now.getTime() - timestamp) / 1000));
}

function selectQuotes(subscription: ArbitrageAlertSubscription, quotes: FxQuote[]) {
  const sourceQuote = quotes
    .filter((quote) => quote.transferAsset === subscription.transferAsset && quote.providerId === subscription.sourceProviderId && (quote.userBuysUsdAt ?? 0) > 0)
    .toSorted((left, right) => (left.userBuysUsdAt ?? Number.POSITIVE_INFINITY) - (right.userBuysUsdAt ?? Number.POSITIVE_INFINITY))[0];
  const destinationQuote = quotes
    .filter((quote) => quote.transferAsset === subscription.transferAsset && quote.providerId === subscription.destinationProviderId && (quote.userSellsUsdAt ?? 0) > 0)
    .toSorted((left, right) => (right.userSellsUsdAt ?? 0) - (left.userSellsUsdAt ?? 0))[0];
  return { sourceQuote, destinationQuote };
}

export function arbitrageInstrumentId(subscription: ArbitrageAlertSubscription) {
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
  const { sourceQuote, destinationQuote } = selectQuotes(subscription, quotes);
  if (!sourceQuote || !destinationQuote) return null;

  const opportunity = calculateArbitrageOpportunity(sourceQuote, destinationQuote, subscription.amountUsd, undefined, now);
  const sourceFreshness = getFreshnessStatus(sourceQuote, now);
  const destinationFreshness = getFreshnessStatus(destinationQuote, now);
  const retrievalIsCurrent = [sourceQuote, destinationQuote].every((quote) => ageSeconds(quote.fetchedAt, now) <= MAX_RETRIEVAL_AGE_SECONDS);
  const sourceDataIsUsable = ![sourceFreshness, destinationFreshness].includes("stale") && retrievalIsCurrent;
  const triggered = sourceDataIsUsable && opportunity.grossSpreadPerUsd >= subscription.minimumGrossSpreadArs;
  const sourceName = providerNames.get(subscription.sourceProviderId) ?? subscription.sourceProviderId;
  const destinationName = providerNames.get(subscription.destinationProviderId) ?? subscription.destinationProviderId;
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
  const formattedGross = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(opportunity.grossProfitArs);

  const limitations = [
    "La diferencia es bruta: no descuenta comisiones, impuestos, spread final, límites ni tiempos de transferencia.",
    ...(!sourceHasTime || !destinationHasTime ? ["Al menos una fuente no informa hora propia; se muestra y controla la hora de consulta de CMA."] : []),
    ...(opportunity.blockers.length ? [`Ruta no confirmada: ${opportunity.blockers.join(", ")}.`] : []),
  ];

  return {
    opportunity,
    sourceQuote,
    destinationQuote,
    evaluation: {
      ruleId: "arbitrage_opportunity",
      ruleVersion: 2,
      category: "arbitrage_opportunity",
      triggered,
      severity: opportunity.classification === "verified_opportunity" ? "medium" : "informational",
      confidenceScore: sourceHasTime && destinationHasTime ? 0.75 : 0.45,
      direction: "up",
      title: {
        es: `Diferencia bruta detectada: ${sourceName} → ${destinationName}`,
        en: `Gross price difference detected: ${sourceName} → ${destinationName}`,
      },
      summary: {
        es: `Para USD ${formattedAmount}, la diferencia bruta estimada es ${formattedGross} (${formattedSpread} por unidad). No confirma ganancia neta ni ejecución posible.`,
        en: `For USD ${formattedAmount}, the estimated gross difference is ${formattedGross} (${formattedSpread} per unit). It does not confirm net profit or an executable route.`,
      },
      reasons: [
        `La diferencia por unidad alcanzó ${opportunity.grossSpreadPerUsd.toFixed(2)} ARS.`,
        `El umbral configurado es ${subscription.minimumGrossSpreadArs.toFixed(2)} ARS por unidad.`,
      ],
      evidence: [
        { key: "source_buy_rate", label: `Compra en ${sourceName}`, value: opportunity.buyRate, unit: "ARS", provider: sourceName, observedAt: sourceObservedAt },
        { key: "destination_sell_rate", label: `Venta en ${destinationName}`, value: opportunity.sellRate, unit: "ARS", provider: destinationName, observedAt: destinationObservedAt },
        { key: "source_timestamp_basis", label: sourceTimeLabel, value: sourceObservedAt, provider: sourceName, observedAt: sourceObservedAt },
        { key: "destination_timestamp_basis", label: destinationTimeLabel, value: destinationObservedAt, provider: destinationName, observedAt: destinationObservedAt },
        { key: "gross_difference", label: "Diferencia bruta para el monto configurado", value: opportunity.grossProfitArs, unit: "ARS", provider: "CMA deterministic engine", observedAt: now.toISOString() },
      ],
      limitations,
      evaluatedAt: now.toISOString(),
      freshnessStatus,
    },
  };
}
