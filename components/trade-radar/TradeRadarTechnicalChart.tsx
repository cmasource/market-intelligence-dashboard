"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  type CandlestickData,
  type HistogramData,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";
import { formatTradeRadarSource } from "@/lib/technical/trade-radar-labels";

type TradeRadarTechnicalChartProps = {
  analysis: TradeRadarAnalysis;
};

function toCandleData(analysis: TradeRadarAnalysis): CandlestickData[] {
  return analysis.ohlcv.map((bar) => ({
    time: toChartTime(bar.time),
    open: bar.open,
    high: bar.high,
    low: bar.low,
    close: bar.close,
  }));
}

function toVolumeData(analysis: TradeRadarAnalysis): HistogramData[] {
  return analysis.ohlcv.map((bar) => ({
    time: toChartTime(bar.time),
    value: bar.volume,
    color: bar.close >= bar.open ? "rgba(34, 197, 94, 0.28)" : "rgba(248, 113, 113, 0.28)",
  }));
}

function toLineData(series: Array<{ time: string; value: number }>) {
  return series.map((point) => ({
    time: toChartTime(point.time),
    value: point.value,
  }));
}

function toChartTime(value: string): Time {
  return Math.floor(new Date(value).getTime() / 1000) as Time;
}

function formatPrice(value: number, currency: string) {
  const decimals = Math.abs(value) >= 100 ? 2 : 4;
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: decimals })} ${currency}`;
}

export function TradeRadarTechnicalChart({ analysis }: TradeRadarTechnicalChartProps) {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleData = useMemo(() => toCandleData(analysis), [analysis]);
  const volumeData = useMemo(() => toVolumeData(analysis), [analysis]);
  const ema20Data = useMemo(() => toLineData(analysis.chartSeries.ema20), [analysis.chartSeries.ema20]);
  const ema50Data = useMemo(() => toLineData(analysis.chartSeries.ema50), [analysis.chartSeries.ema50]);
  const ema200Data = useMemo(() => toLineData(analysis.chartSeries.ema200), [analysis.chartSeries.ema200]);
  const latestClose = analysis.ohlcv.at(-1)?.close;

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || candleData.length === 0) return undefined;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#020617" },
        textColor: "#cbd5e1",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.08)" },
        horzLines: { color: "rgba(148, 163, 184, 0.08)" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "rgba(34, 211, 238, 0.36)", labelBackgroundColor: "#0e7490" },
        horzLine: { color: "rgba(34, 211, 238, 0.36)", labelBackgroundColor: "#0e7490" },
      },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.16)",
        scaleMargins: { top: 0.12, bottom: 0.28 },
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.16)",
        timeVisible: analysis.interval !== "1d",
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#67e8f9",
      wickDownColor: "#f87171",
      priceFormat: {
        type: "price",
        precision: Math.abs(latestClose ?? 0) >= 100 ? 2 : 4,
        minMove: Math.abs(latestClose ?? 0) >= 100 ? 0.01 : 0.0001,
      },
    });
    const ema20Series = chart.addSeries(LineSeries, {
      color: "#22d3ee",
      lineWidth: 2,
      title: "EMA20",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ema50Series = chart.addSeries(LineSeries, {
      color: "#f59e0b",
      lineWidth: 2,
      title: "EMA50",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const ema200Series = chart.addSeries(LineSeries, {
      color: "#a78bfa",
      lineWidth: 2,
      title: "EMA200",
      priceLineVisible: false,
      lastValueVisible: false,
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "",
      lastValueVisible: false,
      priceLineVisible: false,
    });

    candleSeries.setData(candleData);
    ema20Series.setData(ema20Data);
    ema50Series.setData(ema50Data);
    ema200Series.setData(ema200Data);
    volumeSeries.setData(volumeData);
    chart.priceScale("").applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } });

    for (const support of analysis.levels.supports.slice(0, 2)) {
      candleSeries.createPriceLine({
        price: support.level,
        color: "rgba(34, 197, 94, 0.54)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
        title: "",
      });
    }
    for (const resistance of analysis.levels.resistances.slice(0, 2)) {
      candleSeries.createPriceLine({
        price: resistance.level,
        color: "rgba(248, 113, 113, 0.58)",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: false,
        title: "",
      });
    }

    chart.timeScale().fitContent();
    const resizeObserver = new ResizeObserver(() => chart.timeScale().fitContent());
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [
    analysis.interval,
    analysis.levels.resistances,
    analysis.levels.supports,
    candleData,
    ema200Data,
    ema20Data,
    ema50Data,
    latestClose,
    volumeData,
  ]);

  return (
    <section className="rounded-lg border border-cyan-300/20 bg-slate-950/55 p-4 shadow-2xl shadow-cyan-950/10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Grafico tecnico trazable</p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {analysis.symbol} <span className="font-normal text-slate-400">{analysis.interval}</span>
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            Velas OHLCV reales de {formatTradeRadarSource(analysis.sourceLabel).toLowerCase()}. Medias y niveles calculados en backend sobre la misma muestra.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-cyan-100">EMA20</span>
          <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-amber-100">EMA50</span>
          <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-violet-100">EMA200</span>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-white/10 bg-slate-950">
        <div
          ref={chartContainerRef}
          className="h-[360px] w-full sm:h-[460px]"
          data-testid="trade-radar-technical-chart"
          aria-label={`Grafico tecnico ${analysis.symbol}`}
        />
      </div>

      <div className="mt-3 grid gap-3 text-xs text-slate-400 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-wrap gap-2">
          {analysis.levels.supports.slice(0, 2).map((support) => (
            <span key={`support-${support.level}`} className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-emerald-100">
              Soporte {support.level.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </span>
          ))}
          {analysis.levels.resistances.slice(0, 2).map((resistance) => (
            <span key={`resistance-${resistance.level}`} className="rounded-full border border-rose-300/20 bg-rose-300/10 px-2.5 py-1 text-rose-100">
              Resistencia {resistance.level.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 lg:justify-end">
          <span>
            Ultimo precio: <span className="font-medium text-slate-200">{formatPrice(analysis.lastPrice, analysis.currency)}</span>
          </span>
          <span>
            Ventana: <span className="font-medium text-slate-200">{analysis.candlesUsed} velas</span>
          </span>
        </div>
      </div>
    </section>
  );
}
