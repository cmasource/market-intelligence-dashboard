import type { Asset } from "@/types/asset";
import type { CedearAnalytics } from "@/lib/cedears";
import type { FixedIncomeAnalytics } from "@/lib/fixed-income";
import type { IntelligenceLanguage, RiskSummary } from "./types";

function byLanguage<T>(language: IntelligenceLanguage, en: T, es: T) {
  return language === "es" ? es : en;
}

export function buildRiskSummary({
  asset,
  cedear,
  fixedIncome,
  language,
}: {
  asset?: Asset | null;
  cedear?: CedearAnalytics | null;
  fixedIncome?: FixedIncomeAnalytics | null;
  language: IntelligenceLanguage;
}): RiskSummary {
  const type = asset?.type ?? fixedIncome?.instrument.type ?? "unknown";
  const risks = new Set<string>();
  const notes = new Set<string>();

  if (type === "crypto") {
    [
      byLanguage(language, "High volatility", "Alta volatilidad"),
      byLanguage(language, "Liquidity shifts", "Cambios de liquidez"),
      byLanguage(language, "Regulatory risk", "Riesgo regulatorio"),
      byLanguage(language, "Sentiment-driven moves", "Movimientos guiados por sentimiento"),
    ].forEach((item) => risks.add(item));
  } else if (type === "etf") {
    [
      byLanguage(language, "Market beta", "Beta de mercado"),
      byLanguage(language, "Sector concentration", "Concentracion sectorial"),
      byLanguage(language, "Macro sensitivity", "Sensibilidad macro"),
    ].forEach((item) => risks.add(item));
  } else if (type.includes("bond") || type === "letra") {
    [
      byLanguage(language, "Sovereign risk", "Riesgo soberano"),
      byLanguage(language, "Duration risk", "Riesgo de duration"),
      byLanguage(language, "FX sensitivity", "Sensibilidad cambiaria"),
      byLanguage(language, "Liquidity risk", "Riesgo de liquidez"),
      byLanguage(language, "Restructuring risk", "Riesgo de reestructuracion"),
      byLanguage(language, "Mock local data limitation", "Limitacion por datos locales simulados"),
    ].forEach((item) => risks.add(item));
  } else if (asset?.argentinaContext) {
    [
      byLanguage(language, "Local macro risk", "Riesgo macro local"),
      byLanguage(language, "FX risk", "Riesgo cambiario"),
      byLanguage(language, "Liquidity risk", "Riesgo de liquidez"),
      byLanguage(language, "Regulation risk", "Riesgo regulatorio"),
    ].forEach((item) => risks.add(item));
  } else {
    [
      byLanguage(language, "Valuation risk", "Riesgo de valuacion"),
      byLanguage(language, "Earnings risk", "Riesgo de resultados"),
      byLanguage(language, "Sector concentration", "Concentracion sectorial"),
      byLanguage(language, "Rate sensitivity", "Sensibilidad a tasas"),
      byLanguage(language, "Market volatility", "Volatilidad de mercado"),
    ].forEach((item) => risks.add(item));
  }

  if (cedear) {
    [
      byLanguage(language, "Underlying asset risk", "Riesgo del subyacente"),
      byLanguage(language, "CCL/FX risk", "Riesgo CCL/cambiario"),
      byLanguage(language, "Local liquidity risk", "Riesgo de liquidez local"),
      byLanguage(language, "Ratio and local data limitation", "Limitacion de ratio y datos locales"),
    ].forEach((item) => risks.add(item));
    notes.add(
      byLanguage(
        language,
        "CEDEAR local price and ratio are mock until local market integration is enabled.",
        "El precio local CEDEAR y el ratio son simulados hasta integrar mercado local.",
      ),
    );
  }

  if (fixedIncome?.warnings?.length) {
    notes.add(
      byLanguage(
        language,
        "Fixed income analytics use structured mock data for local instruments.",
        "La analitica de renta fija usa datos estructurados simulados para instrumentos locales.",
      ),
    );
  }

  return {
    level: asset?.riskLevel ?? fixedIncome?.risk.overallRisk ?? "medium",
    keyRisks: Array.from(risks).slice(0, 6),
    riskNotes: Array.from(notes),
  };
}
