import type { FixedIncomeCashFlow } from "./types";

export function calculateConvexity(
  cashFlows: FixedIncomeCashFlow[],
  annualYield: number,
  marketPrice: number,
  paymentsPerYear: number,
) {
  if (cashFlows.length === 0 || marketPrice <= 0 || paymentsPerYear <= 0 || !Number.isFinite(annualYield)) {
    return null;
  }

  if (annualYield <= -1) return null;

  const weightedCashFlows = cashFlows.reduce((total, cashFlow) => {
    const presentValue = cashFlow.totalCashFlow / (1 + annualYield) ** cashFlow.yearFraction;
    return total + presentValue * cashFlow.yearFraction * (cashFlow.yearFraction + 1);
  }, 0);

  // Convexidad aproxima la curvatura de sensibilidad precio/tasa. Es una version MVP.
  return weightedCashFlows / (marketPrice * (1 + annualYield) ** 2);
}
