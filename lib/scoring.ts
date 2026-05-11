import type { RiskLevel } from "@/types/asset";

export function getScoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 65) return "Constructive";
  if (score >= 45) return "Neutral";
  if (score >= 30) return "Weak";
  return "Defensive";
}

export function getScoreTone(score: number) {
  if (score >= 80) return "text-emerald-200 bg-emerald-500/15 border-emerald-400/30";
  if (score >= 65) return "text-cyan-200 bg-cyan-500/15 border-cyan-400/30";
  if (score >= 45) return "text-slate-200 bg-slate-500/15 border-slate-400/25";
  if (score >= 30) return "text-amber-200 bg-amber-500/15 border-amber-400/30";
  return "text-rose-200 bg-rose-500/15 border-rose-400/30";
}

export function getRiskTone(riskLevel: RiskLevel) {
  const tones: Record<RiskLevel, string> = {
    low: "text-emerald-200 bg-emerald-500/15 border-emerald-400/30",
    medium: "text-cyan-200 bg-cyan-500/15 border-cyan-400/30",
    high: "text-amber-200 bg-amber-500/15 border-amber-400/30",
    very_high: "text-rose-200 bg-rose-500/15 border-rose-400/30",
  };

  return tones[riskLevel];
}

export function getTechnicalInterpretation(score: number) {
  if (score >= 80) {
    return "Price action shows strong momentum, trend alignment and favorable confirmation signals.";
  }

  if (score >= 65) {
    return "The technical setup is constructive, with improving momentum and manageable support levels.";
  }

  if (score >= 45) {
    return "The asset is in a balanced technical zone where confirmation matters more than direction.";
  }

  if (score >= 30) {
    return "The technical profile is fragile and should be evaluated around support, volatility and volume.";
  }

  return "The asset is in a defensive technical posture with elevated downside risk in the mock model.";
}

export function getFundamentalInterpretation(score?: number) {
  if (score === undefined) {
    return "Traditional equity fundamental scoring is not available for this instrument in the MVP model.";
  }

  if (score >= 75) {
    return "Fundamental quality appears solid, with attractive profitability and balance-sheet indicators.";
  }

  if (score >= 55) {
    return "Fundamentals look mixed but acceptable, with valuation and margin context worth monitoring.";
  }

  return "Fundamental quality is weaker in this mock framework and needs deeper validation before decisions.";
}
