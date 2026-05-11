# Public Demo Readiness

## What Currently Works

- Home dashboard with market overview, universal search, featured assets and AI-style interpretation placeholders.
- Markets page as the main instrument universe entry point.
- Advanced screener with grouped universe, filters and coverage labels.
- Asset pages for supported MVP symbols.
- Preliminary profiles for future-coverage symbols in the instrument universe.
- Dark/light appearance preference with dark as the default demo mode.
- Integrated market signal gauge with non-advisory defensive/neutral/constructive terminology.
- Hydration-safe universal search with local recent-search history.
- Interactive charts with provider/fallback market data.
- Technical analysis calculated from OHLCV candles.
- Fundamentals layer for selected USA stocks and ETFs with fallback behavior.
- Fixed income analytics for Argentine mock bond instruments and species.
- Bilingual English/Spanish UI.

## Real or Provider Data

- USA/ETF market data attempts: `AAPL`, `SPY`, `QQQ`.
- Crypto market data attempts: `BTC-USD`, `ETH-USD`.
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

## Warnings

- This is not investment advice.
- Argentina data is still simulated.
- CEDEARs are still a future/mock foundation.
- Public demo viewers should treat all analytics as product workflow examples unless explicitly marked as provider data.

## Deployment Notes

- See `docs/vercel-deployment.md` for the Vercel checklist.
- No secrets are required for the current public demo.
- Final brand assets and favicon can be refined later.
- The public demo is currently configured as noindex/nofollow until the project is production-ready.
