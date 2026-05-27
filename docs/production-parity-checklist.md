# Production Parity Checklist

This checklist helps compare localhost and Vercel behavior for CMA Market Intelligence without exposing secrets.

## Deployment checks

1. Confirm the latest git commit is pushed.
2. Confirm the Vercel deployment points to the expected commit or deployment hash.
3. Confirm environment variables are configured in the Vercel project.
4. Redeploy after any environment variable change.
5. Hard refresh the browser or open an incognito session after deployment.

## Compare safe diagnostics

Check these endpoints locally and in production:

- `/api/diagnostics/runtime`
- `/api/news/AAPL`
- `/api/analysis/fundamentals/AAPL?debug=1`

The runtime diagnostics endpoint reports provider configuration, fallback availability and sanitization layer status. It never returns API keys.

## Fundamentals parity

If AAPL or another provider-supported equity shows mostly `N/D` in production but not locally:

- compare `provider`, `sourceLabel`, `missingFields` and `coverageRatio`;
- check whether FMP/Finnhub/Alpha Vantage keys are enabled in Vercel;
- check whether the provider plan restricts the endpoint;
- confirm Yahoo-compatible and mock fallbacks remain enabled.

## News parity

If news previews show raw entities such as `&nbsp;` in production:

- compare `/api/news/AAPL` locally and in production;
- confirm the production deployment includes `lib/news/sanitize-news.ts`;
- redeploy if the API response still returns raw HTML entities.

## Limits

Manual Argentina data is not real time. BYMA, IOL, PPI and CNV integrations remain future provider paths. Do not scrape unauthorized broker pages.
