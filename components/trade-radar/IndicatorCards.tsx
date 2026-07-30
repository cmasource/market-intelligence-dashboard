"use client";

import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";

type IndicatorCardsProps = {
  analysis: TradeRadarAnalysis;
};

function formatValue(value: number | null, suffix = "") {
  if (value === null) return "Omitido";
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}${suffix}`;
}

export function IndicatorCards({ analysis }: IndicatorCardsProps) {
  const items = [
    { label: "Precio", value: formatValue(analysis.lastPrice), detail: analysis.currency },
    { label: "EMA 20", value: formatValue(analysis.indicators.ema20), detail: "Dinamico" },
    { label: "EMA 50", value: formatValue(analysis.indicators.ema50), detail: "Dinamico" },
    { label: "EMA 200", value: formatValue(analysis.indicators.ema200), detail: "Tendencia" },
    { label: "RSI 14", value: formatValue(analysis.indicators.rsi14), detail: "Momentum" },
    { label: "ATR 14", value: formatValue(analysis.indicators.atr14), detail: "Volatilidad" },
    { label: "Volumen", value: formatValue(analysis.indicators.volume), detail: "Ultima vela" },
    { label: "Vol. prom. 20", value: formatValue(analysis.indicators.avgVolume20), detail: "Media" },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border border-white/10 bg-slate-950/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{item.label}</p>
          <p className="cma-metric mt-2 text-2xl font-semibold text-white">{item.value}</p>
          <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
        </div>
      ))}
    </section>
  );
}
