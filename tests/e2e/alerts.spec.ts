import { expect, test } from "@playwright/test";

test.describe("intelligent alerts public boundary", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
  });

  test("alerts are discoverable, protected and responsive with or without Supabase configuration", async ({ page }) => {
    await page.goto("/alerts", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: "Alerts", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Smart alerts" })).toBeVisible();
    await expect(page.getByText(/Supabase configuration and the database migration are required|Sign in to view alerts associated with your watchlists/)).toBeVisible();
    await expect(page.getByRole("main").getByRole("link", { name: "Sign in", exact: true })).toHaveAttribute("href", "/auth/login?next=%2Falerts");
    await page.screenshot({ path: "test-results/intelligent-alerts-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
  });

  test("alert settings remain an authenticated route", async ({ page }) => {
    const response = await page.goto("/account/alerts", { waitUntil: "domcontentloaded" });
    expect(response?.url()).toContain("/auth/login");
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Faccount%2Falerts/);
  });
});
