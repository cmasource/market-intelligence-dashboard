import assert from "node:assert/strict";
import test from "node:test";
import {
  mergeDollarReferences,
  normalizeCriptoYaDollarPayload,
  normalizeCriptoYaIndexPayload,
  normalizeDolarApiPayload,
} from "../../lib/market-data/argentina-references";

const now = new Date("2026-08-05T20:30:00.000Z");

test("normalizes CriptoYa dollar categories without mixing settlement variants", () => {
  const quotes = normalizeCriptoYaDollarPayload({
    oficial: { ask: 1520, bid: 1470, variation: 0.33, timestamp: 1785960680 },
    blue: { ask: 1540, bid: 1520, variation: -0.32, timestamp: 1785960982 },
    mep: { al30: { "24hs": { price: 1525.22, variation: 0.23, timestamp: 1785959922 } }, gd30: { "24hs": { price: 1400, timestamp: 1 } } },
    ccl: { al30: { "24hs": { price: 1598.34, variation: -1.23, timestamp: 1785959948 } } },
  });
  assert.deepEqual(quotes.map((quote) => quote.id), ["usd-oficial", "usd-blue", "usd-bolsa", "usd-contadoconliqui"]);
  assert.equal(quotes.find((quote) => quote.id === "usd-bolsa")?.value, 1525.22);
  assert.ok(quotes.every((quote) => quote.source === "CriptoYa"));
});

test("uses CriptoYa as primary FX reference and DolarAPI as category-level fallback", () => {
  const criptoYa = normalizeCriptoYaDollarPayload({
    oficial: { ask: 1520, variation: 0.33, timestamp: 1785960680 },
  });
  const dolarApi = normalizeDolarApiPayload([
    { casa: "oficial", venta: 1519, fechaActualizacion: "2026-08-05T17:00:00.000Z" },
    { casa: "blue", venta: 1540, fechaActualizacion: "2026-08-05T19:59:00.000Z" },
    { casa: "cripto", venta: 1566.34, fechaActualizacion: "2026-08-05T19:59:00.000Z" },
  ]);
  const merged = mergeDollarReferences(criptoYa, dolarApi, now);
  assert.equal(merged.find((quote) => quote.id === "usd-oficial")?.source, "CriptoYa");
  assert.equal(merged.find((quote) => quote.id === "usd-blue")?.quality, "fallback");
  assert.equal(merged.find((quote) => quote.id === "usd-cripto")?.quality, "primary");
  assert.equal(merged.find((quote) => quote.id === "usd-cripto")?.source, "DolarAPI");
});

test("rejects stale preferred quotes before selecting a current fallback", () => {
  const criptoYa = normalizeCriptoYaDollarPayload({
    oficial: { ask: 1400, timestamp: 1760000000 },
  });
  const dolarApi = normalizeDolarApiPayload([
    { casa: "oficial", venta: 1520, fechaActualizacion: "2026-08-05T17:00:00.000Z" },
  ]);
  const merged = mergeDollarReferences(criptoYa, dolarApi, now);
  assert.equal(merged[0]?.source, "DolarAPI");
  assert.equal(merged[0]?.value, 1520);
  assert.equal(merged[0]?.quality, "fallback");
});

test("prefers a fresher fallback over an older preferred source", () => {
  const criptoYa = normalizeCriptoYaDollarPayload({
    oficial: { ask: 1500, timestamp: 1785800000 },
  });
  const dolarApi = normalizeDolarApiPayload([
    { casa: "oficial", venta: 1520, fechaActualizacion: "2026-08-05T20:00:00.000Z" },
  ]);
  const merged = mergeDollarReferences(criptoYa, dolarApi, now);
  assert.equal(merged[0]?.source, "DolarAPI");
  assert.equal(merged[0]?.quality, "fallback");
});

test("normalizes CriptoYa CER and UVA as explicit BCRA fallbacks", () => {
  const cer = normalizeCriptoYaIndexPayload("cer", { time: 1785942000, value: 817.91 }, now);
  const uva = normalizeCriptoYaIndexPayload("uva", { time: 1785942000, value: 2064.25 }, now);
  assert.deepEqual(cer && { id: cer.id, value: cer.value, date: cer.date, source: cer.source }, { id: 30, value: 817.91, date: "2026-08-05", source: "CriptoYa" });
  assert.deepEqual(uva && { id: uva.id, value: uva.value, unit: uva.unit }, { id: 31, value: 2064.25, unit: "ARS" });
});
