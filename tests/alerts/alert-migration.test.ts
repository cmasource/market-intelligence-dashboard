import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync("supabase/migrations/20260805190000_intelligent_alerts.sql", "utf8");

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
