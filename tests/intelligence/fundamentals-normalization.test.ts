import assert from "node:assert/strict";
import test from "node:test";
import { calculateFundamentalScore } from "@/lib/fundamentals-data/fundamentals-score";
import { percentagePointsToRatio } from "@/lib/fundamentals-data/normalization";

test("Finnhub percentage points are normalized to decimal ratios", () => {
  assert.ok(Math.abs((percentagePointsToRatio(146.69) ?? 0) - 1.4669) < 1e-10);
  assert.ok(Math.abs((percentagePointsToRatio(47.86) ?? 0) - 0.4786) < 1e-10);
  assert.equal(percentagePointsToRatio(undefined), undefined);
});

test("fundamental score measures quality independently from coverage", () => {
  const score = calculateFundamentalScore({
    trailingPE: 18,
    forwardPE: 17,
    priceToBook: 3,
    roe: 0.22,
    roa: 0.09,
    grossMargin: 0.35,
    operatingMargin: 0.2,
    netMargin: 0.15,
  });

  assert.ok(score !== null);
  assert.ok(score >= 70, `expected a constructive score, received ${score}`);
});

test("a single available fundamental group is not enough to publish a score", () => {
  assert.equal(calculateFundamentalScore({ trailingPE: 15 }), null);
});
