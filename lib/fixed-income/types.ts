export type FixedIncomeInstrumentType =
  | "sovereign_bond"
  | "global_bond"
  | "cer_bond"
  | "dollar_linked_bond"
  | "lecap"
  | "letra"
  | "corporate_bond"
  | "provincial_bond"
  | "unknown";

export type FixedIncomeCurrency = "ARS" | "USD" | "USD_MEP" | "USD_CABLE" | "ARS_CER" | "ARS_DOLLAR_LINKED" | "UNKNOWN";

export type FixedIncomeLaw = "argentina" | "new_york" | "unknown";

export type AmortizationType = "bullet" | "amortizing" | "zero_coupon" | "unknown";

export type CouponType = "fixed" | "floating" | "zero" | "cer_adjusted" | "dollar_linked" | "unknown";

export type RiskTone = "low" | "medium" | "high" | "very_high";

export type SpeciesType = "peso" | "dollar_mep" | "dollar_cable" | "cer" | "unknown";
export type QuoteCurrency = "ARS" | "USD" | "UNKNOWN";
export type SettlementContext = "pesos" | "dollar_mep" | "dollar_cable" | "cer_linked" | "unknown";
export type IndexationType = "CER" | "none" | "unknown";

export type FixedIncomeInstrument = {
  symbol: string;
  underlyingSymbol: string;
  tradingSymbol: string;
  speciesType: SpeciesType;
  tradingCurrency: FixedIncomeCurrency;
  settlementCurrency: FixedIncomeCurrency;
  displayCurrency: FixedIncomeCurrency;
  quoteCurrency?: QuoteCurrency;
  settlementContext?: SettlementContext;
  indexationType?: IndexationType;
  marketDisplayPrice?: number;
  analyticalPrice?: number;
  marketConventionLabel: string;
  marketConventionLabelEn?: string;
  marketConventionLabelEs?: string;
  name: string;
  type: FixedIncomeInstrumentType;
  issuer: string;
  currency: FixedIncomeCurrency;
  law: FixedIncomeLaw;
  amortizationType: AmortizationType;
  couponType: CouponType;
  faceValue: number;
  marketPrice: number;
  cleanPrice?: number;
  dirtyPrice?: number;
  annualCouponRate: number;
  couponFrequency: number;
  issueDate?: string;
  settlementDate?: string;
  maturityDate: string;
  yearsToMaturity: number;
  accruedInterest?: number;
  cerCoefficient?: number;
  fxAdjustment?: number;
  sourceLabel: string;
  isMock: boolean;
};

export type FixedIncomeCashFlow = {
  period: number;
  date?: string;
  yearFraction: number;
  coupon: number;
  amortization: number;
  principal: number;
  totalCashFlow: number;
  discountFactor?: number | null;
  presentValue?: number | null;
};

export type AccruedInterestInputs = {
  faceValue: number;
  annualCouponRate: number;
  couponFrequency: number;
  daysSinceLastCoupon: number;
  daysInCouponPeriod: number;
};

export type FixedIncomeRiskProfile = {
  durationRisk: RiskTone;
  creditRisk: RiskTone;
  currencyRisk: RiskTone;
  liquidityRisk: RiskTone;
  inflationAdjustmentRisk?: RiskTone;
  legalRisk?: RiskTone;
  overallRisk: RiskTone;
  bulletPoints: string[];
};

export type FixedIncomeInterpretation = {
  label: string;
  tone: "positive" | "neutral" | "negative" | "warning";
  summary: string;
  bulletPoints: string[];
};

export type FixedIncomeAnalytics = {
  symbol: string;
  name: string;
  sourceLabel: string;
  isMock: boolean;
  instrument: FixedIncomeInstrument;
  cleanPrice: number | null;
  dirtyPrice: number | null;
  accruedInterest: number | null;
  currentYield: number | null;
  parity: number | null;
  estimatedYTM: number | null;
  macaulayDuration: number | null;
  modifiedDuration: number | null;
  convexity: number | null;
  cashFlows: FixedIncomeCashFlow[];
  risk: FixedIncomeRiskProfile;
  interpretation: FixedIncomeInterpretation;
  warnings?: string[];
};

export type BondComparisonItem = {
  symbol: string;
  underlyingSymbol: string;
  speciesType: SpeciesType;
  tradingCurrency: FixedIncomeCurrency;
  displayCurrency: FixedIncomeCurrency;
  quoteCurrency?: QuoteCurrency;
  settlementContext?: SettlementContext;
  indexationType?: IndexationType;
  name: string;
  price: number;
  analyticalPrice?: number;
  parity: number | null;
  estimatedYTM: number | null;
  duration: number | null;
  modifiedDuration: number | null;
  convexity: number | null;
  currency: FixedIncomeCurrency;
  law: FixedIncomeLaw;
  riskLevel: RiskTone;
};
