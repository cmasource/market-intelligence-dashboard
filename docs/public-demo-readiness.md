# Public Demo Readiness

## What Currently Works

- Home dashboard with market overview, universal search, featured assets and AI-style interpretation placeholders.
- Markets page as the main instrument universe entry point.
- Advanced screener with grouped universe, filters and coverage labels.
- Asset pages for supported MVP symbols.
- Preliminary profiles for future-coverage symbols in the instrument universe.
- Data audit matrix for real/provider/mock/future coverage by instrument and analytical layer.
- Methodology page for technical, market signal, fundamentals and fixed income explanations.
- Financial glossary page and metric tooltips for technical, fundamentals and fixed income labels.
- Centralized currency display for USD and ARS, with bond species context shown separately for MEP, cable/CCL and CER.
- Dark/light appearance preference with dark as the default demo mode.
- Integrated market signal gauge with non-advisory defensive/neutral/constructive terminology.
- Hydration-safe universal search with local recent-search history.
- Interactive charts with provider/fallback market data.
- Featured dashboard cards and visible dashboard search results hydrate provider-supported USA/crypto quotes after mount.
- Technical analysis calculated from OHLCV candles.
- Fundamentals layer for selected USA stocks and ETFs with fallback behavior.
- Fixed income analytics for Argentine mock bond instruments and species.
- CEDEAR analytics with provider/fallback underlying context, mock local ARS price, mock ratio and implied CCL.
- Provider status and fallback-safe real-data architecture for market data, fundamentals and news.
- Bilingual English/Spanish UI.

## Real or Provider Data

- USA/ETF market data attempts: `AAPL`, `SPY`, `QQQ`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL`, `KO`.
- Crypto market data attempts: `BTC-USD`, `ETH-USD`, `BNB-USD`, `SOL-USD`, `XRP-USD`, `ADA-USD`, `DOGE-USD`, `AVAX-USD`, `LINK-USD`, `DOT-USD`.
- Fundamentals provider attempts: `AAPL`, `SPY`, `QQQ`.

## Mock or Fallback Data

- Argentine equities in the MVP.
- Argentine fixed income analytics.
- Fallback OHLCV candles when a provider is unavailable.
- AI-style summaries and report placeholders.

## Future Coverage

- Full BYMA, IOL or CNV integrations.
- CEDEAR local prices, ratios, dollar species and implied CCL.
- News feeds.
- AI agents and PDF reports.
- Watchlists, alerts, portfolios and accounts.

## Suggested Demo Flow

1. Home.
2. Markets.
3. Screener.
4. AAPL page.
5. AL30 page.
6. Argentina page.
7. Crypto page.
8. Status page.
9. Data audit and methodology pages.

## Warnings

- This is not investment advice.
- Argentina data is still simulated. For bonds, visible local mock prices can differ from normalized analytical prices used for metrics.
- CEDEARs are still a future/mock foundation.
- CEDEAR local prices and ratios are simulated; implied CCL is informational.
- Provider keys are optional; missing keys should show fallback or mock labels rather than breaking the demo.
- FMP can be configured while a specific endpoint is plan-restricted; in that case Yahoo-compatible data is a valid provider fallback and should not be presented as mock.
- Some dashboard values render server-side seed values first and then update from the provider quote chain on the client.
- Public demo viewers should treat all analytics as product workflow examples unless explicitly marked as provider data.

## Deployment Notes

- See `docs/vercel-deployment.md` for the Vercel checklist.
- No secrets are required for the current public demo.
- Final brand assets and favicon can be refined later.
- The public demo is currently configured as noindex/nofollow until the project is production-ready.
