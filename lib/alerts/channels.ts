import type { SupabaseClient } from "@supabase/supabase-js";
import { isInQuietHours } from "./preferences";
import type { AlertPreferences } from "./types";

export type DeliveryRequest = {
  alertEventId: string;
  userId: string;
  preferences: AlertPreferences;
  now: Date;
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

export function nextInAppDeliveryAt(now: Date, preferences: AlertPreferences) {
  let candidate = new Date(now);
  if (preferences.frequency === "hourly_digest") candidate = new Date(now.getTime() + 60 * 60_000);
  if (preferences.frequency === "daily_digest") candidate = new Date(now.getTime() + 24 * 60 * 60_000);
  for (let step = 0; step < 96 && isInQuietHours(candidate, preferences); step += 1) {
    candidate = new Date(candidate.getTime() + 15 * 60_000);
  }
  return candidate;
}

export class InAppNotificationChannel implements NotificationChannel {
  readonly name = "in_app" as const;
  constructor(private readonly supabase: SupabaseClient) {}

  async send({ alertEventId, userId, preferences, now }: DeliveryRequest): Promise<DeliveryResult> {
    const scheduled = nextInAppDeliveryAt(now, preferences);
    const isImmediate = scheduled.getTime() <= now.getTime();
    const status: DeliveryResult["status"] = isImmediate ? "sent" : "pending";
    const payload = {
      alert_event_id: alertEventId,
      user_id: userId,
      channel: this.name,
      status,
      attempt_count: isImmediate ? 1 : 0,
      scheduled_at: scheduled.toISOString(),
      sent_at: isImmediate ? now.toISOString() : null,
    };
    const { error } = await this.supabase.from("alert_deliveries").upsert(payload, { onConflict: "alert_event_id,channel" });
    if (error) return { status: "failed", scheduledAt: scheduled.toISOString(), errorCode: error.code };
    return { status: payload.status, scheduledAt: scheduled.toISOString() };
  }
}

export class EmailNotificationChannel implements NotificationChannel {
  readonly name = "email" as const;
  async send({ now }: DeliveryRequest): Promise<DeliveryResult> {
    return { status: "cancelled", scheduledAt: now.toISOString(), errorCode: "email_provider_not_configured" };
  }
}
