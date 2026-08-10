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
    assert.equal(writes.at(-1)?.provider_message_id, "email-1");
    assert.equal(writes.at(-1)?.provider_status, "accepted");
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.RESEND_FROM_EMAIL; else process.env.RESEND_FROM_EMAIL = previousFrom;
  }
});
test("Twilio WhatsApp uses an approved content template and E.164 channel prefixes", async () => {
  const previousFetch = globalThis.fetch;
  const previous = { sid: process.env.TWILIO_ACCOUNT_SID, token: process.env.TWILIO_AUTH_TOKEN, from: process.env.TWILIO_WHATSAPP_FROM, content: process.env.TWILIO_WHATSAPP_CONTENT_SID };
  const { client, writes } = databaseRecorder();
  let form = "";
  process.env.TWILIO_ACCOUNT_SID = "ACtest";
  process.env.TWILIO_AUTH_TOKEN = "secret";
  process.env.TWILIO_WHATSAPP_FROM = "+14155238886";
  process.env.TWILIO_WHATSAPP_CONTENT_SID = "HXtest";
  globalThis.fetch = async (_input, init) => { form = String(init?.body); return new Response(JSON.stringify({ sid: "MMtest", status: "queued" }), { status: 201 }); };
  try {
    const result = await new WhatsappNotificationChannel(client).send({ ...request, recipientWhatsapp: "+5491112345678" });
    assert.equal(result.status, "sent");
    const values = new URLSearchParams(form);
    assert.equal(values.get("From"), "whatsapp:+14155238886");
    assert.equal(values.get("To"), "whatsapp:+5491112345678");
    assert.equal(values.get("ContentSid"), "HXtest");
    assert.equal(writes.at(-1)?.provider_message_id, "MMtest");
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previous)) {
      const name = ({ sid: "TWILIO_ACCOUNT_SID", token: "TWILIO_AUTH_TOKEN", from: "TWILIO_WHATSAPP_FROM", content: "TWILIO_WHATSAPP_CONTENT_SID" } as const)[key as keyof typeof previous];
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});
