import { ema } from "@/lib/technical/indicators";
import { freshnessFor } from "./engine";
import type {
  AlertEvaluation,
  AlertMarketSnapshot,
  PersonalAlertCondition,
  PersonalAlertQuoteContext,
  PersonalAlertSubscription,
} from "./types";

const RULE_ID_BY_CONDITION: Record<PersonalAlertCondition, string> = {
  price_above: "personal_price_above",
  price_below: "personal_price_below",
  rapid_rise: "personal_rapid_rise",
  rapid_fall: "personal_rapid_fall",
  near_ema200: "personal_near_ema200",
  near_period_low: "personal_near_period_low",
  near_period_high: "personal_near_period_high",
};

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function inactive(snapshot: AlertMarketSnapshot, subscription: PersonalAlertSubscription, now: Date): AlertEvaluation {
  return {
    ruleId: RULE_ID_BY_CONDITION[subscription.condition], ruleVersion: 1,
    category: subscription.condition.includes("rapid") ? "unusual_price_move" : "technical_change",
    triggered: false, severity: "medium", confidenceScore: 0, direction: "neutral",
    title: { es: `Alerta configurada para ${snapshot.symbol}`, en: `Configured alert for ${snapshot.symbol}` },
    summary: { es: "La condición configurada no está activa.", en: "The configured condition is not active." },
    reasons: [], evidence: [], limitations: ["La evaluación usa cotizaciones y cierres OHLCV verificables y no ejecuta órdenes."],
    evaluatedAt: now.toISOString(), freshnessStatus: freshnessFor(snapshot, now),
  };
}

function evidence(provider: string, observedAt: string, key: string, label: string, value: number, unit?: string) {
  return { key, label, value: round(value, 4), unit, provider, observedAt };
}

export function isPersonalQuoteFresh(quote: PersonalAlertQuoteContext, now: Date) {
  if (quote.price === null || !quote.observedAt || quote.dataDelay === "eod") return false;
  const observed = Date.parse(quote.observedAt);
  if (!Number.isFinite(observed)) return false;
  const age = now.getTime() - observed;
  return age >= -5 * 60_000 && age <= (quote.dataDelay === "realtime" ? 15 : 45) * 60_000;
}

export function evaluatePersonalAlert(
  snapshot: AlertMarketSnapshot,
  subscription: PersonalAlertSubscription,
  now = new Date(),
  quote?: PersonalAlertQuoteContext,
): AlertEvaluation {
  const base = inactive(snapshot, subscription, now);
  if (base.freshnessStatus !== "fresh" || !snapshot.providerHealthy || snapshot.bars.length < 2 || !quote || !isPersonalQuoteFresh(quote, now)) return base;

  const bars = snapshot.bars;
  const price = quote.price!;
  const previousObservedPrice = quote.previousObservedPrice;
  const changePercent = quote.changePercent;
  const target = subscription.targetValue ?? 0;
  const threshold = subscription.thresholdPercent ?? 0;
  const direction = subscription.condition === "price_below" || subscription.condition === "rapid_fall" || subscription.condition === "near_period_low" ? "down" : "up";
  let conditionMet = false;
  let referenceValue: number | null = null;
  let referenceLabel = "Referencia";

  if (subscription.condition === "price_above") conditionMet = previousObservedPrice !== null && previousObservedPrice < target && price >= target;
  if (subscription.condition === "price_below") conditionMet = previousObservedPrice !== null && previousObservedPrice > target && price <= target;
  if (subscription.condition === "rapid_rise") conditionMet = changePercent !== null && changePercent >= threshold;
  if (subscription.condition === "rapid_fall") conditionMet = changePercent !== null && changePercent <= -threshold;

  if (subscription.condition === "near_ema200" && bars.length >= 200) {
    referenceValue = ema(bars.map((bar) => bar.close), 200).at(-1) ?? null;
    referenceLabel = "EMA 200 diaria";
    conditionMet = referenceValue !== null && Math.abs(price - referenceValue) / referenceValue * 100 <= threshold;
  }

  if (subscription.condition === "near_period_low" || subscription.condition === "near_period_high") {
    const lookback = Math.min(subscription.lookbackBars ?? 200, bars.length - 1);
    if (lookback >= 20) {
      const comparison = bars.slice(-(lookback + 1), -1);
      referenceValue = subscription.condition === "near_period_low"
        ? Math.min(...comparison.map((bar) => bar.low))
        : Math.max(...comparison.map((bar) => bar.high));
      referenceLabel = subscription.condition === "near_period_low" ? `Mínimo de ${lookback} ruedas` : `Máximo de ${lookback} ruedas`;
      conditionMet = Math.abs(price - referenceValue) / referenceValue * 100 <= threshold;
    }
  }

  if (!conditionMet) return base;

  const conditionLabel: Record<PersonalAlertCondition, { es: string; en: string }> = {
    price_above: { es: `cruzó o superó ${target} ${snapshot.currency}`, en: `crossed or exceeded ${target} ${snapshot.currency}` },
    price_below: { es: `cruzó o cayó por debajo de ${target} ${snapshot.currency}`, en: `crossed or fell below ${target} ${snapshot.currency}` },
    rapid_rise: { es: `sube ${round(changePercent ?? 0)}% en la rueda actual`, en: `is up ${round(changePercent ?? 0)}% in the current session` },
    rapid_fall: { es: `cae ${round(Math.abs(changePercent ?? 0))}% en la rueda actual`, en: `is down ${round(Math.abs(changePercent ?? 0))}% in the current session` },
    near_ema200: { es: `está a ${round(Math.abs(price - (referenceValue ?? price)) / (referenceValue ?? price) * 100)}% de su EMA 200 diaria`, en: "is near its daily EMA 200" },
    near_period_low: { es: "está cerca de su mínimo del período", en: "is near its period low" },
    near_period_high: { es: "está cerca de su máximo del período", en: "is near its period high" },
  };
  const label = conditionLabel[subscription.condition];
  const alertEvidence = [evidence(quote.provider, quote.observedAt!, "price", "Último precio observado", price, snapshot.currency)];
  if (previousObservedPrice !== null && subscription.condition.startsWith("price_")) alertEvidence.push(evidence(quote.provider, quote.observedAt!, "previous_observed_price", "Precio observado anteriormente", previousObservedPrice, snapshot.currency));
  if (subscription.condition.includes("rapid") && changePercent !== null) alertEvidence.push(evidence(quote.provider, quote.observedAt!, "session_change", "Variación de la rueda", changePercent, "%"));
  if (referenceValue !== null) alertEvidence.push(evidence(snapshot.provider, snapshot.observedAt, "reference", referenceLabel, referenceValue, snapshot.currency));
  if (target > 0) alertEvidence.push(evidence(quote.provider, quote.observedAt!, "target", "Precio configurado", target, snapshot.currency));

  return {
    ...base, triggered: true, confidenceScore: quote.dataDelay === "realtime" ? 0.94 : 0.88, direction,
    title: { es: `Alerta personal en ${snapshot.symbol}`, en: `Personal alert for ${snapshot.symbol}` },
    summary: { es: `${snapshot.symbol} ${label.es}.`, en: `${snapshot.symbol} ${label.en}.` },
    reasons: ["Se cumplió la condición configurada con una cotización reciente y datos OHLCV verificables."],
    evidence: alertEvidence,
  };
}

export function personalRuleId(condition: PersonalAlertCondition) {
  return RULE_ID_BY_CONDITION[condition];
}
