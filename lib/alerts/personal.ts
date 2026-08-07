import { ema } from "@/lib/technical/indicators";
import { freshnessFor } from "./engine";
import type {
  AlertEvaluation,
  AlertMarketSnapshot,
  PersonalAlertCondition,
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
    ruleId: RULE_ID_BY_CONDITION[subscription.condition],
    ruleVersion: 1,
    category: subscription.condition.includes("rapid") ? "unusual_price_move" : "technical_change",
    triggered: false,
    severity: "medium",
    confidenceScore: 0,
    direction: "neutral",
    title: { es: `Alerta configurada para ${snapshot.symbol}`, en: `Configured alert for ${snapshot.symbol}` },
    summary: { es: "La condición configurada no está activa.", en: "The configured condition is not active." },
    reasons: [],
    evidence: [],
    limitations: ["La evaluación usa cierres OHLCV y no ejecuta órdenes."],
    evaluatedAt: now.toISOString(),
    freshnessStatus: freshnessFor(snapshot, now),
  };
}

function personalEvidence(snapshot: AlertMarketSnapshot, key: string, label: string, value: number, unit?: string) {
  return { key, label, value: round(value, 4), unit, provider: snapshot.provider, observedAt: snapshot.observedAt };
}

export function evaluatePersonalAlert(
  snapshot: AlertMarketSnapshot,
  subscription: PersonalAlertSubscription,
  now = new Date(),
): AlertEvaluation {
  const base = inactive(snapshot, subscription, now);
  if (base.freshnessStatus !== "fresh" || !snapshot.providerHealthy || snapshot.bars.length < 2) return base;

  const bars = snapshot.bars;
  const latest = bars.at(-1)!;
  const previous = bars.at(-2)!;
  const close = latest.close;
  const previousClose = previous.close;
  const changePercent = previousClose > 0 ? ((close / previousClose) - 1) * 100 : 0;
  const target = subscription.targetValue ?? 0;
  const threshold = subscription.thresholdPercent ?? 0;
  const direction = subscription.condition === "price_below" || subscription.condition === "rapid_fall" || subscription.condition === "near_period_low" ? "down" : "up";
  let conditionMet = false;
  let referenceValue: number | null = null;
  let referenceLabel = "Referencia";

  if (subscription.condition === "price_above") conditionMet = previousClose < target && close >= target;
  if (subscription.condition === "price_below") conditionMet = previousClose > target && close <= target;
  if (subscription.condition === "rapid_rise") conditionMet = changePercent >= threshold;
  if (subscription.condition === "rapid_fall") conditionMet = changePercent <= -threshold;

  if (subscription.condition === "near_ema200" && bars.length >= 200) {
    referenceValue = ema(bars.map((bar) => bar.close), 200).at(-1) ?? null;
    referenceLabel = "EMA 200";
    conditionMet = referenceValue !== null && Math.abs(close - referenceValue) / referenceValue * 100 <= threshold;
  }

  if (subscription.condition === "near_period_low" || subscription.condition === "near_period_high") {
    const lookback = Math.min(subscription.lookbackBars ?? 200, bars.length - 1);
    if (lookback >= 20) {
      const comparison = bars.slice(-(lookback + 1), -1);
      referenceValue = subscription.condition === "near_period_low"
        ? Math.min(...comparison.map((bar) => bar.low))
        : Math.max(...comparison.map((bar) => bar.high));
      referenceLabel = subscription.condition === "near_period_low" ? `Mínimo de ${lookback} ruedas` : `Máximo de ${lookback} ruedas`;
      conditionMet = Math.abs(close - referenceValue) / referenceValue * 100 <= threshold;
    }
  }

  if (!conditionMet) return base;

  const conditionLabel: Record<PersonalAlertCondition, { es: string; en: string }> = {
    price_above: { es: `alcanzó o superó ${target} ${snapshot.currency}`, en: `reached or exceeded ${target} ${snapshot.currency}` },
    price_below: { es: `alcanzó o cayó por debajo de ${target} ${snapshot.currency}`, en: `reached or fell below ${target} ${snapshot.currency}` },
    rapid_rise: { es: `subió ${round(changePercent)}% en la última rueda`, en: `rose ${round(changePercent)}% in the latest bar` },
    rapid_fall: { es: `cayó ${round(Math.abs(changePercent))}% en la última rueda`, en: `fell ${round(Math.abs(changePercent))}% in the latest bar` },
    near_ema200: { es: `está a ${round(Math.abs(close - (referenceValue ?? close)) / (referenceValue ?? close) * 100)}% de su EMA 200`, en: `is near its EMA 200` },
    near_period_low: { es: `está cerca de su mínimo del período`, en: `is near its period low` },
    near_period_high: { es: `está cerca de su máximo del período`, en: `is near its period high` },
  };
  const label = conditionLabel[subscription.condition];
  const evidence = [
    personalEvidence(snapshot, "close", "Último cierre", close, snapshot.currency),
    personalEvidence(snapshot, "previous_close", "Cierre anterior", previousClose, snapshot.currency),
  ];
  if (subscription.condition.includes("rapid")) evidence.push(personalEvidence(snapshot, "change", "Variación", changePercent, "%"));
  if (referenceValue !== null) evidence.push(personalEvidence(snapshot, "reference", referenceLabel, referenceValue, snapshot.currency));
  if (target > 0) evidence.push(personalEvidence(snapshot, "target", "Precio configurado", target, snapshot.currency));

  return {
    ...base,
    triggered: true,
    confidenceScore: 0.9,
    direction,
    title: { es: `Alerta personal en ${snapshot.symbol}`, en: `Personal alert for ${snapshot.symbol}` },
    summary: { es: `${snapshot.symbol} ${label.es}.`, en: `${snapshot.symbol} ${label.en}.` },
    reasons: ["Se cumplió la condición configurada por el usuario con datos OHLCV verificables."],
    evidence,
  };
}

export function personalRuleId(condition: PersonalAlertCondition) {
  return RULE_ID_BY_CONDITION[condition];
}
