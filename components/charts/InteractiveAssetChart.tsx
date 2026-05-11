"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { formatChartPrice, formatChartVolume, getPricePrecision } from "@/lib/chart/chart-formatters";
import { generateMockOHLCV, getAvailableTimeframes, getDefaultTimeframeForAsset } from "@/lib/chart/mock-chart-data";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getAssetClassForMarketData } from "@/lib/market-data/symbol-map";
import type { MarketDataResponse } from "@/lib/market-data/types";
import type { OHLCVPoint, Timeframe } from "@/types/chart";

type InteractiveAssetChartProps = {
  symbol: string;
  name: string;
  currency: string;
  initialTimeframe?: Timeframe;
};

function toCandlestickData(candles: OHLCVPoint[]): CandlestickData[] {
  return candles.map((candle) => ({
    time: candle.time as Time,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));
}

function toVolumeData(candles: OHLCVPoint[]): HistogramData[] {
  return candles.map((candle) => ({
    time: candle.time as Time,
    value: candle.volume,
    color: candle.close >= candle.open ? "rgba(34, 197, 94, 0.34)" : "rgba(248, 113, 113, 0.34)",
  }));
}

function getSafeCurrency(currency: string) {
  return currency.includes("/") || currency.includes(" ") ? undefined : currency;
}

function getInitialMarketData(symbol: string, timeframe: Timeframe): MarketDataResponse {
  return {
    symbol,
    provider: "mock",
    assetClass: getAssetClassForMarketData(symbol),
    timeframe,
    candles: generateMockOHLCV(symbol, timeframe),
    isFallback: true,
    sourceLabel: "Mock OHLCV data",
  };
}

export function InteractiveAssetChart({
  symbol,
  name,
  currency,
  initialTimeframe,
}: InteractiveAssetChartProps) {
  const { t } = useLanguage();
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const timeframes = useMemo(() => getAvailableTimeframes(), []);
  const defaultTimeframe = initialTimeframe ?? getDefaultTimeframeForAsset(symbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(defaultTimeframe);
  const [marketData, setMarketData] = useState<MarketDataResponse>(() => getInitialMarketData(symbol, defaultTimeframe));
  const [loading, setLoading] = useState(false);
  const [clientFallbackError, setClientFallbackError] = useState<string | null>(null);
  const candles = marketData.candles;
  const lastCandle = candles.at(-1);
  const safeCurrency = getSafeCurrency(currency);
  const isArgentinaMock =
    marketData.isFallback && (marketData.assetClass === "argentina" || marketData.assetClass === "bond");
  const sourceStatusLabel = marketData.isFallback ? t("fallbackMockData") : t("realMarketData");
  const sourceLabel = marketData.sourceLabel === "Mock OHLCV data" ? t("mockOhlcData") : marketData.sourceLabel;

  useEffect(() => {
    const controller = new AbortController();

    async function loadMarketData() {
      setLoading(true);
      setClientFallbackError(null);

      try {
        const response = await fetch(
          `/api/market-data/${encodeURIComponent(symbol)}?timeframe=${encodeURIComponent(selectedTimeframe)}`,
          { signal: controller.signal },
        );

        if (!response.ok) throw new Error(`Market data API returned HTTP ${response.status}.`);

        const data = (await response.json()) as MarketDataResponse;

        if (!data.candles.length) throw new Error(data.error ?? "Market data API returned no candles.");

        setMarketData(data);
      } catch (error) {
        if (controller.signal.aborted) return;

        setClientFallbackError(error instanceof Error ? error.message : "Client fallback used after market data failure.");
        setMarketData(getInitialMarketData(symbol, selectedTimeframe));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    loadMarketData();

    return () => controller.abort();
  }, [selectedTimeframe, symbol]);

  useEffect(() => {
    const container = chartContainerRef.current;

    if (!container || candles.length === 0) return undefined;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#020617" },
        textColor: "#cbd5e1",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.09)" },
        horzLines: { color: "rgba(148, 163, 184, 0.09)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(34, 211, 238, 0.38)", labelBackgroundColor: "#0891b2" },
        horzLine: { color: "rgba(34, 211, 238, 0.38)", labelBackgroundColor: "#0891b2" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        scaleMargins: { top: 0.08, bottom: 0.28 },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.18)",
        timeVisible: selectedTimeframe === "1D" || selectedTimeframe === "5D",
        secondsVisible: false,
      },
      localization: {
        priceFormatter: (value: number) => formatChartPrice(value, safeCurrency),
      },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const precision = getPricePrecision(lastCandle?.close ?? 0);
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#67e8f9",
      wickDownColor: "#f87171",
      priceFormat: {
        type: "price",
        precision,
        minMove: 1 / 10 ** precision,
      },
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    candleSeries.setData(toCandlestickData(candles));
    volumeSeries.setData(toVolumeData(candles));
    chart.priceScale("").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });
    chart.timeScale().fitContent();

    const resizeObserver = new ResizeObserver(() => {
      chart.timeScale().fitContent();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [candles, lastCandle?.close, safeCurrency, selectedTimeframe]);

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/10 backdrop-blur">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{t("priceAction")}</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            {symbol} <span className="font-normal text-slate-400">{name}</span>
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 font-medium text-cyan-100">
              {sourceStatusLabel}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-slate-300">
              {sourceLabel}
            </span>
            <span className="text-slate-400">{t("licensedDataReady")}</span>
          </div>
          {isArgentinaMock ? (
            <p className="mt-2 text-xs text-amber-100">{t("argentinaMockUntilEnabled")}</p>
          ) : null}
          {clientFallbackError || marketData.error ? (
            <p className="mt-2 text-xs text-slate-500">{clientFallbackError ?? marketData.error}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              onClick={() => setSelectedTimeframe(timeframe)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedTimeframe === timeframe
                  ? "border-cyan-300/70 bg-cyan-300/15 text-cyan-50"
                  : "border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/50 hover:text-white"
              }`}
              aria-pressed={selectedTimeframe === timeframe}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-slate-950/80">
        {candles.length === 0 ? (
          <div className="flex h-80 items-center justify-center text-sm text-slate-400">{t("chartNoData")}</div>
        ) : (
          <div className="relative" data-testid="asset-chart-container">
            {loading ? (
              <div className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
                {t("loadingMarketData")}
              </div>
            ) : null}
            <div ref={chartContainerRef} className="h-80 w-full sm:h-[420px]" aria-label={`${symbol} ${t("priceAction")}`} />
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <span>
          {t("chartLastClose")}:{" "}
          <span className="font-medium text-slate-200">
            {lastCandle ? formatChartPrice(lastCandle.close, safeCurrency) : "-"}
          </span>
        </span>
        <span>
          {t("volumeTrend")}:{" "}
          <span className="font-medium text-slate-200">
            {lastCandle ? formatChartVolume(lastCandle.volume) : "-"}
          </span>
        </span>
      </div>

      {/* TODO: preparar overlays SMA 20/50/200, EMA y subpaneles RSI/MACD cuando exista data real normalizada. */}
    </section>
  );
}
