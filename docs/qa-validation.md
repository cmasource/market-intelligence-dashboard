# QA Validation

## Purpose

Sprint 4.1 adds automated Playwright smoke tests for CMA Market Intelligence. The tests verify that the main dashboard, navigation, asset routes, chart module, language switcher, search workflow and reports placeholder work in a browser.

## Routes Tested

- `/`
- `/asset/AAPL`
- `/asset/GGAL`
- `/asset/BTC-USD`
- `/asset/AL30`

## Branding Checks

- Confirms `CMA Market Intelligence` appears on the dashboard.
- Confirms `CMA Consulting` appears on the dashboard.
- Confirms `cma_source` appears in lowercase.
- Confirms no legacy brand text appears in tested pages.

## Language Switcher Checks

- Switches from English to Spanish.
- Confirms the Spanish dashboard title appears.
- Switches back to English.
- Confirms the English dashboard title appears.

## Chart Smoke Checks

- Confirms the interactive chart area appears on asset routes.
- Confirms the chart source status appears for real-data or fallback scenarios.
- Confirms timeframe buttons exist.
- Clicks `1M` and `1Y`.
- Confirms the chart container remains visible after timeframe changes.

## Search Checks

- Searches for `AAPL` from the home dashboard.
- Confirms the `AAPL` result appears.
- Opens the `AAPL` asset route.
- Confirms the asset page and chart smoke label load.

## How To Run

```bash
npm run test:e2e
```

```bash
npm run test:e2e:ui
```

If Playwright browsers are missing locally, run:

```bash
npx playwright install chromium
```

## Current Limitations

- These are smoke tests, not full financial correctness tests.
- Visual regression screenshots are not yet implemented.
- Real API integration is not yet tested.
- The tests use the local mock-data MVP and do not validate external market data.
