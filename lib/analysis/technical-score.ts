import type { TechnicalIndicatorSnapshot, TechnicalInterpretation } from "./types";
import { translateMomentumLabel, translateTrendLabel } from "@/lib/i18n/interpretation-labels";

type Language = "en" | "es";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function getTrendLabel(snapshot: TechnicalIndicatorSnapshot) {
  const { lastClose, sma20, sma50, sma200 } = snapshot;

  if (!isNumber(lastClose)) return "Trend unavailable";
  if (isNumber(sma20) && isNumber(sma50) && isNumber(sma200) && lastClose > sma20 && sma20 > sma50 && sma50 > sma200) {
    return "Constructive uptrend";
  }
  if (isNumber(sma200) && lastClose > sma200) return "Above long-term trend";
  if (isNumber(sma50) && lastClose < sma50) return "Trend under pressure";
  return "Mixed trend";
}

export function getMomentumLabel(snapshot: TechnicalIndicatorSnapshot) {
  const { rsi14, macd, macdSignal, macdHistogram } = snapshot;

  if (!isNumber(rsi14)) return "Momentum unavailable";
  if (rsi14 > 75) return "Overbought momentum watch";
  if (rsi14 < 30) return "Oversold momentum watch";
  if (isNumber(macd) && isNumber(macdSignal) && isNumber(macdHistogram) && macd > macdSignal && macdHistogram > 0) {
    return "Positive momentum";
  }
  if (rsi14 >= 45 && rsi14 <= 65) return "Healthy momentum";
  return "Mixed momentum";
}

export function calculateTechnicalScore(snapshot: TechnicalIndicatorSnapshot): number {
  let score = 0;

  // Modelo MVP: suma evidencias tecnicas simples. No representa recomendacion de compra o venta.
  if (isNumber(snapshot.lastClose) && isNumber(snapshot.sma200) && snapshot.lastClose > snapshot.sma200) score += 13;
  if (isNumber(snapshot.sma20) && isNumber(snapshot.sma50) && snapshot.sma20 > snapshot.sma50) score += 11;
  if (isNumber(snapshot.sma50) && isNumber(snapshot.sma200) && snapshot.sma50 > snapshot.sma200) score += 11;

  // Momentum: RSI y MACD se ponderan como confirmacion, no como senal aislada.
  if (isNumber(snapshot.rsi14)) {
    if (snapshot.rsi14 >= 45 && snapshot.rsi14 <= 65) score += 12;
    else if (snapshot.rsi14 > 65 && snapshot.rsi14 <= 75) score += 9;
    else if (snapshot.rsi14 >= 30 && snapshot.rsi14 < 45) score += 6;
    else if (snapshot.rsi14 < 30) score += 4;
    else score += 5;
  }

  if (isNumber(snapshot.macd) && isNumber(snapshot.macdSignal) && snapshot.macd > snapshot.macdSignal) score += 10;
  if (isNumber(snapshot.macdHistogram) && snapshot.macdHistogram > 0) score += 8;

  // Ubicacion relativa: premia fuerza o zona cercana a soporte, penaliza cercania extrema a resistencia.
  if (isNumber(snapshot.lastClose) && isNumber(snapshot.support) && isNumber(snapshot.resistance) && snapshot.resistance > snapshot.support) {
    const position = (snapshot.lastClose - snapshot.support) / (snapshot.resistance - snapshot.support);

    if (position > 1) score += 12;
    else if (position <= 0.35) score += 10;
    else if (position <= 0.75) score += 8;
    else score += 5;
  }

  if (snapshot.volumeTrend === "increasing") score += 10;
  else if (snapshot.volumeTrend === "neutral") score += 7;
  else if (snapshot.volumeTrend === "decreasing") score += 4;

  const availableIndicators = [
    snapshot.lastClose,
    snapshot.sma20,
    snapshot.sma50,
    snapshot.sma200,
    snapshot.ema12,
    snapshot.ema26,
    snapshot.rsi14,
    snapshot.macd,
    snapshot.macdSignal,
    snapshot.macdHistogram,
    snapshot.support,
    snapshot.resistance,
  ].filter(isNumber).length;

  score += Math.min(10, (availableIndicators / 12) * 10);

  return clampScore(score);
}

export function buildTechnicalInterpretation(
  snapshot: TechnicalIndicatorSnapshot,
  score: number,
  language: Language = "en",
): TechnicalInterpretation {
  const tone: TechnicalInterpretation["tone"] =
    score >= 75 ? "positive" : score >= 55 ? "neutral" : score >= 35 ? "warning" : "negative";
  const label =
    language === "es"
      ? score >= 75
        ? "Perfil tecnico fuerte"
        : score >= 55
          ? "Perfil tecnico constructivo"
          : score >= 35
            ? "Perfil tecnico fragil"
            : "Perfil tecnico debil"
      : score >= 75
        ? "Strong technical profile"
        : score >= 55
          ? "Constructive technical profile"
          : score >= 35
            ? "Fragile technical profile"
            : "Weak technical profile";
  const trend = translateTrendLabel(snapshot.trendLabel, language);
  const momentum = translateMomentumLabel(snapshot.momentumLabel, language);

  return {
    label,
    tone,
    summary:
      language === "es"
        ? "Esta lectura tecnica se calcula con velas OHLCV disponibles y debe usarse como apoyo informativo, no como recomendacion de operacion."
        : "This technical view is calculated from available OHLCV candles and should be treated as decision support, not as a trading recommendation.",
    bulletPoints: [
      language === "es" ? `Tendencia: ${trend}.` : `Trend: ${trend}.`,
      language === "es" ? `Momentum: ${momentum}.` : `Momentum: ${momentum}.`,
      language === "es" ? `Confirmacion de volumen: ${snapshot.volumeTrend}.` : `Volume confirmation: ${snapshot.volumeTrend}.`,
      score >= 75
        ? language === "es"
          ? "La lectura muestra multiples confirmaciones, pero el riesgo y el contexto de mercado siguen siendo necesarios."
          : "The setup shows multiple confirmations, but risk management and market context remain necessary."
        : language === "es"
          ? "La lectura necesita confirmacion de precio, volumen y contexto general de mercado."
          : "The setup needs confirmation from price, volume and broader market context.",
    ],
  };
}
