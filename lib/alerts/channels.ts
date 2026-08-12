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

function alertGuideUrl(alertUrl?: string) {
  if (!alertUrl) return null;
  try { return new URL("/alerts/guide", alertUrl).toString(); } catch { return null; }
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
          html: `<div style="font-family:Arial,sans-serif;max-width:620px"><h1 style="font-size:22px">${escapeHtml(request.title ?? "CMA Market Intelligence")}</h1><p>${escapeHtml(request.summary ?? "A configured market alert was triggered.")}</p>${request.alertUrl ? `<p><a href="${escapeHtml(request.alertUrl)}">Abrir detalle / Open alert details</a></p>` : ""}${alertGuideUrl(request.alertUrl) ? `<p><a href="${escapeHtml(alertGuideUrl(request.alertUrl)!)}">Entender esta alerta / Understand this alert</a></p>` : ""}<p style="color:#64748b;font-size:12px">Alerta informativa. No constituye asesoramiento financiero personalizado ni ejecuta órdenes. / Informational alert. It is not personalized financial advice and does not execute orders.</p></div>`,
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
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN?.trim();
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim();
    const templateName = process.env.META_WHATSAPP_TEMPLATE_NAME?.trim() || "cma_market_alert_v1";
    const templateLanguage = process.env.META_WHATSAPP_TEMPLATE_LANGUAGE?.trim() || "es_AR";
    const graphVersion = process.env.META_WHATSAPP_GRAPH_VERSION?.trim() || "v25.0";
    if (!accessToken || !phoneNumberId || !request.recipientWhatsapp) {
      const errorCode = !request.recipientWhatsapp ? "whatsapp_recipient_unavailable" : "meta_whatsapp_not_configured";
      await saveDelivery(this.supabase, request, this.name, "cancelled", scheduledAt, { errorCode });
      return { status: "cancelled", scheduledAt, errorCode };
    }

    try {
      const recipient = request.recipientWhatsapp.replace(/^whatsapp:/, "").replace(/\D/g, "");
      const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(graphVersion)}/${encodeURIComponent(phoneNumberId)}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipient,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [{
              type: "body",
              parameters: [
                { type: "text", text: request.title ?? "CMA Market Intelligence" },
                { type: "text", text: request.summary ?? "Se activó una alerta de mercado." },
                { type: "text", text: request.alertUrl ?? "" },
              ],
            }],
          },
        }),
      });
      const payload = await response.json().catch(() => ({})) as { messages?: Array<{ id?: string; message_status?: string }>; error?: { code?: number } };
      const message = payload.messages?.[0];
      if (!response.ok || !message?.id) throw new Error(payload.error?.code ? `meta_whatsapp_${payload.error.code}` : `meta_whatsapp_http_${response.status}`);
      await saveDelivery(this.supabase, request, this.name, "sent", scheduledAt, { providerMessageId: message.id, providerStatus: message.message_status ?? "accepted" });
      return { status: "sent", scheduledAt };
    } catch (error) {
      const errorCode = safeErrorCode(error instanceof Error ? error.message : null, "meta_whatsapp_request_failed");
      await saveDelivery(this.supabase, request, this.name, "failed", scheduledAt, { errorCode });
      return { status: "failed", scheduledAt, errorCode };
    }
  }
}
