import { expect, test } from "@playwright/test";

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
  { route: "/argentina", heading: /Argentina Market|Mercado argentino/ },
  { route: "/crypto", heading: /Crypto Monitor|Monitor cripto/ },
  { route: "/reports", heading: /Reports|Reportes/ },
  { route: "/agents", heading: /AI Agents|Agentes IA/ },
  { route: "/status", heading: /Development Status|Estado del desarrollo/ },
];

const timeframes = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];
const forbiddenLegacyBrand = new RegExp(["Se", "mia"].join(""), "i");
const marketDataStatus = /Real market data|Fallback mock data|Mock OHLCV data/;
const technicalSourceStatus = /Calculated from real market data|Calculated from fallback mock data/;
const fundamentalsSourceStatus = /Provider fundamentals|Fallback mock fundamentals/;
const fixedIncomeSourceStatus = /Mock fixed income analytics/;

test.describe("CMA Market Intelligence smoke tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.clear());
  });

  test("home dashboard loads with approved branding", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/CMA Market Intelligence/);
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();
    await expect(page.getByText("CMA Consulting").first()).toBeVisible();
    await expect(page.getByText("cma_source").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/Mixed coverage|Cobertura mixta/);
    await expect(page.locator("body")).not.toContainText("Solo datos mock");
    await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
  });

  test("header navigation exists", async ({ page }) => {
    await page.goto("/");

    const navigation = page.getByRole("navigation", { name: "Primary navigation" });
    await expect(navigation.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Markets" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Screener" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Argentina" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Crypto" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Reports" })).toBeVisible();
    await expect(navigation.getByRole("link", { name: "Agents" })).toBeVisible();
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
      await expect(page.locator("body")).toContainText(marketDataStatus);
      await expect(page.getByTestId("asset-chart-container")).toBeVisible();
      await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
      await expect(page.locator("body")).not.toContainText(/Asset not found|Activo no encontrado/i);
    });
  }

  test("chart module timeframes remain interactive", async ({ page }) => {
    await page.goto("/asset/AAPL");

    const chart = page.getByTestId("asset-chart-container");
    await expect(chart).toBeVisible();

    for (const timeframe of timeframes) {
      await expect(page.getByRole("button", { name: timeframe })).toBeVisible();
    }

    await page.getByRole("button", { name: "1M" }).click();
    await expect(page.getByRole("button", { name: "1M" })).toHaveAttribute("aria-pressed", "true");
    await expect(chart).toBeVisible();

    await page.getByRole("button", { name: "1Y" }).click();
    await expect(page.getByRole("button", { name: "1Y" })).toHaveAttribute("aria-pressed", "true");
    await expect(chart).toBeVisible();
  });

  test("language switcher toggles dashboard copy", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "ES", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Inteligencia financiera para decisiones modernas de mercado" })).toBeVisible();

    await page.getByRole("button", { name: "EN", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Financial intelligence for modern market decisions" })).toBeVisible();
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

    await page.getByLabel("Asset search").fill("Bitcoin");
    await expect(searchSection.getByText("BTC-USD").first()).toBeVisible();
  });

  test("home search handles future instruments with clear actions", async ({ page }) => {
    await page.goto("/");

    const searchSection = page.locator("#markets");
    await page.getByLabel("Asset search").fill("Amazon");
    await expect(searchSection.getByText("AMZN").first()).toBeVisible();
    await expect(searchSection).toContainText(/View preliminary profile|Ver ficha preliminar|Future coverage|Cobertura futura/);
    await expect(searchSection.locator("a").first()).toBeVisible();
  });

  test("future asset fallback page is graceful", async ({ page }) => {
    await page.goto("/asset/AMZN");

    await expect(page.getByText("AMZN").first()).toBeVisible();
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
    for (const symbol of ["AL30", "AL30D", "AL30C", "GGAL", "YPFD", "BTC-USD", "ETH-USD", "AAPL"]) {
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
    await page.getByRole("button", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await expect(page.getByText("CMA Market Intelligence").first()).toBeVisible();
  });

  test("markets page remains readable in light mode", async ({ page }) => {
    await page.goto("/markets");
    await page.getByRole("button", { name: "Light" }).click();

    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByText("CEDEARs").first()).toBeVisible();
    await expect(page.getByText(/Bonds|Bonos/).first()).toBeVisible();
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
    await expect(page.getByText("Mock data until Argentina market integration is enabled.")).toBeVisible();
  });

  test("asset pages show data coverage badges", async ({ page }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(/Data coverage|Cobertura de datos/);
    await expect(page.locator("body")).toContainText(/Price: Provider|Precio: Proveedor|Provider|Proveedor/);
    await expect(page.locator("body")).toContainText(/Fundamentals: Provider|Fundamentos: Proveedor|Provider|Proveedor/);

    await page.goto("/asset/AL30");
    await expect(page.locator("body")).toContainText(/Fixed income: Mock|Renta fija: Simulado|Mock|Simulado/);
  });

  test("technical analysis source and API stay fallback-safe", async ({ page, request }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(/Market signal|Senal de mercado/);
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
  });

  test("fundamentals source and API stay fallback-safe", async ({ page, request }) => {
    await page.goto("/asset/AAPL");
    await expect(page.locator("body")).toContainText(fundamentalsSourceStatus);

    const response = await request.get("/api/fundamentals/AAPL");
    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    expect(data.symbol).toBe("AAPL");
    expect(data.snapshot).toBeTruthy();
    expect(typeof data.provider).toBe("string");
    expect(typeof data.isFallback).toBe("boolean");
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
    await expect(page.locator("body")).toContainText(/Dollar MEP species|Especie dolar MEP/);
    await expect(page.locator("body")).toContainText(/Dollar cable\/CCL species|Especie dolar cable\/CCL/);
    await expect(page.locator("body")).toContainText(fixedIncomeSourceStatus);
    await expect(page.getByRole("heading", { name: "Fixed Income Analytics" })).toBeVisible();
    await expect(page.locator("body")).toContainText(/YTM|TIR/);
    await expect(page.locator("body")).toContainText("Duration");
    await expect(page.locator("body")).toContainText("Parity");
    await expect(page.locator("body")).toContainText("Risk profile");
    await expect(page.locator("body")).not.toContainText(forbiddenLegacyBrand);
  });

  test("related instruments navigate between AL30 species", async ({ page }) => {
    await page.goto("/asset/AL30");

    const relatedCard = page.locator("section").filter({ hasText: /Related instruments|Instrumentos relacionados/ });
    await relatedCard.getByRole("link", { name: /AL30D/ }).click();
    await expect(page).toHaveURL(/\/asset\/AL30D$/);
    await expect(page.getByText("AL30D").first()).toBeVisible();
    await expect(page.getByText(/Primary instrument|Instrumento principal/)).toBeVisible();
    await expect(page.getByText("AL30C").first()).toBeVisible();

    await page.getByRole("link", { name: /Primary instrument: AL30|Instrumento principal: AL30/ }).click();
    await expect(page).toHaveURL(/\/asset\/AL30$/);
    await expect(page.getByText("AL30").first()).toBeVisible();
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

  test("fixed income comparison and APIs stay offline-safe", async ({ page, request }) => {
    await page.goto("/argentina");

    await expect(page.getByRole("heading", { name: "Fixed Income Analytics" })).toBeVisible();
    for (const symbol of ["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "TX26"]) {
      await expect(page.getByText(symbol).first()).toBeVisible();
    }
    await expect(page.locator("body")).toContainText(/Peso trading species|Especie en pesos/);
    await expect(page.locator("body")).toContainText(/Dollar MEP species|Especie dolar MEP/);
    await expect(page.locator("body")).toContainText(/Dollar cable\/CCL species|Especie dolar cable\/CCL/);

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
