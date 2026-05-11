# CMA Market Intelligence

CMA Market Intelligence is a public-demo MVP financial intelligence dashboard created under CMA Consulting and developed by cma_source.

It combines market universe exploration, asset detail pages, interactive charts, technical analysis, fundamentals, fixed income analytics, a screener, bilingual UI and transparent data coverage labels.

## Branding

- Product: CMA Market Intelligence
- Company: CMA Consulting
- Technology division: cma_source

## Current Status

Public demo / MVP.

The app is transparent about mixed coverage: selected USA and crypto instruments can attempt public/provider data, while Argentina instruments, CEDEARs and several future-universe entries use mock, fallback or future coverage labels.

## Features

- Dashboard overview
- Markets universe page
- Advanced instrument screener
- Asset detail pages
- Real/provider USA and crypto market data with fallback
- Technical analysis from OHLCV candles
- Integrated market signal gauge
- USA fundamentals provider layer with fallback
- Fixed income analytics using mock structured bond data
- Argentina bond species: AL30, AL30D, AL30C, GD30, GD30D, GD30C and TX26
- CEDEAR foundation
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
npm run build
npm run test:e2e
```

## Vercel Deployment

Recommended workflow:

1. Push the project to GitHub.
2. Import the repository in the Vercel Dashboard.
3. Use the Next.js preset.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Environment variables: none required for the current demo.
7. Review the preview deployment before promoting to production.

Alternative workflow:

- Vercel CLI or the VS Code extension can also deploy the app.
- GitHub + Vercel Dashboard is preferred for ongoing previews, review and collaboration.

See `docs/vercel-deployment.md` for the full deployment checklist.

## Disclaimer

This platform provides informational analysis only and does not constitute personalized financial advice or an investment recommendation.

Some data comes from public providers, while other data is simulated or marked as future coverage.
