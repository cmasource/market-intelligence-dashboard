"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellPlus, BellRing, CheckCheck, ExternalLink, Pause, Play, Settings2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getWatchlistRepository, setWatchlistUser, type Watchlist } from "@/lib/watchlist";
import { createClient } from "@/lib/supabase/client";
import {
  ALERT_SUBSCRIPTIONS_UPDATED_EVENT,
  ALERTS_UPDATED_EVENT,
  deletePersonalAlertSubscription,
  getDeliveredAlerts,
  getPersonalAlertSubscriptions,
  markAlertRead,
  markAllAlertsRead,
  setPersonalAlertSubscriptionEnabled,
  type AlertEventRecord,
} from "@/lib/alerts/client";
import type { AlertCategory, AlertSeverity, PersonalAlertCondition, PersonalAlertSubscription } from "@/lib/alerts";
import { AlertComposerDialog } from "./AlertComposerDialog";

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

const personalConditionLabels: Record<PersonalAlertCondition, string> = {
  price_above: "Precio alcanza o supera",
  price_below: "Precio alcanza o cae por debajo",
  rapid_rise: "Suba brusca",
  rapid_fall: "Baja brusca",
  near_ema200: "Cerca de EMA 200",
  near_period_low: "Cerca del mínimo del período",
  near_period_high: "Cerca del máximo del período",
};

function subscriptionDetail(subscription: PersonalAlertSubscription) {
  if (subscription.targetValue !== null) return `${subscription.targetValue.toLocaleString("es-AR")} ${subscription.currency}`;
  if (subscription.condition === "near_period_low" || subscription.condition === "near_period_high") return `margen ${subscription.thresholdPercent}% · ${subscription.lookbackBars} ruedas`;
  return `${subscription.thresholdPercent}%`;
}

export function AlertsCenter() {
  const { language } = useLanguage();
  const [alerts, setAlerts] = useState<AlertEventRecord[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [subscriptions, setSubscriptions] = useState<PersonalAlertSubscription[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
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
      const [nextAlerts, lists, nextSubscriptions] = await Promise.all([
        getDeliveredAlerts(),
        getWatchlistRepository().getWatchlists(),
        getPersonalAlertSubscriptions(),
      ]);
      setAlerts(nextAlerts);
      setWatchlists(lists);
      setSubscriptions(nextSubscriptions);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
    window.addEventListener(ALERTS_UPDATED_EVENT, load);
    window.addEventListener(ALERT_SUBSCRIPTIONS_UPDATED_EVENT, load);
    return () => {
      window.removeEventListener(ALERTS_UPDATED_EVENT, load);
      window.removeEventListener(ALERT_SUBSCRIPTIONS_UPDATED_EVENT, load);
    };
  }, [load]);

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
  async function toggleSubscription(subscription: PersonalAlertSubscription) { await setPersonalAlertSubscriptionEnabled(subscription.id, !subscription.enabled); await load(); }
  async function removeSubscription(subscription: PersonalAlertSubscription) {
    if (!window.confirm(`¿Eliminar la alerta “${personalConditionLabels[subscription.condition]}” de ${subscription.instrumentSymbol}?`)) return;
    await deletePersonalAlertSubscription(subscription.id);
    await load();
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <header className="cma-panel-elevated p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cma-accent-cyan)]">CMA Market Intelligence</p><h1 className="mt-2 text-3xl font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "Centro de alertas" : "Alert center"}</h1><p className="mt-2 text-sm text-[var(--cma-text-secondary)]">{language === "es" ? `${unreadIds.length} alertas no leídas. Señales informativas basadas en datos verificables.` : `${unreadIds.length} unread alerts. Informational signals based on verifiable data.`}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => setComposerOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100"><BellPlus size={16} />Crear alerta</button><button type="button" disabled={!unreadIds.length} onClick={() => void readAll()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm text-[var(--cma-text-secondary)] disabled:opacity-40"><CheckCheck size={16} />Marcar todas como leídas</button><Link href="/account/alerts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100"><Settings2 size={16} />Preferencias</Link></div>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="cma-panel p-5"><h2 className="text-xl font-semibold">Qué se monitorea</h2><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">Los activos de tus listas reciben las alertas automáticas de CMA. Además, podés crear condiciones personales por instrumento. Este centro muestra eventos que ya se activaron; las condiciones vigentes aparecen debajo.</p><p className="mt-3 text-xs text-[var(--cma-text-muted)]">Próximas evaluaciones: cripto cada hora · Argentina días hábiles 18:00 AR · USA y otros mercados días hábiles 19:00 AR.</p></div>
          <details className="cma-panel p-5"><summary className="cursor-pointer text-base font-semibold text-cyan-100">Alertas automáticas incluidas</summary><ul className="mt-3 space-y-2 text-sm text-[var(--cma-text-secondary)]"><li>Movimiento de precio inusual ajustado por volatilidad y ATR.</li><li>Volumen inusual frente al promedio de 20 ruedas.</li><li>Ruptura o recuperación de tendencia por EMA 50 o rango de 20 ruedas.</li><li>Volatilidad reciente elevada frente a su propio historial.</li><li>Oportunidad multiseñal con confirmaciones independientes.</li></ul></details>
        </section>

        <section className="cma-panel p-5" aria-labelledby="active-monitoring-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="active-monitoring-title" className="text-xl font-semibold">Alertas personales</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{subscriptions.length} condiciones configuradas · {watchlists.reduce((total, list) => total + list.itemCount, 0)} activos en tus listas.</p></div><button type="button" onClick={() => setComposerOpen(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 px-4 text-sm text-cyan-100"><BellPlus size={16} />Nueva condición</button></div>
          {subscriptions.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{subscriptions.map((subscription) => <article key={subscription.id} className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] p-4"><div className="flex items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><strong className="font-mono">{subscription.instrumentSymbol}</strong><span className={`rounded-full border px-2 py-0.5 text-[11px] ${subscription.enabled ? "border-emerald-300/30 text-emerald-200" : "border-slate-400/25 text-slate-400"}`}>{subscription.enabled ? "Activa" : "Pausada"}</span></div><p className="mt-2 text-sm font-medium">{personalConditionLabels[subscription.condition]}</p><p className="mt-1 text-xs text-[var(--cma-text-muted)]">{subscriptionDetail(subscription)} · {listNames.get(subscription.watchlistId) ?? "Lista"}</p></div><div className="flex gap-1"><button type="button" onClick={() => void toggleSubscription(subscription)} aria-label={subscription.enabled ? "Pausar alerta" : "Reactivar alerta"} className="grid min-h-11 min-w-11 place-items-center rounded-md border border-[var(--cma-border-soft)]">{subscription.enabled ? <Pause size={15} /> : <Play size={15} />}</button><button type="button" onClick={() => void removeSubscription(subscription)} aria-label="Eliminar alerta" className="grid min-h-11 min-w-11 place-items-center rounded-md border border-[var(--cma-border-soft)] text-rose-200"><Trash2 size={15} /></button></div></div></article>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-[var(--cma-border-soft)] p-5 text-sm text-[var(--cma-text-secondary)]">Todavía no configuraste condiciones personales. Podés crear una desde aquí o desde cualquier activo de <Link href="/watchlist" className="font-semibold text-cyan-100">Mi lista</Link>.</div>}
        </section>

        <section aria-label="Filtros del historial de alertas" className="grid gap-3 rounded-xl border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-4 sm:grid-cols-2 lg:grid-cols-6">
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Filtrar instrumento<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Solo alertas activadas" className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm" /></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Severidad<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">Todas</option>{["informational","low","medium","high","critical"].map((value) => <option key={value}>{value}</option>)}</select></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Categoría<select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">Todas</option>{Array.from(new Set(alerts.map((alert) => alert.category))).map((value) => <option key={value} value={value}>{categoryLabels[value][language]}</option>)}</select></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Lista<select value={watchlistId} onChange={(event) => setWatchlistId(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">Todas</option>{watchlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label>
          <label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">Fecha<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm" /></label>
          <label className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />No leídas</label>
        </section>

        {error ? <p role="alert" className="cma-panel border-rose-300/30 p-4 text-sm text-rose-200">{error}</p> : loading ? <p className="cma-panel p-6 text-sm text-[var(--cma-text-muted)]">Cargando alertas…</p> : !visible.length ? <div className="cma-panel p-8 text-center"><BellRing className="mx-auto text-[var(--cma-text-muted)]" /><h2 className="mt-3 text-lg font-semibold">Todavía no se activó ninguna alerta</h2><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--cma-text-secondary)]">Tus activos continúan monitoreados aunque este historial esté vacío. Una alerta aparecerá cuando una regla automática o una condición personal se cumpla con datos verificables.</p></div> : <div className="space-y-3">{visible.map((alert) => {
          const title = alert.localizedContent.title?.[language] ?? alert.title;
          const summary = alert.localizedContent.summary?.[language] ?? alert.summary;
          return <article key={alert.id} className={`rounded-xl border bg-[var(--cma-bg-panel)] p-5 ${alert.readAt ? "border-[var(--cma-border-soft)]" : "border-cyan-300/30"}`}><div className="flex flex-col gap-4 sm:flex-row sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2 py-1 text-[11px] font-semibold uppercase ${severityStyle[alert.severity]}`}>{alert.severity}</span><span className="text-xs text-[var(--cma-text-muted)]">{categoryLabels[alert.category][language]} · {listNames.get(alert.watchlistId ?? "") ?? "Lista eliminada"}</span>{!alert.readAt ? <span className="sr-only">No leída</span> : null}</div><h2 className="mt-3 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{summary}</p><p className="mt-3 text-xs text-[var(--cma-text-muted)]">{new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.triggeredAt))} · {alert.provider} · {alert.freshnessStatus}</p></div><div className="flex shrink-0 flex-wrap items-start gap-2">{!alert.readAt ? <button type="button" onClick={() => void read(alert.id)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm">Marcar leída</button> : null}<Link href={`/alerts/${alert.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 px-3 text-sm text-cyan-100">Ver detalle<ExternalLink size={14} /></Link></div></div></article>;
        })}</div>}
      </div>
      <AlertComposerDialog open={composerOpen} watchlists={watchlists} onClose={() => setComposerOpen(false)} onSaved={() => void load()} />
    </AppShell>
  );
}
