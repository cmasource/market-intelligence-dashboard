import type { BetaInputs, CAPMInputs, CAPMResult } from "@/types/finance";

function isValidNumber(value: number) {
  return Number.isFinite(value);
}

// La prima de riesgo de mercado es el retorno extra esperado por invertir en mercado sobre tasa libre de riesgo.
export function calculateMarketRiskPremium(marketReturn: number, riskFreeRate: number) {
  if (!isValidNumber(marketReturn) || !isValidNumber(riskFreeRate)) return null;
  return marketReturn - riskFreeRate;
}

// CAPM estima el retorno esperado segun tasa libre de riesgo, beta y prima de mercado.
export function calculateCAPMExpectedReturn(inputs: CAPMInputs): CAPMResult {
  const marketRiskPremium = calculateMarketRiskPremium(inputs.marketReturn, inputs.riskFreeRate);
  const expectedReturn =
    marketRiskPremium === null || !isValidNumber(inputs.beta)
      ? null
      : inputs.riskFreeRate + inputs.beta * marketRiskPremium;

  return {
    expectedReturn,
    marketRiskPremium,
  };
}

export function calculateMean(values: number[]) {
  const validValues = values.filter(isValidNumber);

  if (validValues.length === 0 || validValues.length !== values.length) return null;

  return validValues.reduce((total, value) => total + value, 0) / validValues.length;
}

export function calculateCovariance(assetReturns: number[], marketReturns: number[]) {
  if (assetReturns.length !== marketReturns.length || assetReturns.length < 2) return null;

  const assetMean = calculateMean(assetReturns);
  const marketMean = calculateMean(marketReturns);

  if (assetMean === null || marketMean === null) return null;

  const covarianceSum = assetReturns.reduce(
    (total, assetReturn, index) => total + (assetReturn - assetMean) * (marketReturns[index] - marketMean),
    0,
  );

  return covarianceSum / (assetReturns.length - 1);
}

export function calculateVariance(values: number[]) {
  if (values.length < 2) return null;

  const mean = calculateMean(values);

  if (mean === null) return null;

  const varianceSum = values.reduce((total, value) => total + (value - mean) ** 2, 0);

  return varianceSum / (values.length - 1);
}

// Beta mide la sensibilidad del activo frente a los movimientos del mercado.
export function calculateBeta(inputs: BetaInputs) {
  const covariance = calculateCovariance(inputs.assetReturns, inputs.marketReturns);
  const variance = calculateVariance(inputs.marketReturns);

  if (covariance === null || variance === null || variance === 0) return null;

  return covariance / variance;
}
