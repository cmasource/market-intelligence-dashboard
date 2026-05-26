# CMA Market Intelligence Roadmap

## Branding Baseline

- Product: CMA Market Intelligence
- Company: CMA Consulting
- Technology division: cma_source
- cma_source must always remain lowercase.

## Phase 1: UI Mock Dashboard

- Build the responsive fintech dashboard.
- Create reusable UI components.
- Add mock data coverage for global equities, ETFs, Argentina assets, bonds and crypto.
- Add dynamic asset detail pages.
- Include the financial disclaimer.

## Phase 2: Bilingual MVP Foundation

- Add lightweight internal i18n support without external libraries.
- Support English and Spanish.
- Detect browser language.
- Persist manual language selection in `localStorage`.
- Add a small EN / ES language switcher.
- Keep the product, company and technology division names untranslated.

## Phase 3: Financial Calculation Engine

- Add validated utility functions for ratios, indicators and fixed income metrics.
- Separate raw data, derived metrics and presentation formatting.
- Add tests for financial formulas.

## Phase 4: Interactive Mock Chart Module

- Replace the asset chart placeholder with TradingView Lightweight Charts.
- Add mock OHLCV candlestick data by symbol and timeframe.
- Add timeframe switching for `1D`, `5D`, `1M`, `6M`, `YTD`, `1Y` and `5Y`.
- Add volume histogram support inside the chart area.
- Prepare the chart structure for future SMA, EMA, RSI and MACD overlays.
- Keep mock fallback behavior for every instrument until real market data adapters are complete.

## Phase 5: First Real Market Data Integration

- Add provider abstraction under `lib/market-data`.
- Add an internal market-data API route for chart consumers.
- Support Sprint 5 real OHLCV attempts for `AAPL`, `SPY`, `QQQ`, `BTC-USD` and `ETH-USD`.
- Preserve mock fallback behavior for every instrument.
- Keep Argentina assets and bonds mocked until a dedicated local-market integration sprint.
- Keep no-auth, no-database MVP constraints.

## Phase 6: Advanced Charting and Indicators

- Calculate technical analysis from OHLCV candles through the market data layer.
- Add technical analysis API route and card-level fallback behavior.
- Add production-ready technical overlays.
- Add SMA 20, SMA 50, SMA 200 and EMA overlays.
- Add RSI and MACD subpanels.
- Add Bollinger Bands and ATR when data quality is sufficient.

## Phase 7: Fundamentals Data Layer

## Phase 19: Asset Intelligence Reports

- Add a high-value executive report layer for public demos.
- Combine price, technicals, fundamentals, news, risks, CEDEAR context, fixed income context and data coverage.
- Add shareable `/report/[symbol]` routes.
- Keep language non-advisory and avoid direct investment recommendation wording.
- Sprint 19.1 improves Spanish localization and replaces compressed internal phrases with human-readable technical, fundamental and CEDEAR explanations.
- Sprint 19.2 reorganizes the executive reading layout, makes `/report/[symbol]` a cleaner shareable executive summary, keeps `/asset/[symbol]` as the full working profile, and finishes Spanish cleanup for visible report-mode copy and CTA labels.
- Sprint 19.3 adds report mode polish: compact summary strip, shorter key points, reduced repetition, clearer CEDEAR guidance, news source-language note, grouped risk presentation and sharper data-limitations copy.
- Future work: exportable reports, richer provider diagnostics and deeper local Argentina data once licensed integrations are available.

- Add provider abstraction for fundamentals under `lib/fundamentals-data`.
- Support provider fundamentals attempts for `AAPL`, `SPY` and `QQQ`.
- Preserve mock fallback fundamentals for USA and Argentina equity-like assets.
- Return non-applicable fundamentals for crypto and fixed income instruments.
- Keep BYMA, IOL, CNV and Argentine bond fundamentals out of scope until future sprints.

## Phase 8: Fixed Income Analytics

- Add mock structured fixed income instruments for `AL30`, `GD30` and `TX26`.
- Calculate clean price, dirty price, accrued interest, current yield, parity, estimated YTM / TIR, duration and convexity.
- Add fixed income risk profiles and cautious interpretation.
- Add fixed income API routes and a dashboard comparison section.
- Keep BYMA, IOL, CNV and official bond-term integration out of scope until future sprints.

## Phase 9: Argentina Module

- Expand BYMA equity coverage.
- Add CEDEAR support.
- Add sovereign bonds, CER-linked instruments, letras and obligaciones negociables.
- Add CCL, MEP, crypto dollar and local FX references.
- Add an instrument universe model for Argentine bond species, CEDEAR placeholders and future ADR/underlying relationships.
- Show related trading species on asset pages for `AL30`, `AL30D`, `AL30C`, `GD30`, `GD30D` and `GD30C`.
- Add the first instrument screener for mock-supported, real-supported and future-supported instruments.

## Phase 10: Crypto and Arbitrage Intelligence

- Monitor BTC, ETH, stablecoins and ARS crypto pairs.
- Compare crypto dollars, MEP, CCL and selected instruments.
- Add spread, liquidity and execution-risk summaries.
- Prepare a top 50 crypto universe roadmap while keeping unsupported assets mock/future-only.
- Surface crypto roadmap entries in the screener while keeping unsupported assets marked as future coverage.

## Phase 11: AI Agents and Reports

- Add agent workflows for market briefs, screeners, alerts and reporting.
- Generate consultant-ready summaries.
- Add daily market briefings, asset reports, Argentina market reports, crypto and arbitrage reports, and AI-generated PDF reports.
- Add watchlists and saved report structures.
- Prepare governance and compliance review flows.

## Phase 12: Market Universe and Data Provenance

- Make `/markets` the primary market universe page.
- Keep `/screener` as the advanced filter and search tool.
- Add visible data coverage labels for price, technical analysis, fundamentals, fixed income and news.
- Promote CEDEARs as a dedicated future Argentina market module.
- Expand dashboard search into a universal instrument search across supported, mock and future coverage items.

## Phase 13: Public Demo Polish

- Tighten home hero spacing and replace old mock-only language with mixed coverage messaging.
- Add graceful future asset profiles for planned instruments.
- Add recent local search history with `localStorage`.
- Add a first dark/light/system appearance preference foundation.
- Improve Markets and Screener hierarchy for external demo clarity.

## Phase 14: Vercel Demo Readiness

- Make the appearance toggle visibly change the app shell.
- Add a public demo footer and clearer legal/data coverage notes.
- Strengthen module accent colors for Markets, Screener, Argentina, Crypto, Reports and Agents.
- Add Vercel deployment notes and demo caveats.

## Phase 14.1: Theme and Signal Polish

- Simplify the appearance toggle to dark and light modes for the public demo.
- Improve light-mode contrast and readability.
- Add a non-advisory technical signal gauge based on the existing technical score.
- Keep future-only instruments from displaying misleading technical signals.

## Phase 14.2: Hydration and Market Signal Polish

- Make dashboard search hydration-safe by loading recent searches only after client mount.
- Keep the home hero and search layout balanced with compact, scrollable search results.
- Add an integrated market signal model that combines technical and fundamental scores when available.
- Reserve fixed income signal scoring for a future conservative model.

## Phase 15: Public Demo Deployment Readiness

- Add conservative noindex/nofollow metadata, robots and sitemap route conventions.
- Add `.env.example` with future placeholder variables only.
- Update README and Vercel deployment documentation for GitHub + Vercel Dashboard and CLI workflows.
- Add public demo badge, feedback note and final disclaimer checks.

## Phase 16: Analytical Credibility and Data Audit

- Expand provider/fallback market data attempts to additional USA stocks and crypto assets.
- Add `/data-audit` for real/provider/mock/future coverage transparency by instrument and layer.
- Add `/methodology` to explain technical, market signal, fundamentals and fixed income methodology.
- Add manual validation guides for comparing technical and fundamental outputs with external platforms.
- Keep Argentina, CEDEAR and bond real-data integrations future-scoped until BYMA, IOL, CNV or licensed providers are enabled.

## Phase 16.1: Currency and Glossary Polish

- Centralize currency and unit display for USD and ARS while keeping MEP, cable/CCL and CER as separate bond context labels.
- Remove misleading composite currency labels from local Argentine price displays.
- Add glossary tooltips for technical, fundamental and fixed income metrics.
- Add a public `/glossary` page and supporting documentation.
- Add regression coverage for currency labels, glossary page rendering and tooltip visibility.

## Phase 16.2: Argentine Bond Species Convention

- Show AL30 and GD30 peso species with realistic-looking local ARS mock prices.
- Show AL30D, AL30C, GD30D and GD30C with USD quote currency while rendering MEP or cable/CCL as species context.
- Show TX26 with ARS quote currency and CER as indexation context.
- Separate visible `marketDisplayPrice` from normalized `analyticalPrice` for fixed income metrics.
- Keep Argentine bond prices mock/structured until BYMA, IOL or licensed-provider integration is enabled.

## Phase 17: CEDEAR Analytics and Implied CCL

- Add CEDEAR-to-underlying relationships for initial USA stocks and ETFs.
- Add mock local ARS prices and ratio structure for CEDEAR examples.
- Calculate implied CCL from local price, ratio and underlying USD price.
- Show CEDEAR context on supported asset pages without replacing USA stock analysis.
- Keep BYMA/IOL and licensed-provider local integrations future-scoped.

## Phase 18: Real Provider Architecture and News MVP

- Add server-side provider configuration and status API.
- Add FMP, Finnhub and Alpha Vantage adapter scaffolding.
- Preserve Yahoo/RSS/mock fallback when keys are missing or providers fail.
- Add news API and UI with provider/RSS/mock source badges.
- Keep local Argentina and CEDEAR data clearly separated from provider-backed underlying data.

## Phase 20: Argentina Data Layer

- Add normalized Argentina instrument registry and quote types.
- Add validated manual quote loads from committed JSON.
- Add Argentina quote, batch quote, status and instruments APIs.
- Show manual/mock/future Argentina source status in the Argentina page and data audit.
- Document future BYMA, CNV, broker and licensed-provider integration paths.
- Keep broker scraping and unauthorized private endpoints out of scope.

## Future Regional Personalization

- Argentina.
- United States.
- Latin America.
- Global crypto markets.
