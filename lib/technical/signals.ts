import type { TechnicalLevel } from "./levels";

export type RadarSignals = {
  trendStatus: string;
  momentumStatus: string;
  volatilityStatus: string;
  setup: string;
  riskStatus: string;
};

type SignalInput = {
  price: number;
  ema20: number | null;
  ema50: number | null;
  ma200: number | null;
  rsi14: number | null;
  atr14: number | null;
  resistances: TechnicalLevel[];
};

function between(value: number, a: number, b: number) {
  return value >= Math.min(a, b) && value <= Math.max(a, b);
}

export function calculateSignals(input: SignalInput): RadarSignals {
  const { price, ema20, ema50, ma200, rsi14, atr14, resistances } = input;
  const hasCore = ema20 !== null && ema50 !== null && rsi14 !== null;
  let trendStatus = "sin_senal";

  if (hasCore && ma200 !== null && price > ema20 && ema20 > ema50 && ema50 > ma200 && rsi14 > 55) {
    trendStatus = "bullish_strong";
  } else if (hasCore && price < ema20 && ema20 < ema50 && rsi14 < 45) {
    trendStatus = "bearish";
  } else if (hasCore && price > ema20 && (price < ema50 || (ma200 !== null && price < ma200))) {
    trendStatus = "rebote_alcista_corto_plazo";
  } else if (hasCore && price > ema20 && rsi14 > 50) {
    trendStatus = "bullish_short_term";
  } else if (hasCore && between(price, ema20, ema50) && rsi14 >= 45 && rsi14 <= 55) {
    trendStatus = "neutral_range";
  } else if (hasCore && price < ema20 && rsi14 < 45) {
    trendStatus = "deterioration";
  }

  const nearestResistance = resistances[0]?.level;
  const nearResistance = atr14 !== null && nearestResistance !== undefined && nearestResistance - price > 0 && nearestResistance - price < atr14;
  const nearPullback =
    atr14 !== null
    && ((ema20 !== null && Math.abs(price - ema20) <= atr14 * 0.5)
      || (ema50 !== null && Math.abs(price - ema50) <= atr14 * 0.5));

  return {
    trendStatus,
    momentumStatus: rsi14 === null ? "sin_dato" : rsi14 > 60 ? "positivo_fuerte" : rsi14 > 50 ? "positivo" : rsi14 < 40 ? "negativo" : "neutral",
    volatilityStatus: atr14 === null ? "sin_dato" : atr14 / price > 0.035 ? "alta" : atr14 / price < 0.015 ? "baja" : "normal",
    setup: nearResistance ? "vigilancia_breakout" : nearPullback ? "pullback_watch" : "esperar_confirmacion",
    riskStatus: nearResistance ? "resistencia_cercana" : trendStatus === "bearish" ? "riesgo_bajista" : "normal",
  };
}

export function buildSuggestedAlerts(
  price: number,
  atr14: number | null,
  supports: TechnicalLevel[],
  resistances: TechnicalLevel[],
) {
  const buffer = atr14 ? atr14 * 0.03 : price * 0.001;
  const nearestResistance = resistances[0];
  const nearestSupport = supports[0];

  return [
    nearestResistance
      ? {
          condition: "crosses_above",
          level: Number((nearestResistance.level + buffer).toFixed(4)),
          reason: `Ruptura de ${nearestResistance.type}/resistencia inmediata`,
        }
      : null,
    nearestSupport
      ? {
          condition: "crosses_below",
          level: Number((nearestSupport.level - buffer).toFixed(4)),
          reason: `Perdida de ${nearestSupport.type}/soporte corto`,
        }
      : null,
  ].filter((alert): alert is { condition: string; level: number; reason: string } => alert !== null);
}
