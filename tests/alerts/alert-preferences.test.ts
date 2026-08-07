import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_ALERT_PREFERENCES, isInQuietHours, shouldCreateInAppAlert } from "../../lib/alerts/preferences";

test("minimum severity, opportunities and selected lists filter delivery", () => {
  const preferences = { ...DEFAULT_ALERT_PREFERENCES, minimumSeverity: "high" as const, opportunityAlertsEnabled: false, monitoredWatchlistIds: ["list-a"] };
  assert.equal(shouldCreateInAppAlert({ severity: "medium", category: "trend_change", watchlistId: "list-a", preferences }), false);
  assert.equal(shouldCreateInAppAlert({ severity: "high", category: "opportunity", watchlistId: "list-a", preferences }), false);
  assert.equal(shouldCreateInAppAlert({ severity: "high", category: "trend_change", watchlistId: "list-b", preferences }), false);
  assert.equal(shouldCreateInAppAlert({ severity: "high", category: "trend_change", watchlistId: "list-a", preferences }), true);
});
test("quiet hours support overnight windows in the selected timezone", () => {
  const preferences = { ...DEFAULT_ALERT_PREFERENCES, quietHoursStart: "22:00", quietHoursEnd: "07:00", timezone: "UTC" };
  assert.equal(isInQuietHours(new Date("2026-08-01T23:00:00Z"), preferences), true);
  assert.equal(isInQuietHours(new Date("2026-08-01T06:30:00Z"), preferences), true);
  assert.equal(isInQuietHours(new Date("2026-08-01T12:00:00Z"), preferences), false);
});
