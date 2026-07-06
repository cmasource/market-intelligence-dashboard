import { fetchBymaCedearLocalQuote, fetchTradeRadarOhlcv } from "@/lib/market-data/providerRouter";
import { resolveTradeRadarSymbol } from "@/lib/market-data/resolveSymbol";
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
  indicators: {
    ema20: number | null;
    ema50: number | null;
    ma200: number | null;
    rsi14: number | null;
    atr14: number | null;
    volume: number | null;
    avgVolume20: number | null;
  };
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
    `${symbol} cotiza en ${price.toFixed(2)} con estado ${signals?.trendStatus ?? "sin_senal"}.`,
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

export async function analyzeTradeRadar(params: {
  symbol: string;
  market: TradeRadarMarket;
  interval: TradeRadarInterval;
  provider: TradeRadarProviderName;
}): Promise<TradeRadarAnalysis> {
  const resolved = resolveTradeRadarSymbol(params.symbol, params.market);
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

  if (resolved.market === "cedear") {
    const local = await fetchBymaCedearLocalQuote(resolved.inputSymbol);
    if (local.quote) {
      localLayer = {
        provider: "byma",
        quote: local.quote,
        message: "Cotizacion local CEDEAR BYMA.",
      };
    }
    if (local.failure) extraFailures.push(local.failure);
  }

  if (!lastBar) {
    if (!response.localQuote) throw new Error("No OHLCV bars available after provider normalization.");
    const quote = response.localQuote;
    const quoteTime = quote.broadcastTime ?? quote.date ?? response.fetchedAt;
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
      indicators: emptyIndicators(quote.volume),
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
        `BYMA ${quote.feed === "delay20" ? "Delay20" : quote.feed === "snapshot" ? "Snapshot" : "EOD"}`,
        "Local Quote Only",
        "Technical indicators unavailable",
      ],
      localLayer,
    };
  }

  const ema20 = latestNumber(ema(closes, 20));
  const ema50 = latestNumber(ema(closes, 50));
  const ma200 = latestNumber(sma(closes, 200));
  const rsi14 = latestNumber(rsiWilder(closes, 14));
  const atr14 = latestNumber(atrWilder(bars, 14));
  const avgVolume20 = latestNumber(avgVolume(bars, 20));
  const volume = lastBar.volume;
  const levels = calculateSupportResistance(bars, lastBar.close, atr14, { ema20, ema50, ma200 });
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
    indicators: {
      ema20: round(ema20),
      ema50: round(ema50),
      ma200: round(ma200),
      rsi14: round(rsi14, 1),
      atr14: round(atr14),
      volume,
      avgVolume20: round(avgVolume20, 0),
    },
    levels,
    signals,
    suggestedAlerts,
    operativeSummary: buildSummary(sampleStatus, response.symbol, lastBar.close, signals, levels),
    disclaimer: "Analisis informativo. No constituye recomendacion personalizada de inversion.",
    notes: resolved.notes,
    badges: [
      response.provider === "byma"
        ? `BYMA ${response.localQuote?.feed === "delay20" ? "Delay20" : response.localQuote?.feed === "snapshot" ? "Snapshot" : "EOD"}`
        : response.market === "cedear"
          ? "US Technical"
          : response.market === "us"
            ? "US Technical"
            : response.market === "crypto"
              ? "Crypto Technical"
              : "Technical",
      ...(sampleStatus === "ok" ? [] : ["Technical indicators unavailable"]),
      ...(localLayer ? [`BYMA ${localLayer.quote.feed === "delay20" ? "Delay20" : localLayer.quote.feed === "snapshot" ? "Snapshot" : "EOD"}`] : []),
    ],
    technicalLayer: {
      symbol: response.resolvedSymbol,
      provider: response.provider,
      currency: response.currency,
      description: response.market === "cedear" ? "subyacente USD" : "serie OHLCV principal",
    },
    localLayer,
  };
}
