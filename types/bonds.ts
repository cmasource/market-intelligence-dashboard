export type BondMetrics = {
  tir: number;
  duration: number;
  modifiedDuration: number;
  parity: number;
  coupon: number;
  maturityDate: string;
  currency: string;
  quoteCurrency?: string;
  settlementContext?: string;
  indexationType?: string;
  marketDisplayPrice?: number;
  analyticalPrice?: number;
  law: string;
  interpretation: string;
};
