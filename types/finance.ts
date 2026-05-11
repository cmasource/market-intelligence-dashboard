export type FinancialNumber = number | null;

export type FundamentalInputs = {
  netIncome: number;
  equity: number;
  totalAssets: number;
  revenue: number;
  ebitda: number;
  sharesOutstanding: number;
  marketPrice: number;
  bookValue: number;
  dividendsPerShare?: number;
};

export type FundamentalRatios = {
  roe: FinancialNumber;
  roa: FinancialNumber;
  ebitdaMargin: FinancialNumber;
  eps: FinancialNumber;
  peRatio: FinancialNumber;
  bookValuePerShare: FinancialNumber;
  priceToBook: FinancialNumber;
  dividendYield?: FinancialNumber;
};

export type BondCashFlow = {
  period: number;
  date?: string;
  coupon: number;
  amortization: number;
  totalCashFlow: number;
  discountFactor?: FinancialNumber;
  presentValue?: FinancialNumber;
};

export type BondInputs = {
  faceValue: number;
  marketPrice: number;
  annualCouponRate: number;
  yearsToMaturity: number;
  paymentsPerYear: number;
  requiredYield?: number;
  settlementDate?: string;
  maturityDate?: string;
};

export type BondAnalytics = {
  annualCoupon: FinancialNumber;
  couponPerPeriod: FinancialNumber;
  totalPeriods: FinancialNumber;
  currentYield: FinancialNumber;
  parity: FinancialNumber;
  estimatedYTM: FinancialNumber;
  macaulayDuration: FinancialNumber;
  modifiedDuration: FinancialNumber;
  cashFlows: BondCashFlow[];
};

export type CAPMInputs = {
  riskFreeRate: number;
  marketReturn: number;
  beta: number;
};

export type CAPMResult = {
  expectedReturn: FinancialNumber;
  marketRiskPremium: FinancialNumber;
};

export type BetaInputs = {
  assetReturns: number[];
  marketReturns: number[];
};

export type TradeResultInputs = {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  buyCommissionRate: number;
  sellCommissionRate: number;
  dividendsReceived?: number;
  holdingDays?: number;
  taxes?: number;
};

export type TradeResult = {
  grossPurchaseAmount: FinancialNumber;
  grossSaleAmount: FinancialNumber;
  buyCommission: FinancialNumber;
  sellCommission: FinancialNumber;
  totalCost: FinancialNumber;
  netSaleProceeds: FinancialNumber;
  grossProfit: FinancialNumber;
  netProfit: FinancialNumber;
  totalReturn: FinancialNumber;
  annualizedReturn?: FinancialNumber;
};

export type TechnicalPricePoint = {
  date: string;
  open?: number;
  high?: number;
  low?: number;
  close: number;
  volume?: number;
};

export type MACDResult = {
  macdLine: FinancialNumber[];
  signalLine: FinancialNumber[];
  histogram: FinancialNumber[];
};

export type InterpretationTone = "positive" | "neutral" | "negative" | "warning";

export type InterpretationResult = {
  label: string;
  tone: InterpretationTone;
  description: string;
};
