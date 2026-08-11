import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { join } from "node:path";

const root = process.cwd();

test("cron route uses the documented server-only secret", () => {
  const route = readFileSync(join(root, "app/api/alerts/evaluate/route.ts"), "utf8");
  assert.match(route, /process\.env\.CRON_SECRET/);
  assert.doesNotMatch(route, /ALERTS_CRON_SECRET/);
});

test("repository does not activate a scheduler before the hosting plan is selected", () => {
  assert.equal(existsSync(join(root, "vercel.json")), false);
  const proTemplate = readFileSync(join(root, "docs/vercel-cron.pro.example.json"), "utf8");
  assert.match(proTemplate, /\/api\/alerts\/evaluate/);
  assert.match(proTemplate, /\*\/5 \* \* \* \*/);
});

test("Supabase Cron template reads endpoint and authorization from Vault", () => {
  const sql = readFileSync(join(root, "supabase/snippets/enable_intelligent_alerts_cron.sql"), "utf8");
  assert.match(sql, /vault\.decrypted_secrets/);
  assert.match(sql, /cma_alerts_endpoint_url/);
  assert.match(sql, /cma_alerts_cron_secret/);
  assert.match(sql, /cron\.schedule/);
  assert.match(sql, /'\*\/5 \* \* \* \*'/);
  assert.doesNotMatch(sql, /https:\/\/your-production-host\/api\/alerts\/evaluate\s*['"]/);
});
