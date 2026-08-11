"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, BellRing, Mail, MessageCircle, Save } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { DEFAULT_ALERT_PREFERENCES, type AlertPreferences } from "@/lib/alerts";
import { loadAlertPreferences, saveAlertPreferences } from "@/lib/alerts/client";
import { createClient } from "@/lib/supabase/client";
import { getWatchlistRepository, setWatchlistUser, type Watchlist } from "@/lib/watchlist";

export function AlertPreferencesForm() {
  const { language } = useLanguage();
  const [userId, setUserId] = useState("");
  const [preferences, setPreferences] = useState<AlertPreferences>(DEFAULT_ALERT_PREFERENCES);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { data } = await createClient().auth.getUser();
        if (!data.user) return;
        setUserId(data.user.id);
        setWatchlistUser(data.user.id);
        const [saved, lists] = await Promise.all([loadAlertPreferences(data.user.id), getWatchlistRepository().getWatchlists()]);
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setPreferences({ ...saved, timezone: saved.timezone || browserTimezone || DEFAULT_ALERT_PREFERENCES.timezone });
        setWatchlists(lists);
      } catch (error) { setStatus(error instanceof Error ? error.message : "Unable to load preferences."); }
      finally { setLoading(false); }
    })();
  }, []);

  function update<K extends keyof AlertPreferences>(key: K, value: AlertPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
  }

  function toggleWatchlist(id: string) {
    const selected = preferences.monitoredWatchlistIds ?? watchlists.map((list) => list.id);
    const next = selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id];
    update("monitoredWatchlistIds", next.length === watchlists.length ? null : next);
  }

  async function save() {
    if (!userId) return;
    setSaving(true); setStatus(null);
    try { await saveAlertPreferences(userId, preferences); setStatus(language === "es" ? "Preferencias guardadas." : "Preferences saved."); }
    catch (error) { setStatus(error instanceof Error ? error.message : "Unable to save preferences."); }
    finally { setSaving(false); }
  }

  const whatsappPhoneValid = !preferences.whatsappEnabled || /^\+[1-9][0-9]{7,14}$/.test(preferences.whatsappPhoneE164 ?? "");

  return <AppShell>{loading ? <p className="cma-panel p-6 text-sm">{language === "es" ? "Cargando configuración…" : "Loading settings…"}</p> : <div className="mx-auto max-w-4xl space-y-5">
    <Link href="/alerts" className="inline-flex min-h-11 items-center gap-2 text-sm text-[var(--cma-text-secondary)]"><ArrowLeft size={16} />{language === "es" ? "Centro de alertas" : "Alert center"}</Link>
    <header className="cma-panel-elevated p-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--cma-accent-cyan)]">CMA Market Intelligence</p><h1 className="mt-2 text-3xl font-semibold text-[var(--cma-text-primary)]">{language === "es" ? "Configuración de alertas" : "Alert settings"}</h1><p className="mt-2 text-sm text-[var(--cma-text-secondary)]">{language === "es" ? "Elegís qué monitorear y cómo recibirlo. Las reglas financieras son versionadas por CMA." : "Choose what to monitor and how to receive it. Financial rules are versioned by CMA."}</p></header>

    <section className="cma-panel p-6"><label className="flex min-h-11 items-center gap-3 text-sm font-semibold"><input type="checkbox" checked={preferences.alertsEnabled} onChange={(event) => update("alertsEnabled", event.target.checked)} /><BellRing size={18} />{language === "es" ? "Alertas activadas" : "Alerts enabled"}</label></section>
    <section className="cma-panel p-6"><h2 className="text-xl font-semibold">{language === "es" ? "Listas monitoreadas" : "Monitored watchlists"}</h2><label className="mt-4 flex min-h-11 items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm"><input type="checkbox" checked={preferences.monitoredWatchlistIds === null} onChange={() => update("monitoredWatchlistIds", null)} />{language === "es" ? "Todas las listas" : "All watchlists"}</label><div className="mt-2 grid gap-2 sm:grid-cols-2">{watchlists.map((list) => <label key={list.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm"><input type="checkbox" checked={preferences.monitoredWatchlistIds === null || preferences.monitoredWatchlistIds.includes(list.id)} onChange={() => toggleWatchlist(list.id)} />{list.name} <span className="ml-auto text-xs text-[var(--cma-text-muted)]">{list.itemCount}</span></label>)}</div></section>
    <section className="cma-panel grid gap-5 p-6 sm:grid-cols-2"><label className="grid gap-2 text-sm">{language === "es" ? "Severidad mínima" : "Minimum severity"}<select value={preferences.minimumSeverity} onChange={(event) => update("minimumSeverity", event.target.value as AlertPreferences["minimumSeverity"])} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3"><option value="informational">{language === "es" ? "Todas" : "All"}</option><option value="medium">{language === "es" ? "Relevantes" : "Relevant"}</option><option value="high">{language === "es" ? "Importantes" : "Important"}</option><option value="critical">{language === "es" ? "Críticas" : "Critical"}</option></select></label><label className="grid gap-2 text-sm">{language === "es" ? "Frecuencia" : "Frequency"}<select value={preferences.frequency} onChange={(event) => update("frequency", event.target.value as AlertPreferences["frequency"])} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3"><option value="immediate">{language === "es" ? "Inmediata" : "Immediate"}</option><option value="hourly_digest">{language === "es" ? "Resumen cada hora" : "Hourly digest"}</option><option value="daily_digest">{language === "es" ? "Resumen diario" : "Daily digest"}</option><option value="disabled">{language === "es" ? "Desactivada" : "Disabled"}</option></select></label></section>
    <section className="cma-panel p-6"><h2 className="text-xl font-semibold">{language === "es" ? "Horario de silencio" : "Quiet hours"}</h2><div className="mt-4 grid gap-4 sm:grid-cols-3"><label className="grid gap-2 text-sm">{language === "es" ? "Inicio" : "Start"}<input type="time" value={preferences.quietHoursStart ?? ""} onChange={(event) => update("quietHoursStart", event.target.value || null)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3" /></label><label className="grid gap-2 text-sm">{language === "es" ? "Fin" : "End"}<input type="time" value={preferences.quietHoursEnd ?? ""} onChange={(event) => update("quietHoursEnd", event.target.value || null)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3" /></label><label className="grid gap-2 text-sm">{language === "es" ? "Zona horaria" : "Timezone"}<input value={preferences.timezone} onChange={(event) => update("timezone", event.target.value)} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3" /></label></div></section>
    <section className="cma-panel space-y-3 p-6"><h2 className="text-xl font-semibold">{language === "es" ? "Tipos y canales" : "Types and channels"}</h2><label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm"><input type="checkbox" checked={preferences.opportunityAlertsEnabled} onChange={(event) => update("opportunityAlertsEnabled", event.target.checked)} />{language === "es" ? "Recibir oportunidades detectadas" : "Receive detected opportunities"}</label><label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm"><input type="checkbox" checked={preferences.inAppEnabled} onChange={(event) => update("inAppEnabled", event.target.checked)} /><BellRing size={17} />In-app <span className="ml-auto text-xs text-emerald-300">{language === "es" ? "Disponible" : "Available"}</span></label><label className="flex min-h-11 items-center gap-3 rounded-lg border border-[var(--cma-border-soft)] px-3 text-sm"><input type="checkbox" checked={preferences.emailEnabled} onChange={(event) => update("emailEnabled", event.target.checked)} /><Mail size={17} />Email <span className="ml-auto text-xs text-[var(--cma-text-muted)]">{language === "es" ? "A la dirección de tu cuenta" : "To your account address"}</span></label><div className="rounded-lg border border-[var(--cma-border-soft)] p-3"><label className="flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={preferences.whatsappEnabled} onChange={(event) => update("whatsappEnabled", event.target.checked)} /><MessageCircle size={17} />WhatsApp</label>{preferences.whatsappEnabled ? <label className="mt-2 grid gap-2 text-sm">{language === "es" ? "Número con código de país" : "Number with country code"}<input type="tel" inputMode="tel" autoComplete="tel" placeholder="+5491112345678" value={preferences.whatsappPhoneE164 ?? ""} onChange={(event) => update("whatsappPhoneE164", event.target.value.replace(/[\s()-]/g, ""))} aria-invalid={!whatsappPhoneValid} className="min-h-11 rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-elevated)] px-3" /><span className={`text-xs ${whatsappPhoneValid ? "text-[var(--cma-text-muted)]" : "text-rose-300"}`}>{language === "es" ? "Al activar este canal confirmás que el número es tuyo y aceptás recibir alertas transaccionales. Formato: +5491112345678." : "By enabling this channel you confirm ownership and consent to transactional alerts. Format: +15551234567."}</span></label> : null}</div><p className="text-xs text-[var(--cma-text-muted)]">{language === "es" ? "Los envíos respetan la frecuencia y el horario de silencio. Email usa Resend; WhatsApp requiere una plantilla aprobada de Twilio/Meta." : "Deliveries respect frequency and quiet hours. Email uses Resend; WhatsApp requires an approved Twilio/Meta template."}</p></section>
    {status ? <p role="status" aria-live="polite" className="rounded-lg border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-3 text-sm">{status}</p> : null}
    <button type="button" disabled={saving || !whatsappPhoneValid || Boolean(preferences.quietHoursStart) !== Boolean(preferences.quietHoursEnd)} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cyan-300/35 bg-cyan-300/10 px-5 text-sm font-semibold text-cyan-100 disabled:opacity-40"><Save size={16} />{saving ? (language === "es" ? "Guardando…" : "Saving…") : (language === "es" ? "Guardar preferencias" : "Save preferences")}</button>
  </div>}</AppShell>;
}
