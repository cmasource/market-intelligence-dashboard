export type MarketSignalTone =
  | "very_defensive"
  | "defensive"
  | "neutral"
  | "constructive"
  | "very_constructive"
  | "unavailable";

export type MarketSignalConfidence = "high" | "medium" | "limited" | "unavailable";

export type MarketSignalLanguage = "en" | "es";

export type MarketSignalInput = {
  technicalScore?: number | null;
  fundamentalScore?: number | null;
  fixedIncomeScore?: number | null;
  dataCoverage?: object;
  riskLevel?: string | null;
  assetType?: string | null;
  language?: MarketSignalLanguage;
};

export type MarketSignalResult = {
  score: number | null;
  label: string;
  tone: MarketSignalTone;
  confidence: MarketSignalConfidence;
  confidenceLabel: string;
  description: string;
  components: {
    technical?: number | null;
    fundamental?: number | null;
    fixedIncome?: number | null;
  };
  disclaimer: string;
};

function clampScore(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

function toneFromScore(score: number | null): MarketSignalTone {
  if (score === null) return "unavailable";
  if (score <= 20) return "very_defensive";
  if (score <= 40) return "defensive";
  if (score <= 60) return "neutral";
  if (score <= 80) return "constructive";
  return "very_constructive";
}

function labelForTone(tone: MarketSignalTone, language: MarketSignalLanguage) {
  const labels: Record<MarketSignalTone, Record<MarketSignalLanguage, string>> = {
    very_defensive: { en: "Very defensive", es: "Muy defensivo" },
    defensive: { en: "Defensive", es: "Defensivo" },
    neutral: { en: "Neutral", es: "Neutral" },
    constructive: { en: "Constructive", es: "Constructivo" },
    very_constructive: { en: "Very constructive", es: "Muy constructivo" },
    unavailable: { en: "Unavailable", es: "No disponible" },
  };

  return labels[tone][language];
}

function confidenceLabel(confidence: MarketSignalConfidence, language: MarketSignalLanguage) {
  const labels: Record<MarketSignalConfidence, Record<MarketSignalLanguage, string>> = {
    high: { en: "High", es: "Alta" },
    medium: { en: "Medium", es: "Media" },
    limited: { en: "Limited", es: "Limitada" },
    unavailable: { en: "Unavailable", es: "No disponible" },
  };

  return labels[confidence][language];
}

function descriptionForSignal(tone: MarketSignalTone, confidence: MarketSignalConfidence, language: MarketSignalLanguage) {
  if (tone === "unavailable") {
    return language === "es"
      ? "No hay datos suficientes para construir una lectura integrada del instrumento."
      : "There is not enough data to build an integrated reading for this instrument.";
  }

  const descriptions: Record<MarketSignalTone, Record<MarketSignalLanguage, string>> = {
    very_defensive: {
      en: "Available data points to a defensive market reading, with weak or incomplete signals.",
      es: "Los datos disponibles apuntan a una lectura defensiva, con senales debiles o incompletas.",
    },
    defensive: {
      en: "Available data suggests a cautious reading, with mixed signals or pressure in key components.",
      es: "Los datos disponibles sugieren una lectura prudente, con senales mixtas o presion en componentes clave.",
    },
    neutral: {
      en: "Available data is balanced and does not show a clear dominant market signal.",
      es: "Los datos disponibles estan equilibrados y no muestran una senal dominante clara.",
    },
    constructive: {
      en: "Available data is favorable overall, while still requiring risk and context review.",
      es: "Los datos disponibles son favorables en conjunto, aunque requieren revisar riesgo y contexto.",
    },
    very_constructive: {
      en: "Available data shows a strong integrated reading across the components currently available.",
      es: "Los datos disponibles muestran una lectura integrada fuerte en los componentes disponibles.",
    },
    unavailable: { en: "", es: "" },
  };

  const confidenceNote =
    confidence === "limited"
      ? language === "es"
        ? " La confianza es limitada porque falta una parte de la cobertura."
        : " Confidence is limited because part of the coverage is missing."
      : "";

  return `${descriptions[tone][language]}${confidenceNote}`;
}

function isFixedIncomeType(assetType: string | null | undefined) {
  return Boolean(assetType && (assetType.includes("bond") || assetType === "letra" || assetType === "lecap"));
}

export function calculateMarketSignalScore(input: MarketSignalInput): MarketSignalResult {
  const language = input.language ?? "en";
  const technical = clampScore(input.technicalScore);
  const fundamental = clampScore(input.fundamentalScore);
  const fixedIncome = clampScore(input.fixedIncomeScore);
  const assetType = input.assetType ?? "";
  const isCrypto = assetType === "crypto";
  const isFixedIncome = isFixedIncomeType(assetType);

  let score: number | null = null;
  let confidence: MarketSignalConfidence = "unavailable";

  if (isFixedIncome) {
    if (fixedIncome !== null) {
      score = fixedIncome;
      confidence = technical !== null ? "medium" : "limited";
    } else if (technical !== null) {
      score = technical;
      confidence = "limited";
    }
  } else if (isCrypto) {
    if (technical !== null) {
      score = technical;
      confidence = "medium";
    }
  } else if (technical !== null && fundamental !== null) {
    score = technical * 0.55 + fundamental * 0.45;
    confidence = "high";
  } else if (technical !== null) {
    score = technical;
    confidence = "limited";
  } else if (fundamental !== null) {
    score = fundamental;
    confidence = "limited";
  }

  const roundedScore = score === null ? null : Math.round(score);
  const tone = toneFromScore(roundedScore);

  return {
    score: roundedScore,
    label: labelForTone(tone, language),
    tone,
    confidence,
    confidenceLabel: confidenceLabel(confidence, language),
    description: descriptionForSignal(tone, confidence, language),
    components: {
      technical,
      fundamental,
      fixedIncome,
    },
    disclaimer:
      language === "es"
        ? "Senal informativa basada en los datos disponibles. No constituye recomendacion de inversion."
        : "Informational signal based on available data. Not an investment recommendation.",
  };
}
