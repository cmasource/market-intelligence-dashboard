import type { SupabaseClient } from "@supabase/supabase-js";
import { getArgentinaQuote } from "@/lib/argentina";
import { getMarketQuote } from "@/lib/market-data";
import { analyzeTradeRadar } from "@/lib/technical/trade-radar";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmailNotificationChannel, InAppNotificationChannel, WhatsappNotificationChannel } from "./channels";
import { arbitrageInstrumentId, evaluateArbitrageAlert } from "./arbitrage";
import { canReactivate, classifyAlertAssetType, deduplicationKey, evaluateAlertRules } from "./engine";
import { evaluatePersonalAlert, isPersonalQuoteFresh } from "./personal";
import { DEFAULT_ALERT_PREFERENCES, shouldCreateAutomaticAlert, shouldCreatePersonalAlert } from "./preferences";
import { alertRuleCatalog } from "./rules";
import { severityRank, type AlertEvaluation, type AlertPreferences, type ArbitrageAlertSubscription, type PersonalAlertCondition, type PersonalAlertQuoteContext, type PersonalAlertSubscription } from "./types";

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
  whatsapp_enabled: boolean;
  whatsapp_phone_e164: string | null;
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
type SubscriptionRow = {
  id: string; user_id: string; watchlist_id: string; watchlist_item_id: string; instrument_id: string;
  instrument_symbol: string; instrument_name: string; market: string; exchange: string | null; currency: string;
  asset_type: PersonalAlertSubscription["assetType"]; condition: PersonalAlertCondition; target_value: number | null;
  threshold_percent: number | null; lookback_bars: number | null; enabled: boolean; created_at: string; updated_at: string;
};
type SubscriptionStateRow = {
  subscription_id: string; last_price: number | null; change_percent: number | null;
  observed_at: string | null; fetched_at: string | null; provider: string | null; data_delay: PersonalAlertQuoteContext["dataDelay"] | null;
};
type ArbitrageSubscriptionRow = {
  id: string; user_id: string; source_provider_id: string; destination_provider_id: string;
  transfer_asset: ArbitrageAlertSubscription["transferAsset"]; amount_usd: number | string;
  minimum_gross_spread_ars: number | string; enabled: boolean; created_at: string; updated_at: string;
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
    whatsappEnabled: row.whatsapp_enabled,
    whatsappPhoneE164: row.whatsapp_phone_e164,
    monitoredWatchlistIds: row.monitored_watchlist_ids,
  };
}

function eventIdentity(userId: string, instrumentId: string, ruleId: string, direction: string) {
  return `${userId}:${instrumentId}:${ruleId}:${direction}`;
}

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

function evaluationWindow(now: Date) {
  const bucket = Math.floor(now.getUTCMinutes() / 5) * 5;
  return `${now.toISOString().slice(0, 13)}:${String(bucket).padStart(2, "0")}`;
}

function arbitrageSubscriptionFromRow(row: ArbitrageSubscriptionRow): ArbitrageAlertSubscription {
  return {
    id: row.id, userId: row.user_id, sourceProviderId: row.source_provider_id,
    destinationProviderId: row.destination_provider_id, transferAsset: row.transfer_asset,
    amountUsd: Number(row.amount_usd), minimumGrossSpreadArs: Number(row.minimum_gross_spread_ars),
    enabled: row.enabled, createdAt: row.created_at, updatedAt: row.updated_at,
  };
}

export function shouldEvaluateOnThisRun(assetType: string, market: string, now: Date) {
  if (assetType === "crypto") return true;
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = now.getUTCHours();
  if (market === "argentina") return hour === 21;
  return hour === 22;
}

export function shouldEvaluatePersonalOnThisRun(assetType: string, market: string, now: Date) {
  if (assetType === "crypto") return true;
  const day = now.getUTCDay();
  if (day === 0 || day === 6) return false;
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (market === "argentina" || market === "cedear") return minutes >= 12 * 60 + 30 && minutes <= 21 * 60;
  return minutes >= 13 * 60 && minutes <= 22 * 60;
}

async function releaseScheduledDeliveries(supabase: SupabaseClient, now: Date) {
  const { error } = await supabase.from("alert_deliveries").update({ status: "sent", sent_at: now.toISOString(), attempt_count: 1, updated_at: now.toISOString() })
    .eq("channel", "in_app").eq("status", "pending").lte("scheduled_at", now.toISOString());
  if (error) throw error;
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

async function dispatchScheduledExternalDeliveries(supabase: SupabaseClient, now: Date, preferencesByUser: Map<string, AlertPreferences>) {
  const pending = await supabase.from("alert_deliveries")
    .select("alert_event_id,user_id,channel,alert_events(title,summary)")
    .in("channel", ["email", "whatsapp"]).eq("status", "pending").lte("scheduled_at", now.toISOString()).limit(100);
  if (pending.error) throw pending.error;
  const emailChannel = new EmailNotificationChannel(supabase);
  const whatsappChannel = new WhatsappNotificationChannel(supabase);
  const recipientEmails = new Map<string, string | null>();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
  for (const row of pending.data ?? []) {
    const preferences = preferencesByUser.get(row.user_id) ?? DEFAULT_ALERT_PREFERENCES;
    const related = Array.isArray(row.alert_events) ? row.alert_events[0] : row.alert_events;
    const delivery = {
      alertEventId: row.alert_event_id, userId: row.user_id, preferences, now, scheduledDispatch: true,
      title: related?.title ?? "CMA Market Intelligence", summary: related?.summary ?? "Se activó una alerta de mercado.",
      alertUrl: siteUrl ? `${siteUrl}/alerts/${row.alert_event_id}` : undefined,
    };
    if (row.channel === "email" && preferences.emailEnabled) {
      if (!recipientEmails.has(row.user_id)) {
        const userResult = await supabase.auth.admin.getUserById(row.user_id);
        recipientEmails.set(row.user_id, userResult.data.user?.email ?? null);
      }
      await emailChannel.send({ ...delivery, recipientEmail: recipientEmails.get(row.user_id) });
    }
    if (row.channel === "whatsapp" && preferences.whatsappEnabled) {
      await whatsappChannel.send({ ...delivery, recipientWhatsapp: preferences.whatsappPhoneE164 });
    }
  }
}

async function loadPersonalQuote(item: ItemRow, symbol: string): Promise<Omit<PersonalAlertQuoteContext, "previousObservedPrice">> {
  const market = marketFromItem(item);
  if (market === "argentina" || market === "cedear") {
    const quote = await getArgentinaQuote(symbol);
    return {
      price: quote.isRealData ? quote.price : null,
      changePercent: quote.isRealData ? quote.changePercent ?? null : null,
      provider: quote.source,
      observedAt: quote.isRealData ? quote.lastUpdated ?? null : null,
      fetchedAt: new Date().toISOString(),
      dataDelay: quote.source === "yahoo" ? "delayed" : "unknown",
    };
  }
  const quote = await getMarketQuote(symbol);
  return {
    price: quote.price, changePercent: quote.changePercent, provider: quote.provider,
    observedAt: quote.observedAt, fetchedAt: quote.fetchedAt, dataDelay: quote.dataDelay,
  };
}

export async function runAlertEvaluation(now = new Date(), suppliedClient?: SupabaseClient): Promise<AlertJobSummary & { skipped?: boolean }> {
  const supabase = suppliedClient ?? createAdminClient();
  const windowKey = `alerts:${evaluationWindow(now)}`;
  const lock = await supabase.from("alert_job_runs").insert({ window_key: windowKey, status: "running" }).select("id").single();
  if (lock.error?.code === "23505") return { status: "completed", processedUsers: 0, processedInstruments: 0, createdEvents: 0, updatedEvents: 0, resolvedEvents: 0, errors: 0, skipped: true };
  if (lock.error) throw lock.error;

  const summary: AlertJobSummary = { status: "completed", processedUsers: 0, processedInstruments: 0, createdEvents: 0, updatedEvents: 0, resolvedEvents: 0, errors: 0 };
  let fatalError = false;
  try {
    await Promise.all([syncRuleVersions(supabase), releaseScheduledDeliveries(supabase, now)]);
    const [watchlistsResult, preferencesResult, subscriptionsResult, arbitrageSubscriptionsResult, subscriptionStatesResult, activeEventsResult, recentEventsResult] = await Promise.all([
      supabase.from("watchlists").select("id,user_id,name").order("created_at").limit(500),
      supabase.from("alert_preferences").select("user_id,alerts_enabled,minimum_severity,frequency,quiet_hours_start,quiet_hours_end,timezone,opportunity_alerts_enabled,in_app_enabled,email_enabled,whatsapp_enabled,whatsapp_phone_e164,monitored_watchlist_ids"),
      supabase.from("alert_subscriptions").select("id,user_id,watchlist_id,watchlist_item_id,instrument_id,instrument_symbol,instrument_name,market,exchange,currency,asset_type,condition,target_value,threshold_percent,lookback_bars,enabled,created_at,updated_at").eq("enabled", true).limit(2000),
      supabase.from("arbitrage_alert_subscriptions").select("id,user_id,source_provider_id,destination_provider_id,transfer_asset,amount_usd,minimum_gross_spread_ars,enabled,created_at,updated_at").eq("enabled", true).limit(1000),
      supabase.from("alert_subscription_states").select("subscription_id,last_price,change_percent,observed_at,fetched_at,provider,data_delay").limit(2000),
      supabase.from("alert_events").select("id,user_id,instrument_id,rule_id,direction,severity,status,triggered_at,updated_at").eq("status", "active").limit(2000),
      supabase.from("alert_events").select("id,user_id,instrument_id,rule_id,direction,severity,status,triggered_at,updated_at").neq("status", "active").order("triggered_at", { ascending: false }).limit(2000),
    ]);
    for (const result of [watchlistsResult, preferencesResult, subscriptionsResult, arbitrageSubscriptionsResult, subscriptionStatesResult, activeEventsResult, recentEventsResult]) if (result.error) throw result.error;
    const watchlists = (watchlistsResult.data ?? []) as WatchlistRow[];
    const preferences = new Map(((preferencesResult.data ?? []) as PreferenceRow[]).map((row) => [row.user_id, preferenceFromRow(row)]));
    const arbitrageSubscriptions = ((arbitrageSubscriptionsResult.data ?? []) as ArbitrageSubscriptionRow[]).map(arbitrageSubscriptionFromRow)
      .filter((subscription) => {
        const preference = preferences.get(subscription.userId) ?? DEFAULT_ALERT_PREFERENCES;
        return preference.alertsEnabled && preference.frequency !== "disabled" && preference.opportunityAlertsEnabled;
      });
    await dispatchScheduledExternalDeliveries(supabase, now, preferences);
    const activeEvents = new Map(((activeEventsResult.data ?? []) as ExistingEvent[]).map((event) => [eventIdentity(event.user_id, event.instrument_id, event.rule_id, event.direction), event]));
    const subscriptionStates = new Map(((subscriptionStatesResult.data ?? []) as SubscriptionStateRow[]).map((state) => [state.subscription_id, state]));
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
    const subscriptionsByInstrument = new Map<string, PersonalAlertSubscription[]>();
    for (const row of (subscriptionsResult.data ?? []) as SubscriptionRow[]) {
      if (!watchlistById.has(row.watchlist_id)) continue;
      const subscription = subscriptionFromRow(row);
      const key = `${subscription.userId}:${subscription.instrumentId}`;
      subscriptionsByInstrument.set(key, [...(subscriptionsByInstrument.get(key) ?? []), subscription]);
    }
    summary.processedUsers = new Set([...enabledWatchlists.map((row) => row.user_id), ...arbitrageSubscriptions.map((row) => row.userId)]).size;
    let itemRows: ItemRow[] = [];
    if (enabledWatchlists.length) {
      const itemsResult = await supabase.from("watchlist_items")
        .select("id,watchlist_id,user_id,asset_key,instrument_id,symbol,market,exchange,asset_type,item")
        .in("watchlist_id", enabledWatchlists.map((row) => row.id)).limit(2000);
      if (itemsResult.error) throw itemsResult.error;
      itemRows = (itemsResult.data ?? []) as ItemRow[];
    }
    const uniqueItems = new Map<string, ItemRow>();
    for (const item of itemRows) {
      const instrumentId = item.instrument_id ?? String(item.item.instrumentId ?? item.asset_key);
      const key = `${item.user_id}:${instrumentId}`;
      if (!uniqueItems.has(key)) uniqueItems.set(key, item);
    }
    const inAppChannel = new InAppNotificationChannel(supabase);
    const emailChannel = new EmailNotificationChannel(supabase);
    const whatsappChannel = new WhatsappNotificationChannel(supabase);
    const recipientEmails = new Map<string, string | null>();

    for (const item of uniqueItems.values()) {
      const watchlist = watchlistById.get(item.watchlist_id);
      if (!watchlist) continue;
      const preferencesForUser = preferences.get(item.user_id) ?? DEFAULT_ALERT_PREFERENCES;
      const assetType = classifyAlertAssetType(String(item.asset_type ?? item.item.assetType ?? "other"));
      if (["bond", "bill", "corporate_bond", "other"].includes(assetType)) continue;
      const instrumentId = item.instrument_id ?? String(item.item.instrumentId ?? item.asset_key);
      const symbol = String(item.symbol ?? item.item.symbol ?? "").toUpperCase();
      if (!symbol) continue;
      const itemMarket = marketFromItem(item);
      const instrumentSubscriptions = subscriptionsByInstrument.get(`${item.user_id}:${instrumentId}`) ?? [];
      const automaticDue = shouldEvaluateOnThisRun(assetType, itemMarket, now);
      const personalDue = instrumentSubscriptions.length > 0 && shouldEvaluatePersonalOnThisRun(assetType, itemMarket, now);
      if (!automaticDue && !personalDue) continue;
      summary.processedInstruments += 1;
      try {
        const analysis = await analyzeTradeRadar({ instrumentId, symbol, market: itemMarket, interval: "1d", provider: "auto" });
        const snapshot = {
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
        };
        const automaticEvaluations = automaticDue ? evaluateAlertRules(snapshot, now) : [];
        const personalQuote = personalDue ? await loadPersonalQuote(item, symbol) : null;
        const personalEvaluations = personalQuote ? instrumentSubscriptions.map((subscription) => {
          const previousState = subscriptionStates.get(subscription.id);
          const quoteContext: PersonalAlertQuoteContext = {
            ...personalQuote,
            previousObservedPrice: previousState?.last_price === null || previousState?.last_price === undefined ? null : Number(previousState.last_price),
          };
          return { evaluation: evaluatePersonalAlert(snapshot, subscription, now, quoteContext), subscription, quote: quoteContext };
        }) : [];

        const quoteForState = personalQuote ? { ...personalQuote, previousObservedPrice: null } : null;
        if (quoteForState && isPersonalQuoteFresh(quoteForState, now)) {
          const stateRows = instrumentSubscriptions.map((subscription) => ({
            subscription_id: subscription.id, user_id: subscription.userId, instrument_id: subscription.instrumentId,
            last_price: quoteForState.price, change_percent: quoteForState.changePercent, observed_at: quoteForState.observedAt,
            fetched_at: quoteForState.fetchedAt, provider: quoteForState.provider, data_delay: quoteForState.dataDelay,
            updated_at: now.toISOString(),
          }));
          if (stateRows.length) {
            const stateUpdate = await supabase.from("alert_subscription_states").upsert(stateRows, { onConflict: "subscription_id" });
            if (stateUpdate.error) throw stateUpdate.error;
          }
        }

        const evaluations = [
          ...automaticEvaluations.map((evaluation) => ({
            evaluation, subscription: null as PersonalAlertSubscription | null,
            provider: analysis.provider, observedAt: analysis.lastBarTime, fetchedAt: analysis.fetchedAt,
          })),
          ...personalEvaluations.map(({ evaluation, subscription, quote }) => ({
            evaluation, subscription: subscription as PersonalAlertSubscription | null,
            provider: quote.provider, observedAt: quote.observedAt ?? analysis.lastBarTime, fetchedAt: quote.fetchedAt,
          })),
        ];
        const triggeredIdentities = new Set<string>();
        const evaluatedRuleIds = new Set(evaluations.map((entry) => entry.evaluation.ruleId));

        for (const candidate of evaluations.filter((entry) => entry.evaluation.triggered)) {
          const { evaluation, subscription, provider, observedAt, fetchedAt } = candidate;
          const deliveryAllowed = subscription
            ? shouldCreatePersonalAlert(subscription.watchlistId, preferencesForUser)
            : shouldCreateAutomaticAlert({ severity: evaluation.severity, category: evaluation.category, watchlistId: item.watchlist_id, preferences: preferencesForUser });
          if (!deliveryAllowed) continue;
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
              provider,
              observed_at: observedAt,
              fetched_at: fetchedAt,
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
            watchlist_id: subscription?.watchlistId ?? item.watchlist_id,
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
            provider,
            observed_at: observedAt,
            fetched_at: fetchedAt,
            freshness_status: evaluation.freshnessStatus,
            deduplication_key: deduplicationKey({ userId: item.user_id, instrumentId, evaluation, window: evaluationWindow(now) }),
            status: "active",
            triggered_at: now.toISOString(),
            last_evaluated_at: now.toISOString(),
          }).select("id").single();
          if (inserted.error) throw inserted.error;
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
            ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
          const delivery = {
            alertEventId: inserted.data.id, userId: item.user_id, preferences: preferencesForUser, now,
            title: evaluation.title.es, summary: evaluation.summary.es,
            alertUrl: siteUrl ? `${siteUrl}/alerts/${inserted.data.id}` : undefined,
          };
          if (preferencesForUser.inAppEnabled) await inAppChannel.send(delivery);
          if (preferencesForUser.emailEnabled) {
            if (!recipientEmails.has(item.user_id)) {
              const userResult = await supabase.auth.admin.getUserById(item.user_id);
              recipientEmails.set(item.user_id, userResult.data.user?.email ?? null);
            }
            await emailChannel.send({ ...delivery, recipientEmail: recipientEmails.get(item.user_id) });
          }
          if (preferencesForUser.whatsappEnabled) {
            await whatsappChannel.send({ ...delivery, recipientWhatsapp: preferencesForUser.whatsappPhoneE164 });
          }
          summary.createdEvents += 1;
        }

        for (const [identity, existing] of activeEvents) {
          if (existing.user_id !== item.user_id || existing.instrument_id !== instrumentId || !evaluatedRuleIds.has(existing.rule_id) || triggeredIdentities.has(identity)) continue;
          const resolved = await supabase.from("alert_events").update({ status: "resolved", resolved_at: now.toISOString(), last_evaluated_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", existing.id);
          if (resolved.error) throw resolved.error;
          summary.resolvedEvents += 1;
        }
      } catch {
        summary.errors += 1;
      }
    }

    if (arbitrageSubscriptions.length) {
      try {
        const { getArbitrageQuotes } = await import("@/lib/arbitrage/quote-service");
        const quotePayload = await getArbitrageQuotes(true);
        const providerNames = new Map(quotePayload.providers.map((provider) => [provider.id, provider.name]));
        const arbitrageRule = alertRuleCatalog.find((rule) => rule.id === "arbitrage_opportunity")!;
        for (const subscription of arbitrageSubscriptions) {
          summary.processedInstruments += 1;
          try {
            const evaluated = evaluateArbitrageAlert(subscription, quotePayload.quotes, providerNames, now);
            if (!evaluated) continue;
            const instrumentId = arbitrageInstrumentId(subscription);
            const identity = eventIdentity(subscription.userId, instrumentId, evaluated.evaluation.ruleId, evaluated.evaluation.direction);
            const existing = activeEvents.get(identity);
            if (!evaluated.evaluation.triggered) {
              if (existing) {
                const resolved = await supabase.from("alert_events").update({ status: "resolved", resolved_at: now.toISOString(), last_evaluated_at: now.toISOString(), updated_at: now.toISOString() }).eq("id", existing.id);
                if (resolved.error) throw resolved.error;
                summary.resolvedEvents += 1;
              }
              continue;
            }

            const localizedContent = { title: evaluated.evaluation.title, summary: evaluated.evaluation.summary };
            if (existing) {
              const updated = await supabase.from("alert_events").update({
                confidence_score: evaluated.evaluation.confidenceScore,
                summary: evaluated.evaluation.summary.es,
                localized_content: localizedContent,
                evidence: evaluated.evaluation.evidence,
                limitations: evaluated.evaluation.limitations,
                provider: `${subscription.sourceProviderId}/${subscription.destinationProviderId}`,
                observed_at: evaluated.sourceQuote.observedAt ?? evaluated.sourceQuote.fetchedAt,
                fetched_at: quotePayload.generatedAt,
                freshness_status: evaluated.evaluation.freshnessStatus,
                last_evaluated_at: now.toISOString(),
                updated_at: now.toISOString(),
              }).eq("id", existing.id);
              if (updated.error) throw updated.error;
              summary.updatedEvents += 1;
              continue;
            }

            const previous = recentEvents.get(identity);
            if (!canReactivate(previous?.triggered_at ?? null, arbitrageRule.cooldownMinutes, now)) continue;
            const sourceName = providerNames.get(subscription.sourceProviderId) ?? subscription.sourceProviderId;
            const destinationName = providerNames.get(subscription.destinationProviderId) ?? subscription.destinationProviderId;
            const inserted = await supabase.from("alert_events").insert({
              user_id: subscription.userId,
              instrument_id: instrumentId,
              instrument_symbol: `${sourceName} → ${destinationName}`,
              market: "arbitrage",
              currency: "ARS",
              watchlist_id: null,
              rule_id: evaluated.evaluation.ruleId,
              rule_version: evaluated.evaluation.ruleVersion,
              category: evaluated.evaluation.category,
              severity: evaluated.evaluation.severity,
              confidence_score: evaluated.evaluation.confidenceScore,
              direction: evaluated.evaluation.direction,
              title: evaluated.evaluation.title.es,
              summary: evaluated.evaluation.summary.es,
              localized_content: localizedContent,
              evidence: evaluated.evaluation.evidence,
              limitations: evaluated.evaluation.limitations,
              provider: `${subscription.sourceProviderId}/${subscription.destinationProviderId}`,
              observed_at: evaluated.sourceQuote.observedAt ?? evaluated.sourceQuote.fetchedAt,
              fetched_at: quotePayload.generatedAt,
              freshness_status: evaluated.evaluation.freshnessStatus,
              deduplication_key: deduplicationKey({ userId: subscription.userId, instrumentId, evaluation: evaluated.evaluation, window: evaluationWindow(now) }),
              status: "active",
              triggered_at: now.toISOString(),
              last_evaluated_at: now.toISOString(),
            }).select("id").single();
            if (inserted.error) throw inserted.error;

            const preferencesForUser = preferences.get(subscription.userId) ?? DEFAULT_ALERT_PREFERENCES;
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
              ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null);
            const delivery = {
              alertEventId: inserted.data.id,
              userId: subscription.userId,
              preferences: preferencesForUser,
              now,
              title: evaluated.evaluation.title.es,
              summary: evaluated.evaluation.summary.es,
              alertUrl: siteUrl ? `${siteUrl}/alerts/${inserted.data.id}` : undefined,
            };
            if (preferencesForUser.inAppEnabled) await inAppChannel.send(delivery);
            if (preferencesForUser.emailEnabled) {
              if (!recipientEmails.has(subscription.userId)) {
                const userResult = await supabase.auth.admin.getUserById(subscription.userId);
                recipientEmails.set(subscription.userId, userResult.data.user?.email ?? null);
              }
              await emailChannel.send({ ...delivery, recipientEmail: recipientEmails.get(subscription.userId) });
            }
            if (preferencesForUser.whatsappEnabled) {
              await whatsappChannel.send({ ...delivery, recipientWhatsapp: preferencesForUser.whatsappPhoneE164 });
            }
            summary.createdEvents += 1;
          } catch {
            summary.errors += 1;
          }
        }
      } catch {
        summary.errors += 1;
      }
    }
    summary.status = summary.errors ? "partial" : "completed";
    return summary;
  } catch (error) {
    fatalError = true;
    summary.errors += 1;
    throw error;
  } finally {
    await supabase.from("alert_job_runs").update({
      status: fatalError ? "failed" : summary.errors ? "partial" : "completed",
      finished_at: new Date().toISOString(),
      processed_users: summary.processedUsers,
      processed_instruments: summary.processedInstruments,
      created_events: summary.createdEvents,
      error_count: summary.errors,
    }).eq("id", lock.data.id);
  }
}
