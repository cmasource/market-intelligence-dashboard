import type { Language } from "./types";

type Dictionary = Record<string, Record<Language, string>>;

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll(":", "")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ");
}

function translateFrom(dictionary: Dictionary, value: string | null | undefined, language: Language) {
  const key = normalize(value);
  return dictionary[key]?.[language] ?? value ?? (language === "es" ? "No disponible" : "Unavailable");
}

const trendLabels: Dictionary = {
  "constructive uptrend": { en: "constructive uptrend", es: "tendencia alcista constructiva" },
  "bullish trend": { en: "bullish trend", es: "tendencia alcista" },
  "above long term trend": { en: "above long-term trend", es: "por encima de la tendencia de largo plazo" },
  "neutral trend": { en: "neutral trend", es: "tendencia neutral" },
  "mixed trend": { en: "mixed trend", es: "tendencia mixta" },
  "trend confirmation": { en: "trend confirmation", es: "confirmacion de tendencia" },
  "bearish trend": { en: "bearish trend", es: "tendencia bajista" },
  "trend under pressure": { en: "trend under pressure", es: "tendencia bajo presion" },
  "trend unavailable": { en: "trend unavailable", es: "tendencia no disponible" },
  unavailable: { en: "unavailable", es: "no disponible" },
};

const momentumLabels: Dictionary = {
  "overbought momentum watch": { en: "overbought momentum watch", es: "momentum elevado con posible sobrecompra" },
  "positive momentum": { en: "positive momentum", es: "momentum positivo" },
  "positive crossover": { en: "positive crossover", es: "cruce positivo" },
  "healthy momentum": { en: "healthy momentum", es: "momentum saludable" },
  "neutral momentum": { en: "neutral momentum", es: "momentum neutral" },
  "mixed momentum": { en: "mixed momentum", es: "momentum mixto" },
  "negative momentum": { en: "negative momentum", es: "momentum negativo" },
  "oversold bounce watch": { en: "oversold bounce watch", es: "posible rebote desde zona de sobreventa" },
  "oversold momentum watch": { en: "oversold bounce watch", es: "posible rebote desde zona de sobreventa" },
  "momentum unavailable": { en: "momentum unavailable", es: "momentum no disponible" },
  unavailable: { en: "unavailable", es: "no disponible" },
};

const signalLabels: Dictionary = {
  "very defensive": { en: "Very defensive", es: "Muy defensivo" },
  defensive: { en: "Defensive", es: "Defensivo" },
  neutral: { en: "Neutral", es: "Neutral" },
  constructive: { en: "Constructive", es: "Constructivo" },
  "very constructive": { en: "Very constructive", es: "Muy constructivo" },
  unavailable: { en: "Unavailable", es: "No disponible" },
};

const confidenceLabels: Dictionary = {
  high: { en: "High", es: "Alta" },
  medium: { en: "Medium", es: "Media" },
  limited: { en: "Limited", es: "Limitada" },
  unavailable: { en: "Unavailable", es: "No disponible" },
};

const providerLabels: Dictionary = {
  "yahoo finance compatible data": { en: "Yahoo Finance compatible data", es: "datos compatibles con Yahoo Finance" },
  "yahoo compatible data": { en: "Yahoo-compatible data", es: "datos compatibles con Yahoo Finance" },
  "fmp provider": { en: "FMP provider", es: "proveedor FMP" },
  "fmp provider news": { en: "FMP provider news", es: "noticias del proveedor FMP" },
  "mock fallback": { en: "Mock fallback", es: "respaldo simulado" },
  "mock fallback price": { en: "Mock fallback price", es: "precio simulado de respaldo" },
  "provider price": { en: "Provider price", es: "precio de proveedor" },
  "provider price fmp": { en: "Provider price: FMP", es: "precio de proveedor: FMP" },
  "provider price yahoo compatible": { en: "Provider price: Yahoo-compatible", es: "precio de proveedor: Yahoo compatible" },
  unavailable: { en: "Unavailable", es: "No disponible" },
  "not applicable": { en: "Not applicable", es: "No aplicable" },
};

const dataSourceLabels: Dictionary = {
  "provider underlying / mock local cedear": {
    en: "provider underlying / mock local CEDEAR",
    es: "subyacente con datos de proveedor / CEDEAR local simulado",
  },
  "provider underlying": { en: "Provider underlying", es: "subyacente con proveedor" },
  "mock local cedear": { en: "Mock local CEDEAR", es: "CEDEAR local simulado" },
  "future coverage": { en: "Future coverage", es: "Cobertura futura" },
  "configured provider": { en: "Configured provider", es: "Proveedor configurado" },
  "actual provider": { en: "Actual provider", es: "Proveedor efectivo" },
  "plan restricted": { en: "Plan restricted", es: "Limitado por plan del proveedor" },
  "provider trace": { en: "Provider trace", es: "Trazabilidad de proveedor" },
};

const technicalConditions: Dictionary = {
  elevated: { en: "elevated", es: "elevado" },
  strong: { en: "strong", es: "fuerte" },
  favorable: { en: "favorable", es: "favorable" },
  mixed: { en: "mixed", es: "mixto" },
  weak: { en: "weak", es: "debil" },
  unavailable: { en: "unavailable", es: "no disponible" },
};

const fundamentalConditions: Dictionary = {
  demanding: { en: "demanding", es: "exigente" },
  moderate: { en: "moderate", es: "moderada" },
  balanced: { en: "balanced", es: "equilibrada" },
  solid: { en: "solid", es: "solida" },
  mixed: { en: "mixed", es: "mixta" },
  weak: { en: "weak", es: "debil" },
  unavailable: { en: "unavailable", es: "no disponible" },
};

const riskLabels: Dictionary = {
  low: { en: "low", es: "bajo" },
  medium: { en: "medium", es: "medio" },
  high: { en: "high", es: "alto" },
  "very high": { en: "very high", es: "muy alto" },
  very_high: { en: "very high", es: "muy alto" },
};

export function translateTrendLabel(value: string | null | undefined, language: Language) {
  return translateFrom(trendLabels, value, language);
}

export function translateMomentumLabel(value: string | null | undefined, language: Language) {
  return translateFrom(momentumLabels, value, language);
}

export function translateSignalLabel(value: string | null | undefined, language: Language) {
  return translateFrom(signalLabels, value, language);
}

export function translateConfidenceLabel(value: string | null | undefined, language: Language) {
  return translateFrom(confidenceLabels, value, language);
}

export function translateProviderLabel(value: string | null | undefined, language: Language) {
  return translateFrom(providerLabels, value, language);
}

export function translateDataSourceLabel(value: string | null | undefined, language: Language) {
  return translateFrom(dataSourceLabels, value, language);
}

export function translateTechnicalCondition(value: string | null | undefined, language: Language) {
  return translateFrom(technicalConditions, value, language);
}

export function translateFundamentalCondition(value: string | null | undefined, language: Language) {
  return translateFrom(fundamentalConditions, value, language);
}

export function translateRiskLabel(value: string | null | undefined, language: Language) {
  return translateFrom(riskLabels, value, language);
}
