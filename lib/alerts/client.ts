import { createClient } from "@/lib/supabase/client";
import { DEFAULT_ALERT_PREFERENCES } from "./preferences";
import type { WatchlistItem } from "@/lib/watchlist";
import type { AlertCategory, AlertDirection, AlertEvidence, AlertPreferences, AlertSeverity, AlertStatus, PersonalAlertCondition, PersonalAlertSubscription } from "./types";

export const ALERTS_UPDATED_EVENT = "cma-alerts-updated";
export const ALERT_SUBSCRIPTIONS_UPDATED_EVENT = "cma-alert-subscriptions-updated";

type SubscriptionRow = {
  id: string; user_id: string; watchlist_id: string; watchlist_item_id: string; instrument_id: string;
  instrument_symbol: string; instrument_name: string; market: string; exchange: string | null; currency: string;
  asset_type: PersonalAlertSubscription["assetType"]; condition: PersonalAlertCondition; target_value: number | null;
  threshold_percent: number | null; lookback_bars: number | null; enabled: boolean; created_at: string; updated_at: string;
};

function subscriptionFromRow(row: SubscriptionRow): PersonalAlertSubscription {
  return {
    id: row.id, userId: row.user_id, watchlistId: row.watchlist_id, watchlistItemId: row.watchlist_item_id,
    instrumentId: row.instrument_id, instrumentSymbol: row.instrument_symbol, instrumentName: row.instrument_name,
    market: row.market, exchange: row.exchange, currency: row.currency, assetType: row.asset_type,
    condition: row.condition, targetValue: row.target_value === null ? null : Number(row.target_value),
    thresholdPercent: row.threshold_percent === null ? null : Number(row.threshold_percent),
    lookbackBars: row.lookback_bars, enabled: row.enabled, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

const subscriptionColumns = "id,user_id,watchlist_id,watchlist_item_id,instrument_id,instrument_symbol,instrument_name,market,exchange,currency,asset_type,condition,target_value,threshold_percent,lookback_bars,enabled,created_at,updated_at";

export async function getPersonalAlertSubscriptions() {
  const result = await createClient().from("alert_subscriptions").select(subscriptionColumns).order("updated_at", { ascending: false });
  if (result.error) throw result.error;
  return ((result.data ?? []) as SubscriptionRow[]).map(subscriptionFromRow);
}

export async function savePersonalAlertSubscription(input: {
  userId: string;
  watchlistId: string;
  item: WatchlistItem;
  condition: PersonalAlertCondition;
  targetValue?: number | null;
  thresholdPercent?: number | null;
  lookbackBars?: number | null;
}) {
  const payload = {
    user_id: input.userId,
    watchlist_id: input.watchlistId,
    watchlist_item_id: input.item.id,
    instrument_id: input.item.instrumentId ?? input.item.assetKey,
    instrument_symbol: input.item.symbol,
    instrument_name: input.item.name,
    market: input.item.market,
    exchange: input.item.exchange ?? null,
    currency: input.item.currency,
    asset_type: input.item.assetType,
    condition: input.condition,
    target_value: input.targetValue ?? null,
    threshold_percent: input.thresholdPercent ?? null,
    lookback_bars: input.lookbackBars ?? null,
    enabled: true,
    updated_at: new Date().toISOString(),
  };
  const result = await createClient().from("alert_subscriptions").upsert(payload, { onConflict: "user_id,instrument_id,condition" }).select(subscriptionColumns).single();
  if (result.error) throw result.error;
  window.dispatchEvent(new Event(ALERT_SUBSCRIPTIONS_UPDATED_EVENT));
  return subscriptionFromRow(result.data as SubscriptionRow);
}

export async function setPersonalAlertSubscriptionEnabled(id: string, enabled: boolean) {
  const { error } = await createClient().from("alert_subscriptions").update({ enabled, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
  window.dispatchEvent(new Event(ALERT_SUBSCRIPTIONS_UPDATED_EVENT));
}

export async function deletePersonalAlertSubscription(id: string) {
  const { error } = await createClient().from("alert_subscriptions").delete().eq("id", id);
  if (error) throw error;
  window.dispatchEvent(new Event(ALERT_SUBSCRIPTIONS_UPDATED_EVENT));
}

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
  const result = await createClient().from("alert_preferences").select("alerts_enabled,minimum_severity,frequency,quiet_hours_start,quiet_hours_end,timezone,opportunity_alerts_enabled,in_app_enabled,email_enabled,whatsapp_enabled,whatsapp_phone_e164,monitored_watchlist_ids").eq("user_id", userId).maybeSingle();
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
    whatsappEnabled: result.data.whatsapp_enabled,
    whatsappPhoneE164: result.data.whatsapp_phone_e164,
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
    email_enabled: preferences.emailEnabled,
    email_consent_at: preferences.emailEnabled ? new Date().toISOString() : null,
    email_consent_source: preferences.emailEnabled ? "account_alert_settings" : null,
    whatsapp_enabled: preferences.whatsappEnabled,
    whatsapp_phone_e164: preferences.whatsappEnabled ? preferences.whatsappPhoneE164 : null,
    whatsapp_consent_at: preferences.whatsappEnabled ? new Date().toISOString() : null,
    whatsapp_consent_source: preferences.whatsappEnabled ? "account_alert_settings" : null,
    monitored_watchlist_ids: preferences.monitoredWatchlistIds,
    updated_at: new Date().toISOString(),
  };
  const { error } = await createClient().from("alert_preferences").upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}
