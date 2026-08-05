"use client";

import { ArrowDownRight, ArrowUpRight, ExternalLink, Landmark, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";

type MacroMetric = {
  id: number;
  label: string;
  unit: string;
  value: number;
  date: string;
  change: number | null;
  series: Array<{ fecha: string; valor: number }>;
  source?: string;
  sourceUrl?: string;
};

type WalletRate = { name: string; tna: number; tea: number; cap: number | null; date: string; conditions: string | null };
type ExchangeRate = { code: string; label: string; value: number; currency: string; date: string | null };

function formatMetric(metric: MacroMetric) {
  const maximumFractionDigits = metric.id === 1 ? 0 : metric.id === 30 || metric.id === 31 ? 2 : 1;
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits }).format(metric.value);
}

export function ArgentinaMacroMonitor() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [metrics, setMetrics] = useState<MacroMetric[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [rates, setRates] = useState<WalletRate[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch("/api/research/argentina-macro", { signal: controller.signal }).then((response) => response.json() as Promise<{ metrics?: MacroMetric[]; exchangeRates?: ExchangeRate[] }>),
      fetch("/api/research/wallet-rates", { signal: controller.signal }).then((response) => response.json() as Promise<{ rates?: WalletRate[] }>),
    ]).then(([macroResult, walletResult]) => {
      if (controller.signal.aborted) return;
      if (macroResult.status === "fulfilled") {
        setMetrics(macroResult.value.metrics ?? []);
        setExchangeRates(macroResult.value.exchangeRates ?? []);
      }
      if (walletResult.status === "fulfilled") setRates(walletResult.value.rates ?? []);
    });
    return () => controller.abort();
  }, []);

  const macro = useMemo(() => metrics.filter((metric) => [1, 27, 28, 30, 31, 12, 29].includes(metric.id)), [metrics]);

  return (
    <section className="cma-panel overflow-hidden">
      <header className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-cyan-300/20 bg-cyan-300/8 text-cyan-200"><Landmark size={19} aria-hidden="true" /></span>
          <div><p className="cma-kicker">{isSpanish ? "Monitor argentino" : "Argentina monitor"}</p><h2 className="mt-1 text-2xl font-semibold text-white">{isSpanish ? "Datos macro y rendimientos en pesos" : "Macro data and peso yields"}</h2><p className="mt-1 text-sm text-slate-400">{isSpanish ? "Indicadores monetarios, cambiarios y tasas comparables." : "Comparable monetary, FX and rate indicators."}</p></div>
        </div>
        <a href="https://www.bcra.gob.ar/estadisticas-indicadores/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md border border-white/10 px-3 text-xs font-semibold text-cyan-200 transition hover:bg-white/[0.05] hover:text-white">BCRA <ExternalLink size={13} aria-hidden="true" /></a>
      </header>

      <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.75fr)]">
        <div className="min-w-0 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {macro.map((metric) => {
              const positive = (metric.change ?? 0) >= 0;
              const date = new Date(`${metric.date}T12:00:00`).toLocaleDateString(isSpanish ? "es-AR" : "en-US", { day: "2-digit", month: "short" });
              const ChangeIcon = positive ? ArrowUpRight : ArrowDownRight;
              return (
                <article key={metric.id} className="rounded-md border border-white/8 bg-white/[0.025] px-3.5 py-3 transition hover:border-cyan-300/15 hover:bg-cyan-300/[0.025]">
                  <div className="flex min-h-10 items-start justify-between gap-3"><p className="text-[11px] font-semibold uppercase leading-4 text-slate-400">{metric.label}</p>{typeof metric.change === "number" ? <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${positive ? "text-emerald-300" : "text-rose-300"}`}><ChangeIcon size={12} />{Math.abs(metric.change).toLocaleString("es-AR", { maximumFractionDigits: 2 })}</span> : null}</div>
                  <div className="mt-2 flex items-baseline gap-2"><p className="text-xl font-semibold tabular-nums text-white">{formatMetric(metric)}</p><span className="text-[11px] text-slate-500">{metric.unit}</span></div>
                  <p className="mt-2 text-[10px] text-slate-600">
                    {isSpanish ? "Actualizado" : "Updated"} {date}
                    {metric.source ? <> · {metric.sourceUrl ? <a href={metric.sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-cyan-200">{metric.source}</a> : metric.source}</> : null}
                  </p>
                </article>
              );
            })}
          </div>
          {exchangeRates.length ? <div className="mt-4 border-t border-white/8 pt-4"><p className="mb-2 text-[11px] font-semibold uppercase text-slate-500">{isSpanish ? "Tipo de cambio de referencia" : "Reference exchange rates"}</p><div className="grid gap-2 sm:grid-cols-3">{exchangeRates.map((rate) => <article key={rate.code} className="flex items-center justify-between gap-3 rounded-md bg-slate-950/55 px-3 py-2.5"><div><p className="text-[11px] font-semibold text-slate-400">{rate.code} / ARS</p><p className="mt-0.5 max-w-24 truncate text-[10px] text-slate-600">{rate.label}</p></div><p className="text-base font-semibold tabular-nums text-slate-100">{rate.value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</p></article>)}</div></div> : null}
        </div>

        <aside className="border-t border-white/10 bg-violet-400/[0.035] p-4 xl:border-l xl:border-t-0 sm:p-5">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2.5"><span className="grid h-8 w-8 place-items-center rounded-md bg-violet-300/10 text-violet-200"><WalletCards size={16} /></span><div><p className="text-xs font-semibold uppercase text-violet-200">{isSpanish ? "Cuentas remuneradas" : "Interest-bearing accounts"}</p><p className="mt-0.5 text-xs text-slate-500">{isSpanish ? "Ordenadas por TNA publicada" : "Ranked by published APR"}</p></div></div><a href="https://comparatasas.ar/metodologia/" target="_blank" rel="noopener noreferrer" aria-label={isSpanish ? "Ver metodologia" : "View methodology"} className="grid h-8 w-8 place-items-center rounded-md border border-violet-300/15 text-violet-100 hover:bg-violet-300/10"><ExternalLink size={14} /></a></div>
          <ol className="mt-4 divide-y divide-white/8">{rates.slice(0, 6).map((rate, index) => <li key={`${rate.name}-${rate.date}`} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-2.5 py-2.5"><span className="text-xs font-semibold tabular-nums text-slate-600">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-100">{rate.name}</p><p className="mt-0.5 truncate text-[11px] text-slate-500">{rate.conditions ?? (isSpanish ? "Sin tope informado" : "No cap reported")}</p></div><div className="text-right"><p className="text-base font-semibold tabular-nums text-emerald-300">{rate.tna.toFixed(1)}%</p><p className="text-[9px] uppercase text-slate-600">TNA</p></div></li>)}</ol>
        </aside>
      </div>
    </section>
  );
}
