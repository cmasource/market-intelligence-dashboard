import { atrWilder, ema } from "@/lib/technical/indicators";
import { alertRuleCatalog } from "./rules";
import type {
  AlertDirection,
  AlertEvaluation,
  AlertMarketSnapshot,
  AlertSeverity,
} from "./types";

const ruleById = new Map(alertRuleCatalog.map((rule) => [rule.id, rule]));

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const mean = average(values);
  return Math.sqrt(average(values.map((value) => (value - mean) ** 2)));
}

function latest(values: Array<number | null>) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (value !== null && Number.isFinite(value)) return value;
  }
  return null;
}

function round(value: number, decimals = 2) {
  return Number(value.toFixed(decimals));
}

function severityFromScore(score: number): AlertSeverity {
  if (score >= 0.94) return "critical";
  if (score >= 0.82) return "high";
  if (score >= 0.65) return "medium";
  if (score >= 0.5) return "low";
  return "informational";
}

export function classifyAlertAssetType(assetType: string): AlertMarketSnapshot["assetType"] {
  const normalized = assetType.trim().toLowerCase();
  if (normalized === "stock" || normalized === "equity" || normalized === "argentine_equity") return "stock";
  if (normalized === "etf") return "etf";
  if (normalized === "adr") return "adr";
  if (normalized === "cedear") return "cedear";
  if (normalized === "cedear_etf") return "cedear_etf";
  if (normalized === "crypto" || normalized === "cryptocurrency") return "crypto";
  if (normalized === "bond" || normalized === "sovereign_bond" || normalized === "cer_bond") return "bond";
  if (normalized === "bill" || normalized === "letra") return "bill";
  if (normalized === "corporate_bond" || normalized === "on") return "corporate_bond";
  return "other";
}

export function freshnessFor(snapshot: AlertMarketSnapshot, evaluatedAt: Date) {
  const observed = Date.parse(snapshot.observedAt);
  const fetched = Date.parse(snapshot.fetchedAt);
  if (!Number.isFinite(observed) || !Number.isFinite(fetched) || fetched < observed) return "invalid" as const;
  const maximumHours = snapshot.assetType === "crypto" ? 36 : 96;
  return evaluatedAt.getTime() - observed <= maximumHours * 3_600_000 ? "fresh" as const : "stale" as const;
}

function baseEvaluation(
  snapshot: AlertMarketSnapshot,
  ruleId: string,
  evaluatedAt: string,
  freshnessStatus: AlertEvaluation["freshnessStatus"],
): AlertEvaluation {
  const rule = ruleById.get(ruleId)!;
  return {
    ruleId,
    ruleVersion: rule.version,
    category: rule.category,
    triggered: false,
    severity: "informational",
    confidenceScore: 0,
    direction: "neutral",
    title: { es: rule.name, en: rule.name },
    summary: { es: "La condición no está activa.", en: "The condition is not active." },
    reasons: [],
    evidence: [],
    limitations: rule.limitations,
    evaluatedAt,
    freshnessStatus,
  };
}

function evidence(snapshot: AlertMarketSnapshot, key: string, label: string, value: string | number, unit?: string) {
  return { key, label, value, unit, provider: snapshot.provider, observedAt: snapshot.observedAt };
}

function triggered(
  base: AlertEvaluation,
  input: {
    confidence: number;
    direction: AlertDirection;
    titleEs: string;
    titleEn: string;
    summaryEs: string;
    summaryEn: string;
    reasons: string[];
    evidence: AlertEvaluation["evidence"];
  },
): AlertEvaluation {
  const confidenceScore = Math.min(0.99, Math.max(0, input.confidence));
  return {
    ...base,
    triggered: true,
    severity: severityFromScore(confidenceScore),
    confidenceScore: round(confidenceScore, 4),
    direction: input.direction,
    title: { es: input.titleEs, en: input.titleEn },
    summary: { es: input.summaryEs, en: input.summaryEn },
    reasons: input.reasons,
    evidence: input.evidence,
  };
}

export function evaluateAlertRules(snapshot: AlertMarketSnapshot, now = new Date()): AlertEvaluation[] {
  const evaluatedAt = now.toISOString();
  const freshnessStatus = freshnessFor(snapshot, now);
  const rules = alertRuleCatalog.filter((rule) => rule.enabled && rule.scope === "automatic" && rule.supportedAssetTypes.includes(snapshot.assetType));
  const results = rules.filter((rule) => rule.category !== "opportunity").map((rule) => baseEvaluation(snapshot, rule.id, evaluatedAt, freshnessStatus));
  if (freshnessStatus !== "fresh" || !snapshot.providerHealthy || snapshot.bars.length < 60) return results;

  const bars = snapshot.bars;
  const closes = bars.map((bar) => bar.close);
  const latestBar = bars.at(-1)!;
  const previousBar = bars.at(-2)!;
  const returns = closes.slice(1).map((close, index) => close / closes[index] - 1);
  const currentReturn = returns.at(-1)!;
  const historicalReturns = returns.slice(-61, -1);
  const returnDeviation = standardDeviation(historicalReturns);
  const atr14 = latest(atrWilder(bars, 14));
  const atrPercent = atr14 && previousBar.close > 0 ? atr14 / previousBar.close : 0;
  const moveThreshold = Math.max(returnDeviation * 2.5, atrPercent * 1.5);
  const moveRatio = moveThreshold > 0 ? Math.abs(currentReturn) / moveThreshold : 0;

  const moveIndex = results.findIndex((result) => result.ruleId === "unusual_price_move");
  if (moveIndex >= 0 && moveRatio >= 1) {
    const direction = currentReturn > 0 ? "up" : "down";
    results[moveIndex] = triggered(results[moveIndex], {
      confidence: 0.62 + Math.min(0.34, (moveRatio - 1) * 0.18),
      direction,
      titleEs: `Movimiento inusual en ${snapshot.symbol}`,
      titleEn: `Unusual move in ${snapshot.symbol}`,
      summaryEs: `${snapshot.symbol} registró una variación ${direction === "up" ? "alcista" : "bajista"} superior a la esperada para su volatilidad reciente.`,
      summaryEn: `${snapshot.symbol} posted a ${direction === "up" ? "positive" : "negative"} move beyond its recent volatility-adjusted range.`,
      reasons: ["El movimiento supera simultáneamente el umbral estadístico y el ajustado por ATR."],
      evidence: [
        evidence(snapshot, "return", "Variación de la última barra", round(currentReturn * 100, 2), "%"),
        evidence(snapshot, "expected_move", "Umbral ajustado", round(moveThreshold * 100, 2), "%"),
        evidence(snapshot, "atr14", "ATR14", round(atr14 ?? 0, 4), snapshot.currency),
      ],
    });
  }

  const priorVolumes = bars.slice(-21, -1).map((bar) => bar.volume).filter((value) => value > 0);
  const averageVolume20 = average(priorVolumes);
  const volumeRatio = averageVolume20 > 0 && latestBar.volume > 0 ? latestBar.volume / averageVolume20 : 0;
  const volumeIndex = results.findIndex((result) => result.ruleId === "unusual_volume");
  if (volumeIndex >= 0 && priorVolumes.length >= 16 && volumeRatio >= 2.2) {
    results[volumeIndex] = triggered(results[volumeIndex], {
      confidence: 0.61 + Math.min(0.34, (volumeRatio - 2.2) * 0.12),
      direction: currentReturn > 0 ? "up" : currentReturn < 0 ? "down" : "neutral",
      titleEs: `Volumen inusual en ${snapshot.symbol}`,
      titleEn: `Unusual volume in ${snapshot.symbol}`,
      summaryEs: `El volumen de ${snapshot.symbol} equivale a ${round(volumeRatio, 1)} veces su promedio reciente.`,
      summaryEn: `${snapshot.symbol} volume is ${round(volumeRatio, 1)} times its recent average.`,
      reasons: ["El proveedor publicó volumen positivo y suficiente historial comparable."],
      evidence: [
        evidence(snapshot, "volume", "Volumen observado", latestBar.volume),
        evidence(snapshot, "average_volume_20", "Promedio de 20 barras", round(averageVolume20, 0)),
        evidence(snapshot, "volume_ratio", "Relación contra promedio", round(volumeRatio, 2), "x"),
      ],
    });
  }

  const ema50 = ema(closes, 50);
  const currentEma50 = latest(ema50);
  const previousEma50 = ema50.at(-2);
  const priorRange = bars.slice(-21, -1);
  const priorHigh = Math.max(...priorRange.map((bar) => bar.high));
  const priorLow = Math.min(...priorRange.map((bar) => bar.low));
  const buffer = (atr14 ?? 0) * 0.15;
  const crossedUp = currentEma50 !== null && typeof previousEma50 === "number" && previousBar.close <= previousEma50 && latestBar.close > currentEma50 + buffer;
  const crossedDown = currentEma50 !== null && typeof previousEma50 === "number" && previousBar.close >= previousEma50 && latestBar.close < currentEma50 - buffer;
  const brokeHigh = latestBar.close > priorHigh + buffer;
  const brokeLow = latestBar.close < priorLow - buffer;
  const trendDirection: AlertDirection = crossedUp || brokeHigh ? "up" : crossedDown || brokeLow ? "down" : "neutral";
  const trendIndex = results.findIndex((result) => result.ruleId === "trend_change");
  if (trendIndex >= 0 && trendDirection !== "neutral") {
    const level = trendDirection === "up" ? Math.min(currentEma50 ?? priorHigh, priorHigh) : Math.max(currentEma50 ?? priorLow, priorLow);
    const confirmations = Number(crossedUp || crossedDown) + Number(brokeHigh || brokeLow) + Number(volumeRatio >= 1.25);
    results[trendIndex] = triggered(results[trendIndex], {
      confidence: 0.62 + confirmations * 0.09,
      direction: trendDirection,
      titleEs: trendDirection === "up" ? `Recuperación de tendencia en ${snapshot.symbol}` : `Ruptura de tendencia en ${snapshot.symbol}`,
      titleEn: trendDirection === "up" ? `Trend recovery in ${snapshot.symbol}` : `Trend break in ${snapshot.symbol}`,
      summaryEs: `${snapshot.symbol} cerró ${trendDirection === "up" ? "por encima" : "por debajo"} de un nivel técnico relevante en ${round(level, 4)} ${snapshot.currency}.`,
      summaryEn: `${snapshot.symbol} closed ${trendDirection === "up" ? "above" : "below"} a relevant technical level at ${round(level, 4)} ${snapshot.currency}.`,
      reasons: [crossedUp || crossedDown ? "Cruce confirmado de EMA50." : "Ruptura del rango de 20 barras.", volumeRatio >= 1.25 ? "El volumen acompaña el movimiento." : "Sin confirmación adicional de volumen."],
      evidence: [
        evidence(snapshot, "close", "Último cierre", round(latestBar.close, 4), snapshot.currency),
        evidence(snapshot, "technical_level", "Nivel técnico", round(level, 4), snapshot.currency),
        evidence(snapshot, "ema50", "EMA50", round(currentEma50 ?? 0, 4), snapshot.currency),
      ],
    });
  }

  const recentVolatility = standardDeviation(returns.slice(-10));
  const baselineVolatility = standardDeviation(returns.slice(-50, -10));
  const volatilityRatio = baselineVolatility > 0 ? recentVolatility / baselineVolatility : 0;
  const volatilityIndex = results.findIndex((result) => result.ruleId === "elevated_volatility");
  if (volatilityIndex >= 0 && volatilityRatio >= 1.8) {
    results[volatilityIndex] = triggered(results[volatilityIndex], {
      confidence: 0.61 + Math.min(0.34, (volatilityRatio - 1.8) * 0.16),
      direction: "neutral",
      titleEs: `Volatilidad elevada en ${snapshot.symbol}`,
      titleEn: `Elevated volatility in ${snapshot.symbol}`,
      summaryEs: `La volatilidad reciente de ${snapshot.symbol} aumentó a ${round(volatilityRatio, 1)} veces su propio nivel de referencia.`,
      summaryEn: `${snapshot.symbol}'s recent volatility rose to ${round(volatilityRatio, 1)} times its own baseline.`,
      reasons: ["La comparación usa el historial del mismo instrumento, no un umbral universal."],
      evidence: [
        evidence(snapshot, "recent_volatility", "Volatilidad reciente", round(recentVolatility * 100, 2), "%"),
        evidence(snapshot, "baseline_volatility", "Volatilidad base", round(baselineVolatility * 100, 2), "%"),
        evidence(snapshot, "volatility_ratio", "Relación", round(volatilityRatio, 2), "x"),
      ],
    });
  }

  const positiveTrend = results.find((result) => result.ruleId === "trend_change" && result.triggered && result.direction === "up");
  const independentConfirmation = results.find((result) => result.triggered && (result.ruleId === "unusual_price_move" || result.ruleId === "unusual_volume") && result.direction !== "down");
  const opportunityRule = ruleById.get("multi_signal_opportunity")!;
  if (!opportunityRule.supportedAssetTypes.includes(snapshot.assetType)) return results;
  if (positiveTrend && independentConfirmation) {
    const confidence = Math.min(0.95, average([positiveTrend.confidenceScore, independentConfirmation.confidenceScore]) + 0.08);
    results.push(triggered(baseEvaluation(snapshot, opportunityRule.id, evaluatedAt, freshnessStatus), {
      confidence,
      direction: "up",
      titleEs: `Oportunidad detectada en ${snapshot.symbol}`,
      titleEn: `Opportunity detected in ${snapshot.symbol}`,
      summaryEs: `Una recuperación de tendencia coincide con ${independentConfirmation.ruleId === "unusual_volume" ? "volumen inusual" : "un movimiento confirmado por volatilidad"}. Revisá la evidencia antes de decidir.`,
      summaryEn: `A trend recovery coincides with ${independentConfirmation.ruleId === "unusual_volume" ? "unusual volume" : "a volatility-adjusted move"}. Review the evidence before making a decision.`,
      reasons: ["Se activaron dos reglas independientes con datos frescos.", "La confianza prioriza la calidad de la evidencia y no estima rentabilidad."],
      evidence: [...positiveTrend.evidence.slice(0, 2), ...independentConfirmation.evidence.slice(0, 2)],
    }));
  } else {
    results.push(baseEvaluation(snapshot, opportunityRule.id, evaluatedAt, freshnessStatus));
  }

  return results;
}

export function deduplicationKey(input: { userId: string; instrumentId: string; evaluation: AlertEvaluation; window: string }) {
  return [input.userId, input.instrumentId, input.evaluation.ruleId, input.evaluation.direction, input.window].join(":");
}

export function canReactivate(lastTriggeredAt: string | null, cooldownMinutes: number, now: Date) {
  if (!lastTriggeredAt) return true;
  return now.getTime() - Date.parse(lastTriggeredAt) >= cooldownMinutes * 60_000;
}
