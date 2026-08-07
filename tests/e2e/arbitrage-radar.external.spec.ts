import { expect, test } from "@playwright/test";

test.skip(process.env.EXTERNAL_SMOKE !== "1", "External smoke is opt-in and never gates the deterministic suite.");

test("renders the Radar with live public sources", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 1000 });
  const apiResponse = page.waitForResponse((response) => response.url().includes("/api/arbitrage/quotes") && response.ok());
  await page.goto("/radar-arbitraje", { waitUntil: "domcontentloaded" });
  await apiResponse;

  const quoteCards = page.getByTestId("arbitrage-quote-cards");
  await expect(page.getByRole("heading", { name: /Radar de Arbitraje|Arbitrage Radar/ })).toBeVisible();
  await expect(quoteCards).toContainText(/Comprás USD a|You buy USD at/);
  await expect(quoteCards).toContainText(/Vendés USD a|You sell USD at/);
  await expect(quoteCards).toContainText("Fiwind");
  await expect(quoteCards).toContainText(/USD → USDT → ARS/);
  await expect(quoteCards).toContainText(/Frescura no verificable|Unverifiable freshness/);
  await expect(page.getByTestId("arbitrage-source-status")).toContainText("Banco Hipotecario");

  const spanishButton = page.getByRole("button", { name: "ES", exact: true });
  if (await spanishButton.isVisible()) await spanishButton.click();
  await expect(page.getByRole("heading", { name: "Radar de Arbitraje" })).toBeVisible();

  await page.getByRole("button", { name: /Light|Claro/, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  if (process.env.ARBITRAGE_SCREENSHOT_PATH) {
    const lightPath = process.env.ARBITRAGE_SCREENSHOT_PATH.replace(/\.png$/i, "-light.png");
    await page.screenshot({ path: lightPath, fullPage: true });
  }

  await page.getByRole("button", { name: /Dark|Oscuro/, exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  if (process.env.ARBITRAGE_SCREENSHOT_PATH) {
    await page.screenshot({ path: process.env.ARBITRAGE_SCREENSHOT_PATH, fullPage: true });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.locator("body *").evaluateAll((elements) => elements
    .filter((element) => !element.closest(".cma-market-tape-track"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return { tag: element.tagName, className: element.className, text: element.textContent?.trim().slice(0, 80), left: rect.left, right: rect.right };
    })
    .filter((item) => item.right > document.documentElement.clientWidth + 1)
    .slice(0, 12));
  expect(overflow, JSON.stringify(overflow, null, 2)).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
