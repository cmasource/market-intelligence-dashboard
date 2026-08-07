import type { AlertPreferences, AlertSeverity } from "./types";
import { severityRank } from "./types";

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  alertsEnabled: true,
  minimumSeverity: "medium",
  frequency: "immediate",
  quietHoursStart: null,
  quietHoursEnd: null,
  timezone: "America/Argentina/Buenos_Aires",
  opportunityAlertsEnabled: true,
  inAppEnabled: true,
  emailEnabled: false,
  monitoredWatchlistIds: null,
};

export function meetsMinimumSeverity(severity: AlertSeverity, minimum: AlertSeverity) {
  return severityRank[severity] >= severityRank[minimum];
}
export function isWatchlistMonitored(watchlistId: string, selected: string[] | null) {
  return selected === null || selected.includes(watchlistId);
}

function localMinutes(now: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

export function isInQuietHours(now: Date, preferences: AlertPreferences) {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) return false;
  const current = localMinutes(now, preferences.timezone);
  const start = timeToMinutes(preferences.quietHoursStart);
  const end = timeToMinutes(preferences.quietHoursEnd);
  if (start === end) return false;
  return start < end ? current >= start && current < end : current >= start || current < end;
}

export function shouldCreateInAppAlert(input: {
  severity: AlertSeverity;
  category: string;
  watchlistId: string;
  preferences: AlertPreferences;
}) {
  const { preferences } = input;
  if (!preferences.alertsEnabled || !preferences.inAppEnabled || preferences.frequency === "disabled") return false;
  if (!isWatchlistMonitored(input.watchlistId, preferences.monitoredWatchlistIds)) return false;
  if (input.category === "opportunity" && !preferences.opportunityAlertsEnabled) return false;
  return meetsMinimumSeverity(input.severity, preferences.minimumSeverity);
}

export function shouldCreatePersonalInAppAlert(watchlistId: string, preferences: AlertPreferences) {
  return preferences.alertsEnabled
    && preferences.inAppEnabled
    && preferences.frequency !== "disabled"
    && isWatchlistMonitored(watchlistId, preferences.monitoredWatchlistIds);
}
