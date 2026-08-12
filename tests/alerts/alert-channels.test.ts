import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { EmailNotificationChannel, WhatsappNotificationChannel } from "../../lib/alerts/channels";
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
    assert.equal(writes.at(-1)?.provider_message_id, "email-1");
    assert.equal(writes.at(-1)?.provider_status, "accepted");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = previousFrom;
  }
});
test("Meta WhatsApp Cloud API uses the approved template and normalized recipient", async () => {
  const previousFetch = globalThis.fetch;
  const previous = {
    token: process.env.META_WHATSAPP_ACCESS_TOKEN,
    phone: process.env.META_WHATSAPP_PHONE_NUMBER_ID,
    template: process.env.META_WHATSAPP_TEMPLATE_NAME,
    language: process.env.META_WHATSAPP_TEMPLATE_LANGUAGE,
    version: process.env.META_WHATSAPP_GRAPH_VERSION,
  };
  const { client, writes } = databaseRecorder();
  let endpoint = "";
  let body: Record<string, unknown> = {};
  process.env.META_WHATSAPP_ACCESS_TOKEN = "meta-test-token";
  process.env.META_WHATSAPP_PHONE_NUMBER_ID = "123456789";
  process.env.META_WHATSAPP_TEMPLATE_NAME = "cma_market_alert_v1";
  process.env.META_WHATSAPP_TEMPLATE_LANGUAGE = "es_AR";
  process.env.META_WHATSAPP_GRAPH_VERSION = "v25.0";
  globalThis.fetch = async (input, init) => {
    endpoint = String(input);
    body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    return new Response(JSON.stringify({ messages: [{ id: "wamid.test", message_status: "accepted" }] }), { status: 200 });
  };
  try {
    const result = await new WhatsappNotificationChannel(client).send({ ...request, recipientWhatsapp: "+5491112345678" });
    assert.equal(result.status, "sent");
    assert.equal(endpoint, "https://graph.facebook.com/v25.0/123456789/messages");
    assert.equal(body.messaging_product, "whatsapp");
    assert.equal(body.to, "5491112345678");
    const template = body.template as { name: string; language: { code: string }; components: Array<{ parameters: Array<{ text: string }> }> };
    assert.equal(template.name, "cma_market_alert_v1");
    assert.equal(template.language.code, "es_AR");
    assert.deepEqual(template.components[0]?.parameters.map((parameter) => parameter.text), [request.title, request.summary, request.alertUrl]);
    assert.equal(writes.at(-1)?.provider_message_id, "wamid.test");
    assert.equal(writes.at(-1)?.provider_status, "accepted");
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previous)) {
      const name = ({ token: "META_WHATSAPP_ACCESS_TOKEN", phone: "META_WHATSAPP_PHONE_NUMBER_ID", template: "META_WHATSAPP_TEMPLATE_NAME", language: "META_WHATSAPP_TEMPLATE_LANGUAGE", version: "META_WHATSAPP_GRAPH_VERSION" } as const)[key as keyof typeof previous];
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
