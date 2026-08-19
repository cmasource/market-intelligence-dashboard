"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  BellPlus,
  BellRing,
  BookOpen,
  Check,
  CheckCheck,
  Clock3,
  ExternalLink,
  Gauge,
  Landmark,
  LineChart,
  Newspaper,
  Pause,
  Pencil,
  Play,
  Repeat2,
  Settings2,
  Target,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getArbitrageProvider } from "@/lib/arbitrage";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getWatchlistRepository, setWatchlistUser, type Watchlist } from "@/lib/watchlist";
import { createClient } from "@/lib/supabase/client";
import {
  ALERT_SUBSCRIPTIONS_UPDATED_EVENT,
  ALERTS_UPDATED_EVENT,
  deleteArbitrageAlertSubscription,
  deletePersonalAlertSubscription,
  getArbitrageAlertSubscriptions,
  getDeliveredAlerts,
  getPersonalAlertSubscriptions,
  markAlertRead,
  markAllAlertsRead,
  setArbitrageAlertSubscriptionEnabled,
  setPersonalAlertSubscriptionEnabled,
  type AlertEventRecord,
} from "@/lib/alerts/client";
import { describePersonalAlert, personalAlertConditionCopy, personalAlertSchedule } from "@/lib/alerts/presentation";
import type { AlertCategory, AlertSeverity, ArbitrageAlertSubscription, PersonalAlertSubscription } from "@/lib/alerts";
import { AlertComposerDialog } from "./AlertComposerDialog";

const categoryLabels: Record<AlertCategory, { es: string; en: string }> = {
  unusual_price_move: { es: "Movimiento inusual", en: "Unusual move" },
  unusual_volume: { es: "Volumen inusual", en: "Unusual volume" },
  trend_change: { es: "Cambio de tendencia", en: "Trend change" },
  elevated_volatility: { es: "Volatilidad elevada", en: "Elevated volatility" },
  technical_change: { es: "Cambio técnico", en: "Technical change" },
  opportunity: { es: "Oportunidad", en: "Opportunity" },
  bond_event: { es: "Evento de bono", en: "Bond event" },
  corporate_bond_event: { es: "Evento de ON", en: "Corporate-bond event" },
  material_news: { es: "Noticia material", en: "Material news" },
  arbitrage_opportunity: { es: "Arbitraje", en: "Arbitrage" },
};

const severityStyle: Record<AlertSeverity, string> = {
  informational: "border-slate-400/25 text-slate-300",
  low: "border-sky-300/25 text-sky-200",
  medium: "border-cyan-300/30 text-cyan-100",
  high: "border-amber-300/35 text-amber-200",
  critical: "border-rose-300/35 text-rose-200",
};

const severityLabels: Record<AlertSeverity, { es: string; en: string }> = {
  informational: { es: "Informativa", en: "Informational" }, low: { es: "Baja", en: "Low" },
  medium: { es: "Media", en: "Medium" }, high: { es: "Alta", en: "High" }, critical: { es: "Crítica", en: "Critical" },
};

const categoryIcons: Record<AlertCategory, LucideIcon> = {
  unusual_price_move: Activity,
  unusual_volume: BarChart3,
  trend_change: TrendingUp,
  elevated_volatility: Gauge,
  technical_change: LineChart,
  opportunity: Target,
  bond_event: Landmark,
  corporate_bond_event: Landmark,
  material_news: Newspaper,
  arbitrage_opportunity: Repeat2,
};

export function AlertsCenter() {
  const { language } = useLanguage();
  const uiLanguage = language === "en" ? "en" : "es";
  const [alerts, setAlerts] = useState<AlertEventRecord[]>([]);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [subscriptions, setSubscriptions] = useState<PersonalAlertSubscription[]>([]);
  const [arbitrageSubscriptions, setArbitrageSubscriptions] = useState<ArbitrageAlertSubscription[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<PersonalAlertSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingSubscriptionId, setPendingSubscriptionId] = useState<string | null>(null);
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
      const [nextAlerts, lists, nextSubscriptions, nextArbitrageSubscriptions] = await Promise.all([
        getDeliveredAlerts(),
        getWatchlistRepository().getWatchlists(),
        getPersonalAlertSubscriptions(),
        getArbitrageAlertSubscriptions(),
      ]);
      setAlerts(nextAlerts);
      setWatchlists(lists);
      setSubscriptions(nextSubscriptions);
      setArbitrageSubscriptions(nextArbitrageSubscriptions);
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : (uiLanguage === "es" ? "No se pudieron cargar las alertas." : "Alerts could not be loaded."));
    } finally {
      setLoading(false);
    }
  }, [uiLanguage]);

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
  const unreadIds = useMemo(() => alerts.filter((alert) => !alert.readAt).map((alert) => alert.id), [alerts]);
  const activeSubscriptions = [...subscriptions, ...arbitrageSubscriptions].filter((subscription) => subscription.enabled).length;
  const pausedSubscriptions = subscriptions.length + arbitrageSubscriptions.length - activeSubscriptions;
  const monitoredAssets = watchlists.reduce((total, list) => total + list.itemCount, 0);
  const hasFilters = unreadOnly || severity !== "all" || category !== "all" || watchlistId !== "all" || Boolean(query || date);
  const visible = useMemo(() => alerts.filter((alert) => {
    const needle = query.trim().toLowerCase();
    return (!unreadOnly || !alert.readAt)
      && (severity === "all" || alert.severity === severity)
      && (category === "all" || alert.category === category)
      && (watchlistId === "all" || alert.watchlistId === watchlistId)
      && (!date || alert.triggeredAt.slice(0, 10) === date)
      && (!needle || `${alert.instrumentId} ${alert.instrumentSymbol} ${alert.title} ${alert.summary}`.toLowerCase().includes(needle));
  }), [alerts, category, date, query, severity, unreadOnly, watchlistId]);
  const visibleUnread = useMemo(() => visible.filter((alert) => !alert.readAt), [visible]);
  const visibleRead = useMemo(() => visible.filter((alert) => Boolean(alert.readAt)), [visible]);

  function openComposer(subscription: PersonalAlertSubscription | null = null) {
    setEditingSubscription(subscription);
    setComposerOpen(true);
    setActionError(null);
  }

  function closeComposer() {
    setComposerOpen(false);
    setEditingSubscription(null);
  }

  function clearFilters() {
    setUnreadOnly(false); setSeverity("all"); setCategory("all"); setWatchlistId("all"); setQuery(""); setDate("");
  }

  async function read(id: string) {
    await markAlertRead(id);
    setAlerts((current) => current.map((alert) => alert.id === id ? { ...alert, readAt: new Date().toISOString() } : alert));
  }

  async function readAll() {
    await markAllAlertsRead(unreadIds);
    const readAt = new Date().toISOString();
    setAlerts((current) => current.map((alert) => unreadIds.includes(alert.id) ? { ...alert, readAt } : alert));
  }

  async function toggleSubscription(subscription: PersonalAlertSubscription) {
    setPendingSubscriptionId(subscription.id); setActionError(null);
    try {
      await setPersonalAlertSubscriptionEnabled(subscription.id, !subscription.enabled);
      setSubscriptions((current) => current.map((item) => item.id === subscription.id ? { ...item, enabled: !item.enabled } : item));
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : (uiLanguage === "es" ? "No se pudo cambiar el estado de la alerta." : "The alert status could not be changed."));
    } finally { setPendingSubscriptionId(null); }
  }

  async function removeSubscription(subscription: PersonalAlertSubscription) {
    const label = personalAlertConditionCopy(subscription.condition, uiLanguage).label;
    const confirmed = window.confirm(uiLanguage === "es" ? `¿Eliminar la alerta “${label}” de ${subscription.instrumentSymbol}?` : `Delete the “${label}” alert for ${subscription.instrumentSymbol}?`);
    if (!confirmed) return;
    setPendingSubscriptionId(subscription.id); setActionError(null);
    try {
      await deletePersonalAlertSubscription(subscription.id);
      setSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : (uiLanguage === "es" ? "No se pudo eliminar la alerta." : "The alert could not be deleted."));
    } finally { setPendingSubscriptionId(null); }
  }

  async function toggleArbitrageSubscription(subscription: ArbitrageAlertSubscription) {
    setPendingSubscriptionId(subscription.id); setActionError(null);
    try {
      await setArbitrageAlertSubscriptionEnabled(subscription.id, !subscription.enabled);
      setArbitrageSubscriptions((current) => current.map((item) => item.id === subscription.id ? { ...item, enabled: !item.enabled } : item));
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : (uiLanguage === "es" ? "No se pudo cambiar el estado de la alerta de arbitraje." : "The arbitrage alert status could not be changed."));
    } finally { setPendingSubscriptionId(null); }
  }

  async function removeArbitrageSubscription(subscription: ArbitrageAlertSubscription) {
    const confirmed = window.confirm(uiLanguage === "es" ? "¿Eliminar esta alerta de arbitraje?" : "Delete this arbitrage alert?");
    if (!confirmed) return;
    setPendingSubscriptionId(subscription.id); setActionError(null);
    try {
      await deleteArbitrageAlertSubscription(subscription.id);
      setArbitrageSubscriptions((current) => current.filter((item) => item.id !== subscription.id));
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : (uiLanguage === "es" ? "No se pudo eliminar la alerta de arbitraje." : "The arbitrage alert could not be deleted."));
    } finally { setPendingSubscriptionId(null); }
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <header className="cma-panel-elevated p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cma-accent-cyan)]">CMA Market Intelligence</p><h1 className="mt-2 text-3xl font-semibold text-[var(--cma-text-primary)]">{uiLanguage === "es" ? "Centro de alertas" : "Alert center"}</h1><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Configurá qué querés monitorear y consultá aquí las condiciones que ya se activaron." : "Choose what to monitor and review conditions that have already triggered."}</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => openComposer()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100"><BellPlus size={16} />{uiLanguage === "es" ? "Crear alerta" : "Create alert"}</button><Link href="/alerts/guide" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm text-[var(--cma-text-secondary)]"><BookOpen size={16} />{uiLanguage === "es" ? "Guía de alertas" : "Alert guide"}</Link><button type="button" disabled={!unreadIds.length} onClick={() => void readAll()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-4 text-sm text-[var(--cma-text-secondary)] disabled:opacity-40"><CheckCheck size={16} />{uiLanguage === "es" ? "Marcar leídas" : "Mark as read"}</button><Link href="/account/alerts" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100"><Settings2 size={16} />{uiLanguage === "es" ? "Preferencias" : "Preferences"}</Link></div>
          </div>
          <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3"><dt className="text-[10px] uppercase tracking-wide text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Activos en listas" : "Watchlist assets"}</dt><dd className="mt-1 text-xl font-semibold">{monitoredAssets}</dd></div><div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3"><dt className="text-[10px] uppercase tracking-wide text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Alertas activas" : "Active alerts"}</dt><dd className="mt-1 text-xl font-semibold text-emerald-200">{activeSubscriptions}</dd></div><div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3"><dt className="text-[10px] uppercase tracking-wide text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Pausadas" : "Paused"}</dt><dd className="mt-1 text-xl font-semibold">{pausedSubscriptions}</dd></div><div className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3"><dt className="text-[10px] uppercase tracking-wide text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "No leídas" : "Unread"}</dt><dd className="mt-1 text-xl font-semibold text-cyan-100">{unreadIds.length}</dd></div></dl>
        </header>

        <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <div className="cma-panel p-5"><h2 className="text-lg font-semibold">{uiLanguage === "es" ? "Dos formas de monitorear" : "Two ways to monitor"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-[var(--cma-border-soft)] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">{uiLanguage === "es" ? "Automáticas CMA" : "CMA automatic"}</p><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Analizan movimientos, volumen, tendencia y volatilidad en los activos de tus listas." : "Analyze price moves, volume, trend, and volatility across watchlist assets."}</p></div><div className="rounded-lg border border-[var(--cma-border-soft)] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-emerald-200">{uiLanguage === "es" ? "Condiciones personales" : "Personal conditions"}</p><p className="mt-2 text-sm leading-6 text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Definís precio, variación o cercanía a niveles técnicos para un activo específico." : "Set price, change, or technical-level proximity for a specific asset."}</p></div></div></div>
          <details className="cma-panel p-5"><summary className="cursor-pointer text-base font-semibold text-cyan-100">{uiLanguage === "es" ? "Ver las 5 reglas automáticas" : "View the 5 automatic rules"}</summary><ul className="mt-3 space-y-2 text-sm text-[var(--cma-text-secondary)]"><li>{uiLanguage === "es" ? "Movimiento de precio inusual ajustado por volatilidad y ATR." : "Unusual price move adjusted for volatility and ATR."}</li><li>{uiLanguage === "es" ? "Volumen inusual frente a 20 ruedas." : "Unusual volume versus 20 sessions."}</li><li>{uiLanguage === "es" ? "Ruptura o recuperación de tendencia." : "Trend break or recovery."}</li><li>{uiLanguage === "es" ? "Volatilidad reciente elevada." : "Elevated recent volatility."}</li><li>{uiLanguage === "es" ? "Oportunidad con múltiples confirmaciones." : "Opportunity with multiple confirmations."}</li></ul></details>
        </section>

        <section className="cma-panel p-5" aria-labelledby="active-monitoring-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="active-monitoring-title" className="text-xl font-semibold">{uiLanguage === "es" ? "Mis condiciones" : "My conditions"}</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Administrá las alertas que configuraste manualmente." : "Manage the alerts you configured manually."}</p></div><button type="button" onClick={() => openComposer()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 px-4 text-sm font-medium text-cyan-100"><BellPlus size={16} />{uiLanguage === "es" ? "Nueva condición" : "New condition"}</button></div>
          {actionError ? <p role="alert" className="mt-4 rounded-lg border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-100">{actionError}</p> : null}
          {subscriptions.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{subscriptions.map((subscription) => {
            const pending = pendingSubscriptionId === subscription.id;
            return <article key={subscription.id} className={`rounded-xl border bg-[var(--cma-bg-elevated)] p-4 ${subscription.enabled ? "border-emerald-300/20" : "border-[var(--cma-border-soft)] opacity-80"}`}><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-base">{subscription.instrumentSymbol}</strong><span className={`rounded-full border px-2 py-0.5 text-[11px] ${subscription.enabled ? "border-emerald-300/30 bg-emerald-300/5 text-emerald-200" : "border-slate-400/25 text-slate-400"}`}>{subscription.enabled ? (uiLanguage === "es" ? "Activa" : "Active") : (uiLanguage === "es" ? "Pausada" : "Paused")}</span><span className="text-xs text-[var(--cma-text-muted)]">{listNames.get(subscription.watchlistId) ?? (uiLanguage === "es" ? "Lista" : "Watchlist")}</span></div><h3 className="mt-3 text-sm font-semibold">{personalAlertConditionCopy(subscription.condition, uiLanguage).label}</h3><p className="mt-1 text-sm leading-6 text-[var(--cma-text-secondary)]">{describePersonalAlert(subscription, uiLanguage)}</p><p className="mt-2 flex items-start gap-2 text-xs text-[var(--cma-text-muted)]"><Clock3 aria-hidden="true" size={14} className="mt-0.5 shrink-0" />{personalAlertSchedule(subscription.assetType, subscription.market, uiLanguage)}</p></div><div className="flex shrink-0 flex-wrap gap-2"><button type="button" disabled={pending} onClick={() => openComposer(subscription)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-3 text-xs" aria-label={`${uiLanguage === "es" ? "Editar alerta de" : "Edit alert for"} ${subscription.instrumentSymbol}`}><Pencil size={14} />{uiLanguage === "es" ? "Editar" : "Edit"}</button><button type="button" disabled={pending} onClick={() => void toggleSubscription(subscription)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-3 text-xs">{subscription.enabled ? <Pause size={14} /> : <Play size={14} />}{subscription.enabled ? (uiLanguage === "es" ? "Pausar" : "Pause") : (uiLanguage === "es" ? "Reactivar" : "Resume")}</button><button type="button" disabled={pending} onClick={() => void removeSubscription(subscription)} aria-label={`${uiLanguage === "es" ? "Eliminar alerta de" : "Delete alert for"} ${subscription.instrumentSymbol}`} className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-[var(--cma-border-soft)] text-rose-200"><Trash2 size={14} /></button></div></div></article>;
          })}</div> : <div className="mt-4 rounded-xl border border-dashed border-[var(--cma-border-soft)] p-6 text-center"><BellPlus className="mx-auto text-[var(--cma-text-muted)]" /><h3 className="mt-3 font-semibold">{uiLanguage === "es" ? "Todavía no creaste condiciones personales" : "You have not created personal conditions yet"}</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Podés empezar desde este centro o desde el botón Crear alerta de cualquier activo en Mis listas." : "Start here or use the Create alert button on any asset in your watchlists."}</p><button type="button" onClick={() => openComposer()} className="mt-4 min-h-11 rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100">{uiLanguage === "es" ? "Configurar primera alerta" : "Set up first alert"}</button></div>}
        </section>

        <section className="cma-panel p-5" aria-labelledby="arbitrage-monitoring-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 id="arbitrage-monitoring-title" className="text-xl font-semibold">{uiLanguage === "es" ? "Diferencias de cotización monitoreadas" : "Monitored quote differences"}</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Alertas por diferencia bruta en ARS por USD, independientemente del monto que después decidas operar." : "Alerts for gross ARS-per-USD differences, regardless of the amount you later choose to trade."}</p></div>
            <Link href="/radar-arbitraje" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-cyan-300/30 px-4 text-sm font-medium text-cyan-100"><BellPlus size={16} />{uiLanguage === "es" ? "Configurar en el Radar" : "Configure in Radar"}</Link>
          </div>
          {arbitrageSubscriptions.length ? <div className="mt-4 grid gap-3 lg:grid-cols-2">{arbitrageSubscriptions.map((subscription) => {
            const pending = pendingSubscriptionId === subscription.id;
            const assetLabel = subscription.transferAsset === "USD_BANK" ? (uiLanguage === "es" ? "USD bancario" : "Bank USD") : subscription.transferAsset;
            const sourceName = subscription.sourceProviderId ? getArbitrageProvider(subscription.sourceProviderId)?.name ?? subscription.sourceProviderId : null;
            const destinationName = subscription.destinationProviderId ? getArbitrageProvider(subscription.destinationProviderId)?.name ?? subscription.destinationProviderId : null;
            const monitorLabel = subscription.scope === "any_verified"
              ? (uiLanguage === "es" ? "Cualquier diferencia comparable" : "Any comparable difference")
              : `${sourceName} → ${destinationName}`;
            return (
              <article key={subscription.id} className={`rounded-xl border bg-[var(--cma-bg-elevated)] p-4 ${subscription.enabled ? "border-cyan-300/20" : "border-[var(--cma-border-soft)] opacity-80"}`}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm">{monitorLabel}</strong>
                      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${subscription.enabled ? "border-emerald-300/30 bg-emerald-300/5 text-emerald-200" : "border-slate-400/25 text-slate-400"}`}>{subscription.enabled ? (uiLanguage === "es" ? "Activa" : "Active") : (uiLanguage === "es" ? "Pausada" : "Paused")}</span>
                      <span className="text-xs text-[var(--cma-text-muted)]">{assetLabel}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? `Avisar desde ARS ${subscription.minimumGrossSpreadArs.toLocaleString("es-AR")} de diferencia por USD` : `Alert from an ARS ${subscription.minimumGrossSpreadArs.toLocaleString("en-US")} difference per USD`}</p>
                    <p className="mt-2 flex items-start gap-2 text-xs text-[var(--cma-text-muted)]"><Clock3 aria-hidden="true" size={14} className="mt-0.5 shrink-0" />{uiLanguage === "es" ? "No depende de un monto. Informa la diferencia bruta; la calculadora estima el resultado para el capital que elijas." : "It does not depend on an amount. It reports the gross difference; the calculator estimates the result for your chosen capital."}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button type="button" disabled={pending} onClick={() => void toggleArbitrageSubscription(subscription)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--cma-border-soft)] px-3 text-xs">{subscription.enabled ? <Pause size={14} /> : <Play size={14} />}{subscription.enabled ? (uiLanguage === "es" ? "Pausar" : "Pause") : (uiLanguage === "es" ? "Reactivar" : "Resume")}</button>
                    <button type="button" disabled={pending} onClick={() => void removeArbitrageSubscription(subscription)} aria-label={uiLanguage === "es" ? "Eliminar alerta de arbitraje" : "Delete arbitrage alert"} className="grid min-h-10 min-w-10 place-items-center rounded-lg border border-[var(--cma-border-soft)] text-rose-200"><Trash2 size={14} /></button>
                  </div>
                </div>
              </article>
            );
          })}</div> : <div className="mt-4 rounded-xl border border-dashed border-[var(--cma-border-soft)] p-6 text-center"><BellRing className="mx-auto text-[var(--cma-text-muted)]" /><h3 className="mt-3 font-semibold">{uiLanguage === "es" ? "Todavía no monitoreás diferencias" : "No differences are monitored yet"}</h3><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Desde el resumen del Radar podés elegir desde cuántos ARS por USD querés recibir un aviso." : "Use the Radar summary to choose the ARS-per-USD difference that should trigger an alert."}</p></div>}
        </section>

        <section className="cma-panel p-5" aria-labelledby="alert-history-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="alert-history-title" className="text-xl font-semibold">{uiLanguage === "es" ? "Historial de eventos" : "Event history"}</h2><p className="mt-1 text-sm text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Aquí aparecen sólo las alertas que ya cumplieron su condición." : "Only alerts whose condition has triggered appear here."}</p></div>{hasFilters ? <button type="button" onClick={clearFilters} className="min-h-10 rounded-lg border border-[var(--cma-border-soft)] px-3 text-xs text-cyan-100">{uiLanguage === "es" ? "Limpiar filtros" : "Clear filters"}</button> : null}</div>
          <div aria-label={uiLanguage === "es" ? "Filtros del historial de alertas" : "Alert history filters"} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Instrumento" : "Instrument"}<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={uiLanguage === "es" ? "Ticker o texto" : "Ticker or text"} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm" /></label><label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Severidad" : "Severity"}<select value={severity} onChange={(event) => setSeverity(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">{uiLanguage === "es" ? "Todas" : "All"}</option>{(["informational", "low", "medium", "high", "critical"] as AlertSeverity[]).map((value) => <option key={value} value={value}>{severityLabels[value][uiLanguage]}</option>)}</select></label><label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Categoría" : "Category"}<select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">{uiLanguage === "es" ? "Todas" : "All"}</option>{Array.from(new Set(alerts.map((alert) => alert.category))).map((value) => <option key={value} value={value}>{categoryLabels[value][uiLanguage]}</option>)}</select></label><label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Lista" : "Watchlist"}<select value={watchlistId} onChange={(event) => setWatchlistId(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm"><option value="all">{uiLanguage === "es" ? "Todas" : "All"}</option>{watchlists.map((list) => <option key={list.id} value={list.id}>{list.name}</option>)}</select></label><label className="grid gap-1 text-xs text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Fecha" : "Date"}<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3 text-sm" /></label><label className="flex min-h-11 items-center gap-2 self-end rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]"><input type="checkbox" checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />{uiLanguage === "es" ? "No leídas" : "Unread"}</label></div>

          {error ? <p role="alert" className="mt-4 rounded-lg border border-rose-300/30 p-4 text-sm text-rose-200">{error}</p> : loading ? <p className="mt-4 rounded-lg border border-[var(--cma-border-soft)] p-6 text-sm text-[var(--cma-text-muted)]">{uiLanguage === "es" ? "Cargando alertas…" : "Loading alerts…"}</p> : !visible.length ? <div className="mt-4 rounded-xl border border-dashed border-[var(--cma-border-soft)] p-8 text-center"><BellRing className="mx-auto text-[var(--cma-text-muted)]" /><h3 className="mt-3 text-lg font-semibold">{hasFilters ? (uiLanguage === "es" ? "No hay eventos para estos filtros" : "No events match these filters") : (uiLanguage === "es" ? "Todavía no se activó ninguna alerta" : "No alerts have triggered yet")}</h3><p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--cma-text-secondary)]">{hasFilters ? (uiLanguage === "es" ? "Probá limpiar los filtros para volver a ver todo el historial." : "Clear the filters to view the full history.") : (uiLanguage === "es" ? "Tus activos continúan monitoreados. Un evento aparecerá cuando una regla automática o personal se cumpla con datos verificables." : "Your assets remain monitored. An event will appear when an automatic or personal condition triggers with verifiable data.")}</p></div> : <div className="mt-5 space-y-5">{[
            { key: "unread", alerts: visibleUnread, label: uiLanguage === "es" ? "Sin leer" : "Unread", Icon: BellRing },
            { key: "read", alerts: visibleRead, label: uiLanguage === "es" ? "Leídas anteriores" : "Previously read", Icon: CheckCheck },
          ].filter((group) => group.alerts.length).map((group) => (
            <section key={group.key} aria-labelledby={`alert-history-${group.key}`} className="space-y-3">
              <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--cma-text-muted)]">
                <group.Icon aria-hidden="true" size={15} />
                <h3 id={`alert-history-${group.key}`}>{group.label} · {group.alerts.length}</h3>
                <span aria-hidden="true" className="h-px flex-1 bg-[var(--cma-border-soft)]" />
              </div>
              {group.alerts.map((alert) => {
                const title = alert.localizedContent.title?.[uiLanguage] ?? alert.title;
                const summary = alert.localizedContent.summary?.[uiLanguage] ?? alert.summary;
                const sourceLabel = alert.category === "arbitrage_opportunity" ? (uiLanguage === "es" ? "Radar de Arbitraje" : "Arbitrage Radar") : listNames.get(alert.watchlistId ?? "") ?? (uiLanguage === "es" ? "Lista eliminada" : "Deleted watchlist");
                const CategoryIcon = categoryIcons[alert.category];
                const isRead = Boolean(alert.readAt);
                return (
                  <article
                    key={alert.id}
                    className={`relative overflow-hidden rounded-xl border p-4 transition sm:p-5 ${isRead
                      ? "border-[var(--cma-border-soft)] bg-[color-mix(in_srgb,var(--cma-bg-panel)_76%,var(--cma-bg-elevated)_24%)]"
                      : "border-cyan-300/35 bg-[color-mix(in_srgb,var(--cma-bg-elevated)_86%,var(--cma-accent-cyan)_14%)] shadow-[0_10px_28px_rgba(0,0,0,0.18)]"}`}
                  >
                    {!isRead ? <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-[var(--cma-accent-cyan)]" /> : null}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-base)] text-[var(--cma-accent-cyan)]">
                          <CategoryIcon aria-hidden="true" size={18} />
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${isRead ? "border-[var(--cma-border-soft)] bg-[color-mix(in_srgb,var(--cma-text-muted)_8%,transparent)] text-[var(--cma-text-muted)]" : "border-cyan-300/35 bg-cyan-300/10 text-cyan-100"}`}>
                              {isRead ? <Check aria-hidden="true" size={12} /> : <BellRing aria-hidden="true" size={12} />}
                              {isRead ? (uiLanguage === "es" ? "Leída" : "Read") : (uiLanguage === "es" ? "Nueva" : "New")}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityStyle[alert.severity]}`}>
                              {uiLanguage === "es" ? "Severidad" : "Severity"} {severityLabels[alert.severity][uiLanguage].toLocaleLowerCase(uiLanguage === "es" ? "es-AR" : "en-US")}
                            </span>
                            <span className="text-xs text-[var(--cma-text-muted)]">{categoryLabels[alert.category][uiLanguage]} · {sourceLabel}</span>
                          </div>
                          <h4 className={`mt-3 text-lg font-semibold ${isRead ? "text-[var(--cma-text-secondary)]" : "text-[var(--cma-text-primary)]"}`}>{title}</h4>
                          <p className={`mt-2 text-sm leading-6 ${isRead ? "text-[var(--cma-text-muted)]" : "text-[var(--cma-text-secondary)]"}`}>{summary}</p>
                          <p className="mt-3 text-xs text-[var(--cma-text-muted)]">{new Intl.DateTimeFormat(uiLanguage === "es" ? "es-AR" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.triggeredAt))} · {alert.provider} · {alert.freshnessStatus}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-start gap-2 sm:ml-4">
                        {!isRead ? <button type="button" onClick={() => void read(alert.id)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm text-[var(--cma-text-secondary)]">{uiLanguage === "es" ? "Marcar leída" : "Mark read"}</button> : null}
                        <Link href={`/alerts/${alert.id}`} className={`inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium ${isRead ? "border-[var(--cma-border-soft)] text-[var(--cma-text-secondary)]" : "border-cyan-300/30 bg-cyan-300/10 text-cyan-100"}`}>{uiLanguage === "es" ? "Ver detalle" : "View detail"}<ExternalLink aria-hidden="true" size={14} /></Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          ))}</div>}
        </section>
      </div>
      <AlertComposerDialog open={composerOpen} watchlists={watchlists} initialSubscription={editingSubscription} onClose={closeComposer} />
    </AppShell>
  );
}
