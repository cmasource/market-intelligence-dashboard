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
- Asset Intelligence Reports on asset pages and shareable `/report/[symbol]` routes for demos.
- The shareable report route is now a cleaner executive summary, while `/asset/[symbol]` remains the full working analysis page.
- Report mode includes a compact price/signal/confidence/source strip and shorter key points for public sharing.
- Technical analysis calculated from OHLCV candles.
- Fundamentals layer for selected USA stocks and ETFs with fallback behavior.
- Fixed income analytics for Argentine mock bond instruments and species.
- CEDEAR analytics with provider/fallback underlying context, mock local ARS price, mock ratio and implied CCL.
- Provider status and fallback-safe real-data architecture for market data, fundamentals and news.
- Bilingual English/Spanish UI.
- Spanish Asset Intelligence copy now localizes interpretive summaries, provider wording and CEDEAR context while keeping standard financial acronyms.
- Spanish report mode now avoids mixed CTA labels and localizes the report intro, executive reading, technical/fundamental synthesis, risks and data coverage sections.
- Report news cards note that headlines may remain in the original source language.
- Argentina data layer now supports validated manual quote loads, structured mock fallback and future BYMA/CNV/broker status labels.

## Real or Provider Data

- USA/ETF market data attempts: `AAPL`, `SPY`, `QQQ`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL`, `KO`.
- Crypto market data attempts: `BTC-USD`, `ETH-USD`, `BNB-USD`, `SOL-USD`, `XRP-USD`, `ADA-USD`, `DOGE-USD`, `AVAX-USD`, `LINK-USD`, `DOT-USD`.
- Fundamentals provider attempts: `AAPL`, `SPY`, `QQQ`.

## Mock or Fallback Data

- Argentine equities in the MVP.
- Argentine fixed income analytics.
- Fallback OHLCV candles when a provider is unavailable.
- AI-style summaries and report placeholders.
- Executive report readings can include fallback or mock sections when provider or local-market data is unavailable.

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
5. `/report/AAPL`.
6. AL30 page and `/report/AL30`.
7. Argentina page.
8. Crypto page and `/report/BTC-USD`.
9. Status page.
10. Data audit and methodology pages.

## Warnings

- This is not investment advice.
- Argentina data is still simulated. For bonds, visible local mock prices can differ from normalized analytical prices used for metrics.
- CEDEARs are still a future/mock foundation.
- CEDEAR local prices and ratios are simulated; implied CCL is informational.
- CEDEAR report context explains how to read the underlying asset, local CEDEAR price and simulated implied CCL separately.
- Manual Argentina data is not real-time and must be validated before deploy.
- Provider keys are optional; missing keys should show fallback or mock labels rather than breaking the demo.
- FMP can be configured while a specific endpoint is plan-restricted; in that case Yahoo-compatible data is a valid provider fallback and should not be presented as mock.
- Some dashboard values render server-side seed values first and then update from the provider quote chain on the client.
- Public demo viewers should treat all analytics as product workflow examples unless explicitly marked as provider data.
- Interpretive summaries are educational context only. They explain indicators in plain language and do not provide direct recommendations.
- The reorganized executive reading is designed for clarity in public demos: broad conclusion first, then technical, fundamental and news synthesis, followed by risks and limitations.
- Sprint 20.1 adds additional public-demo polish: partial fundamentals are labeled clearly, news previews are sanitized, and report cards use more breathing room without changing the non-advisory scope.

## Deployment Notes

- See `docs/vercel-deployment.md` for the Vercel checklist.
- No secrets are required for the current public demo.
- Final brand assets and favicon can be refined later.
- The public demo is currently configured as noindex/nofollow until the project is production-ready.
