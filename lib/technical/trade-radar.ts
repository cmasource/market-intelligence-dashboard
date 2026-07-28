import { resolveInstrument } from "@/lib/instruments/resolveInstrument";
import type { InstrumentResolution } from "@/lib/instruments/types";
import { calculateEMA, calculateMACD, calculateSMA } from "@/lib/finance/technical";
import { getFundamentals } from "@/lib/fundamentals-data";
import { fetchBymaInstrumentLocalQuote, fetchTradeRadarOhlcv } from "@/lib/market-data/providerRouter";
import { resolveTradeRadarSymbol } from "@/lib/market-data/resolveSymbol";
import { getTechnicalAnalysis } from "@/lib/analysis/technical-analysis-service";
import { calculateTechnicalScore, buildTechnicalInterpretation, getMomentumLabel, getTrendLabel } from "@/lib/analysis/technical-score";
import type { TechnicalIndicatorSnapshot, TechnicalInterpretation } from "@/lib/analysis/types";
import {
  type BymaQuote,
  type DataDelay,
  type OhlcvBar,
  type ProviderFailure,
  type TradeRadarInterval,
  type TradeRadarMarket,
  type TradeRadarProviderName,
} from "@/lib/market-data/providers/base";
import { atrWilder, avgVolume, ema, latestNumber, rsiWilder, sma } from "./indicators";
import { calculateSupportResistance, type TechnicalLevel } from "./levels";
import { buildSuggestedAlerts, calculateSignals, type RadarSignals } from "./signals";
import { formatTradeRadarStatus } from "./trade-radar-labels";

export type TradeRadarAnalysis = {
  symbol: string;
  resolvedSymbol: string;
  market: Exclude<TradeRadarMarket, "auto">;
  provider: Exclude<TradeRadarProviderName, "auto">;
  interval: TradeRadarInterval;
  currency: string;
  lastPrice: number;
  lastBarTime: string;
  dataDelay: DataDelay;
  candlesUsed: number;
  sampleStatus: "ok" | "insufficient";
  omittedIndicators: string[];
  providerFailures: ProviderFailure[];
  sourceLabel: string;
  fetchedAt: string;
  ohlcv: OhlcvBar[];
  chartSeries: {
    ema20: Array<{ time: string; value: number }>;
    ema50: Array<{ time: string; value: number }>;
    ma200: Array<{ time: string; value: number }>;
  };
  indicators: {
    ema20: number | null;
    ema50: number | null;
    ma200: number | null;
    rsi14: number | null;
    atr14: number | null;
    volume: number | null;
    avgVolume20: number | null;
  };
  technicalScore: number | null;
  technicalSnapshot: TechnicalIndicatorSnapshot | null;
  technicalInterpretation: TechnicalInterpretation | null;
  tradeSignal: {
    label: string;
    tone: "buy" | "sell" | "wait";
    strength: "strong" | "normal" | "neutral";
  } | null;
  fundamentalScore: number | null;
  levels: {
    supports: TechnicalLevel[];
    resistances: TechnicalLevel[];
  };
  signals: RadarSignals | null;
  suggestedAlerts: Array<{ condition: string; level: number; reason: string }>;
  operativeSummary: string;
  disclaimer: string;
  notes: string[];
  badges: string[];
  technicalLayer?: {
    symbol: string;
    provider: Exclude<TradeRadarProviderName, "auto">;
    currency: string;
    description: string;
  };
  localLayer?: {
    provider: "byma";
    quote: BymaQuote;
    message: string;
  };
  instrument?: InstrumentResolution["instrument"];
  instrumentResolution?: {
    technicalLayer: InstrumentResolution["technicalLayer"];
    localLayer: InstrumentResolution["localLayer"];
    localAlternatives: InstrumentResolution["localAlternatives"];
  };
  warnings: string[];
  dataCoverage: string[];
};

function round(value: number | null, decimals = 2) {
  if (value === null || !Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

function omitted(candlesCount: number) {
  const result: string[] = [];
  if (candlesCount < 20) result.push("ema20", "avgVolume20");
  if (candlesCount < 50) result.push("ema50");
  if (candlesCount < 200) result.push("ma200");
  if (candlesCount < 15) result.push("rsi14", "atr14");
  return Array.from(new Set(result));
}

const allTechnicalIndicators = ["ema20", "ema50", "ma200", "rsi14", "atr14"] as const;

function buildSummary(
  sampleStatus: TradeRadarAnalysis["sampleStatus"],
  symbol: string,
  price: number,
  signals: RadarSignals | null,
  levels: TradeRadarAnalysis["levels"],
) {
  if (sampleStatus === "insufficient") {
    return `${symbol}: muestra insuficiente para emitir lectura operativa trazable. Se requieren al menos 220 velas para habilitar senales del radar.`;
  }

  const resistance = levels.resistances[0]?.level;
  const support = levels.supports[0]?.level;
  const setup = signals?.setup ?? "esperar_confirmacion";

  return [
    `${symbol} cotiza en ${price.toFixed(2)} con lectura ${formatTradeRadarStatus("trendStatus", signals?.trendStatus ?? "sin_senal").toLowerCase()}.`,
    resistance ? `La resistencia inmediata queda cerca de ${resistance}.` : "No se detecto resistencia inmediata confiable.",
    support ? `El soporte operativo mas cercano queda en ${support}.` : "No se detecto soporte inmediato confiable.",
    setup === "vigilancia_breakout"
      ? "Escenario principal: vigilar ruptura con confirmacion de volumen."
      : setup === "pullback_watch"
        ? "Escenario principal: monitorear pullback hacia medias dinamicas."
        : "Escenario principal: esperar confirmacion antes de tomar lectura direccional.",
  ].join(" ");
}

function quoteOnlySummary(symbol: string) {
  return `${symbol}: BYMA entrego cotizacion local, pero no hay historico OHLCV suficiente para indicadores 4H. Para analisis tecnico usar ADR/subyacente o activar almacenamiento historico.`;
}

function emptyIndicators(volume: number | null = null) {
  return {
    ema20: null,
    ema50: null,
    ma200: null,
    rsi14: null,
    atr14: null,
    volume,
    avgVolume20: null,
  };
}

function latestValue(values: Array<number | null>) {
  for (let index = values.length - 1; index >= 0; index -= 1) {
    const value = values[index];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }

  return null;
}

function volumeTrend(volume: number | null, averageVolume: number | null): TechnicalIndicatorSnapshot["volumeTrend"] {
  if (volume === null || averageVolume === null || averageVolume <= 0) return "unavailable";
  if (volume > averageVolume * 1.08) return "increasing";
  if (volume < averageVolume * 0.92) return "decreasing";
  return "neutral";
}

function tradeSignal(score: number | null): TradeRadarAnalysis["tradeSignal"] {
  if (score === null) return null;
  if (score >= 80) return { label: "Compra fuerte", tone: "buy", strength: "strong" };
  if (score >= 65) return { label: "Compra", tone: "buy", strength: "normal" };
  if (score <= 20) return { label: "Venta fuerte", tone: "sell", strength: "strong" };
  if (score <= 35) return { label: "Venta", tone: "sell", strength: "normal" };
  return { label: "Esperar", tone: "wait", strength: "neutral" };
}

async function getCanonicalDailyTechnical(symbol: string, interval: TradeRadarInterval) {
  if (interval !== "1d") return null;

  try {
    const analysis = await getTechnicalAnalysis(symbol, "1Y", "es");
    if (analysis.isFallback) return null;
    return analysis;
  } catch {
    return null;
  }
}

function buildTechnicalSnapshot(bars: OhlcvBar[], levels: TradeRadarAnalysis["levels"]): TechnicalIndicatorSnapshot | null {
  const closes = bars.map((bar) => bar.close).filter(Number.isFinite);
  if (!closes.length) return null;

  const macd = calculateMACD(closes);
  const volume = bars.at(-1)?.volume ?? null;
  const avgVolume20 = latestValue(avgVolume(bars, 20));
  const snapshotBase = {
    lastClose: closes.at(-1) ?? null,
    sma20: latestValue(calculateSMA(closes, 20)),
    sma50: latestValue(calculateSMA(closes, 50)),
    sma200: latestValue(calculateSMA(closes, 200)),
    ema12: latestValue(calculateEMA(closes, 12)),
    ema26: latestValue(calculateEMA(closes, 26)),
    rsi14: latestValue(rsiWilder(closes, 14)),
    macd: latestValue(macd.macdLine),
    macdSignal: latestValue(macd.signalLine),
    macdHistogram: latestValue(macd.histogram),
    support: levels.supports[0]?.level ?? null,
    resistance: levels.resistances[0]?.level ?? null,
    volumeTrend: volumeTrend(volume, avgVolume20),
  };
  const trendLabel = getTrendLabel({ ...snapshotBase, trendLabel: "", momentumLabel: "" });
  const momentumLabel = getMomentumLabel({ ...snapshotBase, trendLabel, momentumLabel: "" });

  return {
    ...snapshotBase,
    trendLabel,
    momentumLabel,
    volatilityLabel: "Trade Radar OHLCV",
  };
}

function toChartSeries(bars: OhlcvBar[], values: Array<number | null>) {
  return bars.flatMap((bar, index) => {
    const value = values[index];
    return typeof value === "number" && Number.isFinite(value)
      ? [{ time: bar.time, value: round(value, 4) ?? value }]
      : [];
  });
}

function instrumentBadges(resolution: InstrumentResolution | null) {
  if (!resolution) return [];

  const badges: string[] = [];
  const { assetClass, market } = resolution.instrument;

  if (market === "argentina") badges.push("BYMA");
  if (assetClass === "adr") badges.push("ADR");
  if (assetClass === "cedear") badges.push("CEDEAR");
  if (assetClass === "cedear_etf") badges.push("CEDEAR ETF");
  if (assetClass === "bond" || assetClass === "bill") badges.push("Bono");
  if (assetClass === "corporate_bond") badges.push("ON");
  if (assetClass === "crypto") badges.push("Crypto");
  if (resolution.dataCoverage.includes("technical_underlying")) badges.push("Tecnico del subyacente");
  if (resolution.dataCoverage.includes("quote_only") && !resolution.dataCoverage.includes("technical_full")) badges.push("Cotizacion disponible");

  return badges;
}

export async function analyzeTradeRadar(params: {
  instrumentId?: string;
  symbol: string;
  market: TradeRadarMarket;
  interval: TradeRadarInterval;
  provider: TradeRadarProviderName;
}): Promise<TradeRadarAnalysis> {
  const instrumentResolution = resolveInstrument({ instrumentId: params.instrumentId, symbol: params.symbol });
  const effectiveSymbol = instrumentResolution?.technicalLayer?.symbol
    ?? instrumentResolution?.instrument.providerSymbol
    ?? instrumentResolution?.instrument.bymaSymbol
    ?? params.symbol;
  const effectiveMarket = instrumentResolution?.technicalLayer?.market
    ?? (instrumentResolution?.instrument.assetClass === "bond"
      || instrumentResolution?.instrument.assetClass === "bill"
      || instrumentResolution?.instrument.assetClass === "corporate_bond"
      ? "bond"
      : instrumentResolution?.instrument.market === "crypto"
        ? "crypto"
        : instrumentResolution?.instrument.market === "argentina"
          ? "argentina"
          : params.market);
  const resolved = resolveTradeRadarSymbol(effectiveSymbol, effectiveMarket);
  const { response, failures } = await fetchTradeRadarOhlcv(resolved, params.interval, params.provider);
  const bars = response.ohlcv.slice(-260);
  const closes = bars.map((bar) => bar.close);
  const lastBar = bars.at(-1);

  const extraFailures = [...failures];
  let localLayer: TradeRadarAnalysis["localLayer"] | undefined = response.localQuote
    ? {
        provider: "byma",
        quote: response.localQuote,
        message: "Cotizacion local BYMA. No se usa como vela historica para indicadores.",
      }
    : undefined;

  const localInstrument = instrumentResolution?.instrument.market === "argentina" ? instrumentResolution.instrument : null;
  if (localInstrument) {
    const local = await fetchBymaInstrumentLocalQuote(
      localInstrument.bymaSymbol ?? localInstrument.symbol,
      localInstrument.assetClass === "cedear" || localInstrument.assetClass === "cedear_etf" ? "CEDEARS" : "ACCIONES",
    );
    if (local.quote) {
      localLayer = {
        provider: "byma",
        quote: local.quote,
        message: localInstrument.assetClass === "cedear" || localInstrument.assetClass === "cedear_etf"
          ? "Cotizacion local CEDEAR BYMA."
          : "Cotizacion local BYMA.",
      };
    }
    if (local.failure) extraFailures.push(local.failure);
  }

  if (!lastBar) {
    const requestedFundamentalSymbol = instrumentResolution?.instrument.underlyingSymbol ?? response.resolvedSymbol;
    const technicalAnalysisSymbol = instrumentResolution?.technicalLayer?.symbol ?? response.resolvedSymbol;
    const [fundamentals, canonicalTechnical] = await Promise.all([
      getFundamentals({ symbol: requestedFundamentalSymbol }),
      getCanonicalDailyTechnical(technicalAnalysisSymbol, params.interval),
    ]);
    if (!response.localQuote) throw new Error("No OHLCV bars available after provider normalization.");
    const quote = response.localQuote;
    const quoteTime = quote.broadcastTime ?? quote.date ?? response.fetchedAt;
    const publishedTechnicalScore = canonicalTechnical?.technicalScore ?? null;
    return {
      symbol: response.symbol,
      resolvedSymbol: response.resolvedSymbol,
      market: response.market,
      provider: response.provider,
      interval: response.interval,
      currency: response.currency,
      lastPrice: round(quote.lastPrice, 4) ?? 0,
      lastBarTime: Number.isFinite(Date.parse(quoteTime)) ? new Date(quoteTime).toISOString() : response.fetchedAt,
      dataDelay: response.dataDelay,
      candlesUsed: 0,
      sampleStatus: "insufficient",
      omittedIndicators: [...allTechnicalIndicators],
      providerFailures: extraFailures,
      sourceLabel: response.sourceLabel,
      fetchedAt: response.fetchedAt,
      ohlcv: [],
      chartSeries: { ema20: [], ema50: [], ma200: [] },
      indicators: emptyIndicators(quote.volume),
      technicalScore: publishedTechnicalScore,
      technicalSnapshot: canonicalTechnical?.snapshot ?? null,
      technicalInterpretation: canonicalTechnical?.interpretation ?? null,
      tradeSignal: tradeSignal(publishedTechnicalScore),
      fundamentalScore: fundamentals.fundamentalScore ?? null,
      levels: { supports: [], resistances: [] },
      signals: null,
      suggestedAlerts: [],
      operativeSummary: quoteOnlySummary(response.symbol),
      disclaimer: "Analisis informativo. No constituye recomendacion personalizada de inversion.",
      notes: [
        ...resolved.notes,
        "BYMA entrego cotizacion local, pero no hay historico OHLCV suficiente para indicadores 4H. Para analisis tecnico usar ADR/subyacente o activar almacenamiento historico.",
      ],
      badges: [
        ...instrumentBadges(instrumentResolution),
        `BYMA ${quote.feed === "delay20" ? "Delay20" : quote.feed === "snapshot" ? "Snapshot" : "EOD"}`,
        "Cotizacion local",
        "Indicadores no disponibles",
      ],
      localLayer,
      instrument: instrumentResolution?.instrument,
      instrumentResolution: instrumentResolution
        ? {
            technicalLayer: instrumentResolution.technicalLayer,
            localLayer: instrumentResolution.localLayer,
            localAlternatives: instrumentResolution.localAlternatives,
          }
        : undefined,
      warnings: instrumentResolution?.warnings ?? resolved.notes,
      dataCoverage: instrumentResolution?.dataCoverage ?? [],
    };
  }

  const ema20Series = ema(closes, 20);
  const ema50Series = ema(closes, 50);
  const ma200Series = sma(closes, 200);
  const ema20 = latestNumber(ema20Series);
  const ema50 = latestNumber(ema50Series);
  const ma200 = latestNumber(ma200Series);
  const rsi14 = latestNumber(rsiWilder(closes, 14));
  const atr14 = latestNumber(atrWilder(bars, 14));
  const avgVolume20 = latestNumber(avgVolume(bars, 20));
  const volume = lastBar.volume;
  const levels = calculateSupportResistance(bars, lastBar.close, atr14, { ema20, ema50, ma200 });
  const technicalSnapshot = buildTechnicalSnapshot(bars, levels);
  const technicalScore = technicalSnapshot ? calculateTechnicalScore(technicalSnapshot) : null;
  const technicalInterpretation = technicalSnapshot && technicalScore !== null
    ? buildTechnicalInterpretation(technicalSnapshot, technicalScore, "es")
    : null;
  const requestedFundamentalSymbol = instrumentResolution?.instrument.underlyingSymbol ?? response.resolvedSymbol;
  const technicalAnalysisSymbol = instrumentResolution?.technicalLayer?.symbol ?? response.resolvedSymbol;
  const [fundamentals, canonicalTechnical] = await Promise.all([
    getFundamentals({ symbol: requestedFundamentalSymbol }),
    getCanonicalDailyTechnical(technicalAnalysisSymbol, params.interval),
  ]);
  const publishedTechnicalScore = canonicalTechnical?.technicalScore ?? technicalScore;
  const publishedTechnicalSnapshot = canonicalTechnical?.snapshot ?? technicalSnapshot;
  const publishedTechnicalInterpretation = canonicalTechnical?.interpretation ?? technicalInterpretation;
  const sampleStatus = bars.length >= 220 ? "ok" : "insufficient";
  const signals = sampleStatus === "ok"
    ? calculateSignals({
        price: lastBar.close,
        ema20,
        ema50,
        ma200,
        rsi14,
        atr14,
        resistances: levels.resistances,
      })
    : null;
  const suggestedAlerts = sampleStatus === "ok"
    ? buildSuggestedAlerts(lastBar.close, atr14, levels.supports, levels.resistances)
    : [];

  return {
    symbol: response.symbol,
    resolvedSymbol: response.resolvedSymbol,
    market: response.market,
    provider: response.provider,
    interval: response.interval,
    currency: response.currency,
    lastPrice: round(lastBar.close, 4) ?? lastBar.close,
    lastBarTime: lastBar.time,
    dataDelay: response.dataDelay,
    candlesUsed: bars.length,
    sampleStatus,
    omittedIndicators: omitted(bars.length),
    providerFailures: extraFailures,
    sourceLabel: response.sourceLabel,
    fetchedAt: response.fetchedAt,
    ohlcv: bars,
    chartSeries: {
      ema20: toChartSeries(bars, ema20Series),
      ema50: toChartSeries(bars, ema50Series),
      ma200: toChartSeries(bars, ma200Series),
    },
    indicators: {
      ema20: round(ema20),
      ema50: round(ema50),
      ma200: round(ma200),
      rsi14: round(rsi14, 1),
      atr14: round(atr14),
      volume,
      avgVolume20: round(avgVolume20, 0),
    },
    technicalScore: publishedTechnicalScore,
    technicalSnapshot: publishedTechnicalSnapshot,
    technicalInterpretation: publishedTechnicalInterpretation,
    tradeSignal: tradeSignal(publishedTechnicalScore),
    fundamentalScore: fundamentals.fundamentalScore ?? null,
    levels,
    signals,
    suggestedAlerts,
    operativeSummary: buildSummary(sampleStatus, response.symbol, lastBar.close, signals, levels),
    disclaimer: "Analisis informativo. No constituye recomendacion personalizada de inversion.",
    notes: resolved.notes,
    badges: [
      ...instrumentBadges(instrumentResolution),
      response.provider === "byma"
        ? `BYMA ${response.localQuote?.feed === "delay20" ? "Delay20" : response.localQuote?.feed === "snapshot" ? "Snapshot" : "EOD"}`
        : response.market === "cedear"
          ? "Tecnico del subyacente"
          : response.market === "us"
            ? "Tecnico mercado US"
            : response.market === "crypto"
              ? "Tecnico cripto"
              : "Tecnico",
      ...(sampleStatus === "ok" ? [] : ["Indicadores no disponibles"]),
      ...(localLayer ? [`BYMA ${localLayer.quote.feed === "delay20" ? "Delay20" : localLayer.quote.feed === "snapshot" ? "Snapshot" : "EOD"}`] : []),
    ],
    technicalLayer: {
      symbol: response.resolvedSymbol,
      provider: response.provider,
      currency: response.currency,
      description: instrumentResolution?.technicalLayer?.description ?? (response.market === "cedear" ? "subyacente USD" : "serie OHLCV principal"),
    },
    localLayer,
    instrument: instrumentResolution?.instrument,
    instrumentResolution: instrumentResolution
      ? {
          technicalLayer: instrumentResolution.technicalLayer,
          localLayer: instrumentResolution.localLayer,
          localAlternatives: instrumentResolution.localAlternatives,
        }
      : undefined,
    warnings: instrumentResolution?.warnings ?? resolved.notes,
    dataCoverage: instrumentResolution?.dataCoverage ?? [],
  };
}
