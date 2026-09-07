import assert from "node:assert/strict";
import test from "node:test";
import { getTodayMarketSessions, snapshotBelongsToCurrentSession } from "@/lib/research/market-calendar";

test("US Labor Day 2026 closes Wall Street and resolves adjacent sessions", () => {
  const sessions = getTodayMarketSessions("es", new Date("2026-09-07T14:00:00.000Z"));
  assert.equal(sessions.international.status, "holiday");
  assert.match(sessions.international.detail, /Labor Day/);
  assert.equal(sessions.international.previousSessionDate, "2026-09-04");
  assert.equal(sessions.international.nextSessionDate, "2026-09-08");
  assert.equal(sessions.argentina.status, "open");
  assert.equal(sessions.crypto.status, "continuous");
});

test("the previous US close is not classified as today's move on a holiday", () => {
  const sessions = getTodayMarketSessions("en", new Date("2026-09-07T14:00:00.000Z"));
  assert.equal(snapshotBelongsToCurrentSession("2026-09-04T20:00:00.000Z", "international", sessions), false);
  assert.equal(snapshotBelongsToCurrentSession("2026-09-07T13:00:00.000Z", "crypto", sessions), true);
});

test("Wall Street is open during regular hours on the next trading day", () => {
  const sessions = getTodayMarketSessions("en", new Date("2026-09-08T14:00:00.000Z"));
  assert.equal(sessions.international.status, "open");
  assert.equal(snapshotBelongsToCurrentSession("2026-09-08T13:30:00.000Z", "international", sessions), true);
});
