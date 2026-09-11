import assert from "node:assert/strict";
import test from "node:test";
import { getAssetLogoMetadata } from "../../lib/assets/logo-map";
import { getAssetLogoScale } from "../../lib/assets/logo-presentation";

test("resolves Logo.dev domains for representative US and Argentine equities", () => {
  assert.equal(getAssetLogoMetadata("ORCL", "equity", "Oracle").logoDomain, "oracle.com");
  assert.equal(getAssetLogoMetadata("IBM", "equity", "IBM").logoDomain, "ibm.com");
  assert.equal(getAssetLogoMetadata("BYMA", "argentine_equity", "BYMA").logoDomain, "byma.com.ar");
  assert.equal(getAssetLogoMetadata("TRAN", "argentine_equity", "Transener").logoDomain, "transener.com.ar");
});

test("uses compact-list corrections without changing full asset logos", () => {
  assert.equal(getAssetLogoScale("GCLA", "list"), "scale-[1.75]");
  assert.equal(getAssetLogoScale("GCLA", "default"), "scale-100");
  assert.equal(getAssetLogoScale("YPFD", "list"), "scale-[2.6]");
});

test("keeps a readable initials fallback when no external logo is mapped", () => {
  const fallback = getAssetLogoMetadata("ZZZZ", "equity", "Unknown issuer");

  assert.equal(fallback.logoDomain, undefined);
  assert.equal(fallback.initials, "ZZ");
  assert.equal(fallback.label, "Unknown issuer");
});
