# Deployment parity checklist

Local and Vercel can differ when environment variables are not configured in the deployed project.

## Runtime diagnostics

Use:

- `/status`
- `/api/diagnostics/runtime`
- `/api/providers/status`

Diagnostics expose booleans only for key presence. Secret values are never returned.

## Vercel variables

Configure these in Production, Preview and Development as needed:

```bash
FMP_API_KEY=
FINNHUB_API_KEY=
ALPHA_VANTAGE_API_KEY=
MARKET_DATA_PROVIDER=fmp
NEWS_PROVIDER=fmp
NEXT_PUBLIC_ASSET_LOGO_PROVIDER=logo-dev
NEXT_PUBLIC_LOGO_DEV_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

`NEXT_PUBLIC_LOGO_DEV_TOKEN` must be public/publishable. Provider keys such as FMP, Finnhub and Alpha Vantage remain server-side only.

## Expected differences

If Vercel is missing provider variables, production may use:

- Yahoo-compatible fallback
- mock/fallback market data
- manual Argentina data
- simulated CEDEAR/local context
- fallback logos

After changing Vercel env vars, redeploy before comparing behavior.
