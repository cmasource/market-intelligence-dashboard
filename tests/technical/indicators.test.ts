import assert from "node:assert/strict";
import test from "node:test";
import { atrWilder, avgVolume, ema, rsiWilder, sma } from "@/lib/technical/indicators";
import type { OhlcvBar } from "@/lib/market-data/providers/base";

function barsFromCloses(closes: number[]): OhlcvBar[] {
  return closes.map((close, index) => ({
    time: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
    open: close - 0.5,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000 + index * 10,
  }));
}

test("sma returns null until the period is complete", () => {
  assert.deepEqual(sma([1, 2, 3, 4, 5], 3), [null, null, 2, 3, 4]);
});

test("ema seeds from the first complete SMA window", () => {
  const result = ema([1, 2, 3, 4, 5], 3);
  assert.deepEqual(result.slice(0, 3), [null, null, 2]);
  assert.equal(result[3], 3);
  assert.equal(result[4], 4);
});

test("rsiWilder reaches 100 when there are no average losses", () => {
  const result = rsiWilder([1, 2, 3, 4, 5, 6], 3);
  assert.equal(result[3], 100);
  assert.equal(result[5], 100);
});

test("atrWilder calculates true range smoothing", () => {
  const bars = barsFromCloses([10, 11, 12, 11, 13]);
  const result = atrWilder(bars, 3);
  assert.equal(result[0], null);
  assert.equal(result[1], null);
  assert.equal(result[2], 2);
  assert.ok(result[4] !== null && result[4] > 2);
});

test("avgVolume uses the requested lookback", () => {
  const bars = barsFromCloses([10, 11, 12, 13]);
  assert.deepEqual(avgVolume(bars, 2), [null, 1005, 1015, 1025]);
});
