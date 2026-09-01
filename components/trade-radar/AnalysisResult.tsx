"use client";

import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";
import { WatchlistButton } from "@/components/watchlist/WatchlistButton";
import { watchlistItemFromInstrument } from "@/lib/watchlist";
import { IndicatorCards } from "./IndicatorCards";
import { BymaLocalQuoteTable } from "./BymaLocalQuoteTable";
import { LevelsTable } from "./LevelsTable";
import { SuggestedAlerts } from "./SuggestedAlerts";
import { TechnicalVerdict } from "./TechnicalVerdict";
import { TradeRadarTechnicalChart } from "./TradeRadarTechnicalChart";
import {
  formatTradeRadarCoverage,
  formatTradeRadarProviderFailure,
  formatTradeRadarSource,
} from "@/lib/technical/trade-radar-labels";

type AnalysisResultProps = {
  analysis: TradeRadarAnalysis;
};

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  const watchlistItem = analysis.instrument
    ? watchlistItemFromInstrument(analysis.instrument)
    : {
        symbol: analysis.symbol,
        displaySymbol: analysis.symbol,
        normalizedSymbol: analysis.resolvedSymbol,
        providerSymbol: analysis.resolvedSymbol,
        name: analysis.symbol,
        assetType: analysis.market,
        market: analysis.market,
        currency: analysis.currency,
      };

  return (
    <div className="min-w-0 space-y-5 overflow-x-clip">
      <section className="cma-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[var(--cma-text-primary)]">Seguimiento del activo</h2>
          <p className="mt-1 text-xs text-[var(--cma-text-muted)]">Guardalo en una o varias listas sin registrar una posición.</p>
        </div>
        <WatchlistButton item={watchlistItem} />
      </section>
      <TechnicalVerdict analysis={analysis} />
      {analysis.localLayer ? <BymaLocalQuoteTable quote={analysis.localLayer.quote} /> : null}
      <IndicatorCards analysis={analysis} />
      <LevelsTable supports={analysis.levels.supports} resistances={analysis.levels.resistances} />
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {analysis.ohlcv.length ? (
          <TradeRadarTechnicalChart analysis={analysis} />
        ) : (
          <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
            <h3 className="text-lg font-semibold text-white">Grafico tecnico no disponible</h3>
            <p className="mt-2 text-sm leading-6 text-amber-100">
              BYMA entrego cotizacion local, pero no hay historico OHLCV suficiente para calcular indicadores tecnicos.
            </p>
          </section>
        )}
        <div className="min-w-0 space-y-4">
          <SuggestedAlerts alerts={analysis.suggestedAlerts} />
          <section className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <h3 className="text-sm font-semibold text-white">Trazabilidad</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Fuente</dt>
                <dd className="text-right text-slate-200">{formatTradeRadarSource(analysis.sourceLabel)}</dd>
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
                      {formatTradeRadarProviderFailure(failure.message)}
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
            {analysis.warnings.length ? (
              <div className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-100">Advertencias del instrumento</p>
                <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-50/90">
                  {analysis.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {analysis.dataCoverage.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.dataCoverage.map((capability) => (
                  <span key={capability} className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[0.68rem] text-slate-300">
                    {formatTradeRadarCoverage(capability)}
                  </span>
                ))}
              </div>
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
