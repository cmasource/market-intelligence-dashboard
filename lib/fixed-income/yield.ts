import type { FixedIncomeCashFlow } from "./types";

function calculatePriceFromYield(cashFlows: FixedIncomeCashFlow[], annualYield: number) {
  return cashFlows.reduce((total, cashFlow) => {
    if (annualYield <= -1) return total;
    return total + cashFlow.totalCashFlow / (1 + annualYield) ** cashFlow.yearFraction;
  }, 0);
}

export function estimateFixedIncomeYTM(
  cashFlows: FixedIncomeCashFlow[],
  marketPrice: number,
  paymentsPerYear: number,
) {
  if (cashFlows.length === 0 || marketPrice <= 0 || paymentsPerYear <= 0) return null;

  let low = -0.95;
  let high = 1;
  let lowDifference = calculatePriceFromYield(cashFlows, low) - marketPrice;
  let highDifference = calculatePriceFromYield(cashFlows, high) - marketPrice;
  let expansionCount = 0;

  while (lowDifference * highDifference > 0 && expansionCount < 20) {
    high *= 2;
    highDifference = calculatePriceFromYield(cashFlows, high) - marketPrice;
    expansionCount += 1;
  }

  if (lowDifference * highDifference > 0) return null;

  // TIR/YTM es la tasa anual que iguala el valor presente de los flujos al precio de mercado.
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointDifference = calculatePriceFromYield(cashFlows, midpoint) - marketPrice;

    if (Math.abs(midpointDifference) < 0.000001) return midpoint;

    if (lowDifference * midpointDifference > 0) {
      low = midpoint;
      lowDifference = midpointDifference;
    } else {
      high = midpoint;
    }
  }

  return (low + high) / 2;
}

export function calculatePresentValueForCashFlows(
  cashFlows: FixedIncomeCashFlow[],
  annualYield: number,
  paymentsPerYear: number,
): FixedIncomeCashFlow[] {
  if (paymentsPerYear <= 0 || !Number.isFinite(annualYield)) return cashFlows;

  return cashFlows.map((cashFlow) => {
    if (annualYield <= -1) {
      return { ...cashFlow, discountFactor: null, presentValue: null };
    }

    const discountFactor = 1 / (1 + annualYield) ** cashFlow.yearFraction;
    return {
      ...cashFlow,
      discountFactor,
      presentValue: cashFlow.totalCashFlow * discountFactor,
    };
  });
}
