import { expect, test } from "@playwright/test";

test.describe("CMA Trade Radar", () => {
  test("searches instrument master and renders backend technical chart", async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto("/trade-radar", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /CMA Trade Radar/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Datos US/);

    const tickerInput = page.getByPlaceholder("SPY, AAPL, BTCUSDT, AL30");
    await expect(tickerInput).toHaveValue("SPY");
    const analyzeButton = page.getByRole("button", { name: /Analizar|Analyze/ });
    await expect(analyzeButton).toBeEnabled();
    await page.waitForTimeout(750);
    await analyzeButton.click();
    await expect(page.locator("body")).toContainText(/Calculando indicadores|CMA Trade Radar/);
    await expect(page.getByTestId("trade-radar-technical-chart")).toBeVisible({ timeout: 45_000 });
    await expect(page.locator("body")).toContainText(/Score tecnico/);
    await expect(page.locator("body")).toContainText(/Compra|Venta|Esperar/);
    await expect(page.locator("body")).toContainText(/EMA20/);
    await expect(page.locator("body")).toContainText(/EMA50/);
    await expect(page.locator("body")).toContainText(/MA200/);
    await expect(page.locator("body")).toContainText(/US Technical|Technical underlying|subyacente|CEDEAR/);
    await expect(page.locator("body")).not.toContainText(/Unhandled Runtime Error|Hydration failed|This page could not be found/i);

    if (process.env.TRADE_RADAR_QA_SCREENSHOT) {
      await page.getByTestId("trade-radar-technical-chart").scrollIntoViewIfNeeded();
      await page.screenshot({ path: process.env.TRADE_RADAR_QA_SCREENSHOT, fullPage: false });
    }

    const watchlistButton = page.getByTestId("watchlist-button-SPY").first();
    await expect(watchlistButton).toBeVisible();
    await watchlistButton.click();
    const watchlistDialog = page.getByRole("dialog", { name: "Agregar a lista" });
    await watchlistDialog.getByLabel(/Mi lista/).check();
    await watchlistDialog.getByRole("button", { name: "Agregar a las listas elegidas" }).click();
    await expect(watchlistDialog.getByRole("status")).toContainText("Activo agregado");

  });
});
