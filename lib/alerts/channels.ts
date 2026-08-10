import type { SupabaseClient } from "@supabase/supabase-js";
import { isInQuietHours } from "./preferences";
import type { AlertPreferences } from "./types";

export type DeliveryRequest = {
  alertEventId: string;
  userId: string;
  preferences: AlertPreferences;
  now: Date;
  recipientEmail?: string | null;
  recipientWhatsapp?: string | null;
  title?: string;
  summary?: string;
  alertUrl?: string;
  scheduledDispatch?: boolean;
};

export type DeliveryResult = {
  status: "pending" | "sent" | "failed" | "cancelled";
  scheduledAt: string;
  errorCode?: string;
};

export interface NotificationChannel {
  readonly name: "in_app" | "email" | "whatsapp";
  send(delivery: DeliveryRequest): Promise<DeliveryResult>;
}

export function nextAlertDeliveryAt(now: Date, preferences: AlertPreferences) {
  let candidate = new Date(now);
  if (preferences.frequency === "hourly_digest") candidate = new Date(now.getTime() + 60 * 60_000);
  if (preferences.frequency === "daily_digest") candidate = new Date(now.getTime() + 24 * 60 * 60_000);
  for (let step = 0; step < 96 && isInQuietHours(candidate, preferences); step += 1) {
    candidate = new Date(candidate.getTime() + 15 * 60_000);
  }
  return candidate;
}

export const nextInAppDeliveryAt = nextAlertDeliveryAt;

async function saveDelivery(
  supabase: SupabaseClient,
  request: DeliveryRequest,
  channel: NotificationChannel["name"],
  status: DeliveryResult["status"],
  scheduledAt: string,
  details: { errorCode?: string | null; providerMessageId?: string | null; providerStatus?: string | null } = {},
) {
  const nowIso = request.now.toISOString();
  const payload = {
    alert_event_id: request.alertEventId, user_id: request.userId, channel, status,
    attempt_count: status === "pending" ? 0 : 1, scheduled_at: scheduledAt,
    sent_at: status === "sent" ? nowIso : null, error_code: details.errorCode ?? null,
    provider_message_id: details.providerMessageId ?? null, provider_status: details.providerStatus ?? null,
    updated_at: nowIso,
  };
  const { error } = await supabase.from("alert_deliveries").upsert(payload, { onConflict: "alert_event_id,channel" });
  return error?.code ?? null;
}

function safeErrorCode(value: unknown, fallback: string) {
  if (!value || typeof value !== "string") return fallback;
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 80) || fallback;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]!);
}

export class InAppNotificationChannel implements NotificationChannel {
  readonly name = "in_app" as const;
  constructor(private readonly supabase: SupabaseClient) {}

  async send(request: DeliveryRequest): Promise<DeliveryResult> {
    const scheduled = request.scheduledDispatch ? request.now : nextAlertDeliveryAt(request.now, request.preferences);
    const status: DeliveryResult["status"] = scheduled.getTime() <= request.now.getTime() ? "sent" : "pending";
    const errorCode = await saveDelivery(this.supabase, request, this.name, status, scheduled.toISOString());
    return errorCode ? { status: "failed", scheduledAt: scheduled.toISOString(), errorCode } : { status, scheduledAt: scheduled.toISOString() };
  }
}

export class EmailNotificationChannel implements NotificationChannel {
  readonly name = "email" as const;
  constructor(private readonly supabase: SupabaseClient) {}

  async send(request: DeliveryRequest): Promise<DeliveryResult> {
    const scheduledAt = (request.scheduledDispatch ? request.now : nextAlertDeliveryAt(request.now, request.preferences)).toISOString();
    if (Date.parse(scheduledAt) > request.now.getTime()) {
      await saveDelivery(this.supabase, request, this.name, "pending", scheduledAt);
      return { status: "pending", scheduledAt };
    }
    const apiKey = process.env.RESEND_API_KEY?.trim();
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (!apiKey || !from || !request.recipientEmail) {
      const errorCode = !request.recipientEmail ? "email_recipient_unavailable" : "resend_not_configured";
      await saveDelivery(this.supabase, request, this.name, "cancelled", scheduledAt, { errorCode });
      return { status: "cancelled", scheduledAt, errorCode };
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `cma-alert-${request.alertEventId}` },
        body: JSON.stringify({
          from, to: [request.recipientEmail], subject: request.title ?? "CMA Market Intelligence alert",
          html: `<div style="font-family:Arial,sans-serif;max-width:620px"><h1 style="font-size:22px">${escapeHtml(request.title ?? "CMA Market Intelligence")}</h1><p>${escapeHtml(request.summary ?? "A configured market alert was triggered.")}</p>${request.alertUrl ? `<p><a href="${escapeHtml(request.alertUrl)}">Open alert details</a></p>` : ""}<p style="color:#64748b;font-size:12px">Informational alert. It is not personalized financial advice and does not execute orders.</p></div>`,
        }),
      });
      const payload = await response.json().catch(() => ({})) as { id?: string; name?: string };
      if (!response.ok || !payload.id) throw new Error(safeErrorCode(payload.name, `resend_http_${response.status}`));
      await saveDelivery(this.supabase, request, this.name, "sent", scheduledAt, { providerMessageId: payload.id, providerStatus: "accepted" });
      return { status: "sent", scheduledAt };
    } catch (error) {
      const errorCode = safeErrorCode(error instanceof Error ? error.message : null, "resend_request_failed");
      await saveDelivery(this.supabase, request, this.name, "failed", scheduledAt, { errorCode });
      return { status: "failed", scheduledAt, errorCode };
    }
  }
}

export class WhatsappNotificationChannel implements NotificationChannel {
  readonly name = "whatsapp" as const;
  constructor(private readonly supabase: SupabaseClient) {}

  async send(request: DeliveryRequest): Promise<DeliveryResult> {
    const scheduledAt = (request.scheduledDispatch ? request.now : nextAlertDeliveryAt(request.now, request.preferences)).toISOString();
    if (Date.parse(scheduledAt) > request.now.getTime()) {
      await saveDelivery(this.supabase, request, this.name, "pending", scheduledAt);
      return { status: "pending", scheduledAt };
    }
    const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_WHATSAPP_FROM?.trim();
    const contentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID?.trim();
    if (!accountSid || !authToken || !from || !contentSid || !request.recipientWhatsapp) {
      const errorCode = !request.recipientWhatsapp ? "whatsapp_recipient_unavailable" : "twilio_whatsapp_not_configured";
      await saveDelivery(this.supabase, request, this.name, "cancelled", scheduledAt, { errorCode });
      return { status: "cancelled", scheduledAt, errorCode };
    }

    try {
      const body = new URLSearchParams({
        From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
        To: request.recipientWhatsapp.startsWith("whatsapp:") ? request.recipientWhatsapp : `whatsapp:${request.recipientWhatsapp}`,
        ContentSid: contentSid,
        ContentVariables: JSON.stringify({ "1": request.title ?? "CMA Market Intelligence", "2": request.summary ?? "Market alert triggered", "3": request.alertUrl ?? "" }),
      });
      const callback = process.env.TWILIO_STATUS_CALLBACK_URL?.trim();
      if (callback) body.set("StatusCallback", callback);
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`, {
        method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" }, body,
      });
      const payload = await response.json().catch(() => ({})) as { sid?: string; status?: string; code?: number };
      if (!response.ok || !payload.sid) throw new Error(payload.code ? `twilio_${payload.code}` : `twilio_http_${response.status}`);
      await saveDelivery(this.supabase, request, this.name, "sent", scheduledAt, { providerMessageId: payload.sid, providerStatus: payload.status ?? "queued" });
      return { status: "sent", scheduledAt };
    } catch (error) {
      const errorCode = safeErrorCode(error instanceof Error ? error.message : null, "twilio_request_failed");
      await saveDelivery(this.supabase, request, this.name, "failed", scheduledAt, { errorCode });
      return { status: "failed", scheduledAt, errorCode };
    }
  }
}
