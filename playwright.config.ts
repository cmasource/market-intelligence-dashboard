import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3001);

export default defineConfig({
  testDir: "./tests/e2e",
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 8_000,
  },
  fullyParallel: false,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${port}`,
    locale: "en-US",
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- -p ${port}`,
    env: { NODE_OPTIONS: "--use-system-ca" },
    url: `http://localhost:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
