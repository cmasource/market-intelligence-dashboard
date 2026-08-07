import { createClient } from "@/lib/supabase/client";
import { DEFAULT_ALERT_PREFERENCES } from "./preferences";
import type { AlertCategory, AlertDirection, AlertEvidence, AlertPreferences, AlertSeverity, AlertStatus } from "./types";

export const ALERTS_UPDATED_EVENT = "cma-alerts-updated";

export type AlertEventRecord = {
  id: string;
  instrumentId: string;
  instrumentSymbol: string;
  market: string;
  currency: string;
  watchlistId: string | null;
  ruleId: string;
  ruleVersion: number;
  category: AlertCategory;
  severity: AlertSeverity;
  confidenceScore: number;
  direction: AlertDirection;
  title: string;
  summary: string;
  localizedContent: { title?: { es?: string; en?: string }; summary?: { es?: string; en?: string } };
  evidence: AlertEvidence[];
  limitations: string[];
  provider: string;
  observedAt: string;
  fetchedAt: string;
  freshnessStatus: "fresh" | "stale" | "invalid";
  status: AlertStatus;
  triggeredAt: string;
  resolvedAt: string | null;
  readAt: string | null;
};

type AlertRow = {
  id: string; instrument_id: string; instrument_symbol: string; market: string; currency: string; watchlist_id: string | null; rule_id: string; rule_version: number;
  category: AlertCategory; severity: AlertSeverity; confidence_score: number; direction: AlertDirection;
  title: string; summary: string; localized_content: AlertEventRecord["localizedContent"];
  evidence: AlertEvidence[]; limitations: string[]; provider: string; observed_at: string; fetched_at: string;
  freshness_status: AlertEventRecord["freshnessStatus"]; status: AlertStatus; triggered_at: string;
  resolved_at: string | null; read_at: string | null;
};

function eventFromRow(row: AlertRow): AlertEventRecord {
  return {
    id: row.id, instrumentId: row.instrument_id, instrumentSymbol: row.instrument_symbol, market: row.market, currency: row.currency, watchlistId: row.watchlist_id, ruleId: row.rule_id,
    ruleVersion: row.rule_version, category: row.category, severity: row.severity,
    confidenceScore: Number(row.confidence_score), direction: row.direction, title: row.title, summary: row.summary,
    localizedContent: row.localized_content ?? {}, evidence: row.evidence ?? [], limitations: row.limitations ?? [],
    provider: row.provider, observedAt: row.observed_at, fetchedAt: row.fetched_at,
    freshnessStatus: row.freshness_status, status: row.status, triggeredAt: row.triggered_at,
    resolvedAt: row.resolved_at, readAt: row.read_at,
  };
}

const eventColumns = "id,instrument_id,instrument_symbol,market,currency,watchlist_id,rule_id,rule_version,category,severity,confidence_score,direction,title,summary,localized_content,evidence,limitations,provider,observed_at,fetched_at,freshness_status,status,triggered_at,resolved_at,read_at";

export async function getDeliveredAlerts() {
  const supabase = createClient();
  const deliveries = await supabase.from("alert_deliveries").select("alert_event_id").eq("channel", "in_app").eq("status", "sent").limit(1000);
  if (deliveries.error) throw deliveries.error;
  const ids = Array.from(new Set((deliveries.data ?? []).map((row) => row.alert_event_id)));
  if (!ids.length) return [];
  const events = await supabase.from("alert_events").select(eventColumns).in("id", ids).order("triggered_at", { ascending: false }).limit(500);
  if (events.error) throw events.error;
  return ((events.data ?? []) as AlertRow[]).map(eventFromRow);
}

export async function getDeliveredAlert(id: string) {
  const alerts = await getDeliveredAlerts();
  return alerts.find((alert) => alert.id === id) ?? null;
}

export async function getUnreadAlertCount() {
  const alerts = await getDeliveredAlerts();
  return alerts.filter((alert) => !alert.readAt).length;
}

export async function markAlertRead(id: string) {
  const { error } = await createClient().from("alert_events").update({ read_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  window.dispatchEvent(new Event(ALERTS_UPDATED_EVENT));
}

export async function markAllAlertsRead(ids: string[]) {
  if (!ids.length) return;
  const { error } = await createClient().from("alert_events").update({ read_at: new Date().toISOString() }).in("id", ids);
  if (error) throw error;
  window.dispatchEvent(new Event(ALERTS_UPDATED_EVENT));
}

export async function loadAlertPreferences(userId: string) {
  const result = await createClient().from("alert_preferences").select("alerts_enabled,minimum_severity,frequency,quiet_hours_start,quiet_hours_end,timezone,opportunity_alerts_enabled,in_app_enabled,email_enabled,monitored_watchlist_ids").eq("user_id", userId).maybeSingle();
  if (result.error) throw result.error;
  if (!result.data) return DEFAULT_ALERT_PREFERENCES;
  return {
    alertsEnabled: result.data.alerts_enabled,
    minimumSeverity: result.data.minimum_severity,
    frequency: result.data.frequency,
    quietHoursStart: result.data.quiet_hours_start?.slice(0, 5) ?? null,
    quietHoursEnd: result.data.quiet_hours_end?.slice(0, 5) ?? null,
    timezone: result.data.timezone,
    opportunityAlertsEnabled: result.data.opportunity_alerts_enabled,
    inAppEnabled: result.data.in_app_enabled,
    emailEnabled: result.data.email_enabled,
    monitoredWatchlistIds: result.data.monitored_watchlist_ids,
  } as AlertPreferences;
}

export async function saveAlertPreferences(userId: string, preferences: AlertPreferences) {
  const payload = {
    user_id: userId,
    alerts_enabled: preferences.alertsEnabled,
    minimum_severity: preferences.minimumSeverity,
    frequency: preferences.frequency,
    quiet_hours_start: preferences.quietHoursStart || null,
    quiet_hours_end: preferences.quietHoursEnd || null,
    timezone: preferences.timezone,
    opportunity_alerts_enabled: preferences.opportunityAlertsEnabled,
    in_app_enabled: preferences.inAppEnabled,
    email_enabled: false,
    whatsapp_enabled: false,
    monitored_watchlist_ids: preferences.monitoredWatchlistIds,
    updated_at: new Date().toISOString(),
  };
  const { error } = await createClient().from("alert_preferences").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}
