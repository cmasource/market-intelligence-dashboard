import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20260805190000_intelligent_alerts.sql", "utf8");
const subscriptionsSql = readFileSync("supabase/migrations/20260807190105_configurable_alert_subscriptions.sql", "utf8");
const intradayStateSql = readFileSync("supabase/migrations/20260811131558_intraday_alert_state.sql", "utf8");
const externalChannelsSql = readFileSync("supabase/migrations/20260811131603_external_alert_channels.sql", "utf8");
const arbitrageSubscriptionsSql = readFileSync("supabase/migrations/20260811142159_arbitrage_alert_subscriptions.sql", "utf8");

test("migration enables RLS and does not grant clients alert creation privileges", () => {
  for (const table of ["alert_preferences", "alert_rule_versions", "alert_events", "alert_deliveries", "alert_job_runs"]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.doesNotMatch(sql, /grant\s+insert[^;]+alert_events\s+to\s+authenticated/i);
  assert.match(sql, /revoke all on public\.alert_events from anon, authenticated/i);
  assert.match(sql, /revoke all on public\.alert_deliveries from anon, authenticated/i);
  assert.match(sql, /grant update \(read_at\) on public\.alert_events to authenticated/i);
  assert.match(sql, /user_id, instrument_id, rule_id, direction[\s\S]+where status = 'active'/i);
});

test("configurable alert subscriptions are user-owned and constrained to supported conditions", () => {
  assert.match(subscriptionsSql, /create table if not exists public\.alert_subscriptions/i);
  assert.match(subscriptionsSql, /alter table public\.alert_subscriptions enable row level security/i);
  assert.match(subscriptionsSql, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(subscriptionsSql, /with check \([\s\S]*?\(select auth\.uid\(\)\) = user_id/i);
  assert.match(subscriptionsSql, /price_above[\s\S]+near_period_high/i);
  assert.match(subscriptionsSql, /unique \(user_id, instrument_id, condition\)/i);
  assert.match(subscriptionsSql, /grant select, insert, update, delete on public\.alert_subscriptions to authenticated/i);
  assert.doesNotMatch(subscriptionsSql, /grant [^;]+ to anon/i);
});

test("intraday alert state is private and service-managed", () => {
  assert.match(intradayStateSql, /create table if not exists public\.alert_subscription_states/i);
  assert.match(intradayStateSql, /alter table public\.alert_subscription_states enable row level security/i);
  assert.match(intradayStateSql, /revoke all on public\.alert_subscription_states from anon, authenticated/i);
  assert.match(intradayStateSql, /grant select, insert, update, delete on public\.alert_subscription_states to service_role/i);
});

test("external channels require explicit consent and retain provider delivery metadata", () => {
  assert.match(externalChannelsSql, /whatsapp_phone_e164/);
  assert.match(externalChannelsSql, /whatsapp_consent_at/);
  assert.match(externalChannelsSql, /\^\\\+\[1-9\]\[0-9\]\{7,14\}\$/);
  assert.match(externalChannelsSql, /provider_message_id/);
  assert.match(externalChannelsSql, /provider_status/);
});

test("arbitrage alert subscriptions are user-owned, constrained and service-readable", () => {
  assert.match(arbitrageSubscriptionsSql, /create table if not exists public\.arbitrage_alert_subscriptions/i);
  assert.match(arbitrageSubscriptionsSql, /source_provider_id <> destination_provider_id/i);
  assert.match(arbitrageSubscriptionsSql, /transfer_asset in \('USD_BANK', 'USDT', 'USDC'\)/i);
  assert.match(arbitrageSubscriptionsSql, /alter table public\.arbitrage_alert_subscriptions enable row level security/i);
  assert.match(arbitrageSubscriptionsSql, /using \(\(select auth\.uid\(\)\) = user_id\)/i);
  assert.match(arbitrageSubscriptionsSql, /grant select, insert, update, delete on public\.arbitrage_alert_subscriptions to authenticated/i);
  assert.doesNotMatch(arbitrageSubscriptionsSql, /grant [^;]+ to anon/i);
});
