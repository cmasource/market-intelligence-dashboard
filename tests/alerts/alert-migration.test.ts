import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20260805190000_intelligent_alerts.sql", "utf8");
const subscriptionsSql = readFileSync("supabase/migrations/20260807190105_configurable_alert_subscriptions.sql", "utf8");

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
