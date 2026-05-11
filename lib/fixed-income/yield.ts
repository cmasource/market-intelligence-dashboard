import type { FixedIncomeCashFlow } from "./types";

function calculatePriceFromYield(cashFlows: FixedIncomeCashFlow[], annualYield: number, paymentsPerYear: number) {
  const ratePerPeriod = annualYield / paymentsPerYear;

  return cashFlows.reduce((total, cashFlow) => {
    if (ratePerPeriod <= -1) return total;
    return total + cashFlow.totalCashFlow / (1 + ratePerPeriod) ** cashFlow.period;
  }, 0);
}

export function estimateFixedIncomeYTM(
  cashFlows: FixedIncomeCashFlow[],
  marketPrice: number,
  paymentsPerYear: number,
) {
  if (cashFlows.length === 0 || marketPrice <= 0 || paymentsPerYear <= 0) return null;

  let low = -0.95 * paymentsPerYear;
  let high = 1;
  let lowDifference = calculatePriceFromYield(cashFlows, low, paymentsPerYear) - marketPrice;
  let highDifference = calculatePriceFromYield(cashFlows, high, paymentsPerYear) - marketPrice;
  let expansionCount = 0;

  while (lowDifference * highDifference > 0 && expansionCount < 20) {
    high *= 2;
    highDifference = calculatePriceFromYield(cashFlows, high, paymentsPerYear) - marketPrice;
    expansionCount += 1;
  }

  if (lowDifference * highDifference > 0) return null;

  // TIR/YTM es la tasa anual que iguala el valor presente de los flujos al precio de mercado.
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointDifference = calculatePriceFromYield(cashFlows, midpoint, paymentsPerYear) - marketPrice;

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

  const ratePerPeriod = annualYield / paymentsPerYear;

  return cashFlows.map((cashFlow) => {
    if (ratePerPeriod <= -1) {
      return { ...cashFlow, discountFactor: null, presentValue: null };
    }

    const discountFactor = 1 / (1 + ratePerPeriod) ** cashFlow.period;
    return {
      ...cashFlow,
      discountFactor,
      presentValue: cashFlow.totalCashFlow * discountFactor,
    };
  });
}
