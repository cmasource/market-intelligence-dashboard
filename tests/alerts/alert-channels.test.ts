import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildAlertEmailHtml, EmailNotificationChannel } from "../../lib/alerts/channels";
import { DEFAULT_ALERT_PREFERENCES } from "../../lib/alerts/preferences";

function databaseRecorder() {
  const writes: Record<string, unknown>[] = [];
  const client = {
    from: () => ({ upsert: async (payload: Record<string, unknown>) => { writes.push(payload); return { error: null }; } }),
  } as unknown as SupabaseClient;
  return { client, writes };
}

const request = {
  alertEventId: "event-1", userId: "user-1", now: new Date("2026-08-10T15:00:00.000Z"),
  preferences: { ...DEFAULT_ALERT_PREFERENCES }, title: "MSFT cruzó el objetivo", summary: "Cotización verificable.",
  alertUrl: "https://example.com/alerts/event-1",
};

test("Resend delivery uses a deterministic idempotency key and records provider acceptance", async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.RESEND_FROM_EMAIL;
  const { client, writes } = databaseRecorder();
  let captured: RequestInit | undefined;
  process.env.RESEND_API_KEY = "re_test";
  process.env.RESEND_FROM_EMAIL = "CMA <alerts@example.com>";
  globalThis.fetch = async (_input, init) => { captured = init; return new Response(JSON.stringify({ id: "email-1" }), { status: 200 }); };
  try {
    const result = await new EmailNotificationChannel(client).send({ ...request, recipientEmail: "user@example.com" });
    assert.equal(result.status, "sent");
    assert.equal(new Headers(captured?.headers).get("Idempotency-Key"), "cma-alert-event-1");
    const body = JSON.parse(String(captured?.body)) as { html: string };
    assert.match(body.html, /https:\/\/example\.com\/alerts\/guide/);
    assert.match(body.html, /Entender esta alerta/);
    assert.match(body.html, /https:\/\/example\.com\/brand\/cma-consulting-header-transparent\.png/);
    assert.match(body.html, /#27b7ae/);
    assert.match(body.html, /condición determinística/);
    assert.equal(writes.at(-1)?.provider_message_id, "email-1");
    assert.equal(writes.at(-1)?.provider_status, "accepted");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = previousFrom;
  }
});

test("branded email escapes dynamic alert content", () => {
  const html = buildAlertEmailHtml({
    title: "<script>alert('title')</script>",
    summary: "MSFT > 500 & verified",
    alertUrl: "https://example.com/alerts/event-2",
  });
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert\(&#39;title&#39;\)&lt;\/script&gt;/);
  assert.match(html, /MSFT &gt; 500 &amp; verified/);
});
