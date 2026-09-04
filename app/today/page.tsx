"use client";

import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  Clock3,
  Eye,
  Globe2,
  MapPin,
  Minus,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { TodayBrief, TodayBriefMedia, TodayBriefSection, TodayMarketSnapshot } from "@/lib/research/today-brief";

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
    ? "border-sky-300/20 bg-slate-950/55 hover:border-sky-300/40"
    : item.market === "crypto"
      ? "border-violet-300/20 bg-slate-950/55 hover:border-violet-300/40"
      : "border-cyan-300/15 bg-slate-950/55 hover:border-cyan-300/35";
  const badge = item.market === "argentina"
    ? "border-sky-300/20 bg-sky-300/10 text-sky-200"
    : item.market === "crypto"
      ? "border-violet-300/20 bg-violet-300/10 text-violet-200"
      : "border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200";
  return (
    <article className={`relative overflow-hidden rounded-md border p-4 transition ${palette}`}>
      <span className={`absolute inset-y-0 left-0 w-0.5 ${item.market === "argentina" ? "bg-sky-300" : item.market === "crypto" ? "bg-violet-300" : "bg-cyan-300"}`} />
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
    </article>
  );
}

type EditorialAccent = "cyan" | "blue" | "amber" | "violet" | "rose";

const editorialPalettes: Record<EditorialAccent, { panel: string; icon: string; dot: string; rule: string }> = {
  cyan: { panel: "border-white/10 bg-slate-950/45", icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-300", dot: "bg-cyan-300", rule: "bg-cyan-300" },
  blue: { panel: "border-white/10 bg-slate-950/45", icon: "border-sky-300/25 bg-sky-300/10 text-sky-300", dot: "bg-sky-300", rule: "bg-sky-300" },
  amber: { panel: "border-white/10 bg-slate-950/45", icon: "border-amber-300/25 bg-amber-300/10 text-amber-300", dot: "bg-amber-300", rule: "bg-amber-300" },
  violet: { panel: "border-white/10 bg-slate-950/45", icon: "border-violet-300/25 bg-violet-300/10 text-violet-300", dot: "bg-violet-300", rule: "bg-violet-300" },
  rose: { panel: "border-white/10 bg-slate-950/45", icon: "border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-300", dot: "bg-fuchsia-300", rule: "bg-fuchsia-300" },
};

function NewsPhoto({ media, isSpanish }: { media: TodayBriefMedia; isSpanish: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <a href={media.url} target="_blank" rel="noopener noreferrer" className="group block border-b border-white/10">
      <figure className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- Editorial RSS images use multiple publisher domains. */}
        <img src={media.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-44 w-full object-cover grayscale-[15%] transition duration-300 group-hover:grayscale-0 sm:h-52" />
        <figcaption className="absolute inset-x-0 bottom-0 bg-black/75 px-4 py-2.5 text-[11px] text-slate-200 backdrop-blur-sm">
          {isSpanish ? "Imagen de actualidad" : "News image"} · {media.publisher}
        </figcaption>
      </figure>
    </a>
  );
}

function EditorialSection({ section, icon: Icon, accent = "cyan", media, isSpanish }: { section: TodayBriefSection; icon: typeof Globe2; accent?: EditorialAccent; media?: TodayBriefMedia; isSpanish: boolean }) {
  const palette = editorialPalettes[accent];
  return (
    <section className={`relative overflow-hidden rounded-lg border ${palette.panel}`}>
      <span className={`absolute inset-y-0 left-0 z-10 w-0.5 ${palette.rule}`} />
      {media ? <NewsPhoto media={media} isSpanish={isSpanish} /> : null}
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
  const activeRequestRef = useRef<AbortController | null>(null);

  const loadBrief = useCallback(async () => {
    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/research/today?language=${language}`, { signal: controller.signal });
      const payload = await response.json() as TodayBrief & { error?: string };
      if (!response.ok) throw new Error(payload.error ?? "Brief unavailable");
      if (controller.signal.aborted) return;
      setBrief(payload);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : (isSpanish ? "No se pudo cargar el informe." : "The brief could not be loaded."));
    } finally {
      if (activeRequestRef.current === controller) setLoading(false);
    }
  }, [isSpanish, language]);

  useEffect(() => {
    queueMicrotask(() => { void loadBrief(); });
    return () => activeRequestRef.current?.abort();
  }, [loadBrief]);

  const internationalMedia = brief?.featuredNews?.find((item) => item.market === "international");
  const argentinaMedia = brief?.featuredNews?.find((item) => item.market === "argentina");

  return (
    <AppShell>
      {loading ? <TodayLoading isSpanish={isSpanish} /> : error || !brief ? (
        <div className="py-6"><section className="cma-panel p-6"><p role="alert" className="text-sm text-rose-300">{error ?? (isSpanish ? "El informe no está disponible." : "The brief is unavailable.")}</p><button type="button" onClick={() => void loadBrief()} className="mt-4 rounded-md bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950">{isSpanish ? "Reintentar" : "Try again"}</button></section></div>
      ) : (
        <div className="space-y-5 py-6">
          <section className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/70 p-5 shadow-sm sm:p-7">
            <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-cyan-300" />
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
                  <span className="inline-flex items-center gap-2"><Activity size={15} aria-hidden="true" />{isSpanish ? "CMA HOY" : "CMA TODAY"}</span>
                  <span className="text-slate-700">/</span>
                  <span className="normal-case tracking-normal text-slate-500">{formatTimestamp(brief.generatedAt, locale)}</span>
                </div>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">{brief.title}</h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">{brief.deck}</p>
              </div>
              <div className={`shrink-0 rounded-lg border px-4 py-3 ${brief.tone === "constructive" ? "border-emerald-300/25 bg-emerald-300/10" : brief.tone === "cautious" ? "border-amber-300/25 bg-amber-300/10" : "border-cyan-300/20 bg-cyan-300/10"}`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{isSpanish ? "Sesgo de mercado" : "Market bias"}</p>
                <p className={`mt-1 text-sm font-semibold ${brief.tone === "constructive" ? "text-emerald-200" : brief.tone === "cautious" ? "text-amber-200" : "text-cyan-200"}`}>{brief.toneLabel}</p>
                <p className="mt-2 text-[11px] text-slate-500">{isSpanish ? "CMA Research · actualización automática" : "CMA Research · automatic update"}</p>
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
            <EditorialSection section={brief.day} icon={Clock3} isSpanish={isSpanish} />
            <EditorialSection section={brief.week} icon={CalendarRange} accent="violet" isSpanish={isSpanish} />
            <EditorialSection section={brief.international} icon={Globe2} accent="blue" media={internationalMedia} isSpanish={isSpanish} />
            <EditorialSection section={brief.argentina} icon={MapPin} accent="amber" media={argentinaMedia} isSpanish={isSpanish} />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
            <EditorialSection section={brief.outlook} icon={Eye} accent="rose" isSpanish={isSpanish} />
            <section className="relative overflow-hidden rounded-lg border border-emerald-300/20 bg-slate-950/55 p-5 sm:p-6">
              <span className="absolute inset-y-0 left-0 w-0.5 bg-emerald-300" />
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-300">{isSpanish ? "Postura sugerida" : "Suggested stance"}</p>
              <h2 className="mt-2 text-xl font-semibold text-emerald-100">{brief.recommendedStance.label}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">{brief.recommendedStance.rationale}</p>
              <ul className="mt-4 space-y-2">{brief.recommendedStance.actions.map((action) => <li key={action} className="flex gap-2 text-sm text-slate-300"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />{action}</li>)}</ul>
              <div className="mt-5 border-t border-emerald-300/15 pt-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/70">{isSpanish ? "Qué invalida esta lectura" : "What invalidates this view"}</p><p className="mt-2 text-xs leading-5 text-slate-400">{brief.recommendedStance.invalidation}</p></div>
            </section>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="cma-panel border border-violet-300/15 bg-slate-950/45 p-5 sm:p-6"><div className="flex items-center gap-2"><Eye size={17} className="text-violet-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-white">{isSpanish ? "Radar para las próximas horas" : "Radar for the next hours"}</h2></div><ul className="mt-4 grid gap-3 sm:grid-cols-2">{brief.watchlist.map((item) => <li key={item} className="rounded-md border border-white/10 bg-white/[0.025] p-3 text-sm text-slate-300">{item}</li>)}</ul></section>
            <section className="cma-panel border border-amber-300/15 bg-slate-950/45 p-5 sm:p-6"><div className="flex items-center gap-2"><ShieldAlert size={17} className="text-amber-300" aria-hidden="true" /><h2 className="text-lg font-semibold text-white">{isSpanish ? "Riesgos de la lectura" : "Risks to the view"}</h2></div><ul className="mt-4 space-y-3">{brief.risks.map((item) => <li key={item} className="flex gap-3 text-sm text-slate-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />{item}</li>)}</ul></section>
          </div>

          <p className="border-t border-white/10 pt-4 text-xs leading-5 text-slate-600">{brief.disclaimer}</p>
        </div>
      )}
    </AppShell>
  );
}
