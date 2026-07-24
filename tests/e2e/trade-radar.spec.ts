import { expect, test } from "@playwright/test";

test.describe("CMA Trade Radar", () => {
  test("searches instrument master and renders backend technical chart", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/trade-radar", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /CMA Trade Radar/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Datos US/);

    const tickerInput = page.getByPlaceholder("SPY, AAPL, BTCUSDT, AL30");
    await expect(tickerInput).toHaveValue("SPY");
    await page.waitForTimeout(500);
    await tickerInput.click();
    await tickerInput.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
    await tickerInput.pressSequentially("MSFT");

    await expect(page.getByRole("button", { name: /MSFT CEDEAR/ })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: /MSFT CEDEAR/ }).click();
    await expect(page.getByText(/Microsoft Corporation CEDEAR/)).toBeVisible();

    await page.getByRole("button", { name: /Analizar|Analyze/ }).click();
    await expect(page.getByTestId("trade-radar-technical-chart")).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("body")).toContainText(/EMA20/);
    await expect(page.locator("body")).toContainText(/EMA50/);
    await expect(page.locator("body")).toContainText(/MA200/);
    await expect(page.locator("body")).toContainText(/US Technical|Technical underlying|subyacente|CEDEAR/);
    await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Hydration failed|This page could not be found/i);

    if (process.env.TRADE_RADAR_QA_SCREENSHOT) {
      await page.screenshot({ path: process.env.TRADE_RADAR_QA_SCREENSHOT, fullPage: false });
    }
  });
});
