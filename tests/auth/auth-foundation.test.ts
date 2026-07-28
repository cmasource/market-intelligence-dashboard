import assert from "node:assert/strict";
import test from "node:test";
import { safeRedirectPath } from "../../lib/auth/redirects";
import { isValidEmail, normalizeDisplayName, validatePassword } from "../../lib/auth/validation";

test("safeRedirectPath keeps relative in-app destinations", () => {
  assert.equal(safeRedirectPath("/account?tab=security"), "/account?tab=security");
  assert.equal(safeRedirectPath("/asset/AAPL#analysis"), "/asset/AAPL#analysis");
});

test("safeRedirectPath rejects open redirects", () => {
  assert.equal(safeRedirectPath("https://example.com/phishing"), "/account");
  assert.equal(safeRedirectPath("//example.com/phishing"), "/account");
  assert.equal(safeRedirectPath("javascript:alert(1)"), "/account");
});

test("authentication inputs enforce the local minimums", () => {
  assert.equal(isValidEmail("persona@cma.com"), true);
  assert.equal(isValidEmail("invalid"), false);
  assert.equal(validatePassword("1234567"), null);
  assert.equal(validatePassword("12345678"), "12345678");
  assert.equal(normalizeDisplayName("  Ana   Pérez  "), "Ana Pérez");
});

