import { expect, test } from "@playwright/test";
import { getTradingViewSymbol } from "../../lib/tradingview/symbol-map";

const assetRoutes = [
  { route: "/asset/AAPL", symbol: "AAPL" },
  { route: "/asset/GGAL", symbol: "GGAL" },
  { route: "/asset/BTC-USD", symbol: "BTC-USD" },
  { route: "/asset/AL30", symbol: "AL30" },
  { route: "/asset/AL30D", symbol: "AL30D" },
  { route: "/asset/AL30C", symbol: "AL30C" },
  { route: "/asset/GD30", symbol: "GD30" },
  { route: "/asset/GD30D", symbol: "GD30D" },
  { route: "/asset/GD30C", symbol: "GD30C" },
  { route: "/asset/TX26", symbol: "TX26" },
];

const realRoutes = [
  { route: "/markets", heading: /Markets|Mercados/ },
  { route: "/screener", heading: /Instrument Screener|Screener de instrumentos/ },
  { route: "/data-audit", heading: /Data Audit|Auditoría de datos|Auditoria de datos/ },
  { route: "/glossary", heading: /Financial Glossary|Glosario financiero/ },
  { route: "/methodology", heading: /Methodology|Metodología|Metodologia/ },
  { route: "/argentina", heading: /Argentina Market|Mercado argentino/ },
  { route: "/crypto", heading: /Crypto Monitor|Monitor cripto/ },
  { route: "/watchlist", heading: /Watchlist|Mi lista/ },
  { route: "/reports", heading: /Reports|Reportes/ },
  { route: "/agents", heading: /AI Agents|Agentes IA/ },
  { route: "/status", heading: /Development Status|Estado del desarrollo/ },
];

const forbiddenLegacyBrand = new RegExp(["Se", "mia"].join(""), "i");
const marketDataStatus = /Real market data|Fallback mock data|Mock OHLCV data|Provider price|Mock fallback price|Precio proveedor|Precio simulado de respaldo/;
const technicalSourceStatus = /Calculated from real market data|Calculated from fallback mock data/;
const fundamentalsSourceStatus = /Provider fundamentals|Fallback mock fundamentals/;
const fixedIncomeSourceStatus = /Mock fixed income analytics|Calculating fixed income analytics/;
const forbiddenCurrencyLabels = [/ARS\/USD/, /USD\/ARS/, new RegExp(["ARS", "SAR"].join(" "))];
const forbiddenCurrencyLabelsWhenCclIsAllowed = [/USD\/ARS/, new RegExp(["ARS", "SAR"].join(" "))];

async function getJsonWithRetry(request: { get: (url: string) => Promise<{ ok: () => boolean; json: () => Promise<unknown> }> }, url: string) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await request.get(url);
      if (!response.ok()) throw new Error(`Request failed for ${url}`);
      return response.json();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }

  throw lastError;
}

test.describe("CMA Market Intelligence smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js", (route) =>
      route.abort(),
    );

    await page.addInitScript(() => {
      if (!window.sessionStorage.getItem("cma-e2e-local-storage-cleared")) {
        window.localStorage.clear();
        window.sessionStorage.setItem("cma-e2e-local-storage-cleared", "true");
      }
    });
  });

  test("home dashboard loads with approved branding", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/CMA Market Intelligence/);
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();
    await expect(page.getByText("CMA Consulting").first()).toBeVisible();
    await expect(page.locator("footer")).toContainText("cma_source");
    await expect(page.locator("body")).toContainText(/Mixed coverage|Cobertura mixta/);
    await expect(page.locator("body")).toContainText(/Market Intelligence Terminal/);
    await expect(page.locator("body")).toContainText(/Cross-market pulse|Pulso cross-market/);
    await expect(page.getByTestId("market-heatmap")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Market heatmap|Mapa de calor de mercado/);
    await expect(page.locator("body")).not.toContainText("Solo datos mock");
    await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("header navigation exists", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    await expect(header.locator('[aria-label="CMA"]')).toContainText("CMA");
    await expect(header.getByRole("link", { name: "CMA Market Intelligence" })).toBeVisible();
    await expect(header.locator('img[alt="CMA Market Intelligence"]')).toBeVisible();
    await expect(header.locator("span").filter({ hasText: /^S$/ })).toHaveCount(0);
    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBeFalsy();

    const navigation = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(navigation.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Markets" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Screener" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Argentina" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Crypto" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Watchlist" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Reports" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Agents" })).toBeVisible();
  });

  test("header brand mark remains visible across themes", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");
    const brandMark = header.locator('img[alt="CMA Market Intelligence"]');
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();
    await expect(brandMark).toBeVisible();

    await page.getByRole("button", { name: "Light" }).click();
    await expect(brandMark).toBeVisible();
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();

    await page.getByRole("button", { name: "Dark" }).click();
    await expect(brandMark).toBeVisible();
  });

  test("favicon and app icon assets are available", async ({ request }) => {
    for (const route of ["/icon.png", "/apple-icon.png", "/favicon.ico", "/brand/icon-192.png"]) {
      const response = await request.get(route);
      expect(response.ok()).toBeTruthy();
      expect((await response.body()).length).toBeGreaterThan(1000);
    }
  });

  test("rankings API returns safe bundled rankings", async ({ request }) => {
    const response = await request.get("/api/rankings");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("technical");
    expect(data).toHaveProperty("fundamental");
    expect(data).toHaveProperty("combined");
    expect(data.technical.items.length).toBeGreaterThan(0);
    expect(JSON.stringify(data)).not.toMatch(/API_KEY|FMP_API_KEY|FINNHUB_API_KEY|ALPHA_VANTAGE_API_KEY/i);
  });

  test("technical ranking API avoids direct recommendation wording", async ({ request }) => {
    const response = await request.get("/api/rankings/technical");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.items)).toBeTruthy();
    expect(data.items.length).toBeGreaterThan(0);
    const forbiddenRecommendation = new RegExp(["Strong ", "Buy|Strong ", "Sell|Compra fuerte|Venta fuerte"].join(""), "i");
    expect(JSON.stringify(data)).not.toMatch(forbiddenRecommendation);
  });

  test("performance ranking API supports period query", async ({ request }) => {
    const response = await request.get("/api/rankings/performance?period=YTD");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.type).toBe("performance");
    expect(data.period).toBe("YTD");
    expect(data.items.length).toBeGreaterThan(0);
  });

  for (const route of realRoutes) {
    test(`${route.route} real route loads`, async ({ page }) => {
      await page.goto(route.route);

      await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
      await expect(page.getByRole("heading", { name: route.heading })).toBeVisible();
      await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
    });
  }

  test("header navigation uses real App Router routes", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation", { name: "Primary navigation" });
    const navTargets = [
      { name: "Markets", route: /\/markets$/ },
      { name: "Screener", route: /\/screener$/ },
      { name: "Argentina", route: /\/argentina$/ },
      { name: "Crypto", route: /\/crypto$/ },
      { name: "Watchlist", route: /\/watchlist$/ },
      { name: "Reports", route: /\/reports$/ },
      { name: "Agents", route: /\/agents$/ },
    ];

    for (const target of navTargets) {
      await page.goto("/");
      await navigation.getByRole("link", { name: target.name }).click();
      await expect(page).toHaveURL(target.route);
      await expect(page.url()).not.toContain("#");
    }
  });

  for (const asset of assetRoutes) {
    test(`${asset.symbol} asset route loads`, async ({ page }) => {
      await page.goto(asset.route);

      await expect(page.getByText(asset.symbol).first()).toBeVisible();
      await expect(page.getByTestId("asset-logo").first()).toBeVisible();
      await expect(page.getByTestId("price-action-section")).toBeVisible();
      await expect(page.locator("body")).toContainText(/Price action|Acci(?:\u00f3|o)n del precio/);
      await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
      await expect(page.locator("body")).not.toContainText(/Asset not found|Activo no encontrado/i);
    });
  }

  test("TradingView symbol mapping covers core assets", () => {
    expect(getTradingViewSymbol("AAPL")).toMatchObject({ tradingViewSymbol: "NASDAQ:AAPL", verified: true });
    expect(getTradingViewSymbol("GGAL")).toMatchObject({ tradingViewSymbol: "BCBA:GGAL", verified: true });
    expect(getTradingViewSymbol("BTC-USD")).toMatchObject({ tradingViewSymbol: "BINANCE:BTCUSDT", verified: true });
    expect(getTradingViewSymbol("UNKNOWN")).toMatchObject({ tradingViewSymbol: "UNKNOWN", verified: false });
  });

  test("mapped assets render TradingView as the main price action chart", async ({ page }) => {
    const expectedSymbols = [
      ["/asset/AAPL", "NASDAQ:AAPL"],
      ["/asset/GGAL", "BCBA:GGAL"],
      ["/asset/BTC-USD", "BINANCE:BTCUSDT"],
    ] as const;

    for (const [route, tradingViewSymbol] of expectedSymbols) {
      await page.goto(route);
      const priceAction = page.getByTestId("price-action-section");
      const tradingViewChart = priceAction.getByTestId("tradingview-chart");

      await expect(priceAction).toBeVisible();
      await expect(priceAction).toHaveAttribute("data-chart-provider", "tradingview");
      await expect(priceAction).toContainText(/Price action|Acci(?:\u00f3|o)n del precio/);
      await expect(priceAction).toContainText(tradingViewSymbol);
      await expect(tradingViewChart).toBeVisible();
      await expect(tradingViewChart).toHaveAttribute("data-chart-provider", "tradingview");
      await expect(tradingViewChart).toHaveAttribute("data-tradingview-symbol", tradingViewSymbol);
      await expect(tradingViewChart).toHaveAttribute("data-tradingview-verified", "true");
      const tradingViewBox = await tradingViewChart.boundingBox();
      expect(tradingViewBox?.height).toBeGreaterThanOrEqual(420);

      await expect(page.getByRole("heading", { name: /Gr(?:\u00e1|a)fico interactivo|Interactive chart/ })).toHaveCount(0);
      await expect(priceAction.getByTestId("asset-chart-container")).toHaveCount(0);
      await expect(priceAction).not.toContainText(/Datos simulados de respaldo|Datos OHLCV simulados|Preparado para proveedores licenciados de datos de mercado/);
    }
  });

  test("unverified TradingView symbols keep the internal chart as labeled fallback only", async ({ page }) => {
    await page.goto("/asset/AL30");

    const priceAction = page.getByTestId("price-action-section");
    await expect(priceAction).toBeVisible();
    await expect(priceAction).toContainText("Símbolo TradingView no verificado");
    await expect(priceAction.getByTestId("tradingview-chart")).toHaveCount(0);
    await expect(priceAction.getByTestId("legacy-chart-fallback")).toContainText("Gráfico interno de respaldo");
  });

  test("language switcher toggles dashboard copy", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Inteligencia financiera para decisiones de mercado" })).toBeVisible();

    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Financial intelligence for market decisions" })).toBeVisible();
  });

  test("homepage rankings show technical fundamental combined and performance modules", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ES", exact: true }).click();

    const rankings = page.getByTestId("market-rankings");
    await expect(rankings).toBeVisible();
    await expect(rankings).toContainText("Rankings de oportunidad informativa");
    await expect(rankings).toContainText("Ranking técnico");
    await expect(rankings).toContainText("Ranking fundamental");
    await expect(rankings).toContainText("Ranking combinado");
    await expect(rankings).toContainText("Mejores rendimientos");
    await expect(rankings).toContainText(/Últimos 30 días|Ultimos 30 dias/);
    await expect(rankings).toContainText(/Año en curso|Ano en curso/);
  });

  test("ranking row navigation opens an asset page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "ES", exact: true }).click();

    const firstRankingRow = page.getByTestId("ranking-row").first();
    await expect(firstRankingRow).toBeVisible();
    await firstRankingRow.click();
    await expect(page).toHaveURL(/\/asset\//);
    await expect(page.locator("body")).not.toContainText(/404|This page could not be found|Activo no encontrado/i);
  });

  test("rankings page surface avoids direct recommendation wording", async ({ page }) => {
    await page.goto("/");
    const forbiddenRecommendation = new RegExp(["Strong ", "Buy|Strong ", "Sell|Compra fuerte|Venta fuerte"].join(""), "i");
    await expect(page.locator("body")).not.toContainText(forbiddenRecommendation);
  });

  test("asset search finds and opens AAPL", async ({ page }) => {
    await page.goto("/");

    const searchSection = page.locator("#markets");
    await page.getByLabel("Asset search").fill("AAPL");
    const aaplResult = searchSection.locator('a[href="/asset/AAPL"]').first();
    await expect(aaplResult).toContainText("AAPL");
    await expect(aaplResult).toContainText("Apple Inc.");

    await aaplResult.click();
    await expect(page).toHaveURL(/\/asset\/AAPL$/);
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(marketDataStatus);
  });

  test("home asset search uses the universal instrument universe", async ({ page }) => {
    await page.goto("/");

    const searchSection = page.locator("#markets");

    await page.getByLabel("Asset search").fill("Apple");
    await expect(searchSection.getByText("AAPL").first()).toBeVisible();
    await expect(searchSection).toContainText(/USA stock|CEDEAR reference|Accion USA|Referencia CEDEAR/);

    await page.getByLabel("Asset search").fill("AL30");
    await expect(searchSection.getByText("AL30").first()).toBeVisible();
    await expect(searchSection.getByText("AL30D").first()).toBeVisible();
    await expect(searchSection.getByText("AL30C").first()).toBeVisible();

    await page.getByLabel("Asset search").fill("Microsoft");
    await expect(searchSection.getByText("MSFT").first()).toBeVisible();

    await page.getByLabel("Asset search").fill("Galicia");
    await expect(searchSection.getByText("GGAL").first()).toBeVisible();

    await page.getByLabel("Asset search").fill("Bitcoin");
    await expect(searchSection.getByText("BTC-USD").first()).toBeVisible();
  });

  test("home search handles future instruments with clear actions", async ({ page }) => {
    await page.goto("/");

    const searchSection = page.locator("#markets");
    await page.getByLabel("Asset search").fill("Pampa");
    await expect(searchSection.getByText("PAMP").first()).toBeVisible();
    await expect(searchSection).toContainText(/View preliminary profile|Ver ficha preliminar|Future coverage|Cobertura futura/);
    await expect(searchSection.locator("a").first()).toBeVisible();
  });

  test("watchlist stores removes and persists assets locally", async ({ page }) => {
    await page.goto("/asset/AAPL");
    const watchlistButton = page.getByTestId("watchlist-button-AAPL").first();
    await expect(watchlistButton).toBeVisible();
    await expect(watchlistButton).toBeEnabled();
    await watchlistButton.click();
    await expect(watchlistButton).toContainText(/Remove from watchlist|Quitar de mi lista/);

    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { name: /Watchlist|Mi lista/ })).toBeVisible();
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await page.reload();
    await expect(page.getByText("AAPL").first()).toBeVisible();

    await page.getByRole("button", { name: /Remove from watchlist|Quitar de mi lista/ }).first().click();
    await expect(page.locator("body")).toContainText(/No saved assets|Sin activos guardados/);
  });

  test("header watchlist navigation opens the local list", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Watchlist" }).click();
    await expect(page).toHaveURL(/\/watchlist$/);
    await expect(page.getByRole("heading", { name: /Watchlist|Mi lista/ })).toBeVisible();
  });

  test("future asset fallback page is graceful", async ({ page }) => {
    await page.goto("/asset/PAMP");

    await expect(page.getByText("PAMP").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/planned CMA Market Intelligence universe|universo previsto de CMA Market Intelligence/);
    await expect(page.locator("body")).not.toContainText(/Technical signal|Senal tecnica/);
    await expect(page.locator("body")).not.toContainText(/Market signal|Senal de mercado/);
    await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
    await expect(page.locator("body")).not.toContainText(/Asset not found|Activo no encontrado/i);
    await expect(page.getByRole("link", { name: /Back to Markets|Volver a Mercados/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /Open Screener|Abrir Screener/ })).toBeVisible();
  });

  test("home search stores recent selections locally", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Asset search").fill("AAPL");
    await page.getByLabel("Asset search").press("Enter");
    await expect(page.locator("#markets")).toContainText(/Recent searches|Búsquedas recientes|Busquedas recientes/);
    await expect(page.locator("#markets").getByRole("link", { name: "AAPL", exact: true })).toBeVisible();
  });

  test("asset search stays hydration-safe and compact", async ({ page }) => {
    await page.goto("/");

    const searchSection = page.locator("#markets");
    await expect(searchSection).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Hydration failed|recoverable hydration/i);

    await page.getByLabel("Asset search").fill("A");
    await expect(searchSection.getByText("AL30").first()).toBeVisible();
    await expect(searchSection.getByRole("link", { name: /See more in screener|Ver más en screener/ })).toBeVisible();

    await page.getByLabel("Asset search").fill("AL30");
    await expect(searchSection.getByText("AL30").first()).toBeVisible();
    await expect(searchSection.getByText("AL30D").first()).toBeVisible();
    await expect(searchSection.getByText("AL30C").first()).toBeVisible();
  });

  test("instrument screener search, filters, and open analysis work", async ({ page }) => {
    await page.goto("/screener");

    await expect(page.getByRole("heading", { name: /Instrument Screener|Screener de instrumentos/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Initial instrument universe|Universo inicial de instrumentos/);
    await expect(page.locator("body")).toContainText(/Argentine equities|Acciones argentinas/);
    await expect(page.locator("body")).toContainText("CEDEARs");
    await expect(page.locator("body")).toContainText(/Bonds|Bonos|Sovereign bonds and species|Bonos soberanos y especies/);
    await expect(page.locator("body")).toContainText("ETFs");
    await expect(page.locator("body")).toContainText(/USA stocks|Acciones USA/);
    await expect(page.locator("body")).toContainText(/Crypto|Cripto/);
    await expect(page.locator("body")).toContainText(/The screener lets users explore|El screener permite explorar/);
    await expect(page.locator("body")).toContainText(/Provider|Proveedor|Real/);
    await expect(page.locator("body")).toContainText(/Mock|Simulado/);
    await expect(page.locator("body")).toContainText(/Future|Futuro/);
    for (const symbol of ["AL30", "AL30D", "AL30C", "GGAL", "YPFD", "PAMP", "BTC-USD", "ETH-USD", "AAPL"]) {
      await expect(page.getByText(symbol).first()).toBeVisible();
    }
    await expect(page.getByPlaceholder(/Search AL30|Buscar AL30/)).toBeVisible();
    await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);

    await page.getByPlaceholder(/Search AL30|Buscar AL30/).fill("AL30");
    await expect(page.getByText("AL30").first()).toBeVisible();
    await expect(page.getByText("AL30D").first()).toBeVisible();
    await expect(page.getByText("AL30C").first()).toBeVisible();

    await page.getByRole("button", { name: /Reset|Resetear/ }).click();
    await page.getByLabel("Country").selectOption("AR");
    await expect(page.getByText("GGAL").first()).toBeVisible();

    await page.getByRole("button", { name: /Reset|Resetear/ }).click();
    await page.getByLabel("Category").selectOption("crypto");
    await expect(page.getByText("BTC-USD").first()).toBeVisible();

    await page.getByRole("button", { name: /Reset|Resetear/ }).click();
    await page.getByPlaceholder(/Search AL30|Buscar AL30/).fill("AAPL");
    await page.getByRole("link", { name: /Open analysis|Abrir analisis/ }).first().click();
    await expect(page).toHaveURL(/\/asset\/AAPL$/);
  });

  test("markets and argentina pages link to screener", async ({ page }) => {
    await page.goto("/markets");
    await expect(page.getByRole("link", { name: /Open advanced screener|Abrir screener avanzado/ })).toHaveAttribute("href", "/screener");

    await page.goto("/argentina");
    await expect(page.getByRole("link", { name: /Explore Argentine instruments|Explorar instrumentos argentinos/ })).toHaveAttribute(
      "href",
      "/screener?country=AR",
    );
  });

  test("markets page shows universe cards and CEDEAR prominence", async ({ page }) => {
    await page.goto("/markets");

    await expect(page.getByTestId("market-heatmap")).toBeVisible();
    await expect(page.getByLabel(/Segment|Segmento/)).toBeVisible();
    await expect(page.getByLabel(/Sort by|Ordenar por/)).toBeVisible();
    await expect(page.locator("body")).toContainText(/Include simulated|Incluir simulados/);
    await expect(page.locator("body")).toContainText(/Argentine equities|Acciones argentinas/);
    await expect(page.locator("body")).toContainText("CEDEARs");
    await expect(page.locator("body")).toContainText(/Bonds|Bonos|Sovereign bonds and species|Bonos soberanos y especies/);
    await expect(page.locator("body")).toContainText("ETFs");
    await expect(page.locator("body")).toContainText(/USA stocks|Acciones USA/);
    await expect(page.locator("body")).toContainText(/Crypto|Cripto/);
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.getByText("MSFT").first()).toBeVisible();
    await expect(page.getByText(/NVDA|TSLA/).first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/CCL|implied CCL/i);
  });

  test("market heatmap filters and navigates by segment", async ({ page }) => {
    await page.goto("/markets");

    const heatmap = page.getByTestId("market-heatmap");
    await expect(heatmap).toContainText(/Market heatmap|Mapa de calor de mercado/);
    await page.getByLabel(/Segment|Segmento/).selectOption("argentina");
    await expect(heatmap).toContainText(/GGAL|YPFD/);

    await page.getByLabel(/Segment|Segmento/).selectOption("bonds");
    await expect(heatmap).toContainText(/AL30|GD30/);

    const al30Cell = heatmap.getByTestId("heatmap-cell-AL30").first();
    await expect(al30Cell).toBeVisible();
    await al30Cell.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/asset\/AL30$/, { timeout: 15_000 }), al30Cell.click()]);
    await expect(page.getByText("AL30").first()).toBeVisible();
  });

  test("market heatmap avoids horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto("/markets");
    await expect(page.getByTestId("market-heatmap")).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("appearance toggle switches without crashing", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("button", { name: /Dark|Oscuro/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Light|Claro/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "System" })).toHaveCount(0);
    await page.getByRole("button", { name: "Light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("[data-app-theme='light']")).toBeVisible();
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();
    await expect(page.locator("#markets")).toBeVisible();
    await expect(page.locator("header")).not.toContainText("cma_source");
    await expect(page.locator("#markets")).not.toContainText("cma_source");
    await expect(page.locator("body")).toContainText(/Mixed coverage|Cobertura mixta/);
    await expect(page.locator("body")).toContainText(/informational analysis only|analisis informativo/);
    await expect(page.locator("body")).toContainText(/Very high|Muy alto|High|Alto|Medium|Medio/);
    await expect(page.locator("body")).toContainText(/Open intelligence profile|Abrir perfil de inteligencia/);
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();
  });

  test("markets page remains readable in light mode", async ({ page }) => {
    await page.goto("/markets");
    await page.getByRole("button", { name: "Light" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.locator("body")).toContainText("CEDEARs");
    await expect(page.locator("body")).toContainText(/Bonds|Bonos/);
  });

  test("screener remains readable in light mode", async ({ page }) => {
    await page.goto("/screener");
    await page.getByRole("button", { name: "Light" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByRole("heading", { name: /Instrument Screener|Screener de instrumentos/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/The screener lets users explore|El screener permite explorar/);
    await expect(page.locator("body")).toContainText(/Data provenance and coverage|Origen y cobertura de datos/);
    await expect(page.getByPlaceholder(/Search AL30|Buscar AL30/)).toBeVisible();
  });

  test("public demo footer is visible", async ({ page }) => {
    await page.goto("/");

    const footer = page.locator("footer");
    await expect(footer).toContainText("CMA Market Intelligence");
    await expect(footer).toContainText("CMA Consulting");
    await expect(footer).toContainText("cma_source");
    await expect(footer).toContainText(/Public demo|Demo publica/);
    await expect(footer).toContainText(/informational analysis only|analisis informativo/);
  });

  test("market data source labels stay fallback-safe", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(marketDataStatus);

    await page.goto("/asset/BTC-USD");
    await expect(page.locator("body")).toContainText(marketDataStatus);

    await page.goto("/asset/AL30");
    await expect(page.locator("body")).toContainText(/Validated manual load|Price: Mock|Fixed income: Mock|Mock data|Datos simulados|Simulado/);
  });

  test("asset pages show data coverage badges", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(/Data coverage|Cobertura de datos/);
    await expect(page.locator("body")).toContainText(/View data coverage|Ver cobertura de datos/);
    await expect(page.locator("body")).toContainText(/Price: Provider|Precio: Proveedor|Provider|Proveedor/);
    await expect(page.locator("body")).toContainText(/Fundamentals: Provider|Fundamentos: Proveedor|Provider|Proveedor/);

    await page.goto("/asset/AL30");
    await expect(page.locator("body")).toContainText(/Fixed income: Mock|Renta fija: Simulado|Mock|Simulado/);
  });

  test("asset pages show normalized display currencies", async ({ page }) => {
    test.setTimeout(60_000);
    const expectedCurrencies = [
      { symbol: "AAPL", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "SPY", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "QQQ", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "MSFT", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "NVDA", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "TSLA", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "AMZN", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "META", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "GOOGL", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "KO", currency: "USD", forbidden: forbiddenCurrencyLabelsWhenCclIsAllowed },
      { symbol: "BTC-USD", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "ETH-USD", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "SOL-USD", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "BNB-USD", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "GGAL", currency: "ARS", forbidden: forbiddenCurrencyLabels },
      { symbol: "YPFD", currency: "ARS", forbidden: forbiddenCurrencyLabels },
      { symbol: "AL30", currency: "ARS", forbidden: forbiddenCurrencyLabels },
      { symbol: "AL30D", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "AL30C", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "GD30", currency: "ARS", forbidden: forbiddenCurrencyLabels },
      { symbol: "GD30D", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "GD30C", currency: "USD", forbidden: forbiddenCurrencyLabels },
      { symbol: "TX26", currency: "ARS", forbidden: forbiddenCurrencyLabels },
    ];

    for (const item of expectedCurrencies) {
      await page.goto(`/asset/${item.symbol}`, { waitUntil: "domcontentloaded" });
      await expect(page.getByText(item.symbol).first()).toBeVisible();
      await expect(page.locator("body")).toContainText(item.currency);
      for (const forbidden of item.forbidden) {
        await expect(page.locator("body")).not.toContainText(forbidden);
      }
    }
  });

  test("Argentine bond species display quote currency separately from context", async ({ page }) => {
    await page.goto("/asset/GD30");
    await expect(page.locator("body")).toContainText(/92,300 ARS/);
    await expect(page.locator("body")).not.toContainText(/61(?:\.|,)7\s*ARS/);
    await expect(page.locator("body")).not.toContainText(/USD MEP|ARS CER|ARS SAR/);

    await page.goto("/asset/AL30");
    await expect(page.locator("body")).toContainText(/58,400 ARS/);
    await expect(page.locator("body")).not.toContainText(/58(?:\.|,)4\s*ARS/);
    await expect(page.locator("body")).not.toContainText(/USD MEP|ARS CER|ARS SAR/);

    await page.goto("/asset/GD30D");
    await expect(page.locator("body")).toContainText(/61\.70 USD/);
    await expect(page.locator("body")).toContainText(/Dollar MEP species|Especie dólar MEP|Especie dolar MEP/);
    await expect(page.locator("body")).not.toContainText(/61\.70 USD MEP|USD MEP/);

    await page.goto("/asset/AL30D");
    await expect(page.locator("body")).toContainText(/58\.40 USD/);
    await expect(page.locator("body")).toContainText(/Dollar MEP species|Especie dólar MEP|Especie dolar MEP/);
    await expect(page.locator("body")).not.toContainText(/58\.40 USD MEP|USD MEP/);

    await page.goto("/asset/TX26");
    await expect(page.locator("body")).toContainText(/142\.80 ARS/);
    await expect(page.locator("body")).toContainText(/CER/);
    await expect(page.locator("body")).not.toContainText(/ARS CER|ARS SAR/);
  });

  test("home search keeps GD30 price, change and action readable", async ({ page }) => {
    await page.goto("/");

    const searchSection = page.locator("#markets");
    await page.getByLabel("Asset search").fill("GD30");
    await expect(searchSection.getByText("GD30").first()).toBeVisible();
    await expect(searchSection).toContainText(/92,300 ARS/);
    await expect(searchSection).toContainText(/Abrir análisis|Open analysis/);
    await expect(searchSection).toContainText(/%/);
    await expect(searchSection).not.toContainText(/61(?:\.|,)7\s*ARS|ARS SAR|ARS CER/);
  });

  test("CEDEAR API returns local, underlying and implied CCL fields", async ({ request }) => {
    const response = await request.get("/api/cedears/AAPL");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.localSymbol).toBe("AAPL");
    expect(data.underlyingSymbol).toBe("AAPL");
    expect(data.ratio).toBeTruthy();
    expect(data).toHaveProperty("impliedCcl");
    expect(data.sourceLabel).toContain("Mock CEDEAR data");
  });

  test("provider status API is safe and hides keys", async ({ request }) => {
    const response = await request.get("/api/providers/status");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    const serialized = JSON.stringify(data);

    expect(Array.isArray(data.marketData)).toBeTruthy();
    expect(Array.isArray(data.fundamentals)).toBeTruthy();
    expect(Array.isArray(data.news)).toBeTruthy();
    expect(serialized).toContain("fmp");
    expect(serialized).not.toMatch(/"key"\s*:/i);
    expect(serialized).not.toMatch(/"token"\s*:/i);
    expect(serialized).not.toMatch(/"secret"\s*:/i);
  });

  test("AAPL asset page shows CEDEAR analytics without replacing USA context", async ({ page }) => {
    await page.goto("/asset/AAPL");

    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText("CEDEAR");
    await expect(page.locator("body")).toContainText(/Underlying asset|Activo subyacente/);
    await expect(page.locator("body")).toContainText(/Implied CCL|CCL implícito|CCL implicito/);
    await expect(page.locator("body")).toContainText(/Mock data|Datos simulados/);
    await expect(page.locator("body")).toContainText(/underlying asset when local CEDEAR integration is not available|subyacente cuando no existe integración real del CEDEAR local/i);
    await expect(page.locator("body")).toContainText(/ARS/);
    await expect(page.locator("body")).toContainText(/USD/);
    await expect(page.locator("body")).toContainText(/ARS\/USD/);
  });

  test("markets page promotes CEDEAR and implied CCL context", async ({ page }) => {
    await page.goto("/markets");

    await expect(page.locator("body")).toContainText("CEDEARs");
    await expect(page.locator("body")).toContainText(/implied CCL|CCL implícito|CCL implicito/);
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/MSFT|NVDA/);
  });

  test("methodology and glossary include CEDEAR terms", async ({ page }) => {
    await page.goto("/methodology");
    await expect(page.locator("body")).toContainText("CEDEAR");
    await expect(page.locator("body")).toContainText(/implied CCL|CCL implícito|CCL implicito/);

    await page.goto("/glossary");
    await expect(page.locator("body")).toContainText("CEDEAR");
    await expect(page.locator("body")).toContainText(/Implied CCL|CCL implícito|CCL implicito/);
    await expect(page.locator("body")).toContainText(/CEDEAR ratio|Ratio CEDEAR/);
  });

  test("news API and news panel fall back safely", async ({ page, request }) => {
    const response = await request.get("/api/news/market");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.articles)).toBeTruthy();
    expect(data).toHaveProperty("provider");
    const symbolNewsResponse = await request.get("/api/news/AAPL");
    expect(symbolNewsResponse.ok()).toBeTruthy();
    const symbolNews = await symbolNewsResponse.json();
    expect(Array.isArray(symbolNews.articles)).toBeTruthy();
    expect(symbolNews.articles.length).toBeGreaterThan(0);
    const encodedNewsPayload = JSON.stringify(symbolNews.articles);
    expect(encodedNewsPayload).not.toContain("&nbsp;");
    expect(encodedNewsPayload).not.toContain("&amp;");
    expect(encodedNewsPayload).not.toContain("&#39;");
    expect(encodedNewsPayload).not.toMatch(new RegExp("</?[a-z][\\s\\S]*>", "i"));

    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(/Market Headlines|Noticias|Provider news|Mock news|Noticias simuladas|Noticias fallback/);
    await expect(page.locator("body")).toContainText(/Open article|Abrir noticia/);
    await expect(page.locator("body")).not.toContainText("&nbsp;");
  });

  test("data audit shows provider status and fallback labels", async ({ page }) => {
    await page.goto("/data-audit");
    await expect(page.locator("body")).toContainText(/Provider status|Estado de proveedores/);
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/Provider|Proveedor|Mock|Simulado|Fallback|Futuro|Future/);
    await expect(page.locator("body")).toContainText(/Actual provider|Proveedor efectivo/);
    await expect(page.locator("body")).toContainText(/Configured provider|Proveedor configurado/);
    await expect(page.locator("body")).toContainText(/Yahoo-compatible|Yahoo compatible|FMP/);
    await expect(page.locator("body")).toContainText(/Production\/local parity|Paridad produccion\/local/);
    await expect(page.locator("body")).toContainText(/Sanitization|Sanitizacion/);
  });

  test("runtime diagnostics expose safe provider parity metadata", async ({ request }) => {
    const data = (await getJsonWithRetry(request, "/api/diagnostics/runtime")) as {
      app: string;
      configuredMarketProvider: unknown;
      configuredNewsProvider: unknown;
      configuredFundamentalsProvider: unknown;
      fmpEnabled: unknown;
      fmpKeyPresent: unknown;
      logoDevTokenPresent: unknown;
      yahooFallbackEnabled: unknown;
      mockFallbackEnabled: unknown;
      providerFlags: {
        fmpKeyPresent: unknown;
        logoDevTokenPresent: unknown;
      };
    };
    const payload = JSON.stringify(data);

    expect(data.app).toBe("CMA Market Intelligence");
    expect(typeof data.configuredMarketProvider).toBe("string");
    expect(typeof data.configuredNewsProvider).toBe("string");
    expect(typeof data.configuredFundamentalsProvider).toBe("string");
    expect(typeof data.fmpEnabled).toBe("boolean");
    expect(typeof data.fmpKeyPresent).toBe("boolean");
    expect(typeof data.logoDevTokenPresent).toBe("boolean");
    expect(typeof data.yahooFallbackEnabled).toBe("boolean");
    expect(typeof data.mockFallbackEnabled).toBe("boolean");
    expect(typeof data.providerFlags.fmpKeyPresent).toBe("boolean");
    expect(typeof data.providerFlags.logoDevTokenPresent).toBe("boolean");
    expect(payload).not.toMatch(/api[_-]?key/i);
    if (process.env.FMP_API_KEY) expect(payload).not.toContain(process.env.FMP_API_KEY);
    if (process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN) expect(payload).not.toContain(process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN);
  });

  test("quote API exposes provider or fallback structure without secrets", async ({ request }) => {
    const response = await request.get("/api/market-data/quote/AAPL");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.symbol).toBe("AAPL");
    expect(data).toHaveProperty("price");
    expect(typeof data.provider).toBe("string");
    expect(typeof data.isFallback).toBe("boolean");
    expect(typeof data.sourceLabel).toBe("string");
    expect(data.providerTrace).toBeUndefined();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(data)).not.toContain(process.env.FMP_API_KEY);

    const debugResponse = await request.get("/api/market-data/quote/AAPL?debug=1");
    expect(debugResponse.ok()).toBeTruthy();
    const debugData = await debugResponse.json();
    expect(Array.isArray(debugData.providerTrace)).toBeTruthy();
    expect(debugData.providerTrace.length).toBeGreaterThan(0);
    const fmpTrace = debugData.providerTrace.find((item: { provider: string }) => item.provider === "fmp");
    if (fmpTrace?.reason === "plan_restricted") {
      expect(debugData).toHaveProperty("price");
      expect(["yahoo", "mock"]).toContain(debugData.provider);
    }
    if (process.env.FMP_API_KEY) expect(JSON.stringify(debugData.providerTrace)).not.toContain(process.env.FMP_API_KEY);

    const batchResponse = await request.post("/api/market-data/quotes", {
      data: { symbols: ["AAPL", "SPY"] },
    });
    expect(batchResponse.ok()).toBeTruthy();
    const batchData = await batchResponse.json();
    expect(batchData.quotes).toBeTruthy();
    expect(batchData.quotes.AAPL).toHaveProperty("price");
    expect(typeof batchData.quotes.AAPL.provider).toBe("string");
    if (process.env.FMP_API_KEY) expect(JSON.stringify(batchData)).not.toContain(process.env.FMP_API_KEY);
  });

  test("provider verification API compares configured and actual quote providers", async ({ request }) => {
    const response = await request.get("/api/providers/verify/AAPL");
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.symbol).toBe("AAPL");
    expect(typeof data.configuredProvider).toBe("string");
    expect(typeof data.actualProvider).toBe("string");
    expect(Array.isArray(data.providerTrace)).toBeTruthy();
    expect(Array.isArray(data.fallbackChain)).toBeTruthy();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(data)).not.toContain(process.env.FMP_API_KEY);
  });

  test("Argentina data APIs expose normalized manual and registry status", async ({ request }) => {
    const quoteResponse = await request.get("/api/argentina/quote/AL30");
    expect(quoteResponse.ok()).toBeTruthy();
    const quote = await quoteResponse.json();
    expect(quote.symbol).toBe("AL30");
    expect(typeof quote.price).toBe("number");
    expect(typeof quote.currency).toBe("string");
    expect(typeof quote.source).toBe("string");
    expect(JSON.stringify(quote)).not.toContain("ARS SAR");
    expect(quote.currency).not.toBe("ARS/USD");
    expect(quote.currency).not.toBe("USD MEP");
    expect(quote.currency).not.toBe("ARS CER");

    const statusResponse = await request.get("/api/argentina/status");
    expect(statusResponse.ok()).toBeTruthy();
    const status = await statusResponse.json();
    expect(JSON.stringify(status)).toContain("manual");
    expect(JSON.stringify(status)).toContain("mock");
    expect(JSON.stringify(status)).toContain("future");

    const instrumentsResponse = await request.get("/api/argentina/instruments");
    expect(instrumentsResponse.ok()).toBeTruthy();
    const instruments = await instrumentsResponse.json();
    expect(JSON.stringify(instruments)).toContain("GGAL");
    expect(JSON.stringify(instruments)).toContain("AL30");
    expect(JSON.stringify(instruments)).toContain("BYMA CEDEAR");
  });

  test("CNV APIs expose issuer documents and safe source status", async ({ request }) => {
    const issuerResponse = await request.get("/api/cnv/issuer/YPFD");
    expect(issuerResponse.ok()).toBeTruthy();
    const issuerData = await issuerResponse.json();
    expect(issuerData.symbol).toBe("YPFD");
    expect(issuerData.issuer.issuerName).toBeTruthy();
    expect(issuerData.issuer.sourceStatus).toBeTruthy();

    const documentsResponse = await request.get("/api/cnv/documents/YPFD");
    expect(documentsResponse.ok()).toBeTruthy();
    const documentsData = await documentsResponse.json();
    expect(Array.isArray(documentsData.documents)).toBeTruthy();
    expect(documentsData.documents.length).toBeGreaterThan(0);
    expect(documentsData.documents[0].sourceLabel).toBeTruthy();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(documentsData)).not.toContain(process.env.FMP_API_KEY);

    const statusResponse = await request.get("/api/cnv/status");
    expect(statusResponse.ok()).toBeTruthy();
    const statusData = await statusResponse.json();
    expect(Array.isArray(statusData.sources)).toBeTruthy();
    expect(statusData.officialIntegrationEnabled).toBe(false);
  });

  test("Argentina page shows local data coverage status", async ({ page }) => {
    await page.goto("/argentina");

    await expect(page.locator("body")).toContainText(/Cobertura de datos Argentina|Argentina data coverage/);
    await expect(page.getByTestId("market-heatmap")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Panorama local de mercado|Local market snapshot/);
    await expect(page.getByText("AL30").first()).toBeVisible();
    await expect(page.getByText("GGAL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/Proveedor|Manual validado|Simulado|Futuro|Carga manual validada|Validated manual load|Dato estructurado simulado|Structured mock data/);
    await expect(page.locator("body")).toContainText(/BYMA|CNV|Broker\/API/);
  });

  test("Argentina page shows CNV issuer and documents section", async ({ page }) => {
    await page.goto("/argentina");

    await expect(page.locator("body")).toContainText(/Emisoras y documentos CNV|CNV issuers and documents/);
    await expect(page.getByTestId("cnv-documents-panel").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/YPFD|GGAL/);
    await expect(page.locator("body")).toContainText(/Documento estructurado de demostracion|Structured demo document/);
  });

  test("Argentine asset pages show CNV context and non-Argentina assets do not", async ({ page }) => {
    await page.goto("/asset/YPFD");
    await expect(page.locator("body")).toContainText(/Emisora CNV|CNV issuer/);
    await expect(page.locator("body")).toContainText(/Documentos societarios|Corporate documents/);
    await expect(page.locator("body")).toContainText(/Integracion CNV futura|Future CNV integration/);

    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).not.toContainText("Emisora CNV");
    await expect(page.locator("body")).not.toContainText("CNV issuer");
  });

  test("data audit includes Argentina quote source section", async ({ page }) => {
    await page.goto("/data-audit");

    await expect(page.locator("body")).toContainText(/Auditoría de datos Argentina|Argentina data audit/);
    await expect(page.locator("body")).toContainText(/manual\/mock\/future/);
    await expect(page.getByText("AL30").first()).toBeVisible();
    await expect(page.getByText("GGAL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/CNV source\/status|Auditoria de documentos CNV/);
    await expect(page.locator("body")).toContainText(/Structured demo document|Documento estructurado de demostracion/);
  });

  test("AAPL asset header uses quote source labels and preserves CEDEAR distinction", async ({ page, request }) => {
    const quoteResponse = await request.get("/api/market-data/quote/AAPL");
    const quote = await quoteResponse.json();

    await page.goto("/asset/AAPL");
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/FMP provider|Proveedor FMP|Provider price: Yahoo-compatible|Precio proveedor: Yahoo compatible|Provider price|Precio proveedor|Mock fallback price|Precio simulado de respaldo|Precio mock/);

    if ((quote.provider === "fmp" || quote.provider === "yahoo") && quote.isFallback === false && quote.price) {
      await expect(page.locator("body")).not.toContainText("Precio mock");
    }

    await expect(page.locator("body")).toContainText("CEDEAR");
    await expect(page.locator("body")).toContainText(/Mock local CEDEAR price|Precio local CEDEAR simulado/);
    await expect(page.locator("body")).toContainText(/Underlying provider price|Precio subyacente proveedor|Fallback underlying price|Precio subyacente de respaldo/);
  });

  test("dashboard featured assets and search hydrate provider-supported prices", async ({ page, request }) => {
    const quoteResponse = await request.get("/api/market-data/quote/AAPL");
    const quote = await quoteResponse.json();

    await page.goto("/");
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/Yahoo-compatible|Yahoo compatible|FMP provider|Proveedor FMP|Mock|Simulado|Refreshing|Actualizando/);
    await expect(page.locator("body")).not.toContainText(/Hydration failed/i);

    if ((quote.provider === "fmp" || quote.provider === "yahoo") && quote.isFallback === false && quote.price) {
      await expect(page.locator("body")).not.toContainText(/191\.24\s*USD|191,24\s*USD/);
    }

    const search = page.locator("#asset-search");
    await search.fill("AAPL");
    const searchSection = page.locator("#markets");
    await expect(searchSection.getByText("AAPL").first()).toBeVisible();
    await expect(searchSection).toContainText(/Open analysis|Abrir análisis|Abrir anÃ¡lisis/);
    await expect(searchSection).toContainText(/Yahoo-compatible|Yahoo compatible|FMP provider|Proveedor FMP|Mock|Simulado/);
  });

  test("Spanish asset summaries use localized copy", async ({ page }) => {
    test.setTimeout(45_000);

    await page.goto("/asset/AAPL");
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.locator("body")).toContainText("Compañía tecnológica global");
    await expect(page.locator("body")).not.toContainText("Quality mega-cap profile");

    await page.goto("/asset/GD30");
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.locator("body")).toContainText("Referencia soberana argentina");
    await expect(page.locator("body")).not.toContainText("Global-law Argentine sovereign reference");

    await page.goto("/asset/TX26");
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.locator("body")).toContainText("Bono del Tesoro argentino ajustado por CER");
    await expect(page.locator("body")).not.toContainText("Inflation-linked Argentine Treasury exposure");

    await page.goto("/asset/AL30D");
    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.locator("body")).toContainText(/Especie dólar MEP|Especie dolar MEP/);
    await expect(page.locator("body")).not.toContainText("Dollar MEP Species");
  });

  test("glossary page and metric tooltips are visible", async ({ page }) => {
    await page.goto("/glossary");
    await expect(page.getByRole("heading", { name: /Financial Glossary|Glosario financiero/ })).toBeVisible();
    await expect(page.locator("body")).toContainText("Technical analysis");
    await expect(page.locator("body")).toContainText("Estimated annual return");
    for (const forbidden of forbiddenCurrencyLabels) {
      await expect(page.locator("body")).not.toContainText(forbidden);
    }

    await page.goto("/asset/AAPL");
    await page.getByRole("button", { name: "SMA 20" }).first().click();
    await expect(page.getByRole("tooltip")).toContainText("Simple average of the last 20 closes");

    await page.getByRole("button", { name: "P/E" }).first().click();
    await expect(page.getByRole("tooltip")).toContainText("Relates market price to earnings per share");

    await page.goto("/asset/AL30");
    await page.getByRole("button", { name: "Clean price" }).first().click();
    await expect(page.getByRole("tooltip")).toContainText("Bond price excluding accrued interest");
  });

  test("expanded USA provider/fallback asset routes stay available", async ({ page }) => {
    for (const symbol of ["MSFT", "NVDA", "AMZN"]) {
      await page.goto(`/asset/${symbol}`);
      await expect(page.getByText(symbol).first()).toBeVisible();
      await expect(page.locator("body")).toContainText(/Data coverage|Cobertura de datos/);
      await expect(page.locator("body")).not.toContainText(/404|This page could not be found|Asset not found|Activo no encontrado/i);
    }
  });

  test("expanded crypto provider/fallback asset routes stay available", async ({ page }) => {
    for (const symbol of ["SOL-USD", "BNB-USD"]) {
      await page.goto(`/asset/${symbol}`);
      await expect(page.getByText(symbol).first()).toBeVisible();
      await expect(page.locator("body")).toContainText(/Crypto|Cripto|Data coverage|Cobertura de datos/);
      await expect(page.locator("body")).not.toContainText(/404|This page could not be found|Asset not found|Activo no encontrado/i);
    }
  });

  test("data audit page explains provider mock and future coverage", async ({ page }) => {
    await page.goto("/data-audit");

    await expect(page.getByRole("heading", { name: /Data Audit|Auditoría de datos|Auditoria de datos/ })).toBeVisible();
    for (const symbol of ["AAPL", "AL30", "BTC-USD"]) {
      await expect(page.getByText(symbol).first()).toBeVisible();
    }
    await expect(page.locator("body")).toContainText(/Provider|Proveedor|Real/);
    await expect(page.locator("body")).toContainText(/Mock|Simulado/);
    await expect(page.locator("body")).toContainText(/Future|Futuro/);
  });

  test("methodology page explains analytical approach and disclaimer", async ({ page }) => {
    await page.goto("/methodology");

    await expect(page.getByRole("heading", { name: /Methodology|Metodología|Metodologia/ })).toBeVisible();
    await expect(page.locator("body")).toContainText(/Technical analysis methodology|Metodología de análisis técnico|Metodologia de analisis tecnico/);
    await expect(page.locator("body")).toContainText(/Not investment advice|No es asesoramiento financiero/);
  });

  test("status and footer link to data audit and methodology", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toContainText(/Paridad local\/producci|Local\/production parity/i);
    await expect(page.getByRole("link", { name: /View data audit|Ver auditor/i })).toHaveAttribute("href", "/data-audit");
    await expect(page.getByRole("link", { name: /View methodology|Ver metodolog/i })).toHaveAttribute("href", "/methodology");

    await page.goto("/");
    const footer = page.locator("footer");
    await expect(footer.getByRole("link", { name: /Data Audit|Auditoría|Auditoria/ })).toHaveAttribute("href", "/data-audit");
    await expect(footer.getByRole("link", { name: /Methodology|Metodología|Metodologia/ })).toHaveAttribute("href", "/methodology");
  });

  test("technical analysis source and API stay fallback-safe", async ({ page, request }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(/Integrated market signal|Market signal|Senal integrada de mercado|Senal de mercado/);
    await expect(page.locator("body")).toContainText(/Technical|Tecnico/);
    await expect(page.locator("body")).toContainText(/Fundamentals|Fundamentos/);
    await expect(page.locator("body")).toContainText(technicalSourceStatus);
    await expect(page.locator("body")).toContainText(/Technical signal|Senal tecnica/);
    await expect(page.locator("body")).toContainText(/Constructive|Constructivo|Neutral|Defensive|Defensivo|Very constructive|Muy constructivo|Very defensive|Muy defensivo/);
    await expect(page.locator("body")).toContainText(/\/100/);
    await expect(page.locator("body")).toContainText(/Not an investment recommendation|No constituye recomendacion de inversion/);
    await expect(page.locator("body")).not.toContainText(/Strong Buy|Strong Sell|Compra fuerte|Venta fuerte/);

    const response = await request.get("/api/analysis/technical/AAPL?timeframe=1Y");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.symbol).toBe("AAPL");
    expect(typeof data.technicalScore).toBe("number");
    expect(data.snapshot).toBeTruthy();
    expect(data.candlesCount).toBeGreaterThan(0);

    const debugResponse = await request.get("/api/analysis/technical/AAPL?timeframe=1Y&debug=1");
    expect(debugResponse.ok()).toBeTruthy();
    const debugData = await debugResponse.json();
    expect(debugData.providerTrace === undefined || Array.isArray(debugData.providerTrace)).toBeTruthy();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(debugData)).not.toContain(process.env.FMP_API_KEY);

    const unknownResponse = await request.get("/api/analysis/technical/UNKNOWN_TEST_SYMBOL?timeframe=1Y");
    expect([200, 404]).toContain(unknownResponse.status());
    const unknownData = await unknownResponse.json();
    expect(unknownData).not.toHaveProperty("stack");
  });

  test("fundamentals source and API stay fallback-safe", async ({ page, request }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(fundamentalsSourceStatus);
    await expect(page.locator("body")).toContainText(/P\/E|ROE|EPS|Cobertura fundamental parcial|Partial fundamental coverage/);
    await expect(page.locator("body")).not.toContainText(/N\/D\\s*N\/D\\s*N\/D\\s*N\/D\\s*N\/D\\s*N\/D/);

    const response = await request.get("/api/fundamentals/AAPL");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.symbol).toBe("AAPL");
    expect(data.snapshot).toBeTruthy();
    expect(data.metrics).toBeTruthy();
    expect(data.providerTrace).toBeUndefined();
    expect(typeof data.provider).toBe("string");
    expect(typeof data.isFallback).toBe("boolean");
    expect(typeof data.coverageRatio).toBe("number");
    expect(Array.isArray(data.missingFields)).toBeTruthy();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(data)).not.toContain(process.env.FMP_API_KEY);

    const debugResponse = await request.get("/api/analysis/fundamentals/AAPL?debug=1");
    expect(debugResponse.ok()).toBeTruthy();
    const debugData = await debugResponse.json();
    expect(debugData.symbol).toBe("AAPL");
    expect(debugData.sourceLabel).toBeTruthy();
    expect(debugData.metrics).toBeTruthy();
    expect(typeof debugData.coverageRatio).toBe("number");
    expect(Array.isArray(debugData.missingFields)).toBeTruthy();
    expect(Array.isArray(debugData.providerTrace)).toBeTruthy();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(debugData)).not.toContain(process.env.FMP_API_KEY);
  });

  test("non-equity fundamentals stay clear", async ({ page }) => {
    await page.goto("/asset/BTC-USD");
    await expect(page.getByText("Equity fundamentals do not directly apply to crypto assets.")).toBeVisible();

    await page.goto("/asset/AL30");
    await expect(page.getByText("Bond analytics are handled through fixed income metrics, not equity fundamentals.")).toBeVisible();
  });

  test("AL30 fixed income analytics stay visible", async ({ page }) => {
    await page.goto("/asset/AL30");

    await expect(page.getByText("AL30").first()).toBeVisible();
    await expect(page.getByText(/Related instruments|Instrumentos relacionados/)).toBeVisible();
    await expect(page.getByText("AL30D").first()).toBeVisible();
    await expect(page.getByText("AL30C").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/Peso species|Especie en pesos/);
    await expect(page.locator("body")).toContainText(/Dollar MEP species|Especie dólar MEP|Especie dolar MEP/);
    await expect(page.locator("body")).toContainText(/Dollar cable\/CCL species|Especie dólar cable\/CCL|Especie dolar cable\/CCL/);
    await expect(page.locator("body")).toContainText(fixedIncomeSourceStatus);
    await expect(page.getByRole("heading", { name: "Fixed Income Analytics" })).toBeVisible();
    await expect(page.locator("body")).toContainText(/YTM|TIR/);
    await expect(page.locator("body")).toContainText("Duration");
    await expect(page.locator("body")).toContainText("Parity");
    await expect(page.locator("body")).toContainText("Risk profile");
    await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
  });

  test("related instruments navigate between AL30 species", async ({ page }) => {
    test.setTimeout(60_000);
    await page.addInitScript(() => {
      window.localStorage.setItem("cma-market-intelligence-language", "en");
      window.sessionStorage.clear();
    });

    await page.goto("/asset/AL30D", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/asset\/AL30D$/);
    await expect(page.getByText("AL30D").first()).toBeVisible();

    const relatedCard = page.locator("section").filter({ hasText: /Related instruments|Instrumentos relacionados/ });
    await expect(relatedCard).toBeVisible({ timeout: 15_000 });
    await expect(relatedCard.getByText("AL30C").first()).toBeVisible();

    const al30PrimaryLink = relatedCard
      .getByRole("link", { name: /Instrumento principal: AL30|Primary instrument: AL30/ })
      .first();
    await expect(al30PrimaryLink).toBeVisible({ timeout: 15_000 });
    await expect(al30PrimaryLink).toHaveAttribute("href", "/asset/AL30");
    await al30PrimaryLink.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/asset\/AL30$/, { timeout: 15_000 }), al30PrimaryLink.click()]);
    await expect(page.getByText("AL30").first()).toBeVisible();

    await page.goto("/asset/AL30C", { waitUntil: "domcontentloaded" });
    const al30cRelatedCard = page.locator("section").filter({ hasText: /Related instruments|Instrumentos relacionados/ });
    const al30cPrimaryLink = al30cRelatedCard
      .getByRole("link", { name: /Instrumento principal: AL30|Primary instrument: AL30/ })
      .first();
    await expect(al30cPrimaryLink).toBeVisible({ timeout: 15_000 });
    await expect(al30cPrimaryLink).toHaveAttribute("href", "/asset/AL30");
    await al30cPrimaryLink.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/asset\/AL30$/, { timeout: 15_000 }), al30cPrimaryLink.click()]);
    await expect(page).toHaveURL(/\/asset\/AL30$/);

    await page.goto("/asset/GD30D", { waitUntil: "domcontentloaded" });
    const gd30dRelatedCard = page.locator("section").filter({ hasText: /Related instruments|Instrumentos relacionados/ });
    const gd30PrimaryLink = gd30dRelatedCard
      .getByRole("link", { name: /Instrumento principal: GD30|Primary instrument: GD30/ })
      .first();
    await expect(gd30PrimaryLink).toBeVisible({ timeout: 15_000 });
    await expect(gd30PrimaryLink).toHaveAttribute("href", "/asset/GD30");
    await gd30PrimaryLink.scrollIntoViewIfNeeded();
    await Promise.all([page.waitForURL(/\/asset\/GD30$/, { timeout: 15_000 }), gd30PrimaryLink.click()]);
    await expect(page).toHaveURL(/\/asset\/GD30$/);
  });

  test("bond species fixed income routes stay available", async ({ page }) => {
    for (const symbol of ["AL30D", "AL30C", "GD30D", "GD30C"]) {
      await page.goto(`/asset/${symbol}`);
      await expect(page.getByText(symbol).first()).toBeVisible();
      await expect(page.getByText(/Related instruments|Instrumentos relacionados/)).toBeVisible();
      await expect(page.getByText(/Primary instrument|Instrumento principal/)).toBeVisible();
      await expect(page.getByText("Underlying bond")).toBeVisible();
      await expect(page.getByText(/Dollar MEP species|Dollar cable\/CCL species/).first()).toBeVisible();
      await expect(page.locator("body")).not.toContainText(/Asset not found|Activo no encontrado/i);
      await expect(page.locator("body")).not.toContainText(/very_high|new_york|sovereign_bond|dolar_mep|dolar_cable/i);
    }
  });

  test("GD30 and TX26 fixed income routes stay available", async ({ page }) => {
    await page.goto("/asset/GD30");
    await expect(page.getByText("GD30").first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Fixed Income Analytics" })).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/Asset not found|Activo no encontrado/i);

    await page.goto("/asset/TX26");
    await expect(page.getByText("TX26").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/CER|Inflation-linked/i);
    await expect(page.getByRole("heading", { name: "Fixed Income Analytics" })).toBeVisible();
  });

  test("asset intelligence API and asset page report stay available", async ({ page, request }) => {
    const response = await request.get("/api/intelligence/AAPL");
    expect(response.ok()).toBeTruthy();
    const report = await response.json();
    expect(report.symbol).toBe("AAPL");
    expect(report.finalReading).toBeTruthy();
    expect(report.priceSummary).toBeTruthy();
    expect(report.marketSignalSummary).toBeTruthy();
    expect(report.riskSummary).toBeTruthy();
    if (process.env.FMP_API_KEY) expect(JSON.stringify(report)).not.toContain(process.env.FMP_API_KEY);

    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(/Lectura ejecutiva|Executive reading/, { timeout: 20_000 });
    await expect(page.getByTestId("asset-executive-summary")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Price action|Precio/);
    await expect(page.locator("body")).toContainText(/View data coverage|Ver cobertura de datos/);
    await expect(page.locator("body")).toContainText(/Data coverage|Cobertura de datos/);
    await expect(page.locator("body")).toContainText(/Technical analysis|Análisis técnico|Analisis tecnico/);
    await expect(page.locator("body")).toContainText(/Fundamental analysis|Análisis fundamental|Analisis fundamental/);
    await expect(page.locator("body")).toContainText(/Riesgos principales|Key risks/);
    await expect(page.getByTestId("market-signal-module")).toBeVisible();
    await expect(page.getByTestId("technical-analysis-module")).toBeVisible();
    await expect(page.locator("body")).toContainText(/Technical factor panel|Panel de factores tecnicos/);
  });

  test("Spanish technical interpretation is human-readable", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await page.getByRole("button", { name: "ES", exact: true }).click();

    await expect(page.locator("body")).toContainText(/An.lisis t.cnico|Panel de factores tecnicos/i);
    await expect(page.locator("body")).not.toContainText("constructive uptrend");
    await expect(page.locator("body")).not.toContainText("overbought momentum watch");
    await expect(page.locator("body")).toContainText(/tendencia|momentum|sobrecompra/i);
  });

  test("Spanish CEDEAR context avoids internal provider wording", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await page.getByRole("button", { name: "ES", exact: true }).click();

    await expect(page.locator("body")).toContainText("Subyacente");
    await expect(page.locator("body")).toContainText(/CEDEAR local simulado|Precio local CEDEAR simulado/);
    await expect(page.locator("body")).not.toContainText("Provider underlying / mock local CEDEAR");
    await expect(page.locator("body")).not.toContainText("mock local CEDEAR");
    await expect(page.locator("body")).not.toContainText("provider underlying");
  });

  test("Spanish fundamental card avoids English unavailable copy", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await page.getByRole("button", { name: "ES", exact: true }).click();

    await expect(page.locator("body")).toContainText(/Análisis fundamental|AnÃ¡lisis fundamental|Analisis fundamental/);
    await expect(page.locator("body")).not.toContainText("Equity-style fundamental metrics");
  });

  test("Spanish report route keeps executive sections localized", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("cma-market-intelligence-language", "es");
    });
    await page.goto("/report/AAPL");

    await expect(page.locator("body")).toContainText("Reporte compartible");
    await expect(page.locator("body")).toContainText("Precio");
    await expect(page.locator("body")).toContainText("Señal");
    await expect(page.locator("body")).toContainText("Confianza");
    await expect(page.locator("body")).toContainText("Fuente");
    await expect(page.locator("body")).toContainText("Abrir perfil completo");
    await expect(page.locator("body")).toContainText(/Metodolog/i);
    await expect(page.locator("body")).toContainText(/Auditor/i);
    await expect(page.locator("body")).toContainText("Lectura ejecutiva");
    await expect(page.locator("body")).toContainText("Puntos clave");
    await expect(page.locator("body")).toContainText(/ntesis t/i);
    await expect(page.locator("body")).toContainText("Pulso de noticias");
    await expect(page.locator("body")).toContainText("Los titulares pueden mostrarse en el idioma original");
    await expect(page.locator("body")).toContainText(/Cómo leerlo|Como leerlo/);
    await expect(page.locator("body")).toContainText("BYMA/IOL");
    await expect(page.locator("body")).toContainText("Riesgos principales");
    await expect(page.locator("body")).not.toContainText("Executive reading");
    await expect(page.locator("body")).not.toContainText("Key risks");
    await expect(page.locator("body")).not.toContainText("Data coverage and limitations");
    await expect(page.locator("body")).not.toContainText("Open full asset page");
    await expect(page.locator("body")).not.toContainText("Methodology");
    await expect(page.locator("body")).not.toContainText("Data audit");
    await expect(page.locator("body")).not.toContainText("Shareable asset intelligence report");
    await expect(page.locator("body")).not.toContainText("Open full asset page / Abrir perfil completo");
    await expect(page.locator("body")).not.toContainText("Methodology /");
    await expect(page.locator("body")).not.toContainText("Data audit /");
  });

  test("Spanish asset executive reading uses report synthesis hierarchy", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await page.getByRole("button", { name: "ES", exact: true }).click();

    await expect(page.locator("body")).toContainText("Lectura ejecutiva", { timeout: 20_000 });
    await expect(page.locator("body")).toContainText(/Panel de factores tecnicos|Detalle tecnico/i);
    await expect(page.locator("body")).toContainText("Pulso de noticias");
    await expect(page.locator("body")).not.toContainText("Shareable asset intelligence report");
  });

  test("Spanish report route stays responsive without mixed CTA language", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.addInitScript(() => {
      window.localStorage.setItem("cma-market-intelligence-language", "es");
    });
    await page.goto("/report/AAPL");

    await expect(page.locator("body")).toContainText("Lectura ejecutiva", { timeout: 20_000 });
    await expect(page.locator("body")).toContainText("Puntos clave");
    await expect(page.locator("body")).toContainText("Abrir perfil completo");
    await expect(page.locator("body")).toContainText("Cobertura y limitaciones de datos");
    await expect(page.locator("body")).not.toContainText("Hydration failed");
    await expect(page.locator("body")).not.toContainText("Open full asset page / Abrir perfil completo");

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test("shareable intelligence report routes cover equities crypto and bonds", async ({ page }) => {
    await page.goto("/report/AAPL");
    await expect(page.getByText("AAPL").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/Executive reading|Lectura ejecutiva/);
    await expect(page.locator("body")).toContainText(/Price|Precio/);
    await expect(page.locator("body")).toContainText(/Signal|Señal/);
    await expect(page.locator("body")).toContainText(/Confidence|Confianza/);
    await expect(page.locator("body")).toContainText(/Source|Fuente/);
    await expect(page.locator("body")).toContainText(/Headlines may appear in the source's original language|Los titulares pueden mostrarse en el idioma original/);
    await expect(page.locator("body")).toContainText(/Open full asset page|Abrir perfil completo/);
    await expect(page.locator("body")).toContainText(/How to read it|Cómo leerlo|Como leerlo/);
    await expect(page.locator("body")).toContainText(/BYMA\/IOL|licensed-provider|proveedor licenciado/);
    await expect(page.locator("body")).not.toContainText(/Strong Buy|Strong Sell|Compra fuerte|Venta fuerte/);
    await expect(page.locator("body")).not.toContainText("Open full asset page / Abrir perfil completo");
    await expect(page.locator("body")).not.toContainText("Methodology /");
    await expect(page.locator("body")).not.toContainText("Data audit /");

    await page.goto("/report/BTC-USD");
    await expect(page.getByText("BTC-USD").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/fundamental reading is limited|fundamentals are not applicable|fundamentos de equity no aplican|Fundamentals unavailable|Fundamentos no disponibles/i);
    await expect(page.locator("body")).toContainText(/Key risks|Riesgos principales/);

    await page.goto("/report/AL30");
    await expect(page.getByText("AL30").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/fixed income|renta fija/i);
    await expect(page.locator("body")).toContainText(/mock|simulad/i);
  });

  test("fixed income comparison and APIs stay offline-safe", async ({ page, request }) => {
    await page.goto("/argentina");

    await expect(page.getByRole("heading", { name: "Fixed Income Analytics" })).toBeVisible();
    for (const symbol of ["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"]) {
      await expect(page.getByText(symbol).first()).toBeVisible();
    }
    await expect(page.locator("body")).toContainText(/Peso trading species|Especie en pesos/);
    await expect(page.locator("body")).toContainText(/Dollar MEP species|Especie dólar MEP|Especie dolar MEP/);
    await expect(page.locator("body")).toContainText(/Dollar cable\/CCL species|Especie dólar cable\/CCL|Especie dolar cable\/CCL/);

    for (const symbol of ["AL30D", "AL30C", "GD30D"]) {
      const analyticsResponse = await request.get(`/api/fixed-income/${symbol}`);
      expect(analyticsResponse.ok()).toBeTruthy();
      const analytics = await analyticsResponse.json();
      expect(analytics.symbol).toBe(symbol);
      expect("estimatedYTM" in analytics).toBeTruthy();
      expect("macaulayDuration" in analytics).toBeTruthy();
    }

    const comparisonResponse = await request.get("/api/fixed-income/comparison");
    expect(comparisonResponse.ok()).toBeTruthy();
    const comparison = await comparisonResponse.json();
    const symbols = comparison.map((item: { symbol: string }) => item.symbol);
    expect(symbols).toEqual(expect.arrayContaining(["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"]));
    expect(comparison[0]).toHaveProperty("estimatedYTM");
    expect(comparison[0]).toHaveProperty("duration");
  });

  test("argentina page shows instrument universe groups", async ({ page }) => {
    await page.goto("/argentina");

    await expect(page.locator("body")).toContainText(/Initial Argentina universe|Universo argentino inicial/);
    await expect(page.locator("body")).toContainText(/Argentine equities|Acciones argentinas/);
    await expect(page.locator("body")).toContainText("CEDEARs");
    await expect(page.locator("body")).toContainText(/Sovereign bonds and species|Bonos soberanos y especies/);
    await expect(page.locator("body")).toContainText(/Instrument universe|Universo de instrumentos/);
    for (const symbol of ["AL30D", "AL30C", "GD30D", "GD30C", "TX26", "GGAL", "YPFD", "PAMP", "AAPL", "MSFT", "SPY"]) {
      await expect(page.getByText(symbol).first()).toBeVisible();
    }
  });

  test("asset logo fallback is visible without broken images", async ({ page }) => {
    await page.goto("/asset/TSLA");

    const logo = page.getByTestId("asset-logo").first();
    await expect(logo).toBeVisible();
    const brokenImages = await page.evaluate(() =>
      Array.from(document.images).filter((image) => image.complete && image.naturalWidth === 0).length,
    );
    expect(brokenImages).toBe(0);
  });

  test("expanded CEDEAR universe is discoverable", async ({ page }) => {
    await page.goto("/screener");

    await page.getByPlaceholder(/Search AL30|Buscar AL30/).fill("NVDA");
    await expect(page.locator("body")).toContainText("NVDA");
    await expect(page.locator("body")).toContainText(/CEDEAR|Referencia CEDEAR|CEDEAR context/);

    await page.getByPlaceholder(/Search AL30|Buscar AL30/).fill("SPY");
    await expect(page.locator("body")).toContainText("SPY");
    await expect(page.locator("body")).toContainText(/CEDEAR|ETF/);
  });

  test("crypto page shows crypto universe roadmap", async ({ page }) => {
    await page.goto("/crypto");

    await expect(page.locator("body")).toContainText(/Crypto universe roadmap|Hoja de ruta del universo cripto/);
    await expect(page.getByText("BTC-USD").first()).toBeVisible();
    await expect(page.getByText("ETH-USD").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/top 50 crypto assets|50 principales/i);
  });

  test("reports navigation reaches future reports section", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Reports" }).click();
    await expect(page).toHaveURL(/\/reports$/);
    await expect(page.locator("body")).not.toContainText(/404|This page could not be found/i);
    await expect(page.locator("body")).toContainText(
      /Reports|Reportes|Daily market briefings|AI-generated PDF reports|Informes diarios de mercado/,
    );
  });
});
