# CMA Market Intelligence

CMA Market Intelligence is a public-demo MVP financial intelligence dashboard created under CMA Consulting and developed by cma_source.

It combines market universe exploration, asset detail pages, interactive charts, technical analysis, fundamentals, fixed income analytics, a screener, bilingual UI and transparent data coverage labels.

## Analysis Coverage

Sprint 28 adds structured analysis coverage for the curated instrument universe. The app distinguishes technical, fundamental, fixed income and chart availability per symbol so unsupported analysis is labeled as not applicable or unavailable instead of being implied.

Useful endpoints:

- `/api/analysis/coverage`
- `/api/analysis/coverage/AAPL`
- `/api/analysis/batch?symbols=AAPL,MSFT,GGAL,BTC-USD`
- `/api/analysis/universe?type=crypto`

## Branding

- Product: CMA Market Intelligence
- Company: CMA Consulting
- Technology division: cma_source

## Current Status

Public demo / MVP.

The app is transparent about mixed coverage: selected USA and crypto instruments can attempt public/provider data, while Argentina instruments, CEDEARs and several future-universe entries use mock, fallback or future coverage labels.

## Features

- Sprint 21 visual identity: CMA Institutional Fintech Terminal design system with premium dark fintech panels, market-grid background, sticky glass header and differentiated card families.
- Sprint 22 asset page IA: compact executive strip, distinct market signal, technical factor panel, secondary coverage disclosure and first market heatmap.
- Browser-local multiple watchlists with legacy migration, Instrument Master search and no account or portfolio semantics.
- Supabase Auth foundation for email/password, email confirmation, recovery, Google OAuth (PKCE), secure cookie sessions and a private account page. Provider configuration is required before live use.
- Account-scoped intelligent alerts with explicit local-watchlist import consent, deterministic versioned rules, persisted in-app delivery, unread history, preferences, RLS and a protected Vercel Cron evaluator. Supabase migrations and server-only scheduler variables are required before live use.
- Sprint 25 rankings and brand polish: refined CMA lockup/favicon/footer plus technical, fundamental, combined and performance rankings.
- Sprint 26 brand/deployment polish: theme-aware logo contrast, padded favicons, hybrid asset logos and local/production parity diagnostics.
- Dashboard overview
- Markets universe page
- Advanced instrument screener
- Browser-local multiple watchlists with no database or account synchronization
- Asset detail pages
- Real/provider USA and crypto market data with fallback
- Argentina data layer with validated manual quote loads, structured mock fallback and future BYMA/CNV/provider status
- CNV issuer/document layer with structured demo filings and future official integration status
- Server-side provider chain for FMP, Finnhub, Alpha Vantage, Yahoo/RSS and mock fallback
- Provider quote hydration for asset pages, featured dashboard cards and visible dashboard search results
- Technical analysis from OHLCV candles
- Homepage market rankings for technical, fundamental, combined and period performance readings
- Hybrid company/asset logo strategy with optional Logo.dev integration and premium fallback monograms
- Integrated market signal gauge
- USA fundamentals provider layer with fallback
- Data audit and methodology pages for coverage transparency
- Centralized currency display and contextual financial glossary tooltips
- Fixed income analytics using mock structured bond data
- Argentina bond species: AL30, AL30D, AL30C, GD30, GD30D, GD30C and TX26
- Expanded Argentina universe for common local equities, CEDEAR references and additional sovereign bond species.
- CEDEAR analytics with mock local ARS prices, ratio structure, underlying asset context and implied CCL
- Asset Intelligence Reports on asset pages and shareable `/report/[symbol]` demo routes
- English/Spanish language switcher
- Dark/light theme toggle
- Public demo footer and informational disclaimer

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Next.js. Use port `3000` by default, or `3001` if `3000` is already busy:

```bash
npm run dev -- -p 3001
```

## Validation

Run the full pre-demo checklist:

```bash
npm run lint
npm run validate:finance
npm run validate:argentina
npm run build
npm run test:e2e
```

## Design System

- `docs/design-system.md` documents the CMA Institutional Fintech Terminal tokens, utility classes and card families.
- `docs/redesign-sprint-21.md` documents the Sprint 21 redesign direction and confirms external references were used only as inspiration.
- `docs/sprint-22-asset-redesign.md`, `docs/heatmap-module.md` and `docs/ui-decisions.md` document the Sprint 22 asset IA, heatmap and signal/technical distinction.
- `docs/cnv-layer.md` and `docs/sprint-24-cnv-documents.md` document the CNV documents layer and future official integration path.
- `docs/watchlist-local-storage.md`, `docs/instrument-universe.md` and `docs/sprint-24-watchlist-universe-ux.md` document the local watchlist and expanded universe strategy.
- `docs/rankings-module.md` and `docs/sprint-25-rankings-brand-fix.md` document Sprint 25 ranking methodology, brand fixes and source limitations.
- `docs/asset-logo-strategy.md`, `docs/deployment-parity-checklist.md` and `docs/sprint-26-brand-deployment-logos.md` document Sprint 26 logo and deployment-parity decisions.

## Vercel Deployment

Recommended workflow:

1. Push the project to GitHub.
2. Import the repository in the Vercel Dashboard.
3. Use the Next.js preset.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Environment variables: none required for fallback market-data demo mode. Supabase Auth requires `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SITE_URL`; optional provider keys can be added for live market data.
7. Review the preview deployment before promoting to production.

Alternative workflow:

- Vercel CLI or the VS Code extension can also deploy the app.
- GitHub + Vercel Dashboard is preferred for ongoing previews, review and collaboration.

See `docs/vercel-deployment.md` for the full deployment checklist.

See `docs/supabase-auth.md` for Supabase Auth setup, redirect URLs, Google OAuth and verification.

See `docs/intelligent-alerts.md` and `docs/alert-rules-catalog.md` for the alert architecture, rules, scheduler, security model, configuration and verified limitations.

## Disclaimer

This platform provides informational analysis only and does not constitute personalized financial advice or an investment recommendation.

Some data comes from public providers, while other data is simulated or marked as future coverage.

## Sprint 16 Transparency Notes

- Expanded provider/fallback market data attempts now include `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL`, `KO`, `BNB-USD`, `SOL-USD`, `XRP-USD`, `ADA-USD`, `DOGE-USD`, `AVAX-USD`, `LINK-USD` and `DOT-USD`.
- `/data-audit` shows a coverage matrix by instrument and analytical layer.
- `/methodology` explains the technical, market signal, fundamentals and fixed income methodology.
- `/glossary` explains technical, fundamental and fixed income terms used in cards and tooltips.
- Currency display is centralized to avoid visible `ARS/USD`, `USD/ARS` or SAR-typo price labels.
- Manual validation guides live in `docs/manual-technical-validation.md` and `docs/manual-fundamental-validation.md`.

## Sprint 17 CEDEAR Notes

- CEDEAR local prices and ratios are structured mock values until BYMA/IOL or licensed-provider integration is enabled.
- Underlying USA prices can use the existing provider/fallback market-data layer.
- Implied CCL is calculated as `local CEDEAR ARS price * ratio / underlying USD price` using the demo ratio convention.
- The result is informational and not an arbitrage recommendation.

## Sprint 18 Provider Notes

- Optional provider keys: `FMP_API_KEY`, `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`.
- Optional switches: `NEWS_PROVIDER`, `MARKET_DATA_PROVIDER`.
- The demo works without keys via Yahoo-compatible, RSS and mock fallback layers.
- `/api/providers/status` reports enabled/disabled providers without exposing secrets.
- `/api/market-data/quote/AAPL` verifies the visible quote source used by asset headers.
- `/api/market-data/quotes` powers dashboard quote hydration for provider-supported symbols.
- See `docs/provider-verification.md` when provider status is active but a visible UI field still appears to be using fallback data.

## Sprint 20 Argentina Data Layer

- Manual local quotes can be curated in `data/argentina-quotes.manual.json`.
- `data/argentina-quotes.sample.csv` documents the import columns for manual workflows.
- `/api/argentina/quote/[symbol]`, `/api/argentina/quotes`, `/api/argentina/status` and `/api/argentina/instruments` expose normalized Argentina data.
- Manual loads are not real-time. BYMA, CNV, IOL, PPI and licensed providers remain future integration paths.
- Do not scrape unauthorized broker pages or store secrets in data files.
