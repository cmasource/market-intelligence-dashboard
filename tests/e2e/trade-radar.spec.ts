import { expect, test } from "@playwright/test";

test.describe("CMA Trade Radar", () => {
  test("opens the exact Argentine watchlist instrument and starts its daily analysis", async ({ page }) => {
    let requestBody: Record<string, unknown> | null = null;
    await page.route("**/api/trade-radar/analyze", async (route) => {
      requestBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 422, contentType: "application/json", body: JSON.stringify({ error: "QA request captured" }) });
    });

    await page.goto("/trade-radar?symbol=BMA&instrumentId=ar-equity%3ABMA&interval=1d&analyze=1");
    await expect(page.getByPlaceholder("SPY, AAPL, BTCUSDT, AL30")).toHaveValue("BMA");
    await expect(page.locator("form")).toContainText(/Banco Macro S\.A\. - argentina - BYMA/);
    await expect(page.getByText("Mercado", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Temporalidad")).toHaveValue("1d");
    await expect.poll(() => requestBody).not.toBeNull();
    expect(requestBody).toMatchObject({
      instrumentId: "ar-equity:BMA",
      symbol: "BMA.BA",
      market: "argentina",
      interval: "1d",
      provider: "auto",
    });
  });

  test("searches instrument master and renders backend technical chart", async ({ page }) => {
    test.setTimeout(90_000);
    await page.route("**/api/trade-radar/analyze", async (route) => {
      const start = Date.UTC(2025, 11, 1);
      const ohlcv = Array.from({ length: 220 }, (_, index) => {
        const close = 600 + index * 0.5 + Math.sin(index / 5) * 2;
        return { time: new Date(start + index * 86_400_000).toISOString(), open: close - 1, high: close + 2, low: close - 2, close, volume: 1_000_000 + index * 1000 };
      });
      const series = (offset: number) => ohlcv.map((bar) => ({ time: bar.time, value: bar.close - offset }));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          symbol: "SPY", resolvedSymbol: "SPY", market: "us", provider: "yahoo", interval: "1d", currency: "USD",
          lastPrice: ohlcv.at(-1)?.close, lastBarTime: ohlcv.at(-1)?.time, dataDelay: "delayed", candlesUsed: 220,
          sampleStatus: "ok", omittedIndicators: [], providerFailures: [], sourceLabel: "Yahoo-compatible public chart",
          fetchedAt: "2026-08-05T12:00:00.000Z", ohlcv,
          chartSeries: { ema20: series(3), ema50: series(7), ema200: series(20) },
          indicators: { ema20: 706, ema50: 702, ema200: 690, rsi14: 58, atr14: 4, volume: 1_219_000, avgVolume20: 1_209_000 },
          technicalScore: 65, technicalSnapshot: null, technicalInterpretation: null,
          tradeSignal: { label: "Esperar", tone: "wait", strength: "neutral" }, fundamentalScore: null,
          levels: { supports: [{ level: 700, type: "horizontal", strength: 3 }], resistances: [{ level: 715, type: "horizontal", strength: 3 }] },
          signals: { trendStatus: "bullish_short_term", momentumStatus: "positivo", volatilityStatus: "normal", setup: "esperar_confirmacion", riskStatus: "normal" },
          suggestedAlerts: [], operativeSummary: "Tendencia positiva; esperar confirmación.",
          disclaimer: "Información educativa. No constituye recomendación de inversión.", notes: [], badges: ["US Technical"], warnings: [], dataCoverage: ["ohlcv"],
        }),
      });
    });
    await page.goto("/trade-radar", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: /CMA Trade Radar/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Mercado global/);
    await expect(page.locator("body")).toContainText(/Historial OHLCV público/);

    const tickerInput = page.getByPlaceholder("SPY, AAPL, BTCUSDT, AL30");
    await expect(tickerInput).toHaveValue("SPY");
    await expect(page.getByLabel("Temporalidad")).toHaveValue("1d");
    await expect(page.getByText("Mercado", { exact: true })).toHaveCount(0);
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
    await expect(page.locator("body")).toContainText(/EMA200/);
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
