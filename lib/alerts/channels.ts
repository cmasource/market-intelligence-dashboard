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

function absoluteEmailUrl(path: string, alertUrl?: string) {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);
  const baseUrl = alertUrl ?? configuredSiteUrl;
  if (!baseUrl) return null;
  try { return new URL(path, baseUrl).toString(); } catch { return null; }
}

export function buildAlertEmailHtml(request: Pick<DeliveryRequest, "alertUrl" | "summary" | "title">) {
  const title = escapeHtml(request.title ?? "CMA Market Intelligence");
  const summary = escapeHtml(request.summary ?? "A configured market alert was triggered.");
  const alertUrl = request.alertUrl ? escapeHtml(request.alertUrl) : null;
  const guideUrl = alertGuideUrl(request.alertUrl);
  const logoUrl = absoluteEmailUrl("/brand/cma-consulting-header-transparent.png", request.alertUrl);

  return `<div style="margin:0;background:#eef2f4;padding:40px 16px;font-family:Arial,Helvetica,sans-serif;color:#16212d">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${summary}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:640px;margin:0 auto;border-collapse:separate;border-spacing:0;background:#ffffff;border:1px solid #dce4e8;border-radius:16px;overflow:hidden">
    <tr><td style="height:5px;background:#27b7ae;font-size:0;line-height:0">&nbsp;</td></tr>
    <tr><td style="padding:22px 28px;background:#101720;border-bottom:1px solid #25333f">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse"><tr>
        <td style="vertical-align:middle">${logoUrl ? `<img src="${escapeHtml(logoUrl)}" width="156" alt="CMA Consulting" style="display:block;width:156px;height:auto;padding:7px 10px;background:#ffffff;border-radius:7px">` : `<strong style="color:#f3f5f7;font-size:17px">CMA Markets</strong>`}</td>
        <td style="vertical-align:middle;text-align:right;font-size:11px;line-height:1.45;color:#8da0b1;text-transform:uppercase;letter-spacing:1.1px">Market Intelligence<br><span style="color:#7ee2da">Alerta activada / Alert triggered</span></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:32px 28px 14px">
      <span style="display:inline-block;padding:6px 10px;border:1px solid #b8dedb;border-radius:999px;background:#edf9f8;color:#187e78;font-size:11px;font-weight:700;letter-spacing:.4px;text-transform:uppercase">Condición cumplida / Condition met</span>
      <h1 style="font-size:27px;line-height:1.3;margin:18px 0 0;font-weight:700;color:#101720">${title}</h1>
    </td></tr>
    <tr><td style="padding:12px 28px 8px">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#f4f8f9;border:1px solid #dce8ea;border-radius:12px"><tr>
        <td style="width:5px;background:#27b7ae;border-radius:12px 0 0 12px;font-size:0">&nbsp;</td>
        <td style="padding:21px 20px"><p style="font-size:17px;line-height:1.6;margin:0;color:#263746">${summary}</p></td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:22px 28px 28px">
      ${alertUrl ? `<a href="${alertUrl}" style="display:inline-block;padding:13px 18px;border-radius:9px;background:#197f79;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Abrir detalle / Open alert details</a>` : ""}
      ${guideUrl ? `<a href="${escapeHtml(guideUrl)}" style="display:inline-block;margin-left:12px;color:#197f79;font-size:13px;font-weight:700;text-decoration:underline">Entender esta alerta / Understand this alert</a>` : ""}
    </td></tr>
    <tr><td style="padding:19px 28px;background:#f7f9fa;border-top:1px solid #e3e9ec">
      <p style="font-size:12px;line-height:1.55;color:#6d7c89;margin:0 0 7px"><strong style="color:#415261">Transparencia:</strong> esta alerta se generó con datos verificables y una condición determinística. / This alert was generated from verifiable data and a deterministic condition.</p>
      <p style="font-size:11px;line-height:1.55;color:#84919b;margin:0">Información educativa. No constituye asesoramiento financiero personalizado ni ejecuta órdenes. / Educational information only. It is not personalized financial advice and does not execute orders.</p>
    </td></tr>
  </table>
  <p style="max-width:640px;margin:16px auto 0;text-align:center;color:#788691;font-size:11px;line-height:1.5">Recibís este correo porque activaste las notificaciones por email en CMA Markets.</p>
</div>`;
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
          html: buildAlertEmailHtml(request),
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
