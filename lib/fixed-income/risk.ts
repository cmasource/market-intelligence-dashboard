import type { FixedIncomeAnalytics, FixedIncomeInstrument, FixedIncomeInterpretation, FixedIncomeRiskProfile, RiskTone } from "./types";

function maxRisk(...risks: RiskTone[]): RiskTone {
  const rank: Record<RiskTone, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
  return risks.reduce((highest, risk) => (rank[risk] > rank[highest] ? risk : highest), "low" as RiskTone);
}

function getDurationRisk(modifiedDuration: number | null): RiskTone {
  if (modifiedDuration === null) return "medium";
  if (modifiedDuration >= 5) return "very_high";
  if (modifiedDuration >= 3) return "high";
  if (modifiedDuration >= 1.5) return "medium";
  return "low";
}

function getCurrencyRisk(instrument: FixedIncomeInstrument): RiskTone {
  if (instrument.indexationType === "CER" || instrument.currency === "ARS_CER" || instrument.currency === "ARS_DOLLAR_LINKED") return "high";
  if (instrument.currency === "USD") return "medium";
  if (instrument.currency === "ARS") return "high";
  return "medium";
}

export function buildFixedIncomeRiskProfile(
  instrument: FixedIncomeInstrument,
  analytics: Pick<FixedIncomeAnalytics, "modifiedDuration" | "estimatedYTM">,
): FixedIncomeRiskProfile {
  const durationRisk = getDurationRisk(analytics.modifiedDuration);
  const creditRisk: RiskTone =
    instrument.type === "sovereign_bond" || instrument.type === "global_bond" || instrument.type === "cer_bond"
      ? "very_high"
      : "medium";
  const currencyRisk = getCurrencyRisk(instrument);
  const liquidityRisk: RiskTone = instrument.symbol === "TX26" ? "medium" : "high";
  const legalRisk: RiskTone = instrument.law === "new_york" ? "medium" : "high";
  const inflationAdjustmentRisk: RiskTone | undefined =
    instrument.indexationType === "CER" || instrument.currency === "ARS_CER" ? "high" : undefined;
  const overallRisk = maxRisk(durationRisk, creditRisk, currencyRisk, liquidityRisk, legalRisk, inflationAdjustmentRisk ?? "low");

  return {
    durationRisk,
    creditRisk,
    currencyRisk,
    liquidityRisk,
    ...(inflationAdjustmentRisk ? { inflationAdjustmentRisk } : {}),
    legalRisk,
    overallRisk,
    bulletPoints: [
      "Los instrumentos soberanos argentinos se evalúan con un criterio conservador.",
      "La duration aproxima la sensibilidad del precio frente a cambios de tasa.",
      "El riesgo soberano, cambiario y de liquidez sigue siendo relevante.",
    ],
  };
}

export function buildFixedIncomeInterpretation(
  instrument: FixedIncomeInstrument,
  analytics: Pick<FixedIncomeAnalytics, "estimatedYTM" | "modifiedDuration" | "parity" | "risk">,
): FixedIncomeInterpretation {
  const elevatedYield = typeof analytics.estimatedYTM === "number" && analytics.estimatedYTM > 0.12;
  const highDuration = typeof analytics.modifiedDuration === "number" && analytics.modifiedDuration > 3;
  const belowPar = typeof analytics.parity === "number" && analytics.parity < 0.9;
  const cerContext = instrument.type === "cer_bond";

  return {
    label: cerContext ? "Inflation-linked fixed income analysis" : "High-risk sovereign fixed income analysis",
    tone: analytics.risk.overallRisk === "very_high" ? "warning" : "neutral",
    summary: cerContext
      ? "This CER-linked instrument is modeled with simplified inflation adjustment and remains exposed to local curve, liquidity and indexation risks."
      : "El rendimiento estimado debe evaluarse junto con el riesgo soberano, cambiario y de liquidez.",
    bulletPoints: [
      elevatedYield
        ? "Estimated yield is elevated, which can reflect both carry and credit-risk compensation."
        : "La TIR estimada debe leerse junto con el precio y los flujos contractuales disponibles.",
      highDuration
        ? "Modified duration indicates meaningful sensitivity to rate and spread changes."
        : "Duration sensitivity is present but contained under the current simplified assumptions.",
      belowPar
        ? "Price below par can increase estimated yield, but it also reflects market risk assumptions."
        : "Parity context should be compared with similar instruments before drawing conclusions.",
    ],
  };
}
