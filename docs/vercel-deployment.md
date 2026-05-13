# Vercel Deployment

## Pre-Deploy Checklist

Run these commands before deploying:

```bash
npm run lint
npm run validate:finance
npm run build
npm run test:e2e
```

## Local Port Note

Local development may run on `3001` when `3000` is already busy. The app itself does not depend on a fixed local port.

## Deployment Option A: GitHub + Vercel Dashboard

This is the recommended public demo workflow.

### Git

```bash
git status
git add .
git commit -m "Prepare CMA Market Intelligence public demo"
git push
```

### Vercel

1. Import the GitHub repository into Vercel.
2. Framework preset: Next.js.
3. Install command: `npm install`.
4. Build command: `npm run build`.
5. Output directory: Next.js default.
6. Environment variables: none required for fallback demo mode. Optional provider keys can be added later.
7. Deploy Preview.
8. Review the generated URL.
9. Promote to Production only after manual review.

## Deployment Option B: Vercel CLI or VS Code Extension

If the project was already connected from VS Code or Vercel CLI, verify whether a local `.vercel` folder exists. This folder is local deployment metadata and should not contain committed secrets.

Useful commands:

```bash
vercel link
vercel
vercel --prod
```

Use `vercel --prod` only when the public demo is ready for production traffic.

CLI deployment can work without Git, but GitHub integration is better for ongoing previews, collaboration and review history.

## Vercel Assumptions

- Next.js App Router application.
- No required secrets for fallback demo mode.
- No database yet.
- No paid APIs yet.
- Public demo mode uses mixed provider, mock, fallback and future coverage.
- API routes are serverless-compatible and provider failures fall back safely.

## Environment Variables

No environment variables are required for fallback demo mode.

Optional real-data providers:

- `FMP_API_KEY`
- `FINNHUB_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `NEWS_PROVIDER`
- `MARKET_DATA_PROVIDER`

Add variables in Vercel Project Settings > Environment Variables and redeploy after changing them. Do not expose provider secrets with `NEXT_PUBLIC_`. Use `.env.example` as the placeholder template and do not commit real secrets.

After redeploying, verify:

- `/api/providers/status` shows the configured provider as enabled.
- `/api/market-data/quote/AAPL` returns the actual quote source used by the asset header.
- `/asset/AAPL` shows a provider source label when provider quote data is valid, while the CEDEAR panel keeps local CEDEAR data labeled as mock.

See `docs/provider-verification.md` for the detailed troubleshooting checklist.

## Post-Deploy Checklist

1. Open home.
2. Open `/markets`.
3. Open `/screener`.
4. Open `/asset/AAPL`.
5. Open `/asset/AL30`.
6. Open `/argentina`.
7. Open `/crypto`.
8. Open `/status`.
9. Open `/data-audit`.
10. Open `/methodology`.
11. Test theme toggle.
12. Test language toggle.
13. Test search.
14. Confirm footer disclaimer.
15. Confirm no 404 on planned demo routes.
16. Confirm no legacy or forbidden branding appears.

## Demo Caveats

- Argentina data is still mock or future coverage.
- CEDEAR local prices and ratios are modeled but not fully real yet.
- This public demo is noindex/nofollow for now.
- The platform is informational and not investment advice.

## Future Production Requirements

- Real provider keys.
- Database/cache.
- Error monitoring.
- Analytics.
- Privacy/cookie policy if search history or tracking expands.
- Terms and conditions.
- More robust data licensing review.
