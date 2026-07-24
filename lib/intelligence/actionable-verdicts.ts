import type { TechnicalIndicatorSnapshot, VolumeTrend } from "@/lib/analysis/types";
import type { FundamentalsAssetClass, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";

export type VerdictTone = "positive" | "neutral" | "negative" | "warning";

export type Verdict = {
  label: string;
  tone: VerdictTone;
  summary: string;
};

export type ChecklistItem = {
  id: string;
  label: string;
  passed: boolean | null;
  detail: string;
};

type Language = "en" | "es";

function l<T>(language: Language, en: T, es: T) {
  return language === "es" ? es : en;
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function pct(value: number | null | undefined) {
  return isNumber(value) ? `${(value * 100).toFixed(1)}%` : "N/D";
}

function num(value: number | null | undefined, digits = 1) {
  return isNumber(value) ? value.toFixed(digits) : "N/D";
}

function trendFromVolume(volumeTrend: VolumeTrend) {
  if (volumeTrend === "increasing") return true;
  if (volumeTrend === "decreasing") return false;
  if (volumeTrend === "neutral") return null;
  return null;
}

export function buildTechnicalChecklist(snapshot: TechnicalIndicatorSnapshot, language: Language): ChecklistItem[] {
  const aboveLongTrend = isNumber(snapshot.lastClose) && isNumber(snapshot.sma200) ? snapshot.lastClose > snapshot.sma200 : null;
  const shortTrend = isNumber(snapshot.sma20) && isNumber(snapshot.sma50) ? snapshot.sma20 > snapshot.sma50 : null;
  const rsiInRange = isNumber(snapshot.rsi14) ? snapshot.rsi14 >= 40 && snapshot.rsi14 <= 70 : null;
  const macdPositive = isNumber(snapshot.macd) && isNumber(snapshot.macdSignal) ? snapshot.macd > snapshot.macdSignal : null;
  const volume = trendFromVolume(snapshot.volumeTrend);

  return [
    {
      id: "short-trend",
      label: l(language, "EMA/SMA short trend", "Tendencia corta"),
      passed: shortTrend,
      detail: l(language, "Short average above medium average.", "Media corta por encima de media media."),
    },
    {
      id: "long-trend",
      label: l(language, "Price vs long trend", "Precio vs tendencia larga"),
      passed: aboveLongTrend,
      detail: l(language, "Price above SMA 200.", "Precio por encima de SMA 200."),
    },
    {
      id: "rsi",
      label: "RSI 14",
      passed: rsiInRange,
      detail: l(language, `Current RSI: ${num(snapshot.rsi14)}.`, `RSI actual: ${num(snapshot.rsi14)}.`),
    },
    {
      id: "macd",
      label: "MACD",
      passed: macdPositive,
      detail: l(language, "MACD above signal line.", "MACD por encima de su linea de senal."),
    },
    {
      id: "volume",
      label: l(language, "Volume confirmation", "Confirmacion de volumen"),
      passed: volume,
      detail: l(language, `Volume trend: ${snapshot.volumeTrend}.`, `Tendencia de volumen: ${snapshot.volumeTrend}.`),
    },
  ];
}

export function buildTechnicalVerdict(
  snapshot: TechnicalIndicatorSnapshot,
  score: number | null | undefined,
  language: Language,
): Verdict {
  const checklist = buildTechnicalChecklist(snapshot, language);
  const passed = checklist.filter((item) => item.passed === true).length;
  const known = checklist.filter((item) => item.passed !== null).length;
  const highRsi = isNumber(snapshot.rsi14) && snapshot.rsi14 > 70;
  const lowRsi = isNumber(snapshot.rsi14) && snapshot.rsi14 < 30;

  if (known < 3) {
    return {
      label: l(language, "Limited technical reading", "Lectura tecnica limitada"),
      tone: "warning",
      summary: l(language, "There is not enough OHLCV history to validate the setup.", "No hay historial OHLCV suficiente para validar el setup."),
    };
  }

  if ((isNumber(score) && score >= 70) || passed >= 4) {
    return {
      label: l(language, "Technically favorable", "Tecnico favorable"),
      tone: highRsi ? "warning" : "positive",
      summary: highRsi
        ? l(language, "Trend is constructive, but RSI suggests watching overbought risk.", "La tendencia es constructiva, pero el RSI pide vigilar sobrecompra.")
        : l(language, "Trend, momentum and confirmation indicators align constructively.", "Tendencia, momentum y confirmaciones se alinean de forma constructiva."),
    };
  }

  if ((isNumber(score) && score <= 35) || passed <= 1) {
    return {
      label: l(language, "Technically weak", "Tecnico debil"),
      tone: lowRsi ? "warning" : "negative",
      summary: lowRsi
        ? l(language, "The asset is pressured, with possible oversold-rebound context only if price confirms.", "El activo esta presionado; solo hay contexto de rebote si el precio confirma.")
        : l(language, "The setup lacks enough trend or momentum confirmation.", "El setup no tiene suficiente confirmacion de tendencia o momentum."),
    };
  }

  return {
    label: l(language, "Technically neutral", "Tecnico neutral"),
    tone: "neutral",
    summary: l(language, "There is no dominant technical signal across trend, RSI, MACD and volume.", "No hay una senal tecnica dominante entre tendencia, RSI, MACD y volumen."),
  };
}

export function buildFundamentalChecklist(
  snapshot: FundamentalsSnapshot,
  assetClass: FundamentalsAssetClass | undefined,
  language: Language,
): ChecklistItem[] {
  if (assetClass === "crypto" || assetClass === "bond") {
    return [
      {
        id: "not-applicable",
        label: l(language, "Equity fundamentals", "Fundamentos accionarios"),
        passed: null,
        detail: l(language, "This instrument uses a specialized analysis layer.", "Este instrumento usa una capa de analisis especializada."),
      },
    ];
  }

  const valuationOk = isNumber(snapshot.trailingPE) || isNumber(snapshot.forwardPE)
    ? (isNumber(snapshot.trailingPE) && snapshot.trailingPE > 0 && snapshot.trailingPE <= 35)
      || (isNumber(snapshot.forwardPE) && snapshot.forwardPE > 0 && snapshot.forwardPE <= 30)
    : null;
  const profitabilityOk = isNumber(snapshot.roe) || isNumber(snapshot.roa)
    ? (isNumber(snapshot.roe) && snapshot.roe >= 0.1) || (isNumber(snapshot.roa) && snapshot.roa >= 0.03)
    : null;
  const growthOk = isNumber(snapshot.revenueGrowth) || isNumber(snapshot.earningsGrowth)
    ? (isNumber(snapshot.revenueGrowth) && snapshot.revenueGrowth >= 0.03) || (isNumber(snapshot.earningsGrowth) && snapshot.earningsGrowth >= 0.03)
    : null;
  const solvencyOk = isNumber(snapshot.debtToEquity) || isNumber(snapshot.currentRatio) || isNumber(snapshot.quickRatio)
    ? (isNumber(snapshot.debtToEquity) && snapshot.debtToEquity <= 1.8)
      || (isNumber(snapshot.currentRatio) && snapshot.currentRatio >= 1)
      || (isNumber(snapshot.quickRatio) && snapshot.quickRatio >= 0.7)
    : null;

  return [
    {
      id: "valuation",
      label: l(language, "Valuation", "Valuacion"),
      passed: valuationOk,
      detail: l(language, `P/E ${num(snapshot.trailingPE)} | Fwd P/E ${num(snapshot.forwardPE)}.`, `P/E ${num(snapshot.trailingPE)} | Fwd P/E ${num(snapshot.forwardPE)}.`),
    },
    {
      id: "profitability",
      label: l(language, "Profitability", "Rentabilidad"),
      passed: profitabilityOk,
      detail: l(language, `ROE ${pct(snapshot.roe)} | ROA ${pct(snapshot.roa)}.`, `ROE ${pct(snapshot.roe)} | ROA ${pct(snapshot.roa)}.`),
    },
    {
      id: "growth",
      label: l(language, "Growth", "Crecimiento"),
      passed: growthOk,
      detail: l(language, `Revenue ${pct(snapshot.revenueGrowth)} | earnings ${pct(snapshot.earningsGrowth)}.`, `Ingresos ${pct(snapshot.revenueGrowth)} | ganancias ${pct(snapshot.earningsGrowth)}.`),
    },
    {
      id: "solvency",
      label: l(language, "Solvency/liquidity", "Solvencia/liquidez"),
      passed: solvencyOk,
      detail: l(language, `Debt/equity ${num(snapshot.debtToEquity)} | current ratio ${num(snapshot.currentRatio)}.`, `Deuda/patrimonio ${num(snapshot.debtToEquity)} | liquidez corriente ${num(snapshot.currentRatio)}.`),
    },
  ];
}

export function buildFundamentalVerdict(
  snapshot: FundamentalsSnapshot,
  score: number | null | undefined,
  assetClass: FundamentalsAssetClass | undefined,
  language: Language,
): Verdict {
  if (assetClass === "crypto" || assetClass === "bond") {
    return {
      label: l(language, "Not applicable", "No aplica"),
      tone: "neutral",
      summary: l(language, "Use the instrument-specific risk and market modules instead.", "Usar las capas especificas de riesgo y mercado para este instrumento."),
    };
  }

  const checklist = buildFundamentalChecklist(snapshot, assetClass, language);
  const known = checklist.filter((item) => item.passed !== null).length;
  const passed = checklist.filter((item) => item.passed === true).length;

  if (known < 2 || !isNumber(score)) {
    return {
      label: l(language, "Limited fundamentals", "Fundamentos limitados"),
      tone: "warning",
      summary: l(language, "Provider coverage is partial; validate with statements or another source.", "La cobertura del proveedor es parcial; validar con balances u otra fuente."),
    };
  }

  if (score >= 70 || passed >= 3) {
    return {
      label: l(language, "Fundamentally favorable", "Fundamental favorable"),
      tone: "positive",
      summary: l(language, "Available valuation, profitability and growth data are constructive.", "Los datos disponibles de valuacion, rentabilidad y crecimiento son constructivos."),
    };
  }

  if (score <= 35 || passed <= 1) {
    return {
      label: l(language, "Fundamental caution", "Cautela fundamental"),
      tone: "warning",
      summary: l(language, "The available fundamentals need more validation before relying on them.", "Los fundamentos disponibles requieren mas validacion antes de apoyarse en ellos."),
    };
  }

  return {
    label: l(language, "Fundamentally neutral", "Fundamental neutral"),
    tone: "neutral",
    summary: l(language, "The fundamental picture is balanced or mixed.", "La foto fundamental es equilibrada o mixta."),
  };
}

export function buildIntegratedVerdict(technical: Verdict, fundamental: Verdict, language: Language): Verdict {
  if (technical.tone === "positive" && fundamental.tone === "positive") {
    return {
      label: l(language, "Constructive watchlist candidate", "Candidato constructivo para seguimiento"),
      tone: "positive",
      summary: l(language, "Technical and fundamental layers are both constructive. Review risk, news and position sizing before acting.", "Tecnico y fundamental estan constructivos. Revisar riesgo, noticias y tamano de posicion antes de actuar."),
    };
  }

  if (technical.tone === "negative" || fundamental.tone === "negative") {
    return {
      label: l(language, "Defensive reading", "Lectura defensiva"),
      tone: "negative",
      summary: l(language, "At least one core layer is weak, so the asset needs stronger confirmation.", "Al menos una capa central esta debil, por lo que el activo necesita mas confirmacion."),
    };
  }

  if (technical.tone === "warning" || fundamental.tone === "warning") {
    return {
      label: l(language, "Review with caution", "Revisar con cautela"),
      tone: "warning",
      summary: l(language, "Useful data exists, but coverage or signal quality is not strong enough for a clean read.", "Hay datos utiles, pero la cobertura o calidad de senal no alcanza para una lectura limpia."),
    };
  }

  return {
    label: l(language, "Balanced reading", "Lectura equilibrada"),
    tone: "neutral",
    summary: l(language, "No single layer dominates. Compare technical timing with fundamentals and market context.", "No domina una sola capa. Comparar timing tecnico con fundamentos y contexto de mercado."),
  };
}
