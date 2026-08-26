import assert from "node:assert/strict";
import test from "node:test";
import { adrToLocalSymbol, localToAdrSymbol } from "@/lib/instruments/argentinaMappings";
import { instrumentMasterSeed } from "@/lib/instruments/instrument-master.seed";
import { getRelatedInstruments } from "@/lib/instrument-universe";

test("every configured Argentine ADR has separate local and US instrument identities", () => {
  for (const [localSymbol, adrSymbol] of Object.entries(localToAdrSymbol)) {
    assert.equal(adrToLocalSymbol[adrSymbol], localSymbol, `${localSymbol}/${adrSymbol} reverse mapping`);
    assert.ok(instrumentMasterSeed.some((item) => item.id === `ar-equity:${localSymbol}`));
    assert.ok(instrumentMasterSeed.some((item) => item.id === `adr:${adrSymbol}`));
  }
});

test("same-ticker local shares and ADRs remain separately addressable", () => {
  const related = getRelatedInstruments("GGAL", "ar-equity:GGAL");
  assert.ok(related.some((item) => item.instrumentId === "ar-equity:GGAL" && item.currency === "ARS"));
  assert.ok(related.some((item) => item.instrumentId === "adr:GGAL" && item.currency === "USD"));
});
