import type { Language } from "./types";
import type { AmortizationType, CouponType, FixedIncomeCurrency, FixedIncomeLaw, RiskTone, SpeciesType } from "@/lib/fixed-income";
import type { AssetType, RiskLevel } from "@/types/asset";

type RiskLike = RiskTone | RiskLevel;

export function translateRiskLevel(riskLevel: RiskLike, language: Language = "en") {
  const labels: Record<Language, Record<RiskLike, string>> = {
    en: {
      low: "Low",
      medium: "Medium",
      high: "High",
      very_high: "Very high",
    },
    es: {
      low: "Bajo",
      medium: "Medio",
      high: "Alto",
      very_high: "Muy alto",
    },
  };

  return labels[language][riskLevel];
}

export function translateBondLaw(law: FixedIncomeLaw, language: Language = "en") {
  const labels: Record<Language, Record<FixedIncomeLaw, string>> = {
    en: {
      argentina: "Argentina law",
      new_york: "New York law",
      unknown: "Unknown law",
    },
    es: {
      argentina: "Ley argentina",
      new_york: "Ley de Nueva York",
      unknown: "Ley no identificada",
    },
  };

  return labels[language][law];
}

export function translateAssetType(assetType: AssetType, language: Language = "en") {
  const labels: Record<Language, Record<AssetType, string>> = {
    en: {
      stock: "Stock",
      etf: "ETF",
      cedear: "CEDEAR",
      argentine_equity: "Argentine equity",
      sovereign_bond: "Sovereign bond",
      cer_bond: "CER bond",
      corporate_bond: "Corporate bond",
      letra: "Letra",
      crypto: "Crypto",
      fx_reference: "FX reference",
      index: "Index",
    },
    es: {
      stock: "Accion",
      etf: "ETF",
      cedear: "CEDEAR",
      argentine_equity: "Accion argentina",
      sovereign_bond: "Bono soberano",
      cer_bond: "Bono CER",
      corporate_bond: "Bono corporativo",
      letra: "Letra",
      crypto: "Cripto",
      fx_reference: "Referencia FX",
      index: "Indice",
    },
  };

  return labels[language][assetType];
}

export function translateCouponType(couponType: CouponType, language: Language = "en") {
  const labels: Record<Language, Record<CouponType, string>> = {
    en: {
      fixed: "Fixed coupon",
      floating: "Floating coupon",
      zero: "Zero coupon",
      cer_adjusted: "CER-adjusted coupon",
      dollar_linked: "Dollar-linked coupon",
      unknown: "Unknown coupon",
    },
    es: {
      fixed: "Cupon fijo",
      floating: "Cupon variable",
      zero: "Cupon cero",
      cer_adjusted: "Cupon ajustado por CER",
      dollar_linked: "Cupon dollar-linked",
      unknown: "Cupon no identificado",
    },
  };

  return labels[language][couponType];
}

export function translateAmortizationType(amortizationType: AmortizationType, language: Language = "en") {
  const labels: Record<Language, Record<AmortizationType, string>> = {
    en: {
      bullet: "Bullet",
      amortizing: "Amortizing",
      zero_coupon: "Zero coupon",
      unknown: "Unknown amortization",
    },
    es: {
      bullet: "Bullet",
      amortizing: "Amortizable",
      zero_coupon: "Cupon cero",
      unknown: "Amortizacion no identificada",
    },
  };

  return labels[language][amortizationType];
}

export function translateSpeciesType(speciesType: SpeciesType, language: Language = "en") {
  const labels: Record<Language, Record<SpeciesType, string>> = {
    en: {
      peso: "Peso trading species",
      dollar_mep: "Dollar MEP species",
      dollar_cable: "Dollar cable/CCL species",
      cer: "CER-linked ARS bond",
      unknown: "Unknown species",
    },
    es: {
      peso: "Especie en pesos",
      dollar_mep: "Especie dolar MEP",
      dollar_cable: "Especie dolar cable/CCL",
      cer: "Bono CER en pesos",
      unknown: "Especie no identificada",
    },
  };

  return labels[language][speciesType];
}

export function translateTradingCurrency(currency: FixedIncomeCurrency, language: Language = "en") {
  if (currency === "ARS_CER") return language === "es" ? "ARS CER" : "ARS CER";
  if (currency === "ARS_DOLLAR_LINKED") return language === "es" ? "ARS dollar-linked" : "ARS dollar-linked";
  if (currency === "UNKNOWN") return language === "es" ? "No identificada" : "Unknown";
  return currency;
}

export function translateFixedIncomeCurrency(currency: FixedIncomeCurrency, language: Language = "en") {
  return translateTradingCurrency(currency, language);
}

export function translateProviderLabel(label: string, language: Language = "en") {
  if (label === "Mock fixed income data") {
    return language === "es" ? "Datos simulados de renta fija" : "Mock fixed income data";
  }

  return label;
}
