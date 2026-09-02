"use client";

import Image from "next/image";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Clock3,
  ExternalLink,
  Eye,
  Globe2,
  MapPin,
  Minus,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { TodayBrief, TodayBriefSection, TodayMarketSnapshot } from "@/lib/research/today-brief";

function formatTimestamp(value: string, locale: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function formatPrice(snapshot: TodayMarketSnapshot, locale: string) {
  if (snapshot.price === null) return "N/D";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: snapshot.currency,
      maximumFractionDigits: snapshot.price < 100 ? 2 : 0,
    }).format(snapshot.price);
  } catch {
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(snapshot.price);
  }
}

function changeColor(value: number | null) {
  if (value === null) return "text-slate-500";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-400";
}

function ChangeIcon({ value }: { value: number | null }) {
  if (value === null || value === 0) return <Minus size={14} aria-hidden="true" />;
  return value > 0 ? <ArrowUpRight size={14} aria-hidden="true" /> : <ArrowDownRight size={14} aria-hidden="true" />;
}

function SnapshotCard({ item, locale, isSpanish }: { item: TodayMarketSnapshot; locale: string; isSpanish: boolean }) {
  const palette = item.market === "argentina"
    ? "border-sky-300/20 bg-[linear-gradient(145deg,rgba(14,165,233,0.11),rgba(2,6,23,0.62)_58%)] hover:border-sky-300/45"
    : item.market === "crypto"
      ? "border-violet-300/20 bg-[linear-gradient(145deg,rgba(139,92,246,0.12),rgba(2,6,23,0.62)_58%)] hover:border-violet-300/45"
      : "border-cyan-300/15 bg-[linear-gradient(145deg,rgba(6,182,212,0.09),rgba(2,6,23,0.62)_58%)] hover:border-cyan-300/40";
  const badge = item.market === "argentina"
    ? "border-sky-300/20 bg-sky-300/10 text-sky-200"
    : item.market === "crypto"
      ? "border-violet-300/20 bg-violet-300/10 text-violet-200"
      : "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200";
  return (
    <article className={`relative overflow-hidden rounded-lg border p-4 transition ${palette}`}>
      <span className={`absolute inset-x-0 top-0 h-px ${item.market === "argentina" ? "bg-gradient-to-r from-transparent via-sky-300/80 to-transparent" : item.market === "crypto" ? "bg-gradient-to-r from-transparent via-violet-300/80 to-transparent" : "bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent"}`} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.symbol}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-white">{item.label}</h3>
        </div>
        <span className={`rounded border px-2 py-1 text-[10px] font-semibold ${badge}`}>
          {item.market === "argentina" ? "AR" : item.market === "crypto" ? "24/7" : "Global"}
        </span>
      </div>
      <p className="mt-4 text-xl font-semibold tabular-nums text-white">{formatPrice(item, locale)}</p>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${changeColor(item.dailyChange)}`}>
          <ChangeIcon value={item.dailyChange} />
          {item.dailyChange === null ? "N/D" : `${item.dailyChange > 0 ? "+" : ""}${item.dailyChange.toFixed(2)}%`}
          <span className="font-normal text-slate-600">{isSpanish ? "día" : "day"}</span>
        </span>
        {item.weeklyChange !== null ? (
          <span className={`font-semibold tabular-nums ${changeColor(item.weeklyChange)}`}>
            {item.weeklyChange > 0 ? "+" : ""}{item.weeklyChange.toFixed(2)}% <span className="font-normal text-slate-600">{isSpanish ? "5 ruedas" : "5 sessions"}</span>
          </span>
        ) : null}
      </div>
      <p className="mt-3 truncate text-[11px] text-slate-600" title={item.sourceLabel}>{item.sourceLabel}</p>
    </article>
  );
}

type EditorialAccent = "cyan" | "blue" | "amber" | "violet" | "rose";

const editorialPalettes: Record<EditorialAccent, { panel: string; icon: string; dot: string }> = {
  cyan: { panel: "border-cyan-300/18 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_42%)]", icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-300", dot: "bg-cyan-300" },
  blue: { panel: "border-sky-300/18 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.11),transparent_42%)]", icon: "border-sky-300/25 bg-sky-300/10 text-sky-300", dot: "bg-sky-300" },
  amber: { panel: "border-amber-300/18 bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.10),transparent_42%)]", icon: "border-amber-300/25 bg-amber-300/10 text-amber-300", dot: "bg-amber-300" },
  violet: { panel: "border-violet-300/18 bg-[radial-gradient(circle_at_top_right,rgba(167,139,250,0.12),transparent_42%)]", icon: "border-violet-300/25 bg-violet-300/10 text-violet-300", dot: "bg-violet-300" },
  rose: { panel: "border-fuchsia-300/18 bg-[radial-gradient(circle_at_top_right,rgba(232,121,249,0.10),transparent_42%)]", icon: "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-300", dot: "bg-fuchsia-300" },
};

function EditorialSection({ section, icon: Icon, accent = "cyan", image, imageAlt }: { section: TodayBriefSection; icon: typeof Globe2; accent?: EditorialAccent; image?: string; imageAlt?: string }) {
  const palette = editorialPalettes[accent];
  return (
    <section className={`cma-panel overflow-hidden border ${palette.panel}`}>
      {image ? (
        <div className="relative h-40 border-b border-white/10 sm:h-48">
          <Image src={image} alt={imageAlt ?? ""} fill sizes="(min-width: 1280px) 50vw, 100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--cma-bg-panel)] via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--cma-bg-panel)] to-transparent" />
        </div>
      ) : null}
      <div className="p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className={`grid h-9 w-9 place-items-center rounded-md border ${palette.icon}`}><Icon size={18} aria-hidden="true" /></span>
          <h2 className="text-xl font-semibold text-white">{section.headline}</h2>
        </div>
        <p className="mt-4 text-[15px] leading-7 text-slate-300">{section.summary}</p>
        {section.points.length ? (
          <ul className="mt-5 space-y-3 border-t border-white/10 pt-4">
            {section.points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-6 text-slate-400">
                <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${palette.dot}`} />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

function TodayLoading({ isSpanish }: { isSpanish: boolean }) {
  return (
    <div className="space-y-5 py-6" aria-live="polite">
      <div className="cma-panel-elevated animate-pulse p-6"><div className="h-4 w-32 rounded bg-white/10" /><div className="mt-5 h-10 max-w-2xl rounded bg-white/10" /><div className="mt-4 h-5 max-w-3xl rounded bg-white/[0.07]" /></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-lg border border-white/10 bg-white/[0.035]" />)}</div>
      <p className="text-sm text-slate-500">{isSpanish ? "Analizando mercado global, Argentina y noticias recientes..." : "Analyzing global markets, Argentina and recent news..."}</p>
    </div>
  );
}

export default function TodayPage() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const locale = isSpanish ? "es-AR" : "en-US";
  const [brief, setBrief] = useState<TodayBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBrief = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research/today?language=${language}`);
      const payload = await response.json() as TodayBrief & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Brief unavailable");
      setBrief(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (isSpanish ? "No se pudo cargar el informe." : "The brief could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [isSpanish, language]);

  useEffect(() => {
    queueMicrotask(() => { void loadBrief(); });
  }, [loadBrief]);

  return (
    <AppShell>
      {loading ? <TodayLoading isSpanish={isSpanish} /> : error || !brief ? (
        <div className="py-6"><section className="cma-panel p-6"><p role="alert" className="text-sm text-rose-300">{error ?? (isSpanish ? "El informe no está disponible." : "The brief is unavailable.")}</p><button type="button" onClick={() => void loadBrief()} className="mt-4 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">{isSpanish ? "Reintentar" : "Try again"}</button></section></div>
      ) : (
        <div className="space-y-5 py-6">
          <section className="relative overflow-hidden rounded-xl border border-cyan-300/25 bg-[radial-gradient(circle_at_88%_10%,rgba(217,70,239,0.16),transparent_27%),radial-gradient(circle_at_68%_90%,rgba(34,211,238,0.15),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-5 shadow-[0_20px_70px_rgba(8,145,178,0.08)] sm:p-7">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/90 to-fuchsia-300/70" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  <span className="inline-flex items-center gap-2"><Activity size={15} aria-hidden="true" />CMA HOY</span>
                  <span className="text-slate-700">/</span>
                  <span className="normal-case tracking-normal text-slate-500">{formatTimestamp(brief.generatedAt, locale)}</span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">{brief.title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{brief.deck}</p>
              </div>
              <div className={`shrink-0 rounded-lg border px-4 py-3 ${brief.tone === "constructive" ? "border-emerald-300/25 bg-emerald-300/10" : brief.tone === "cautious" ? "border-amber-300/25 bg-amber-300/10" : "border-cyan-300/20 bg-cyan-300/10"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{isSpanish ? "Sesgo de mercado" : "Market bias"}</p>
                <p className={`mt-1 text-sm font-semibold ${brief.tone === "constructive" ? "text-emerald-200" : brief.tone === "cautious" ? "text-amber-200" : "text-cyan-200"}`}>{brief.toneLabel}</p>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-500"><Sparkles size={12} aria-hidden="true" />{brief.method === "openai" ? (isSpanish ? "Síntesis asistida por IA" : "AI-assisted synthesis") : (isSpanish ? "Síntesis determinística" : "Deterministic synthesis")}</p>
              </div>
            </div>
          </section>

          <section aria-label={isSpanish ? "Pulso de activos" : "Asset pulse"}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><p className="cma-kicker">{isSpanish ? "Pulso de activos" : "Asset pulse"}</p><h2 className="mt-1 text-xl font-semibold text-white">{isSpanish ? "La rueda en números" : "The session in numbers"}</h2></div>
              <span className="text-xs text-slate-600">{brief.coverage.availableSnapshots}/{brief.coverage.totalSnapshots} {isSpanish ? "datos disponibles" : "data points available"}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{brief.snapshots.map((item) => <SnapshotCard key={`${item.market}-${item.symbol}`} item={item} locale={locale} isSpanish={isSpanish} />)}</div>
          </section>

          <div className="grid gap-5 xl:grid-cols-2">
            <EditorialSection section={brief.day} icon={Clock3} />
            <EditorialSection section={brief.week} icon={CalendarRange} accent="violet" />
            <EditorialSection section={brief.international} icon={Globe2} accent="blue" image="/editorial/global-markets.webp" imageAlt={isSpanish ? "Mercados financieros internacionales" : "International financial markets"} />
            <EditorialSection section={brief.argentina} icon={MapPin} accent="amber" image="/editorial/argentina-markets.webp" imageAlt={isSpanish ? "Mercado financiero argentino" : "Argentina financial market"} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <EditorialSection section={brief.outlook} icon={Eye} accent="rose" />
            <section className="relative overflow-hidden rounded-xl border border-emerald-300/20 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.14),transparent_46%),linear-gradient(145deg,rgba(6,78,59,0.14),rgba(2,6,23,0.76))] p-5 sm:p-6">
              <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/80 to-transparent" />
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">{isSpanish ? "Postura sugerida" : "Suggested stance"}</p>
              <h2 className="mt-2 text-xl font-semibold text-emerald-100">{brief.recommendedStance.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{brief.recommendedStance.rationale}</p>
              <ul className="mt-4 space-y-2">{brief.recommendedStance.actions.map((action) => <li key={action} className="flex gap-2 text-sm text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />{action}</li>)}</ul>
              <div className="mt-5 border-t border-emerald-300/15 pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/70">{isSpanish ? "Qué invalida esta lectura" : "What invalidates this view"}</p><p className="mt-2 text-xs leading-5 text-slate-400">{brief.recommendedStance.invalidation}</p></div>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="cma-panel border border-violet-300/15 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.11),transparent_48%)] p-5 sm:p-6"><div className="flex items-center gap-2"><Eye size={17} className="text-violet-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-white">{isSpanish ? "Radar para las próximas horas" : "Radar for the next hours"}</h2></div><ul className="mt-4 grid gap-3 sm:grid-cols-2">{brief.watchlist.map((item) => <li key={item} className="rounded-md border border-violet-300/15 bg-violet-300/[0.045] p-3 text-sm text-slate-300">{item}</li>)}</ul></section>
            <section className="cma-panel border border-amber-300/15 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.10),transparent_48%)] p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldAlert size={17} className="text-amber-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-white">{isSpanish ? "Riesgos de la lectura" : "Risks to the view"}</h2></div><ul className="mt-4 space-y-3">{brief.risks.map((item) => <li key={item} className="flex gap-3 text-sm text-slate-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />{item}</li>)}</ul></section>
          </div>

          <section className="cma-panel p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="cma-kicker">{isSpanish ? "Trazabilidad" : "Traceability"}</p><h2 className="mt-1 text-xl font-semibold text-white">{isSpanish ? "Fuentes consultadas" : "Sources consulted"}</h2></div><p className="text-xs text-slate-600">{brief.coverage.internationalHeadlines} global · {brief.coverage.argentinaHeadlines} Argentina</p></div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">{brief.sources.map((source) => <a key={`${source.market}-${source.url}`} href={source.url} target="_blank" rel="noopener noreferrer" className={`group rounded-lg border p-4 transition ${source.market === "argentina" ? "border-sky-300/12 bg-sky-300/[0.035] hover:border-sky-300/35" : "border-violet-300/12 bg-violet-300/[0.035] hover:border-violet-300/35"}`}><div className="flex items-start justify-between gap-3"><div><p className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${source.market === "argentina" ? "text-sky-300/60" : "text-violet-300/60"}`}>{source.publisher} · {source.market === "argentina" ? "Argentina" : "Global"}</p><h3 className="mt-2 text-sm font-semibold leading-5 text-slate-300 transition group-hover:text-white">{source.title}</h3>{source.publishedAt ? <p className="mt-2 text-xs text-slate-600">{formatTimestamp(source.publishedAt, locale)}</p> : null}</div><ExternalLink size={15} className={`shrink-0 transition ${source.market === "argentina" ? "text-sky-300/50 group-hover:text-sky-200" : "text-violet-300/50 group-hover:text-violet-200"}`} aria-hidden="true" /></div></a>)}</div>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-slate-600">{brief.disclaimer}</p>
          </section>
        </div>
      )}
    </AppShell>
  );
}
