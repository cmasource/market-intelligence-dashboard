import assert from "node:assert/strict";
import test from "node:test";
import { buildAnalyticsForInstrument } from "@/lib/fixed-income/fixed-income-service";
import { getFixedIncomeInstrumentReference } from "@/lib/fixed-income/instrument-reference";

test("AL30 uses the contractual remaining amortization schedule", () => {
  const reference = getFixedIncomeInstrumentReference("AL30D", new Date("2026-07-28T12:00:00Z"));
  assert.ok(reference);
  assert.equal(reference.isMock, false);
  assert.equal(reference.faceValue, 64);
  assert.equal(reference.contractualCashFlows?.length, 8);
  assert.equal(reference.contractualCashFlows?.reduce((total, flow) => total + flow.amortization, 0), 64);

  const analytics = buildAnalyticsForInstrument({ ...reference, marketPrice: 56.8, analyticalPrice: 56.8 });
  assert.ok(analytics.estimatedYTM !== null && analytics.estimatedYTM > 0);
  assert.ok(analytics.parity !== null && analytics.parity > 0.8 && analytics.parity < 1);
});

test("D31L6 is modeled as a zero-coupon bill only before maturity", () => {
  const active = getFixedIncomeInstrumentReference("D31L6", new Date("2026-07-28T12:00:00Z"));
  const expired = getFixedIncomeInstrumentReference("D31L6", new Date("2026-08-01T12:00:00Z"));
  assert.equal(active?.contractualCashFlows?.length, 1);
  assert.equal(active?.contractualCashFlows?.[0].coupon, 0);
  assert.equal(expired, null);
});
