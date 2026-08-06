import type { SupabaseClient } from "@supabase/supabase-js";
import { analyzeTradeRadar } from "@/lib/technical/trade-radar";
import { createAdminClient } from "@/lib/supabase/admin";
import { InAppNotificationChannel } from "./channels";
import { canReactivate, classifyAlertAssetType, deduplicationKey, evaluateAlertRules } from "./engine";
import { DEFAULT_ALERT_PREFERENCES, shouldCreateInAppAlert } from "./preferences";
import { alertRuleCatalog } from "./rules";
import { severityRank, type AlertEvaluation, type AlertPreferences } from "./types";

type WatchlistRow = { id: string; user_id: string; name: string };
type ItemRow = {
  id: string;
  watchlist_id: string;
  user_id: string;
  asset_key: string;
  instrument_id: string | null;
  symbol: string | null;
  market: string | null;
  exchange: string | null;
  asset_type: string | null;
  item: Record<string, unknown>;
};
type PreferenceRow = {
  user_id: string;
  alerts_enabled: boolean;
  minimum_severity: AlertPreferences["minimumSeverity"];
  frequency: AlertPreferences["frequency"];
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
  opportunity_alerts_enabled: boolean;
  in_app_enabled: boolean;
  email_enabled: boolean;
  monitored_watchlist_ids: string[] | null;
};
type ExistingEvent = {
  id: string;
  user_id: string;
  instrument_id: string;
  rule_id: string;
  direction: AlertEvaluation["direction"];
  severity: AlertEvaluation["severity"];
  status: string;
  triggered_at: string;
  updated_at: string;
};

export type AlertJobSummary = {
  status: "completed" | "partial";
  processedUsers: number;
  processedInstruments: number;
  createdEvents: number;
  updatedEvents: number;
  resolvedEvents: number;
  errors: number;
};

function preferenceFromRow(row?: PreferenceRow): AlertPreferences {
  if (!row) return DEFAULT_ALERT_PREFERENCES;
  return {
    alertsEnabled: row.alerts_enabled,
    minimumSeverity: row.minimum_severity,
    frequency: row.frequency,
    quietHoursStart: row.quiet_hours_start?.slice(0, 5) ?? null,
    quietHoursEnd: row.quiet_hours_end?.slice(0, 5) ?? null,
    timezone: row.timezone,
    opportunityAlertsEnabled: row.opportunity_alerts_enabled,
    inAppEnabled: row.in_app_enabled,
    emailEnabled: row.email_enabled,
    monitoredWatchlistIds: row.monitored_watchlist_ids,
  };
}

function eventIdentity(userId: string, instrumentId: string, ruleId: string, direction: string) {
  return `${userId}:${instrumentId}:${ruleId}:${direction}`;
}

function evaluationWindow(now: Date) {
  return now.toISOString().slice(0, 13);
}

export function shouldEvaluateOnThisRun(assetType: string, market: string, now: Date) {
  if (assetType === "crypto") return true;
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = now.getUTCHours();
  if (market === "argentina") return hour === 21;
  return hour === 22;
}

async function releaseScheduledDeliveries(supabase: SupabaseClient, now: Date) {
  await supabase.from("alert_deliveries").update({ status: "sent", sent_at: now.toISOString(), attempt_count: 1, updated_at: now.toISOString() })
    .eq("channel", "in_app").eq("status", "pending").lte("scheduled_at", now.toISOString());
}

async function syncRuleVersions(supabase: SupabaseClient) {
  const rows = alertRuleCatalog.map((rule) => ({
    rule_id: rule.id,
    version: rule.version,
    category: rule.category,
    definition: rule,
    enabled: rule.enabled,
  }));
  const { error } = await supabase.from("alert_rule_versions").upsert(rows, { onConflict: "rule_id,version" });
  if (error) throw error;
}

function marketFromItem(item: ItemRow) {
  const market = String(item.market ?? item.item.market ?? "auto").toLowerCase();
  if (market.includes("argentina") || market.includes("byma")) return "argentina" as const;
  if (market.includes("crypto")) return "crypto" as const;
  if (market.includes("cedear")) return "cedear" as const;
  return "auto" as const;
}

export async function runAlertEvaluation(now = new Date(), suppliedClient?: SupabaseClient): Promise<AlertJobSummary & { skipped?: boolean }> {
  const supabase = suppliedClient ?? createAdminClient();
  const windowKey = `alerts:${now.toISOString().slice(0, 16).replace(/.$/, "0")}`;
  const lock = await supabase.from("alert_job_runs").insert({ window_key: windowKey, status: "running" }).select("id").single();
  if (lock.error?.code === "23505") return { status: "completed", processedUsers: 0, processedInstruments: 0, createdEvents: 0, updatedEvents: 0, resolvedEvents: 0, errors: 0, skipped: true };
  if (lock.error) throw lock.error;

  const summary: AlertJobSummary = { status: "completed", processedUsers: 0, processedInstruments: 0, createdEvents: 0, updatedEvents: 0, resolvedEvents: 0, errors: 0 };
  try {
    await Promise.all([syncRuleVersions(supabase), releaseScheduledDeliveries(supabase, now)]);
    const [watchlistsResult, preferencesResult, activeEventsResult, recentEventsResult] = await Promise.all([
      supabase.from("watchlists").select("id,user_id,name").order("created_at").limit(500),
      supabase.from("alert_preferences").select("user_id,alerts_enabled,minimum_severity,frequency,quiet_hours_start,quiet_hours_end,timezone,opportunity_alerts_enabled,in_app_enabled,email_enabled,monitored_watchlist_ids"),
      supabase.from("alert_events").select("id,user_id,instrument_id,rule_id,direction,severity,status,triggered_at,updated_at").eq("status", "active").limit(2000),
      supabase.from("alert_events").select("id,user_id,instrument_id,rule_id,direction,severity,status,triggered_at,updated_at").neq("status", "active").order("triggered_at", { ascending: false }).limit(2000),
    ]);
    for (const result of [watchlistsResult, preferencesResult, activeEventsResult, recentEventsResult]) if (result.error) throw result.error;
    const watchlists = (watchlistsResult.data ?? []) as WatchlistRow[];
    const preferences = new Map(((preferencesResult.data ?? []) as PreferenceRow[]).map((row) => [row.user_id, preferenceFromRow(row)]));
    const activeEvents = new Map(((activeEventsResult.data ?? []) as ExistingEvent[]).map((event) => [eventIdentity(event.user_id, event.instrument_id, event.rule_id, event.direction), event]));
    const recentEvents = new Map<string, ExistingEvent>();
    for (const event of (recentEventsResult.data ?? []) as ExistingEvent[]) {
      const key = eventIdentity(event.user_id, event.instrument_id, event.rule_id, event.direction);
      if (!recentEvents.has(key)) recentEvents.set(key, event);
    }
    const enabledWatchlists = watchlists.filter((watchlist) => {
      const pref = preferences.get(watchlist.user_id) ?? DEFAULT_ALERT_PREFERENCES;
      return pref.alertsEnabled && pref.frequency !== "disabled" && (pref.monitoredWatchlistIds === null || pref.monitoredWatchlistIds.includes(watchlist.id));
    });
    const watchlistById = new Map(enabledWatchlists.map((row) => [row.id, row]));
    summary.processedUsers = new Set(enabledWatchlists.map((row) => row.user_id)).size;
    if (!enabledWatchlists.length) return summary;

    const itemsResult = await supabase.from("watchlist_items")
      .select("id,watchlist_id,user_id,asset_key,instrument_id,symbol,market,exchange,asset_type,item")
      .in("watchlist_id", enabledWatchlists.map((row) => row.id)).limit(2000);
    if (itemsResult.error) throw itemsResult.error;
    const uniqueItems = new Map<string, ItemRow>();
    for (const item of (itemsResult.data ?? []) as ItemRow[]) {
      const instrumentId = item.instrument_id ?? String(item.item.instrumentId ?? item.asset_key);
      const key = `${item.user_id}:${instrumentId}`;
      if (!uniqueItems.has(key)) uniqueItems.set(key, item);
    }
    const channel = new InAppNotificationChannel(supabase);

    for (const item of uniqueItems.values()) {
      const watchlist = watchlistById.get(item.watchlist_id);
      if (!watchlist) continue;
      const preferencesForUser = preferences.get(item.user_id) ?? DEFAULT_ALERT_PREFERENCES;
      const assetType = classifyAlertAssetType(String(item.asset_type ?? item.item.assetType ?? "other"));
      if (["bond", "bill", "corporate_bond", "other"].includes(assetType)) continue;
      if (!shouldEvaluateOnThisRun(assetType, marketFromItem(item), now)) continue;
      const instrumentId = item.instrument_id ?? String(item.item.instrumentId ?? item.asset_key);
      const symbol = String(item.symbol ?? item.item.symbol ?? "").toUpperCase();
      if (!symbol) continue;
      summary.processedInstruments += 1;
      try {
        const analysis = await analyzeTradeRadar({ instrumentId, symbol, market: marketFromItem(item), interval: "1d", provider: "auto" });
        const evaluations = evaluateAlertRules({
          instrumentId,
          symbol: analysis.symbol,
          name: String(item.item.name ?? analysis.instrument?.name ?? symbol),
          assetType,
          market: analysis.market,
          exchange: item.exchange ?? (String(item.item.exchange ?? "") || undefined),
          currency: analysis.currency,
          provider: analysis.provider,
          providerHealthy: analysis.sampleStatus === "ok" && analysis.ohlcv.length >= 220,
          observedAt: analysis.lastBarTime,
          fetchedAt: analysis.fetchedAt,
          dataDelay: analysis.dataDelay,
          bars: analysis.ohlcv,
        }, now);
        const triggeredIdentities = new Set<string>();

        for (const evaluation of evaluations.filter((candidate) => candidate.triggered)) {
          if (!shouldCreateInAppAlert({ severity: evaluation.severity, category: evaluation.category, watchlistId: item.watchlist_id, preferences: preferencesForUser })) continue;
          const identity = eventIdentity(item.user_id, instrumentId, evaluation.ruleId, evaluation.direction);
          triggeredIdentities.add(identity);
          const existing = activeEvents.get(identity);
          const localizedContent = { title: evaluation.title, summary: evaluation.summary };
          if (existing) {
            const escalated = severityRank[evaluation.severity] > severityRank[existing.severity];
            const update = await supabase.from("alert_events").update({
              severity: escalated ? evaluation.severity : existing.severity,
              confidence_score: evaluation.confidenceScore,
              summary: evaluation.summary.es,
              localized_content: localizedContent,
              evidence: evaluation.evidence,
              limitations: evaluation.limitations,
              provider: analysis.provider,
              observed_at: analysis.lastBarTime,
              fetched_at: analysis.fetchedAt,
              freshness_status: evaluation.freshnessStatus,
              last_evaluated_at: now.toISOString(),
              updated_at: now.toISOString(),
            }).eq("id", existing.id);
            if (update.error) throw update.error;
            summary.updatedEvents += 1;
            continue;
          }
          const rule = alertRuleCatalog.find((candidate) => candidate.id === evaluation.ruleId)!;
          const previous = recentEvents.get(identity);
          if (!canReactivate(previous?.triggered_at ?? null, rule.cooldownMinutes, now)) continue;
          const inserted = await supabase.from("alert_events").insert({
            user_id: item.user_id,
            instrument_id: instrumentId,
            instrument_symbol: analysis.symbol,
            market: analysis.market,
            currency: analysis.currency,
            watchlist_id: item.watchlist_id,
            rule_id: evaluation.ruleId,
            rule_version: evaluation.ruleVersion,
            category: evaluation.category,
            severity: evaluation.severity,
            confidence_score: evaluation.confidenceScore,
            direction: evaluation.direction,
            title: evaluation.title.es,
            summary: evaluation.summary.es,
            localized_content: localizedContent,
            evidence: evaluation.evidence,
            limitations: evaluation.limitations,
            provider: analysis.provider,
            observed_at: analysis.lastBarTime,
            fetched_at: analysis.fetchedAt,
            freshness_status: evaluation.freshnessStatus,
            deduplication_key: deduplicationKey({ userId: item.user_id, instrumentId, evaluation, window: evaluationWindow(now) }),
            status: "active",
            triggered_at: now.toISOString(),
            last_evaluated_at: now.toISOString(),
          }).select("id").single();
          if (inserted.error) throw inserted.error;
          await channel.send({ alertEventId: inserted.data.id, userId: item.user_id, preferences: preferencesForUser, now });
          summary.createdEvents += 1;
        }

        for (const [identity, existing] of activeEvents) {
          if (existing.user_id !== item.user_id || existing.instrument_id !== instrumentId || triggeredIdentities.has(identity)) continue;
          const resolved = await supabase.from("alert_events").update({ status: "resolved", resolved_at: now.toISOString(), last_evaluated_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", existing.id);
          if (resolved.error) throw resolved.error;
          summary.resolvedEvents += 1;
        }
      } catch {
        summary.errors += 1;
      }
    }
    summary.status = summary.errors ? "partial" : "completed";
    return summary;
  } finally {
    await supabase.from("alert_job_runs").update({
      status: summary.errors ? "partial" : "completed",
      finished_at: new Date().toISOString(),
      processed_users: summary.processedUsers,
      processed_instruments: summary.processedInstruments,
      created_events: summary.createdEvents,
      error_count: summary.errors,
    }).eq("id", lock.data.id);
  }
}
