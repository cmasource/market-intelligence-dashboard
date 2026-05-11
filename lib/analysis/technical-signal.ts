export type TechnicalSignalTone = "very_defensive" | "defensive" | "neutral" | "constructive" | "very_constructive";

type Language = "en" | "es";

function normalizeScore(score: number | null | undefined) {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  return Math.max(0, Math.min(100, score));
}

export function getTechnicalSignalTone(score: number | null | undefined): TechnicalSignalTone {
  const safeScore = normalizeScore(score);
  if (safeScore === null || safeScore <= 20) return "very_defensive";
  if (safeScore <= 40) return "defensive";
  if (safeScore <= 60) return "neutral";
  if (safeScore <= 80) return "constructive";
  return "very_constructive";
}

export function getTechnicalSignalLabel(score: number | null | undefined, language: Language = "en") {
  const tone = getTechnicalSignalTone(score);
  const labels: Record<TechnicalSignalTone, Record<Language, string>> = {
    very_defensive: { en: "Very defensive", es: "Muy defensivo" },
    defensive: { en: "Defensive", es: "Defensivo" },
    neutral: { en: "Neutral", es: "Neutral" },
    constructive: { en: "Constructive", es: "Constructivo" },
    very_constructive: { en: "Very constructive", es: "Muy constructivo" },
  };

  return labels[tone][language];
}

export function getTechnicalSignalDescription(score: number | null | undefined, language: Language = "en") {
  const tone = getTechnicalSignalTone(score);
  const descriptions: Record<TechnicalSignalTone, Record<Language, string>> = {
    very_defensive: {
      en: "The technical structure shows relevant weakness or insufficient data for a constructive reading.",
      es: "La estructura tecnica muestra debilidad relevante o datos insuficientes para una lectura constructiva.",
    },
    defensive: {
      en: "The technical bias is cautious, with mixed signals or downside pressure.",
      es: "El sesgo tecnico es prudente, con senales mixtas o presion bajista.",
    },
    neutral: {
      en: "The asset shows a balanced technical reading without a clear dominant signal.",
      es: "El activo muestra una lectura tecnica equilibrada, sin una senal dominante clara.",
    },
    constructive: {
      en: "The asset shows favorable technical signals, although risk and context should also be considered.",
      es: "El activo presenta senales tecnicas favorables, aunque deben evaluarse junto con riesgo y contexto.",
    },
    very_constructive: {
      en: "The asset shows a strong technical reading, with favorable momentum and trend according to available indicators.",
      es: "El activo presenta una lectura tecnica fuerte, con momentum y tendencia favorables segun los indicadores disponibles.",
    },
  };

  return descriptions[tone][language];
}
