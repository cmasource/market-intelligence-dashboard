"use client";

import { AlertTriangle, ExternalLink } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { CaucionAlert, CaucionQuote } from "@/lib/argentina/cauciones";

type CaucionesResponse = {
  updatedAt?: string;
  source?: {
    name: string;
    url: string;
  };
  quotes?: CaucionQuote[];
  alert?: CaucionAlert | null;
  error?: string;
};

function formatRate(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })}%`;
}

function formatPoints(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("es-AR", { maximumFractionDigits: 2 })} pp`;
}

function formatVolume(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
    notation: value >= 1_000_000_000 ? "compact" : "standard",
  });
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function CaucionesPanel() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [payload, setPayload] = useState<CaucionesResponse>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/research/cauciones", { signal: controller.signal })
      .then((response) => response.json() as Promise<CaucionesResponse>)
      .then(setPayload)
      .catch(() => setPayload({ quotes: [], alert: null, error: "No se pudieron cargar las cauciones." }))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  const quotes = useMemo(() => payload.quotes ?? [], [payload.quotes]);
  const highlights = useMemo(() => [1, 7, 30].map((term) => quotes.find((quote) => quote.termDays === term)).filter((quote): quote is CaucionQuote => Boolean(quote)), [quotes]);

  return (
    <section className="cma-panel overflow-hidden" data-testid="cauciones-panel">
      <div className="border-b border-white/10 px-4 py-5 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="cma-kicker">{isSpanish ? "Financiamiento garantizado" : "Secured financing"}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{isSpanish ? "Cauciones bursatiles" : "Market repos"}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              {isSpanish
                ? "Tasas TNA por plazo en pesos. La caucion 1D se monitorea para detectar saltos bruscos de tasa."
                : "ARS APR rates by term. The 1D repo is monitored for abrupt rate jumps."}
            </p>
          </div>
          {payload.source ? (
            <a href={payload.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-white">
              {isSpanish ? "Ver fuente" : "View source"} <ExternalLink size={13} aria-hidden="true" />
            </a>
          ) : null}
        </div>
      </div>

      {payload.alert ? (
        <div className="border-b border-amber-300/20 bg-amber-300/[0.08] px-4 py-4 sm:px-5" role="alert">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-amber-300/15 text-amber-200">
                <AlertTriangle size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold text-amber-100">{isSpanish ? "Alerta en caucion 1D" : "1D repo alert"}</p>
                <p className="mt-1 text-sm leading-6 text-amber-50/80">{payload.alert.message}</p>
              </div>
            </div>
            <span className="shrink-0 rounded-md bg-slate-950/60 px-3 py-2 text-sm font-semibold tabular-nums text-amber-100">
              {formatPoints(payload.alert.increasePoints)}
            </span>
          </div>
        </div>
      ) : null}

      {highlights.length ? (
        <div className="grid gap-px bg-white/10 sm:grid-cols-3">
          {highlights.map((quote) => (
            <article key={quote.label} className="bg-cyan-300/[0.045] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{quote.termDays}D</p>
              <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{formatRate(quote.rateTna)}</p>
              <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                <span className="text-slate-500">TNA</span>
                <span className={`${(quote.variationPoints ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{formatPoints(quote.variationPoints)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-white/[0.035] text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{isSpanish ? "Plazo" : "Term"}</th>
              <th className="px-4 py-3">TNA</th>
              <th className="px-4 py-3">{isSpanish ? "Var. diaria" : "Daily change"}</th>
              <th className="px-4 py-3">{isSpanish ? "Cierre previo" : "Previous close"}</th>
              <th className="px-4 py-3">{isSpanish ? "Toma" : "Bid"}</th>
              <th className="px-4 py-3">{isSpanish ? "Coloca" : "Ask"}</th>
              <th className="px-4 py-3">{isSpanish ? "Min / Max" : "Low / High"}</th>
              <th className="px-4 py-3">{isSpanish ? "Volumen" : "Volume"}</th>
              <th className="px-4 py-3">{isSpanish ? "Ultima operacion" : "Last quote"}</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((quote) => (
              <tr key={quote.label} className={`border-t border-white/10 ${quote.termDays === 1 ? "bg-cyan-300/[0.055]" : "hover:bg-white/[0.035]"}`}>
                <td className="px-4 py-3 font-semibold text-white">{quote.termDays}D</td>
                <td className="px-4 py-3 font-semibold tabular-nums text-slate-100">{formatRate(quote.rateTna)}</td>
                <td className={`px-4 py-3 font-semibold tabular-nums ${(quote.variationPoints ?? 0) >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                  {formatPoints(quote.variationPoints)}
                </td>
                <td className="px-4 py-3 tabular-nums text-slate-300">{formatRate(quote.previousRateTna)}</td>
                <td className="px-4 py-3 tabular-nums text-slate-300">{formatRate(quote.bidRateTna)}</td>
                <td className="px-4 py-3 tabular-nums text-slate-300">{formatRate(quote.askRateTna)}</td>
                <td className="px-4 py-3 tabular-nums text-slate-300">{formatRate(quote.minRateTna)} / {formatRate(quote.maxRateTna)}</td>
                <td className="px-4 py-3 tabular-nums text-slate-300">{formatVolume(quote.volume)}</td>
                <td className="px-4 py-3 text-slate-400">{formatDateTime(quote.lastQuote)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? <p className="border-t border-white/10 p-5 text-sm text-slate-400">{isSpanish ? "Cargando cauciones..." : "Loading repos..."}</p> : null}
      {!loading && !quotes.length ? (
        <p className="border-t border-white/10 p-5 text-sm text-slate-400">
          {payload.error ?? (isSpanish ? "No hay cauciones disponibles en este momento." : "No repo rates are available right now.")}
        </p>
      ) : null}
    </section>
  );
}
