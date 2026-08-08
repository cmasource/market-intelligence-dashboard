import { expect, test } from "@playwright/test";

test.describe("multiple local watchlists", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("cma-watchlists-e2e-ready") === "1") return;
      window.localStorage.clear();
      window.sessionStorage.setItem("cma-watchlists-e2e-ready", "1");
    });
  });

  test("creates, renames and preserves multiple lists", async ({ page }) => {
    await page.goto("/watchlist");
    await expect(page.getByRole("heading", { name: /Mis listas|My watchlists/ })).toBeVisible();
    await page.getByLabel("Nueva lista").fill("  Tecnología  ");
    await page.getByRole("button", { name: "Crear lista" }).click();
    await expect(page.getByText("Tecnología", { exact: true }).first()).toBeVisible();

    await page.getByRole("button", { name: "Renombrar" }).click();
    await page.getByLabel("Nuevo nombre de la lista").fill("Oportunidades");
    await page.getByRole("button", { name: "Guardar" }).click();
    await expect(page.getByRole("heading", { name: "Oportunidades" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Oportunidades" })).toBeVisible();
  });

  test("adds an instrument from the shared Trade Radar catalog", async ({ page }) => {
    await page.goto("/watchlist");
    const addButton = page.getByRole("button", { name: "Agregar activo" }).first();
    await addButton.click();
    const dialog = page.getByRole("dialog", { name: "Agregar activo" });
    await dialog.getByLabel("Ticker o nombre").fill("Microsoft");
    await dialog.getByRole("button", { name: /MSFT.*Microsoft/i }).first().click();
    await expect(dialog.getByRole("status")).toContainText("MSFT fue agregado");
    await dialog.getByRole("button", { name: "Cerrar" }).click();
    await expect(addButton).toBeFocused();
    await expect(page.getByTestId("watchlist-asset-row").filter({ hasText: "MSFT" })).toBeVisible();
    await addButton.click();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(addButton).toBeFocused();
  });

  test("explains and pre-fills each configurable alert threshold", async ({ page }) => {
    await page.goto("/watchlist");
    await page.getByRole("button", { name: "Agregar activo" }).first().click();
    const addDialog = page.getByRole("dialog", { name: "Agregar activo" });
    await addDialog.getByLabel("Ticker o nombre").fill("MSFT");
    await addDialog.getByRole("button", { name: /MSFT.*Microsoft/i }).first().click();
    await addDialog.getByRole("button", { name: "Cerrar" }).click();

    await page.getByRole("button", { name: "Crear alerta" }).click();
    const alertDialog = page.getByRole("dialog", { name: /Crear alerta|Create alert/ });
    const condition = alertDialog.getByLabel(/¿Qué querés monitorear\?|What do you want to monitor\?/);
    await condition.selectOption("near_ema200");
    await expect(alertDialog.getByLabel(/Distancia máxima a la EMA 200|Maximum distance to EMA 200/)).toHaveValue("1");
    await expect(alertDialog.getByText(/entre 495 y 505|between 495 and 505/)).toBeVisible();
    await expect(alertDialog.getByText(/19:00.*Argentina/)).toBeVisible();

    await condition.selectOption("rapid_rise");
    await expect(alertDialog.getByLabel(/Suba diaria mínima|Minimum daily rise/)).toHaveValue("5");
    await expect(alertDialog.getByText(/sube 5% o más|rises 5% or more/)).toBeVisible();

    await condition.selectOption("price_above");
    await expect(alertDialog.getByLabel(/Precio objetivo \(USD\)|Target price \(USD\)/)).toHaveValue("");
    await expect(alertDialog.getByRole("button", { name: /Crear alerta|Create alert/ })).toBeDisabled();
  });

  test("watchlists remain usable without horizontal overflow on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/watchlist");
    await expect(page.locator("main")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBeTruthy();
    await expect(page.getByLabel("Seleccionar lista")).toBeVisible();
  });
});
