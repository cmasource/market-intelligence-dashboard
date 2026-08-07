import { expect, test, type Page } from "@playwright/test";

const now = new Date().toISOString();

const providers = [
  { id: "plus", name: "Plus", providerType: "exchange_agency", operates24x7: false, supportsArsDeposit: true, supportsArsWithdrawal: true, supportsUsdDeposit: true, supportsUsdWithdrawal: true, requiresSameHolderAccount: true, sourceType: "public_endpoint", status: "active", verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "partially_verified", transferAsset: "partially_verified", availability24x7: "unverified" } },
  { id: "bna", name: "Banco Nación", providerType: "bank", operates24x7: false, supportsArsDeposit: true, supportsArsWithdrawal: true, supportsUsdDeposit: true, supportsUsdWithdrawal: true, requiresSameHolderAccount: true, sourceType: "public_page", status: "active", verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "partially_verified", transferAsset: "partially_verified", availability24x7: "verified" } },
  { id: "satoshitango", name: "Satoshi Tango", providerType: "exchange", operates24x7: true, sourceType: "aggregator", status: "active", verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "reference_only" } },
  { id: "fiwind", name: "Fiwind", providerType: "wallet", operates24x7: true, sourceType: "aggregator", status: "active", verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "verified", transferAsset: "partially_verified", availability24x7: "partially_verified" } },
  { id: "banco-hipotecario", name: "Banco Hipotecario", providerType: "bank", operates24x7: false, sourceType: "aggregator", status: "active", verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "partially_verified", availability24x7: "reference_only" } },
  { id: "galicia", name: "Banco Galicia", providerType: "bank", sourceType: "unavailable", status: "unsupported", verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "unverified" } },
] as const;

function quote(overrides: Record<string, unknown>) {
  return {
    id: "quote",
    providerId: "plus",
    instrument: "bank_usd",
    transferAsset: "USD_BANK",
    userBuysUsdAt: 1500,
    userSellsUsdAt: 1490,
    originalBuyLabel: "Venta",
    originalSellLabel: "Compra",
    quoteCurrency: "ARS",
    observedAt: now,
    fetchedAt: now,
    sourceUrl: "https://example.com/public-quote",
    sourceType: "public_endpoint",
    status: "live",
    fees: { fixedArs: 0, percentage: 0, fixedUsd: 0, confidence: "confirmed" },
    warnings: [],
    verification: { quote: "verified", costs: "verified", limits: "verified", transferAsset: "verified" },
    ...overrides,
  };
}

function response({ negative = false } = {}) {
  const quotes = [
    quote({ id: "plus-usd", providerId: "plus", instrument: "bank_usd", userBuysUsdAt: negative ? 1519 : 1500, userSellsUsdAt: 1490 }),
    quote({ id: "bna-usd", providerId: "bna", userBuysUsdAt: negative ? 1530 : 1510, userSellsUsdAt: negative ? 1501.92 : 1505, sourceType: "public_page", fees: { confidence: "unknown" }, warnings: ["costs_unverified"] }),
    quote({ id: "fiwind-usd-via-usdt", providerId: "fiwind", instrument: "crypto_usd_route", userBuysUsdAt: 1532, userSellsUsdAt: negative ? 1501 : 1520, observedAt: undefined, status: "delayed", sourceType: "aggregator", fees: { confidence: "unknown" }, warnings: ["observed_at_unavailable", "costs_unverified", "verify_final_price", "provider_partial_data"], verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" } }),
    quote({ id: "hipotecario-usd", providerId: "banco-hipotecario", userBuysUsdAt: 1540, userSellsUsdAt: 1495, observedAt: undefined, status: "delayed", sourceType: "aggregator", fees: { confidence: "unknown" }, warnings: ["observed_at_unavailable", "costs_unverified", "provider_partial_data"], verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" } }),
    quote({ id: "satoshi-usdt", providerId: "satoshitango", instrument: "usdt", transferAsset: "USDT", userBuysUsdAt: 1590, userSellsUsdAt: 1562, observedAt: "2020-01-01T00:00:00.000Z", status: "stale", sourceType: "aggregator", fees: { confidence: "unknown" }, warnings: ["stale_quote", "observed_at_unavailable"], verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" } }),
    quote({ id: "fiwind-usdt", providerId: "fiwind", instrument: "usdt", transferAsset: "USDT", userBuysUsdAt: 1580, userSellsUsdAt: 1567, quotedAmountUsd: 1000, status: "delayed", sourceType: "aggregator", fees: { confidence: "unknown" }, warnings: ["costs_unverified", "verify_final_price", "volume_specific_quote"], verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" } }),
  ];
  return {
    generatedAt: now,
    providers,
    quotes,
    providerResults: [
      { providerId: "plus", quotes: [quotes[0]], status: "success", fetchedAt: now, cacheStatus: "fresh" },
      { providerId: "bna", quotes: [quotes[1]], status: "success", fetchedAt: now, cacheStatus: "fresh" },
      { providerId: "comparadolar-usd", quotes: quotes.slice(2, 4), status: "partial", fetchedAt: now, cacheStatus: "fresh" },
      { providerId: "criptoya-stablecoins", quotes: quotes.slice(4), status: "success", fetchedAt: now, cacheStatus: "fresh" },
    ],
    cache: { plusTtlSeconds: 60, bnaTtlSeconds: 300, criptoYaTtlSeconds: 60, comparaDolarTtlSeconds: 60 },
    disclaimer: "informational_only",
  };
}

async function mockQuotes(page: Page, fixture = response()) {
  await page.route("**/api/arbitrage/quotes*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) }));
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("separates assets, shows both user-side prices and constrains routes", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await mockQuotes(page);
  await page.goto("/radar-arbitraje");

  await expect(page.getByRole("heading", { name: /Radar de Arbitraje|Arbitrage Radar/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Radar de Arbitraje|Arbitrage Radar/ })).toHaveAttribute("href", "/radar-arbitraje");
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText("Plus");
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText("Banco Nación");
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText(/Comprás USD a|You buy USD at/);
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText(/Vendés USD a|You sell USD at/);
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText("Fiwind");
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText(/USD → USDT → ARS/);
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText(/Unverifiable freshness|Frescura no verificable/);
  await expect(page.getByTestId("best-arbitrage-opportunity")).toContainText(/Possible gross difference|Posible diferencia bruta/);
  await expect(page.getByTestId("arbitrage-matrix")).toContainText(/USD bancario|bank USD/i);
  await expect(page.getByTestId("arbitrage-calculator")).toContainText(/Calculadora|calculator/i);
  await expect(page.getByTestId("arbitrage-source-status")).toContainText("Fiwind");
  await expect(page.getByTestId("arbitrage-source-status")).toContainText(/Banco Hipotecario/);

  await page.getByRole("button", { name: /USDT/ }).click();
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText("Fiwind");
  await expect(page.getByTestId("arbitrage-quote-cards")).not.toContainText("Plus");
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText(/Volume|Volumen/);
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText(/Informational reference|Referencia informativa/);
  await expect(page.getByTestId("arbitrage-matrix")).toContainText("USDT");

  await page.getByRole("button", { name: /USD bancario|Bank USD/ }).click();
  await page.getByRole("button", { name: /Fresh only|Sólo vigentes/ }).click();
  await expect(page.getByTestId("arbitrage-quote-cards")).not.toContainText("Fiwind");
  await expect(page.getByTestId("arbitrage-quote-cards")).not.toContainText("Banco Hipotecario");
  await page.getByRole("button", { name: /All|Todas/ }).click();
  const calculator = page.getByTestId("arbitrage-calculator");
  await calculator.getByLabel(/Origin provider|Proveedor de origen/).selectOption("plus-usd");
  await calculator.getByLabel(/Destination provider|Proveedor de destino/).selectOption("bna-usd");
  await calculator.getByLabel(/Amount in USD|Monto en USD/).fill("2000");
  await expect(calculator).toContainText(/10[,.]000/);

  await page.getByRole("button", { name: /USDT/ }).click();
  await page.getByRole("button", { name: /Fresh only|Sólo vigentes/ }).click();
  await expect(page.getByTestId("arbitrage-quote-cards")).not.toContainText("Satoshi Tango");
  await expect(page.getByTestId("arbitrage-quote-cards")).toContainText("Fiwind");
  expect(consoleErrors).toEqual([]);
});

test("keeps the negative Plus and BNA comparison unprofitable", async ({ page }) => {
  await mockQuotes(page, response({ negative: true }));
  await page.goto("/radar-arbitraje");
  await expect(page.getByTestId("best-arbitrage-opportunity")).toContainText(/No verified opportunities|Sin oportunidades verificadas/);
  const calculator = page.getByTestId("arbitrage-calculator");
  await calculator.getByLabel(/Origin provider|Proveedor de origen/).selectOption("plus-usd");
  await calculator.getByLabel(/Destination provider|Proveedor de destino/).selectOption("bna-usd");
  await calculator.getByLabel(/Amount in USD|Monto en USD/).fill("1");
  await expect(calculator).toContainText(/-.*17[,.]08/);
});

test("is responsive without page overflow and supports dark and light modes", async ({ page }) => {
  await mockQuotes(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/radar-arbitraje");
  await expect(page.getByRole("heading", { name: /Radar de Arbitraje|Arbitrage Radar/ })).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole("button", { name: /Light|Claro/, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /Dark|Oscuro/, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});
