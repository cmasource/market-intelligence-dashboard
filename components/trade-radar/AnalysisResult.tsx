"use client";

import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";
import { IndicatorCards } from "./IndicatorCards";
import { BymaLocalQuoteTable } from "./BymaLocalQuoteTable";
import { LevelsTable } from "./LevelsTable";
import { SuggestedAlerts } from "./SuggestedAlerts";
import { TechnicalVerdict } from "./TechnicalVerdict";
import { TradingViewChart } from "./TradingViewChart";

type AnalysisResultProps = {
  analysis: TradeRadarAnalysis;
};

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  return (
    <div className="space-y-5">
      <TechnicalVerdict analysis={analysis} />
      {analysis.localLayer ? <BymaLocalQuoteTable quote={analysis.localLayer.quote} /> : null}
      <IndicatorCards analysis={analysis} />
      <LevelsTable supports={analysis.levels.supports} resistances={analysis.levels.resistances} />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        {analysis.ohlcv.length ? (
          <TradingViewChart symbol={analysis.resolvedSymbol} interval={analysis.interval} />
        ) : (
          <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
            <h3 className="text-lg font-semibold text-white">Grafico tecnico no disponible</h3>
            <p className="mt-2 text-sm leading-6 text-amber-100">
              BYMA entrego cotizacion local, pero no hay historico OHLCV suficiente para calcular indicadores tecnicos.
            </p>
          </section>
        )}
        <div className="space-y-4">
          <SuggestedAlerts alerts={analysis.suggestedAlerts} />
          <section className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <h3 className="text-sm font-semibold text-white">Trazabilidad</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Fuente</dt>
                <dd className="text-right text-slate-200">{analysis.sourceLabel}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Fetch</dt>
                <dd className="text-right font-mono text-slate-200">{new Date(analysis.fetchedAt).toLocaleString("es-AR")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Ultima vela</dt>
                <dd className="text-right font-mono text-slate-200">{new Date(analysis.lastBarTime).toLocaleString("es-AR")}</dd>
              </div>
            </dl>
            {analysis.providerFailures.length ? (
              <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">Fallbacks intentados</p>
                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                  {analysis.providerFailures.map((failure) => (
                    <li key={`${failure.provider}-${failure.message}`}>
                      {failure.provider}: {failure.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {analysis.notes.length ? (
              <ul className="mt-4 space-y-1 text-xs text-slate-400">
                {analysis.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </section>
          <p className="rounded-lg border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-slate-400">
            {analysis.disclaimer}
          </p>
        </div>
      </div>
    </div>
  );
}
