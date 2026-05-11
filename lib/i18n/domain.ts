import type { AssetType, MarketOverviewItem, RiskLevel } from "@/types/asset";
import type { TechnicalSignal } from "@/types/technical";
import type { Language } from "./types";
import { translateAssetType, translateRiskLevel } from "./display-labels";

type Translate = (key: string, params?: Record<string, string | number>) => string;

export function getAssetTypeLabel(type: AssetType, t: Translate) {
  const keys: Record<AssetType, string> = {
    stock: "assetTypeStock",
    etf: "assetTypeEtf",
    cedear: "assetTypeCedear",
    argentine_equity: "assetTypeArgentineEquity",
    sovereign_bond: "assetTypeSovereignBond",
    cer_bond: "assetTypeCerBond",
    corporate_bond: "assetTypeCorporateBond",
    letra: "assetTypeLetra",
    crypto: "assetTypeCrypto",
    fx_reference: "assetTypeFxReference",
    index: "assetTypeIndex",
  };

  return t(keys[type]);
}

export function getRiskLabel(riskLevel: RiskLevel, t: Translate) {
  const keys: Record<RiskLevel, string> = {
    low: "riskLow",
    medium: "riskMedium",
    high: "riskHigh",
    very_high: "riskVeryHigh",
  };

  return t(keys[riskLevel]);
}

export function getAssetTypeDisplayLabel(type: AssetType, language: Language) {
  return translateAssetType(type, language);
}

export function getRiskDisplayLabel(riskLevel: RiskLevel, language: Language) {
  return translateRiskLevel(riskLevel, language);
}

export function getTrendLabel(trend: MarketOverviewItem["trend"], t: Translate) {
  const keys: Record<MarketOverviewItem["trend"], string> = {
    up: "trendUp",
    down: "trendDown",
    flat: "trendFlat",
  };

  return t(keys[trend]);
}

export function getTechnicalSignalLabel(signal: TechnicalSignal, t: Translate) {
  const keys: Record<TechnicalSignal, string> = {
    "Bullish momentum": "signalBullishMomentum",
    "Neutral consolidation": "signalNeutralConsolidation",
    "Possible support test": "signalPossibleSupportTest",
    "High volatility": "signalHighVolatility",
    "Trend confirmation": "signalTrendConfirmation",
    "Breakout watch": "signalBreakoutWatch",
  };

  return t(keys[signal]);
}

export function getTechnicalInterpretationText(score: number, t: Translate) {
  if (score >= 80) return t("technicalInterpretationStrong");
  if (score >= 65) return t("technicalInterpretationConstructive");
  if (score >= 45) return t("technicalInterpretationNeutral");
  if (score >= 30) return t("technicalInterpretationWeak");
  return t("technicalInterpretationDefensive");
}

export function getFundamentalInterpretationText(score: number | undefined, t: Translate) {
  if (score === undefined) return t("fundamentalInterpretationUnavailable");
  if (score >= 75) return t("fundamentalInterpretationStrong");
  if (score >= 55) return t("fundamentalInterpretationMixed");
  return t("fundamentalInterpretationWeak");
}
