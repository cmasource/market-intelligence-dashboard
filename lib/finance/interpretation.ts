import type { InterpretationResult } from "@/types/finance";

function result(label: string, tone: InterpretationResult["tone"], description: string): InterpretationResult {
  return { label, tone, description };
}

export function interpretROE(roe: number | null) {
  if (roe === null) return result("Unavailable ROE", "neutral", "ROE cannot be calculated with the available inputs.");
  if (roe >= 0.2) return result("Strong ROE", "positive", "The company shows strong profitability relative to equity.");
  if (roe >= 0.1) return result("Moderate ROE", "neutral", "The company shows acceptable profitability relative to equity.");
  return result("Weak ROE", "warning", "Profitability relative to equity is weak in this simplified framework.");
}

export function interpretROA(roa: number | null) {
  if (roa === null) return result("Unavailable ROA", "neutral", "ROA cannot be calculated with the available inputs.");
  if (roa >= 0.08) return result("Efficient asset use", "positive", "Assets appear to generate healthy profitability.");
  if (roa >= 0.03) return result("Moderate asset use", "neutral", "Asset profitability is acceptable but not exceptional.");
  return result("Low asset efficiency", "warning", "Asset profitability is low in this simplified framework.");
}

export function interpretPER(peRatio: number | null) {
  if (peRatio === null) return result("Unavailable P/E", "neutral", "P/E cannot be calculated with the available inputs.");
  if (peRatio < 0) return result("Negative earnings", "negative", "A negative P/E usually reflects negative earnings.");
  if (peRatio <= 15) return result("Lower valuation multiple", "positive", "The valuation multiple is relatively low.");
  if (peRatio <= 30) return result("Balanced valuation multiple", "neutral", "The valuation multiple is within a moderate range.");
  return result("Elevated valuation multiple", "warning", "The valuation multiple is high and may require stronger growth assumptions.");
}

export function interpretDebtOrRiskPlaceholder() {
  return result("Risk module pending", "neutral", "Debt, liquidity and solvency interpretation will be added in a future engine sprint.");
}

export function interpretBondYTM(ytm: number | null) {
  if (ytm === null) return result("Unavailable YTM", "neutral", "YTM cannot be estimated with the available inputs.");
  if (ytm >= 0.18) return result("High yield", "warning", "The bond offers high yield, which may also imply high credit or liquidity risk.");
  if (ytm >= 0.08) return result("Moderate yield", "neutral", "The bond yield is moderate in this simplified framework.");
  return result("Low yield", "positive", "The bond yield is low, which can indicate lower perceived risk or richer pricing.");
}

export function interpretBondDuration(duration: number | null) {
  if (duration === null) return result("Unavailable duration", "neutral", "Duration cannot be calculated with the available inputs.");
  if (duration >= 7) return result("High rate sensitivity", "warning", "The bond has elevated sensitivity to interest-rate changes.");
  if (duration >= 3) return result("Moderate rate sensitivity", "neutral", "The bond has moderate interest-rate sensitivity.");
  return result("Lower rate sensitivity", "positive", "The bond has shorter duration and lower rate sensitivity.");
}

export function interpretTechnicalRSI(rsi: number | null) {
  if (rsi === null) return result("Unavailable RSI", "neutral", "RSI cannot be calculated with the available price history.");
  if (rsi >= 70) return result("Overbought watch", "warning", "RSI is elevated and may suggest overbought conditions.");
  if (rsi <= 30) return result("Oversold watch", "warning", "RSI is low and may suggest oversold conditions.");
  return result("Neutral RSI", "neutral", "RSI is in a balanced range.");
}

export function interpretTechnicalScore(score: number | null) {
  if (score === null) return result("Unavailable technical score", "neutral", "Technical score is not available.");
  if (score >= 80) return result("Strong technical profile", "positive", "The technical setup shows strong momentum and confirmation.");
  if (score >= 55) return result("Constructive technical profile", "neutral", "The technical setup is constructive but still needs confirmation.");
  return result("Weak technical profile", "warning", "The technical setup is fragile or defensive.");
}

export function interpretFundamentalScore(score: number | null) {
  if (score === null) return result("Unavailable fundamental score", "neutral", "Fundamental score is not available.");
  if (score >= 75) return result("Strong fundamental profile", "positive", "The company shows strong quality in this simplified framework.");
  if (score >= 55) return result("Mixed fundamental profile", "neutral", "The company shows mixed but acceptable fundamental quality.");
  return result("Weak fundamental profile", "warning", "The company shows weaker fundamental quality in this simplified framework.");
}
