import type { MarketSignalResult } from "@/lib/analysis/market-signal";
import type { TechnicalIndicatorSnapshot } from "@/lib/analysis/types";
import type { FundamentalsResponse, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";

export type IntegratedOutlookMethod = "deterministic" | "openai_explained";

export type IntegratedOutlook = {
  title: string;
  summary: string;
  scenario: string;
  confirmation: string;
  risk: string;
  horizon: string;
  confidenceLabel: string;
  technicalEvidence: string[];
  fundamentalEvidence: string[];
  method: IntegratedOutlookMethod;
};

export type IntegratedOutlookInput = {
  symbol: string;
  language: "en" | "es";
  technicalScore: number | null;
  technicalSnapshot: TechnicalIndicatorSnapshot | null;
  fundamentals: FundamentalsResponse;
  marketSignal: MarketSignalResult;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatNumber(value: number, language: "en" | "es", maximumFractionDigits = 2) {
  return new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatPercent(value: number, language: "en" | "es") {
  return `${value >= 0 ? "+" : ""}${formatNumber(value * 100, language, 2)}%`;
}

function scoreText(score: number | null, language: "en" | "es") {
  return score === null ? (language === "es" ? "N/D" : "N/A") : `${Math.round(score)}/100`;
}

function localizedTrendLabel(label: string, language: "en" | "es") {
  if (language === "en") return label;
  const normalized = label.toLowerCase();
  if (normalized.includes("mixed")) return "Tendencia mixta";
  if (normalized.includes("bull") || normalized.includes("uptrend") || normalized.includes("constructive")) return "Tendencia alcista";
  if (normalized.includes("bear") || normalized.includes("downtrend") || normalized.includes("defensive")) return "Tendencia bajista";
  if (normalized.includes("neutral") || normalized.includes("sideways")) return "Tendencia neutral";
  return label;
}

function technicalEvidence(
  score: number | null,
  snapshot: TechnicalIndicatorSnapshot | null,
  language: "en" | "es",
) {
  const evidence: string[] = [];
  evidence.push(language === "es" ? `Score técnico: ${scoreText(score, language)}.` : `Technical score: ${scoreText(score, language)}.`);

  if (!snapshot) return evidence;
  if (snapshot.trendLabel) {
    evidence.push(language === "es" ? `${localizedTrendLabel(snapshot.trendLabel, language)}.` : `Trend: ${snapshot.trendLabel}.`);
  }
  if (isFiniteNumber(snapshot.rsi14)) {
    evidence.push(`RSI 14: ${formatNumber(snapshot.rsi14, language, 1)}.`);
  }
  if (isFiniteNumber(snapshot.lastClose) && isFiniteNumber(snapshot.sma200)) {
    const above = snapshot.lastClose >= snapshot.sma200;
    evidence.push(
      language === "es"
        ? `El precio está ${above ? "por encima" : "por debajo"} de la SMA 200.`
        : `Price is ${above ? "above" : "below"} the SMA 200.`,
    );
  }

  return evidence.slice(0, 3);
}

function fundamentalEvidence(fundamentals: FundamentalsResponse, language: "en" | "es") {
  const { snapshot } = fundamentals;
  const score = fundamentals.fundamentalScore ?? null;
  const evidence: string[] = [
    language === "es" ? `Score fundamental: ${scoreText(score, language)}.` : `Fundamental score: ${scoreText(score, language)}.`,
  ];

  if (isFiniteNumber(snapshot.trailingPE)) {
    evidence.push(`P/E: ${formatNumber(snapshot.trailingPE, language)}.`);
  } else if (isFiniteNumber(snapshot.forwardPE)) {
    evidence.push(language === "es" ? `P/E proyectado: ${formatNumber(snapshot.forwardPE, language)}.` : `Forward P/E: ${formatNumber(snapshot.forwardPE, language)}.`);
  } else if (isFiniteNumber(snapshot.priceToBook)) {
    evidence.push(`P/B: ${formatNumber(snapshot.priceToBook, language)}.`);
  }

  if (isFiniteNumber(snapshot.revenueGrowth)) {
    evidence.push(language === "es" ? `Crecimiento de ingresos: ${formatPercent(snapshot.revenueGrowth, language)}.` : `Revenue growth: ${formatPercent(snapshot.revenueGrowth, language)}.`);
  } else if (isFiniteNumber(snapshot.roe)) {
    evidence.push(`ROE: ${formatPercent(snapshot.roe, language)}.`);
  } else if (isFiniteNumber(snapshot.netMargin)) {
    evidence.push(language === "es" ? `Margen neto: ${formatPercent(snapshot.netMargin, language)}.` : `Net margin: ${formatPercent(snapshot.netMargin, language)}.`);
  }

  return evidence.slice(0, 3);
}

function buildScenario(
  marketSignal: MarketSignalResult,
  technicalScore: number | null,
  fundamentalScore: number | null,
  language: "en" | "es",
) {
  const bothAvailable = technicalScore !== null && fundamentalScore !== null;
  const constructive = marketSignal.tone === "constructive" || marketSignal.tone === "very_constructive";
  const defensive = marketSignal.tone === "defensive" || marketSignal.tone === "very_defensive";

  if (!bothAvailable) {
    return language === "es"
      ? "La lectura disponible es parcial. El escenario debe validarse con la capa que falta antes de proyectar continuidad o reversión."
      : "The available reading is partial. The missing layer must be validated before projecting continuation or reversal.";
  }
  if (constructive) {
    return language === "es"
      ? "El cruce entre tendencia y fundamentos configura un escenario favorable, condicionado a que el precio confirme la tendencia y los resultados sostengan la valuación observada."
      : "The combination of trend and fundamentals supports a favorable scenario, provided price confirms the trend and results sustain the observed valuation.";
  }
  if (defensive) {
    return language === "es"
      ? "El cruce de datos mantiene un escenario prudente: antes de asumir recuperación deben mejorar la estructura técnica o los indicadores fundamentales que hoy limitan la lectura."
      : "The data combination supports a cautious scenario: technical structure or limiting fundamental indicators must improve before assuming a recovery.";
  }
  return language === "es"
    ? "Las capas técnica y fundamental no muestran una ventaja dominante. El escenario más consistente es esperar una confirmación adicional antes de asignar dirección."
    : "Technical and fundamental layers do not show a dominant edge. The most consistent scenario is to wait for further confirmation before assigning direction.";
}

function buildConfirmation(snapshot: TechnicalIndicatorSnapshot | null, language: "en" | "es") {
  if (snapshot && isFiniteNumber(snapshot.resistance)) {
    return language === "es"
      ? `Confirmación a vigilar: sostener una ruptura sobre ${formatNumber(snapshot.resistance, language)} con volumen.`
      : `Confirmation to watch: hold a breakout above ${formatNumber(snapshot.resistance, language)} with volume.`;
  }
  return language === "es"
    ? "Confirmación a vigilar: mejora simultánea de tendencia, momentum y volumen."
    : "Confirmation to watch: simultaneous improvement in trend, momentum, and volume.";
}

function buildRisk(snapshot: TechnicalIndicatorSnapshot | null, fundamentals: FundamentalsSnapshot, language: "en" | "es") {
  if (snapshot && isFiniteNumber(snapshot.support)) {
    return language === "es"
      ? `Riesgo principal: pérdida del soporte cercano a ${formatNumber(snapshot.support, language)} o deterioro de los resultados reportados.`
      : `Main risk: a loss of support near ${formatNumber(snapshot.support, language)} or weaker reported results.`;
  }
  if (isFiniteNumber(fundamentals.debtToEquity) && fundamentals.debtToEquity > 2) {
    return language === "es"
      ? "Riesgo principal: apalancamiento elevado y sensibilidad a un deterioro de márgenes o flujo de caja."
      : "Main risk: elevated leverage and sensitivity to weaker margins or cash flow.";
  }
  return language === "es"
    ? "Riesgo principal: que el precio y los próximos resultados invaliden la lectura combinada actual."
    : "Main risk: price action and upcoming results invalidating the current combined reading.";
}

export function buildIntegratedOutlook(input: IntegratedOutlookInput): IntegratedOutlook {
  const fundamentalScore = input.fundamentals.fundamentalScore ?? null;
  const technical = scoreText(input.technicalScore, input.language);
  const fundamental = scoreText(fundamentalScore, input.language);

  return {
    title: input.language === "es" ? `Perspectiva integrada de ${input.symbol}` : `${input.symbol} integrated outlook`,
    summary: input.language === "es"
      ? `La lectura combina un score técnico de ${technical} con un score fundamental de ${fundamental}. El resultado integrado es ${input.marketSignal.label.toLowerCase()} y tiene confianza ${input.marketSignal.confidenceLabel.toLowerCase()}.`
      : `The reading combines a technical score of ${technical} with a fundamental score of ${fundamental}. The integrated result is ${input.marketSignal.label.toLowerCase()} with ${input.marketSignal.confidenceLabel.toLowerCase()} confidence.`,
    scenario: buildScenario(input.marketSignal, input.technicalScore, fundamentalScore, input.language),
    confirmation: buildConfirmation(input.technicalSnapshot, input.language),
    risk: buildRisk(input.technicalSnapshot, input.fundamentals.snapshot, input.language),
    horizon: input.language === "es"
      ? "Horizonte: técnico de corto/mediano plazo y fundamental de mediano/largo plazo."
      : "Horizon: short/medium-term technical and medium/long-term fundamental.",
    confidenceLabel: input.marketSignal.confidenceLabel,
    technicalEvidence: technicalEvidence(input.technicalScore, input.technicalSnapshot, input.language),
    fundamentalEvidence: fundamentalEvidence(input.fundamentals, input.language),
    method: "deterministic",
  };
}
