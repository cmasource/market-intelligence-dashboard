import { expect, test, type Page } from "@playwright/test";

const publicRoutes = [
  { route: "/", heading: /CMA Markets/ },
  { route: "/markets", heading: /Markets|Mercados/ },
  { route: "/usa", heading: /USA market|Mercado USA/ },
  { route: "/argentina", heading: /Argentina market|Mercado argentino/i },
  { route: "/crypto", heading: /Crypto Monitor|Monitor cripto/ },
  { route: "/reports", heading: /Research and tools|Research y herramientas/ },
  { route: "/contact", heading: /Let us talk about better-informed decisions|Conversemos sobre decisiones mejor informadas/ },
];

const rankingItems = ["AAPL", "MSFT", "NVDA", "SPY", "QQQ"].map((symbol, index) => ({
  symbol,
  name: symbol === "MSFT" ? "Microsoft Corporation" : `${symbol} test instrument`,
  assetType: "stock",
  market: "US",
  price: 100 + index,
  currency: "USD",
  changePercent: index + 1,
  score: 80 - index,
  label: "constructive",
  sourceLabel: "Deterministic E2E fixture",
  isFallback: false,
  route: `/asset/${symbol}`,
  reason: "Deterministic dashboard smoke fixture.",
}));

const rankingResponse = (type: "technical" | "fundamental" | "combined" | "performance") => ({
  type,
  generatedAt: "2026-08-05T12:00:00.000Z",
  universeSize: rankingItems.length,
  items: rankingItems,
  limitations: [],
  sourceSummary: "Deterministic E2E fixture",
});

const rankingsFixture = {
  generatedAt: "2026-08-05T12:00:00.000Z",
  universeSize: rankingItems.length,
  technical: rankingResponse("technical"),
  fundamental: rankingResponse("fundamental"),
  combined: rankingResponse("combined"),
  performance: { "30D": rankingResponse("performance"), "180D": rankingResponse("performance"), YTD: rankingResponse("performance") },
  limitations: [],
  sourceSummary: "Deterministic E2E fixture",
};

async function assertNoHorizontalOverflow(page: Page) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
}

async function expectExpandedUniverse(page: Page) {
  const countLabel = page.locator("main p").filter({ hasText: /^\d+ (instruments|instrumentos)/ });
  await expect(countLabel).toBeVisible();
  const count = Number.parseInt((await countLabel.textContent())?.match(/\d+/)?.[0] ?? "0", 10);
  expect(count).toBeGreaterThanOrEqual(300);
}

test.describe("CMA Markets public smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", (route) => route.abort());
    await page.route("**/api/rankings", (route) => route.fulfill({ contentType: "application/json", body: JSON.stringify(rankingsFixture) }));
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("cma-e2e-storage-ready") === "1") return;
      window.localStorage.clear();
      window.sessionStorage.setItem("cma-e2e-storage-ready", "1");
    });
  });

  for (const item of publicRoutes) {
    test(`${item.route} loads its public surface`, async ({ page }) => {
      test.setTimeout(60_000);
      await page.goto(item.route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: item.heading }).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/404|This page could not be found|Application error/i);
      await assertNoHorizontalOverflow(page);
    });
  }

  test("branding, navigation, footer and locale remain coherent", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/CMA Markets/);
    await expect(page.getByText("CMA Markets").first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Markets|Mercados/, exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Contact|Contacto/, exact: true }).first()).toBeVisible();
    await expect(page.locator('footer a[aria-label="CMA Consulting"]')).toHaveAttribute("href", "https://cma-consulting.vercel.app/");
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.getByText("Inteligencia financiera para entender el mercado antes de tomar una decisión.", { exact: true })).toBeVisible();
  });

  test("authentication foundation exposes public entry points and protects account", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/auth/login?next=%2Faccount", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /Sign in to CMA Markets|Ingresá a CMA Markets/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Continue with Google|Continuar con Google/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Create account|Crear cuenta/ })).toBeVisible();

    const accountResponse = await page.goto("/account", { waitUntil: "domcontentloaded" });
    expect(accountResponse?.url()).toContain("/auth/login");
    await expect(page).toHaveURL(/\/auth\/login\?next=%2Faccount/);
  });

  test("dashboard exposes rankings, news, macro monitor and wallet rates", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("ranking-row")).toHaveCount(15, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /Argentina and global pulse|Pulso argentino y global/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: /Macro data and peso yields|Datos macro y rendimientos en pesos/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/IPC mensual/);
    await expect(page.locator("body")).toContainText(/UVA/);
    await expect(page.locator("body")).toContainText(/BCRA|CriptoYa \(fallback\)/);
    await expect(page.locator("body")).toContainText(/Interest-bearing accounts|Cuentas remuneradas/);
  });

  test("ranking and universal search resolve instrument routes", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    const ranking = page.getByTestId("ranking-row").first();
    await expect(ranking).toHaveAttribute("href", /^\/asset\//, { timeout: 30_000 });

    await page.getByLabel(/Asset search|Busqueda de activos/).fill("Microsoft");
    const result = page.locator('#markets a[href="/asset/MSFT"]').first();
    await expect(result).toContainText("MSFT");
    await expect(result.locator("img")).toBeVisible();
    await page.goto("/asset/MSFT", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("MSFT").first()).toBeVisible();
    await expect(page.getByTestId("price-action-section")).toBeVisible();
  });

  test("watchlist persists locally across navigation and reload", async ({ page }) => {
    await page.goto("/asset/AAPL");
    const button = page.getByTestId("watchlist-button-AAPL").first();
    await expect(button).toBeEnabled();
    await button.click();
    const dialog = page.getByRole("dialog", { name: "Agregar a lista" });
    await expect(dialog).toBeVisible();
    await dialog.getByLabel(/Mi lista/).check();
    await dialog.getByRole("button", { name: "Agregar a las listas elegidas" }).click();
    await expect(dialog.getByRole("status")).toContainText("Activo agregado");
    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await expect(button).toContainText(/1 (lista|list)/);
    await page.goto("/watchlist");
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("AAPL").first()).toBeVisible();
  });

  test("markets shows heatmap, commodities and public cards without provider badges", async ({ page }) => {
    await page.goto("/markets");
    await expect(page.getByTestId("market-heatmap")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Global commodities|Materias primas globales/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Gold|Oro/);
    await expect(page.locator("body")).not.toContainText(/Yahoo compatible|Proveedor FMP|Provider price/i);
  });

  test("USA lists the complete CEDEAR underlying universe with search", async ({ page }) => {
    await page.goto("/usa");
    await page.getByRole("button", { name: /^(Stocks|Acciones)$/ }).click();
    await expectExpandedUniverse(page);
    await page.getByRole("button", { name: /CEDEAR underlyings|Subyacentes CEDEAR/ }).click();
    await expectExpandedUniverse(page);
    await page.getByLabel(/Search instrument|Buscar instrumento/).fill("AAPL");
    await expect(page.getByRole("row").filter({ hasText: "AAPL" })).toHaveCount(1);
    await expect(page.getByRole("row").filter({ hasText: "AAPL" })).toContainText(/Apple/);
  });

  test("Argentina lists expose search, indicators and bond analytics", async ({ page }) => {
    await page.goto("/argentina");
    await page.getByRole("button", { name: /Equities \+ indicators|Acciones \+ indicadores/ }).click();
    const search = page.getByLabel(/Search symbol|Buscar especie/);
    await search.fill("GGAL");
    const row = page.getByRole("row").filter({ hasText: "GGAL" });
    await expect(row).toHaveCount(1);
    await expect(page.getByRole("columnheader", { name: "RSI" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "MACD" })).toBeVisible();

    await page.getByRole("button", { name: /Bonds|Bonos/, exact: true }).click();
    await expect(page.getByRole("heading", { name: /Fixed Income Analytics|Analitica de renta fija/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/AL30|GD30/);

  });

  test("Argentina exposes cauciones with a compact rate table", async ({ page }) => {
    await page.route("**/api/research/cauciones**", (route) => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        updatedAt: "2026-07-30T12:00:00.000Z",
        quotes: [{
          label: "1D",
          termDays: 1,
          rateTna: 21,
          variationPoints: 0.5,
          previousRateTna: 20.5,
          bidRateTna: 20.8,
          askRateTna: 21.2,
          minRateTna: 20.5,
          maxRateTna: 21.5,
          volume: 1_000_000,
          lastQuote: "2026-07-30T12:00:00.000Z",
        }],
        alert: {
          severity: "spike",
          termDays: 1,
          rateTna: 45,
          currentRateTna: 35,
          baselineRateTna: 20,
          increasePoints: 25,
          increasePercent: 125,
          thresholdPercent: 10,
          basis: "intraday_high",
          message: "La caucion a 1 dia alcanzo 45.0% TNA durante la rueda.",
        },
      }),
    }));
    await page.goto("/argentina");
    await page.getByRole("button", { name: /Repos|Cauciones/, exact: true }).click();
    await expect(page.getByTestId("cauciones-panel")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Market repos|Cauciones bursatiles/ })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "TNA" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "1D", exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("caucion-alert")).toContainText("+125%");
  });

  test("dashboard only surfaces the caucion warning when the threshold is exceeded", async ({ page }) => {
    await page.route("**/api/research/cauciones**", (route) => route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        quotes: [],
        alert: {
          severity: "spike",
          termDays: 1,
          rateTna: 45,
          currentRateTna: 35,
          baselineRateTna: 20,
          increasePoints: 25,
          increasePercent: 125,
          thresholdPercent: 10,
          basis: "intraday_high",
          message: "La caucion a 1 dia alcanzo 45.0% TNA durante la rueda.",
        },
      }),
    }));

    await page.goto("/");
    await expect(page.getByTestId("dashboard-caucion-alert")).toContainText("45.0% TNA");
  });

  test("crypto workspace is searchable and opens supported assets", async ({ page }) => {
    test.setTimeout(60_000);
    await page.goto("/crypto");
    await expect(page.locator("body")).toContainText(/14/);
    await page.getByLabel(/Search crypto asset|Buscar criptoactivo/).fill("Solana");
    const assetLink = page.locator('a[href="/asset/SOL-USD"]');
    await expect(assetLink).toBeVisible();
    await expect(assetLink).toHaveText(/Open|Abrir/);
  });

  test("asset analysis keeps technical and fundamental scores internally consistent", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await expect(page.getByTestId("price-action-section")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Technical analysis|An[aá]lisis t[eé]cnico/i);
    await expect(page.locator("body")).toContainText(/Fundamental analysis|An[aá]lisis fundamental/i);
    const body = await page.locator("body").innerText();
    const technicalScores = [...body.matchAll(/(?:Technical score|Score tecnico)\s*(\d{1,3})\/100/gi)].map((match) => match[1]);
    const fundamentalScores = [...body.matchAll(/(?:Fundamental score|Score fundamental)\s*(\d{1,3})\/100/gi)].map((match) => match[1]);
    expect(new Set(technicalScores).size).toBeLessThanOrEqual(1);
    expect(new Set(fundamentalScores).size).toBeLessThanOrEqual(1);
  });

  test("reports contains current tools and omits the deferred agenda", async ({ page }) => {
    await page.goto("/reports");
    await expect(page.getByRole("button", { name: /News|Noticias/, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /Calculators|Calculadoras/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Bond analysis|Analisis de bonos/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Agenda/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /Earnings calendar|Calendario de balances/ })).toHaveAttribute("href", "/reports#earnings");
    await page.getByRole("link", { name: /Earnings calendar|Calendario de balances/ }).click();
    await expect(page.getByLabel(/Search symbol or company|Buscar simbolo o empresa/)).toBeVisible();
  });

  test("contact form is functional without exposing a server-side secret", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("link", { name: /Visit CMA Consulting|Conocer CMA Consulting/ })).toHaveAttribute("href", "https://cma-consulting.vercel.app/");
    await page.getByLabel(/Name|Nombre/).fill("CMA QA");
    await page.getByLabel(/Email|Correo/).fill("qa@example.com");
    await page.getByLabel(/Message|Mensaje/).fill("Consulta de prueba");
    await expect(page.getByRole("button", { name: /Prepare message|Preparar mensaje/ })).toBeEnabled();
  });

  test("macro and wallet APIs return normalized source-backed data", async ({ request }) => {
    const macroResponse = await request.get("/api/research/argentina-macro");
    expect(macroResponse.ok()).toBeTruthy();
    const macro = await macroResponse.json();
    expect(Array.isArray(macro.metrics)).toBeTruthy();
    expect(macro.metrics.length).toBeGreaterThanOrEqual(6);
    expect(macro.metrics.every((item: { id?: unknown; value?: unknown; series?: unknown; source?: unknown }) => typeof item.id === "number" && typeof item.value === "number" && Array.isArray(item.series) && typeof item.source === "string")).toBeTruthy();
    expect(macro.metrics.map((item: { id: number }) => item.id)).toEqual(expect.arrayContaining([30, 31]));
    expect(Array.isArray(macro.reconciliation)).toBeTruthy();
    expect(Array.isArray(macro.exchangeRates)).toBeTruthy();
    expect(macro.exchangeRates.map((item: { code: string }) => item.code)).toEqual(expect.arrayContaining(["USD", "EUR", "BRL"]));

    const ratesResponse = await request.get("/api/research/wallet-rates");
    expect(ratesResponse.ok()).toBeTruthy();
    const rates = await ratesResponse.json();
    expect(Array.isArray(rates.rates)).toBeTruthy();
    expect(rates.rates.length).toBeGreaterThan(0);
    expect(rates.rates.every((item: { name?: unknown; tna?: unknown }) => typeof item.name === "string" && typeof item.tna === "number")).toBeTruthy();

  });

  test("market and analysis APIs keep stable public contracts and hide secrets", async ({ request }) => {
    const quoteResponse = await request.get("/api/market-data/quote/AAPL");
    expect(quoteResponse.ok()).toBeTruthy();
    const quote = await quoteResponse.json();
    expect(quote.symbol).toBe("AAPL");
    expect(typeof quote.provider).toBe("string");
    expect(quote.providerTrace).toBeUndefined();

    const technicalResponse = await request.get("/api/analysis/technical/AAPL?timeframe=1Y");
    expect(technicalResponse.ok()).toBeTruthy();
    const technical = await technicalResponse.json();
    expect(technical.symbol).toBe("AAPL");
    expect(technical.technicalScore).toBeGreaterThanOrEqual(0);
    expect(technical.technicalScore).toBeLessThanOrEqual(100);

    const fundamentalResponse = await request.get("/api/analysis/fundamentals/AAPL");
    expect(fundamentalResponse.ok()).toBeTruthy();
    const fundamentals = await fundamentalResponse.json();
    expect(fundamentals.symbol).toBe("AAPL");
    expect(fundamentals.providerTrace).toBeUndefined();

    const payload = JSON.stringify({ quote, technical, fundamentals });
    expect(payload).not.toMatch(/FINNHUB_API_KEY|PPI_API_SECRET|ALPHA_VANTAGE_API_KEY/);
  });

  for (const viewport of [
    { name: "tablet", width: 768, height: 900 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    test(`dashboard and market workspaces are responsive on ${viewport.name}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const route of ["/", "/markets", "/usa", "/argentina", "/crypto", "/contact"]) {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await expect(page.locator("main")).toBeVisible();
        await assertNoHorizontalOverflow(page);
      }
    });
  }
});
