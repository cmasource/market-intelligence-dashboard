import type { FundamentalsInterpretation, FundamentalsSnapshot } from "./types";

function isNumber(value: number | undefined | null): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateFundamentalScore(snapshot: FundamentalsSnapshot): number | null {
  let score = 0;
  let availableGroups = 0;

  // Modelo MVP conservador: agrega puntos por calidad, valuacion, crecimiento, liquidez y perfil de mercado.
  // No representa recomendacion de compra o venta.
  let profitability = 0;
  let profitabilityInputs = 0;
  if (isNumber(snapshot.roe)) {
    profitability += snapshot.roe >= 0.2 ? 8 : snapshot.roe >= 0.1 ? 6 : snapshot.roe > 0 ? 3 : 0;
    profitabilityInputs += 1;
  }
  if (isNumber(snapshot.roa)) {
    profitability += snapshot.roa >= 0.08 ? 6 : snapshot.roa >= 0.03 ? 4 : snapshot.roa > 0 ? 2 : 0;
    profitabilityInputs += 1;
  }
  for (const margin of [snapshot.grossMargin, snapshot.operatingMargin, snapshot.ebitdaMargin, snapshot.netMargin]) {
    if (isNumber(margin)) {
      profitability += margin >= 0.25 ? 4 : margin >= 0.1 ? 3 : margin > 0 ? 1 : 0;
      profitabilityInputs += 1;
    }
  }
  if (profitabilityInputs > 0) {
    score += Math.min(30, profitability);
    availableGroups += 1;
  }

  let valuation = 0;
  let valuationInputs = 0;
  if (isNumber(snapshot.trailingPE)) {
    valuation += snapshot.trailingPE > 0 && snapshot.trailingPE <= 18 ? 8 : snapshot.trailingPE <= 30 ? 5 : snapshot.trailingPE <= 45 ? 3 : 1;
    valuationInputs += 1;
  }
  if (isNumber(snapshot.forwardPE)) {
    valuation += snapshot.forwardPE > 0 && snapshot.forwardPE <= 18 ? 6 : snapshot.forwardPE <= 30 ? 4 : snapshot.forwardPE <= 45 ? 2 : 1;
    valuationInputs += 1;
  }
  if (isNumber(snapshot.priceToBook)) {
    valuation += snapshot.priceToBook <= 3 ? 5 : snapshot.priceToBook <= 8 ? 3 : 1;
    valuationInputs += 1;
  }
  if (isNumber(snapshot.pegRatio)) {
    valuation += snapshot.pegRatio > 0 && snapshot.pegRatio <= 1.5 ? 6 : snapshot.pegRatio <= 3 ? 3 : 1;
    valuationInputs += 1;
  }
  if (valuationInputs > 0) {
    score += Math.min(25, valuation);
    availableGroups += 1;
  }

  let growth = 0;
  let growthInputs = 0;
  if (isNumber(snapshot.revenueGrowth)) {
    growth += snapshot.revenueGrowth >= 0.12 ? 10 : snapshot.revenueGrowth >= 0.03 ? 7 : snapshot.revenueGrowth >= 0 ? 4 : 1;
    growthInputs += 1;
  }
  if (isNumber(snapshot.earningsGrowth)) {
    growth += snapshot.earningsGrowth >= 0.12 ? 10 : snapshot.earningsGrowth >= 0.03 ? 7 : snapshot.earningsGrowth >= 0 ? 4 : 1;
    growthInputs += 1;
  }
  if (growthInputs > 0) {
    score += Math.min(20, growth);
    availableGroups += 1;
  }

  let risk = 0;
  let riskInputs = 0;
  if (isNumber(snapshot.debtToEquity)) {
    risk += snapshot.debtToEquity <= 0.8 ? 5 : snapshot.debtToEquity <= 1.8 ? 3 : 1;
    riskInputs += 1;
  }
  if (isNumber(snapshot.currentRatio)) {
    risk += snapshot.currentRatio >= 1.5 ? 5 : snapshot.currentRatio >= 1 ? 3 : 1;
    riskInputs += 1;
  }
  if (isNumber(snapshot.quickRatio)) {
    risk += snapshot.quickRatio >= 1 ? 5 : snapshot.quickRatio >= 0.7 ? 3 : 1;
    riskInputs += 1;
  }
  if (riskInputs > 0) {
    score += Math.min(15, risk);
    availableGroups += 1;
  }

  let marketProfile = 0;
  let marketInputs = 0;
  if (isNumber(snapshot.beta)) {
    marketProfile += snapshot.beta >= 0.6 && snapshot.beta <= 1.4 ? 4 : snapshot.beta < 2 ? 2 : 1;
    marketInputs += 1;
  }
  if (isNumber(snapshot.dividendYield)) {
    marketProfile += snapshot.dividendYield > 0 && snapshot.dividendYield <= 0.06 ? 3 : snapshot.dividendYield === 0 ? 1 : 2;
    marketInputs += 1;
  }
  if (isNumber(snapshot.marketPrice) && isNumber(snapshot.fiftyTwoWeekHigh) && isNumber(snapshot.fiftyTwoWeekLow) && snapshot.fiftyTwoWeekHigh > snapshot.fiftyTwoWeekLow) {
    const rangePosition = (snapshot.marketPrice - snapshot.fiftyTwoWeekLow) / (snapshot.fiftyTwoWeekHigh - snapshot.fiftyTwoWeekLow);
    marketProfile += rangePosition >= 0.35 && rangePosition <= 0.8 ? 3 : 1;
    marketInputs += 1;
  }
  if (marketInputs > 0) {
    score += Math.min(10, marketProfile);
    availableGroups += 1;
  }

  if (availableGroups < 2) return null;

  if (availableGroups < 4) score *= 0.85;

  return clampScore(score);
}

export function buildFundamentalsInterpretation(
  snapshot: FundamentalsSnapshot,
  score?: number | null,
): FundamentalsInterpretation {
  if (score === null || score === undefined) {
    return {
      label: "Fundamentals unavailable",
      tone: "neutral",
      summary: "Equity-style fundamental metrics are not available or not applicable for this instrument.",
      bulletPoints: [
        "The platform keeps fallback handling active for this asset.",
        "Use the relevant fixed income, crypto or market context modules where applicable.",
      ],
    };
  }

  const tone: FundamentalsInterpretation["tone"] =
    score >= 75 ? "positive" : score >= 55 ? "neutral" : score >= 35 ? "warning" : "negative";
  const label =
    score >= 75 ? "Strong fundamental profile" : score >= 55 ? "Mixed fundamental profile" : score >= 35 ? "Fundamental caution" : "Weak fundamental profile";

  return {
    label,
    tone,
    summary: "This fundamental view combines available provider or fallback metrics and should not be treated as a buy or sell recommendation.",
    bulletPoints: [
      isNumber(snapshot.roe) ? `ROE context: ${(snapshot.roe * 100).toFixed(1)}%.` : "ROE is unavailable.",
      isNumber(snapshot.trailingPE) ? `Trailing P/E context: ${snapshot.trailingPE.toFixed(1)}x.` : "Trailing P/E is unavailable.",
      isNumber(snapshot.revenueGrowth) ? `Revenue growth context: ${(snapshot.revenueGrowth * 100).toFixed(1)}%.` : "Revenue growth is unavailable.",
      "Provider coverage and accounting definitions should be validated before production use.",
    ],
  };
}
