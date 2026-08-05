import { expect, test, type Page } from "@playwright/test";

const now = new Date().toISOString();

const providers = [
  { id: "plus", name: "Plus", providerType: "exchange_agency", operates24x7: true, supportsArsDeposit: true, supportsArsWithdrawal: true, supportsUsdDeposit: true, supportsUsdWithdrawal: true, requiresSameHolderAccount: true, sourceType: "public_endpoint", status: "active", verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "partially_verified", transferAsset: "partially_verified", availability24x7: "verified" } },
  { id: "bna", name: "Banco Nación", providerType: "bank", operates24x7: false, supportsArsDeposit: true, supportsArsWithdrawal: true, supportsUsdDeposit: true, supportsUsdWithdrawal: true, requiresSameHolderAccount: true, sourceType: "public_page", status: "active", verification: { deposit: "partially_verified", withdrawal: "partially_verified", sameHolder: "partially_verified", transferAsset: "partially_verified", availability24x7: "verified" } },
  { id: "satoshitango", name: "Satoshi Tango", providerType: "exchange", operates24x7: true, sourceType: "aggregator", status: "active", verification: { deposit: "unverified", withdrawal: "unverified", sameHolder: "unverified", transferAsset: "unverified", availability24x7: "reference_only" } },
  { id: "fiwind", name: "Fiwind", providerType: "wallet", operates24x7: true, sourceType: "unavailable", status: "temporarily_unavailable", verification: { deposit: "verified", withdrawal: "verified", sameHolder: "verified", transferAsset: "verified", availability24x7: "partially_verified" } },
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
    quote({ id: "plus-usd", providerId: "plus", instrument: "usd_24_7", userBuysUsdAt: negative ? 1519 : 1500, userSellsUsdAt: 1490 }),
    quote({ id: "bna-usd", providerId: "bna", userBuysUsdAt: negative ? 1530 : 1510, userSellsUsdAt: negative ? 1501.92 : 1505, sourceType: "public_page", fees: { confidence: "unknown" }, warnings: ["costs_unverified"] }),
    quote({ id: "satoshi-usdt", providerId: "satoshitango", instrument: "usdt", transferAsset: "USDT", userBuysUsdAt: 1495, userSellsUsdAt: 1494, observedAt: "2020-01-01T00:00:00.000Z", status: "stale", sourceType: "aggregator", fees: { confidence: "unknown" }, warnings: ["stale_quote", "observed_at_unavailable"] }),
  ];
  return {
    generatedAt: now,
    providers,
    quotes,
    providerResults: [
      { providerId: "plus", quotes: [quotes[0]], status: "success", fetchedAt: now, cacheStatus: "fresh" },
      { providerId: "bna", quotes: [quotes[1]], status: "success", fetchedAt: now, cacheStatus: "fresh" },
      { providerId: "satoshitango", quotes: [quotes[2]], status: "partial", fetchedAt: now, cacheStatus: "fresh" },
      { providerId: "fiwind", quotes: [], status: "error", fetchedAt: now, errorCode: "upstream_unavailable" },
    ],
    cache: { plusTtlSeconds: 60, bnaTtlSeconds: 300, dolarApiTtlSeconds: 60 },
    disclaimer: "informational_only",
  };
}

async function mockQuotes(page: Page, fixture = response()) {
  await page.route("**/api/arbitrage/quotes*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fixture) }));
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("loads rankings, opportunity, matrix, calculator and source failures", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  await mockQuotes(page);
  await page.goto("/radar-arbitraje");

  await expect(page.getByRole("heading", { name: /Radar de Arbitraje|Arbitrage Radar/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Radar de Arbitraje|Arbitrage Radar/ })).toHaveAttribute("href", "/radar-arbitraje");
  await expect(page.getByTestId("arbitrage-buy-ranking")).toContainText("Plus");
  await expect(page.getByTestId("arbitrage-sell-ranking")).toContainText("Banco Nación");
  await expect(page.getByTestId("best-arbitrage-opportunity")).toContainText(/Possible gross difference|Posible diferencia bruta/);
  await expect(page.getByTestId("arbitrage-matrix")).toBeVisible();
  await expect(page.getByTestId("arbitrage-calculator")).toContainText(/Route calculator|Calculadora de ruta/);
  await expect(page.getByTestId("arbitrage-source-status")).toContainText("Fiwind");
  await expect(page.getByTestId("arbitrage-source-status")).toContainText(/Provider unavailable|Proveedor no disponible/);
  if (process.env.ARBITRAGE_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.ARBITRAGE_SCREENSHOT_PATH, fullPage: true });
  }

  const calculator = page.getByTestId("arbitrage-calculator");
  await calculator.getByLabel(/Amount in USD|Monto en USD/).fill("2000");
  await expect(calculator).toContainText(/20[,.]000/);

  await page.getByLabel(/Fresh quotes only|Sólo cotizaciones frescas/).check();
  await expect(page.getByTestId("arbitrage-buy-ranking")).not.toContainText("Satoshi Tango");
  await expect(page.getByTestId("arbitrage-sell-ranking")).not.toContainText("Satoshi Tango");
  expect(consoleErrors).toEqual([]);
});

test("shows the mandatory negative case as no profitable arbitrage", async ({ page }) => {
  await mockQuotes(page, response({ negative: true }));
  await page.goto("/radar-arbitraje");
  await expect(page.getByTestId("best-arbitrage-opportunity")).toContainText(/No verified opportunities|Sin oportunidades verificadas/);
  await expect(page.getByTestId("best-arbitrage-opportunity")).toContainText(/-.*17[,.]08/);
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
