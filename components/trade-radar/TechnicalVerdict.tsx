"use client";

import type { TradeRadarAnalysis } from "@/lib/technical/trade-radar";
import {
  formatTradeRadarDelay,
  formatTradeRadarMarket,
  formatTradeRadarProvider,
  formatTradeRadarSignalKey,
  formatTradeRadarStatus,
} from "@/lib/technical/trade-radar-labels";

type TechnicalVerdictProps = {
  analysis: TradeRadarAnalysis;
};

function badgeClass(delay: TradeRadarAnalysis["dataDelay"]) {
  if (delay === "realtime") return "border-emerald-300/35 bg-emerald-300/10 text-emerald-100";
  if (delay === "delayed") return "border-amber-300/35 bg-amber-300/10 text-amber-100";
  if (delay === "eod") return "border-blue-300/35 bg-blue-300/10 text-blue-100";
  return "border-slate-400/25 bg-slate-500/10 text-slate-200";
}

export function TechnicalVerdict({ analysis }: TechnicalVerdictProps) {
  return (
    <section className="cma-panel cma-module-technical p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="cma-kicker">CMA Trade Radar</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {analysis.symbol} <span className="text-slate-400">/ {analysis.interval}</span>
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">{analysis.operativeSummary}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {analysis.badges.map((badge) => (
            <span key={badge} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-200">
              {badge}
            </span>
          ))}
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(analysis.dataDelay)}`}>
            {formatTradeRadarDelay(analysis.dataDelay)}
          </span>
          <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold text-cyan-100">
            {formatTradeRadarProvider(analysis.provider)}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300">
            {analysis.candlesUsed} velas
          </span>
        </div>
      </div>

      <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <dt className="text-slate-500">Ultima vela</dt>
          <dd className="mt-1 font-mono text-slate-200">{new Date(analysis.lastBarTime).toLocaleString("es-AR")}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Moneda</dt>
          <dd className="mt-1 text-slate-200">{analysis.currency}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Mercado</dt>
          <dd className="mt-1 text-slate-200">{formatTradeRadarMarket(analysis.market)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Simbolo resuelto</dt>
          <dd className="mt-1 font-mono text-slate-200">{analysis.resolvedSymbol}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Muestra</dt>
          <dd className="mt-1 text-slate-200">{analysis.sampleStatus === "ok" ? "Suficiente" : "Insuficiente"}</dd>
        </div>
      </dl>

      {analysis.signals ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {Object.entries(analysis.signals).map(([key, value]) => (
            <div key={key} className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{formatTradeRadarSignalKey(key)}</p>
              <p className="mt-2 text-sm font-semibold text-white">{formatTradeRadarStatus(key, value)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-amber-300/25 bg-amber-300/10 p-4 text-sm text-amber-100">
          Muestra insuficiente: no se emiten senales operativas hasta contar con al menos 220 velas.
        </div>
      )}

      {analysis.omittedIndicators.length ? (
        <p className="mt-4 text-xs text-slate-400">
          Indicadores omitidos por falta de datos: {analysis.omittedIndicators.join(", ")}.
        </p>
      ) : null}
      {analysis.market === "cedear" ? (
        <p className="mt-3 text-xs leading-5 text-amber-100">
          El CEDEAR puede diferir del subyacente por CCL/MEP implicito, ratio de conversion, liquidez, plazo y spread.
        </p>
      ) : null}
    </section>
  );
}
