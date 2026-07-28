import type { MarketSignalConfidence, MarketSignalTone } from "./market-signal";

export type ScoreLanguage = "en" | "es";
export type ScoreTone = "positive" | "neutral" | "warning" | "negative" | "unavailable";
export type ActionLabel = "strong_buy" | "buy" | "wait" | "sell" | "strong_sell" | "unavailable";
export type ResearchPriority = "advance" | "watchlist" | "needs_trigger" | "deprioritize" | "unavailable";

export type ScoreSemantic = {
  score: number | null;
  tone: ScoreTone;
  action: ActionLabel;
  actionLabel: string;
  researchPriority: ResearchPriority;
  researchPriorityLabel: string;
  confidenceLabel: string;
  summary: string;
};

function clampScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function actionFromScore(score: number | null): ActionLabel {
  if (score === null) return "unavailable";
  if (score >= 82) return "strong_buy";
  if (score >= 65) return "buy";
  if (score <= 18) return "strong_sell";
  if (score <= 35) return "sell";
  return "wait";
}

function priorityFromScore(score: number | null, confidence: MarketSignalConfidence): ResearchPriority {
  if (score === null) return "unavailable";
  if (confidence === "unavailable") return "unavailable";
  if (score >= 70 && confidence !== "limited") return "advance";
  if (score >= 55) return "watchlist";
  if (score >= 40) return "needs_trigger";
  return "deprioritize";
}

function toneFromAction(action: ActionLabel): ScoreTone {
  if (action === "strong_buy" || action === "buy") return "positive";
  if (action === "strong_sell" || action === "sell") return "negative";
  if (action === "wait") return "warning";
  return "unavailable";
}

function label<T extends string>(key: T, language: ScoreLanguage, labels: Record<T, Record<ScoreLanguage, string>>) {
  return labels[key][language];
}

export function buildScoreSemantic(params: {
  score?: number | null;
  confidence?: MarketSignalConfidence;
  language?: ScoreLanguage;
}): ScoreSemantic {
  const language = params.language ?? "es";
  const confidence = params.confidence ?? "medium";
  const score = clampScore(params.score);
  const action = actionFromScore(score);
  const researchPriority = priorityFromScore(score, confidence);
  const tone = toneFromAction(action);

  const actionLabels: Record<ActionLabel, Record<ScoreLanguage, string>> = {
    strong_buy: { es: "Compra fuerte", en: "Strong buy" },
    buy: { es: "Compra", en: "Buy" },
    wait: { es: "Esperar", en: "Wait" },
    sell: { es: "Venta", en: "Sell" },
    strong_sell: { es: "Venta fuerte", en: "Strong sell" },
    unavailable: { es: "Sin lectura", en: "No reading" },
  };

  const priorityLabels: Record<ResearchPriority, Record<ScoreLanguage, string>> = {
    advance: { es: "Avanzar research", en: "Advance research" },
    watchlist: { es: "Mantener en seguimiento", en: "Keep on watchlist" },
    needs_trigger: { es: "Esperar disparador", en: "Wait for trigger" },
    deprioritize: { es: "Baja prioridad", en: "Low priority" },
    unavailable: { es: "Sin prioridad", en: "No priority" },
  };

  const confidenceLabels: Record<MarketSignalConfidence, Record<ScoreLanguage, string>> = {
    high: { es: "Confianza alta", en: "High confidence" },
    medium: { es: "Confianza media", en: "Medium confidence" },
    limited: { es: "Confianza limitada", en: "Limited confidence" },
    unavailable: { es: "Confianza no disponible", en: "Confidence unavailable" },
  };

  const summary =
    language === "es"
      ? score === null
        ? "No hay datos suficientes para publicar una lectura accionable."
        : `Lectura ${label(action, language, actionLabels).toLowerCase()} con ${label(researchPriority, language, priorityLabels).toLowerCase()}.`
      : score === null
        ? "There is not enough data to publish an actionable reading."
        : `${label(action, language, actionLabels)} reading with ${label(researchPriority, language, priorityLabels).toLowerCase()}.`;

  return {
    score,
    tone,
    action,
    actionLabel: label(action, language, actionLabels),
    researchPriority,
    researchPriorityLabel: label(researchPriority, language, priorityLabels),
    confidenceLabel: label(confidence, language, confidenceLabels),
    summary,
  };
}

export function scoreToneClass(tone: ScoreTone) {
  if (tone === "positive") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (tone === "negative") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  if (tone === "warning") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (tone === "neutral") return "border-slate-300/20 bg-slate-300/10 text-slate-100";
  return "border-white/10 bg-white/[0.035] text-slate-300";
}

export function marketToneToScoreTone(tone: MarketSignalTone): ScoreTone {
  if (tone === "constructive" || tone === "very_constructive") return "positive";
  if (tone === "defensive" || tone === "very_defensive") return "negative";
  if (tone === "neutral") return "neutral";
  return "unavailable";
}
