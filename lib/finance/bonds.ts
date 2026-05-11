import type { BondAnalytics, BondCashFlow, BondInputs } from "@/types/finance";

function isValidNumber(value: number) {
  return Number.isFinite(value);
}

function safeDivide(numerator: number, denominator: number) {
  if (!isValidNumber(numerator) || !isValidNumber(denominator) || denominator === 0) {
    return null;
  }

  return numerator / denominator;
}

export function calculateAnnualCoupon(faceValue: number, annualCouponRate: number) {
  if (!isValidNumber(faceValue) || !isValidNumber(annualCouponRate)) return null;
  return faceValue * annualCouponRate;
}

export function calculateCouponPerPeriod(faceValue: number, annualCouponRate: number, paymentsPerYear: number) {
  const annualCoupon = calculateAnnualCoupon(faceValue, annualCouponRate);
  if (annualCoupon === null) return null;
  return safeDivide(annualCoupon, paymentsPerYear);
}

export function calculateTotalPeriods(yearsToMaturity: number, paymentsPerYear: number) {
  if (!isValidNumber(yearsToMaturity) || !isValidNumber(paymentsPerYear) || yearsToMaturity <= 0 || paymentsPerYear <= 0) {
    return null;
  }

  return Math.round(yearsToMaturity * paymentsPerYear);
}

export function calculateCurrentYield(annualCoupon: number | null, marketPrice: number) {
  if (annualCoupon === null) return null;
  return safeDivide(annualCoupon, marketPrice);
}

// La paridad compara el precio de mercado contra el valor nominal del bono.
export function calculateParity(marketPrice: number, faceValue: number) {
  return safeDivide(marketPrice, faceValue);
}

export function buildBondCashFlows(inputs: BondInputs): BondCashFlow[] {
  const totalPeriods = calculateTotalPeriods(inputs.yearsToMaturity, inputs.paymentsPerYear);
  const couponPerPeriod = calculateCouponPerPeriod(inputs.faceValue, inputs.annualCouponRate, inputs.paymentsPerYear);

  if (totalPeriods === null || couponPerPeriod === null || totalPeriods <= 0) return [];

  return Array.from({ length: totalPeriods }, (_, index) => {
    const period = index + 1;
    const amortization = period === totalPeriods ? inputs.faceValue : 0;

    return {
      period,
      ...(period === totalPeriods && inputs.maturityDate ? { date: inputs.maturityDate } : {}),
      coupon: couponPerPeriod,
      amortization,
      totalCashFlow: couponPerPeriod + amortization,
    };
  });
}

export function calculatePresentValue(cashFlow: number, ratePerPeriod: number, period: number) {
  if (!isValidNumber(cashFlow) || !isValidNumber(ratePerPeriod) || !isValidNumber(period) || period <= 0 || ratePerPeriod <= -1) {
    return null;
  }

  return cashFlow / (1 + ratePerPeriod) ** period;
}

function calculatePriceFromYield(cashFlows: BondCashFlow[], annualYield: number, paymentsPerYear: number) {
  const ratePerPeriod = annualYield / paymentsPerYear;

  return cashFlows.reduce((total, cashFlow) => {
    const presentValue = calculatePresentValue(cashFlow.totalCashFlow, ratePerPeriod, cashFlow.period);
    return presentValue === null ? total : total + presentValue;
  }, 0);
}

// TIR/YTM es la tasa anual que iguala el valor presente de los flujos al precio de mercado.
export function estimateYTM(inputs: BondInputs) {
  const cashFlows = buildBondCashFlows(inputs);

  if (cashFlows.length === 0 || inputs.marketPrice <= 0 || inputs.paymentsPerYear <= 0) return null;

  let low = -0.95 * inputs.paymentsPerYear;
  let high = 1;
  let lowDifference = calculatePriceFromYield(cashFlows, low, inputs.paymentsPerYear) - inputs.marketPrice;
  let highDifference = calculatePriceFromYield(cashFlows, high, inputs.paymentsPerYear) - inputs.marketPrice;
  let expansionCount = 0;

  while (lowDifference * highDifference > 0 && expansionCount < 20) {
    high *= 2;
    highDifference = calculatePriceFromYield(cashFlows, high, inputs.paymentsPerYear) - inputs.marketPrice;
    expansionCount += 1;
  }

  if (lowDifference * highDifference > 0) return null;

  for (let iteration = 0; iteration < 100; iteration += 1) {
    const midpoint = (low + high) / 2;
    const midpointDifference = calculatePriceFromYield(cashFlows, midpoint, inputs.paymentsPerYear) - inputs.marketPrice;

    if (Math.abs(midpointDifference) < 0.000001) {
      return midpoint;
    }

    if (lowDifference * midpointDifference > 0) {
      low = midpoint;
      lowDifference = midpointDifference;
    } else {
      high = midpoint;
    }
  }

  return (low + high) / 2;
}

// Duration mide el plazo promedio ponderado de recupero de los flujos descontados.
export function calculateMacaulayDuration(inputs: BondInputs, annualYield: number) {
  const cashFlows = buildBondCashFlows(inputs);

  if (cashFlows.length === 0 || !isValidNumber(annualYield) || inputs.paymentsPerYear <= 0) return null;

  const ratePerPeriod = annualYield / inputs.paymentsPerYear;
  let presentValueTotal = 0;
  let weightedTimeTotal = 0;

  for (const cashFlow of cashFlows) {
    const presentValue = calculatePresentValue(cashFlow.totalCashFlow, ratePerPeriod, cashFlow.period);

    if (presentValue === null) return null;

    const timeInYears = cashFlow.period / inputs.paymentsPerYear;
    presentValueTotal += presentValue;
    weightedTimeTotal += timeInYears * presentValue;
  }

  return safeDivide(weightedTimeTotal, presentValueTotal);
}

// Duration modificada aproxima la sensibilidad del precio ante cambios en la tasa.
export function calculateModifiedDuration(macaulayDuration: number | null, annualYield: number, paymentsPerYear: number) {
  if (macaulayDuration === null || paymentsPerYear <= 0) return null;
  return safeDivide(macaulayDuration, 1 + annualYield / paymentsPerYear);
}

export function calculateBondAnalytics(inputs: BondInputs): BondAnalytics {
  // Supuestos actuales: bono bullet, cupon constante, sin interes corrido, sin ajuste CER,
  // sin amortizaciones parciales y sin precision por fecha de settlement.
  const annualCoupon = calculateAnnualCoupon(inputs.faceValue, inputs.annualCouponRate);
  const couponPerPeriod = calculateCouponPerPeriod(inputs.faceValue, inputs.annualCouponRate, inputs.paymentsPerYear);
  const totalPeriods = calculateTotalPeriods(inputs.yearsToMaturity, inputs.paymentsPerYear);
  const estimatedYTM = inputs.requiredYield ?? estimateYTM(inputs);
  const macaulayDuration =
    estimatedYTM === null ? null : calculateMacaulayDuration(inputs, estimatedYTM);
  const modifiedDuration =
    estimatedYTM === null ? null : calculateModifiedDuration(macaulayDuration, estimatedYTM, inputs.paymentsPerYear);
  const cashFlows = buildBondCashFlows(inputs);
  const ratePerPeriod = estimatedYTM === null ? null : estimatedYTM / inputs.paymentsPerYear;

  return {
    annualCoupon,
    couponPerPeriod,
    totalPeriods,
    currentYield: calculateCurrentYield(annualCoupon, inputs.marketPrice),
    parity: calculateParity(inputs.marketPrice, inputs.faceValue),
    estimatedYTM,
    macaulayDuration,
    modifiedDuration,
    cashFlows: cashFlows.map((cashFlow) => {
      if (ratePerPeriod === null) return cashFlow;

      const presentValue = calculatePresentValue(cashFlow.totalCashFlow, ratePerPeriod, cashFlow.period);

      return {
        ...cashFlow,
        discountFactor: ratePerPeriod <= -1 ? null : 1 / (1 + ratePerPeriod) ** cashFlow.period,
        presentValue,
      };
    }),
  };
}
