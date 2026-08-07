import { expect, test } from "@playwright/test";

test.skip(process.env.EXTERNAL_SMOKE !== "1", "External cauciones smoke is opt-in and never gates the deterministic suite.");

test("cauciones public sources currently return normalized quotes", async ({ request }) => {
  const response = await request.get("/api/research/cauciones");
  expect(response.ok()).toBeTruthy();

  const payload = await response.json() as {
    quotes?: Array<{ termDays?: unknown; rateTna?: unknown }>;
    source?: { name?: unknown; url?: unknown };
  };
  expect(Array.isArray(payload.quotes)).toBeTruthy();
  expect(payload.quotes?.length).toBeGreaterThan(0);
  expect(payload.quotes?.every((quote) => typeof quote.termDays === "number" && typeof quote.rateTna === "number")).toBeTruthy();
  expect(typeof payload.source?.name).toBe("string");
  expect(payload.source?.url).toMatch(/^https:\/\//);
});
