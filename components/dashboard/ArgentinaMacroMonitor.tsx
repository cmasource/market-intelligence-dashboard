"use client";

import { ExternalLink } from "lucide-react";
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

  const macro = useMemo(() => metrics.filter((metric) => [1, 27, 28, 30, 12, 29].includes(metric.id)), [metrics]);

  return (
    <section className="cma-panel overflow-hidden">
      <div className="border-b border-white/10 px-5 py-5 sm:px-6">
        <p className="cma-kicker">{isSpanish ? "Monitor argentino" : "Argentina monitor"}</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">{isSpanish ? "Datos macro y rendimientos en pesos" : "Macro data and peso yields"}</h2>
          <a href="https://www.bcra.gob.ar/estadisticas-indicadores/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-white">
            BCRA <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-px bg-white/10 sm:grid-cols-2 xl:grid-cols-3">
          {macro.map((metric) => {
            const positive = (metric.change ?? 0) >= 0;
            const date = new Date(`${metric.date}T12:00:00`).toLocaleDateString(isSpanish ? "es-AR" : "en-US", { day: "2-digit", month: "short" });
            return (
              <article key={metric.id} className="min-h-32 bg-slate-950/75 p-4">
                <p className="max-w-44 text-xs font-semibold uppercase leading-5 text-slate-400">{metric.label}</p>
                <p className="mt-3 text-xl font-semibold tabular-nums text-white">{formatMetric(metric)}</p>
                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-500">{metric.unit}</span>
                  {typeof metric.change === "number" ? (
                    <span className={`tabular-nums ${positive ? "text-emerald-300" : "text-rose-300"}`}>
                      {positive ? "+" : "-"}{Math.abs(metric.change).toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-[11px] text-slate-600">{isSpanish ? "Actualizado" : "Updated"} {date}</p>
              </article>
            );
          })}
          {exchangeRates.length ? (
            <div className="grid bg-slate-950/75 sm:col-span-2 sm:grid-cols-3 xl:col-span-3">
              {exchangeRates.map((rate) => (
                <article key={rate.code} className="border-t border-white/10 p-4 sm:border-r sm:last:border-r-0">
                  <p className="text-xs font-semibold uppercase text-slate-500">{rate.code} / ARS</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums text-white">{rate.value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{rate.label}</p>
                </article>
              ))}
            </div>
          ) : null}
        </div>

        <div className="border-t border-white/10 bg-violet-400/[0.055] p-4 lg:border-l lg:border-t-0 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-violet-200">{isSpanish ? "Cuentas remuneradas" : "Interest-bearing accounts"}</p>
              <p className="mt-1 text-sm text-slate-400">{isSpanish ? "TNA publicada, con topes y condiciones" : "Published APR, caps and conditions"}</p>
            </div>
            <a href="https://comparatasas.ar/metodologia/" target="_blank" rel="noopener noreferrer" aria-label={isSpanish ? "Ver metodologia" : "View methodology"} className="grid h-9 w-9 place-items-center rounded-md border border-violet-300/20 text-violet-100 hover:bg-violet-300/10">
              <ExternalLink size={16} />
            </a>
          </div>
          <div className="mt-4 divide-y divide-white/8">
            {rates.slice(0, 6).map((rate) => (
              <article key={`${rate.name}-${rate.date}`} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{rate.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{rate.conditions ?? (isSpanish ? "Sin tope informado" : "No cap reported")}</p>
                </div>
                <p className="text-right text-base font-semibold tabular-nums text-emerald-300">{rate.tna.toFixed(1)}% <span className="block text-[10px] font-normal text-slate-500">TNA</span></p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
