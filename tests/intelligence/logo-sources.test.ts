import assert from "node:assert/strict";
import test from "node:test";
import { getLogoLookups, logoLookupPath } from "@/lib/assets/logo-sources";

test("resolves US equities directly by ticker", () => {
  assert.deepEqual(getLogoLookups({ symbol: "MU", name: "Micron Technology", type: "stock" }), [
    { kind: "ticker", value: "MU" },
    { kind: "name", value: "Micron Technology" },
  ]);
});

test("resolves BYMA equities with the Buenos Aires suffix", () => {
  assert.equal(getLogoLookups({ symbol: "GGAL", name: "Grupo Financiero Galicia", type: "argentine_equity" })[0]?.value, "GGAL.BA");
});

test("resolves CEDEAR aliases through their underlying market ticker", () => {
  assert.equal(getLogoLookups({ symbol: "ADS", name: "Adidas CEDEAR", type: "cedear" })[0]?.value, "ADS.DE");
  assert.equal(getLogoLookups({ symbol: "DISN", name: "Disney CEDEAR", type: "cedear" })[0]?.value, "DIS");
});

test("does not request corporate logos for sovereign instruments", () => {
  assert.deepEqual(getLogoLookups({ symbol: "AL30", name: "Bonar 2030", type: "sovereign_bond" }), []);
});

test("uses the dedicated crypto path", () => {
  const lookup = getLogoLookups({ symbol: "BTC-USD", name: "Bitcoin", type: "crypto", cryptoId: "bitcoin" })[0];
  assert.deepEqual(lookup, { kind: "crypto", value: "btc" });
  assert.equal(logoLookupPath(lookup), "crypto/btc");
});
