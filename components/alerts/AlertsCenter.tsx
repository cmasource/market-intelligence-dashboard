"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, CheckCheck, ExternalLink, Settings2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getWatchlistRepository, setWatchlistUser, type Watchlist } from "@/lib/watchlist";
import { createClient } from "@/lib/supabase/client";
import { ALERTS_UPDATED_EVENT, getDeliveredAlerts, markAlertRead, markAllAlertsRead, type AlertEventRecord } from "@/lib/alerts/client";
import type { AlertCategory, AlertSeverity } from "@/lib/alerts";

const categoryLabels: Record<AlertCategory, { es: string; en: string }> = {
  unusual_price_move: { es: "Movimiento inusual", en: "Unusual move" }, unusual_volume: { es: "Volumen inusual", en: "Unusual volume" },
  trend_change: { es: "Cambio de tendencia", en: "Trend change" }, elevated_volatility: { es: "Volatilidad elevada", en: "Elevated volatility" },
  technical_change: { es: "Cambio técnico", en: "Technical change" }, opportunity: { es: "Oportunidad", en: "Opportunity" },
  bond_event: { es: "Evento de bono", en: "Bond event" }, corporate_bond_event: { es: "Evento de ON", en: "Corporate-bond event" },
  material_news: { es: "Noticia material", en: "Material news" }, arbitrage_opportunity: { es: "Arbitraje", en: "Arbitrage" },
};

const severityStyle: Record<AlertSeverity, string> = {
  informational: "border-slate-400/25 text-slate-300", low: "border-sky-300/25 text-sky-200", medium: "border-cyan-300/30 text-cyan-100",
  high: "border-amber-300/35 text-amber-200", critical: "border-rose-300/35 text-rose-200",
};

export function AlertsCenter() {
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<AlertEventRecord[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [severity, setSeverity] = useState("all");
  const [category, setCategory] = useState("all");
  const [watchlistId, setWatchlistId] = useState("all");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");

  const load = useCallback(async () => {
    try {
      const { data } = await createClient().auth.getUser();
      setWatchlistUser(data.user?.id ?? null);
      const [nextAlerts, lists] = await Promise.all([getDeliveredAlerts(), getWatchlistRepository().getWatchlists()]);
      setAlerts(nextAlerts); setWatchlists(lists); setError(null);
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Unable to load alerts."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { queueMicrotask(() => { void load(); }); window.addEventListener(ALERTS_UPDATED_EVENT, load); return () => window.removeEventListener(ALERTS_UPDATED_EVENT, load); }, [load]);

  const listNames = useMemo(() => new Map(watchlists.map((list) => [list.id, list.name])), [watchlists]);
  const visible = alerts.filter((alert) => {
    const needle = query.trim().toLowerCase();
    return (!unreadOnly || !alert.readAt)
      && (severity === "all" || alert.severity === severity)
      && (category === "all" || alert.category === category)
      && (watchlistId === "all" || alert.watchlistId === watchlistId)
      && (!date || alert.triggeredAt.slice(0, 10) === date)
      && (!needle || `${alert.instrumentId} ${alert.title} ${alert.summary}`.toLowerCase().includes(needle));
  });
  const unreadIds = alerts.filter((alert) => !alert.readAt).map((alert) => alert.id);

  async function read(id: string) { await markAlertRead(id); await load(); }
  async function readAll() { await markAllAlertsRead(unreadIds); await load(); }

  return (
    <AppShell>
      <div className="space-y-5">
        <header className="cma-panel-elevated p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cma-accent-cyan)]">CMA Market Intelligence</p><h1 className="mt-2 text-3xl font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "Centro de alertas" : "Alert center"}</h1><p className="mt-2 text-sm text-[var(--cma-text-secondary)]">{language === "es" ? `${unreadIds.length} alertas no leídas. Señales informativas basadas en datos verificables.` : `${unreadIds.length} unread alerts. Informational signals based on verifiable data.`}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" disabled={!unreadIds.length} onClick={() => void readAll()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm text-[var(--cma-text-secondary)] disabled:opacity-40"><CheckCheck size={16} />{language === "es" ? "Marcar todas como leídas" : "Mark all as read"}</button><Link href="/account/alerts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100"><Settings2 size={16} />{language === "es" ? "Preferencias" : "Preferences"}</Link></div>
          </div>
        </header>

        <section aria-label={language === "es" ? "Filtros de alertas" : "Alert filters"} className="grid gap-3 rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Instrumento" : "Instrument"}<input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm" /></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Severidad" : "Severity"}<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">{language === "es" ? "Todas" : "All"}</option>{["informational","low","medium","high","critical"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Categoría" : "Category"}<select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">{language === "es" ? "Todas" : "All"}</option>{Array.from(new Set(alerts.map((alert) => alert.category))).map((value) => <option key={value} value={value}>{categoryLabels[value][language]}</option>)}</select></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Lista" : "Watchlist"}<select value={watchlistId} onChange={(event) => setWatchlistId(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">{language === "es" ? "Todas" : "All"}</option>{watchlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Fecha" : "Date"}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm" /></label>
          <label className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />{language === "es" ? "No leídas" : "Unread"}</label>
        </section>

        {error ? <p role="alert" className="cma-panel border-rose-300/30 p-4 text-sm text-rose-200">{error}</p> : loading ? <p className="cma-panel p-6 text-sm text-[var(--cma-text-muted)]">{language === "es" ? "Cargando alertas…" : "Loading alerts…"}</p> : !visible.length ? <div className="cma-panel p-8 text-center"><BellRing className="mx-auto text-[var(--cma-text-muted)]" /><h2 className="mt-3 text-lg font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "No hay alertas para estos filtros" : "No alerts match these filters"}</h2></div> : (
          <div className="space-y-3">{visible.map((alert) => {
            const title = alert.localizedContent.title?.[language] ?? alert.title;
            const summary = alert.localizedContent.summary?.[language] ?? alert.summary;
            return <article key={alert.id} className={`rounded-xl border bg-[var(--cma-bg-panel)] p-5 ${alert.readAt ? "border-[var(--cma-border-soft)]" : "border-cyan-300/30"}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${severityStyle[alert.severity]}`}>{alert.severity}</span><span className="text-xs text-[var(--cma-text-muted)]">{categoryLabels[alert.category][language]} · {listNames.get(alert.watchlistId ?? "") ?? (language === "es" ? "Lista eliminada" : "Deleted watchlist")}</span>{!alert.readAt ? <span className="sr-only">{language === "es" ? "No leída" : "Unread"}</span> : null}</div><h2 className="mt-3 text-lg font-semibold text-[var(--cma-text-primary)]">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{summary}</p><p className="mt-3 text-xs text-[var(--cma-text-muted)]">{new Intl.DateTimeFormat(language === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.triggeredAt))} · {alert.provider} · {alert.freshnessStatus}</p></div><div className="flex shrink-0 flex-wrap items-start gap-2">{!alert.readAt ? <button type="button" onClick={() => void read(alert.id)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm">{language === "es" ? "Marcar leída" : "Mark read"}</button> : null}<Link href={`/alerts/${alert.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 px-3 text-sm text-cyan-100">{language === "es" ? "Ver detalle" : "View detail"}<ExternalLink size={14} /></Link></div></div>
            </article>;
          })}</div>
        )}
      </div>
    </AppShell>
  );
}
