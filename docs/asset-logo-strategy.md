# Asset logo strategy

Sprint 26 uses a hybrid asset logo strategy.

## Priority

1. Local curated metadata in `lib/assets/logo-domains.ts`.
2. Optional Logo.dev CDN when `NEXT_PUBLIC_ASSET_LOGO_PROVIDER=logo-dev` and `NEXT_PUBLIC_LOGO_DEV_TOKEN` are configured.
3. Premium category-colored monogram fallback.

The fallback is always rendered first, so there is no layout shift and no broken-image state.

## Curated domains

The first curated universe includes major USA stocks, ETFs and crypto fallbacks:

- AAPL, TSLA, MSFT, AMZN, GOOGL, META, NVDA, KO, PEP, MCD, WMT, COST
- JPM, BAC, V, MA, XOM, CVX, MELI, NFLX, AMD, INTC
- SPY, QQQ, DIA, IWM, GLD, SLV
- BTC, ETH, SOL and other crypto symbols through local crypto IDs

## Logo.dev

Logo.dev is optional and must use a public/publishable token only.

Required env vars:

```bash
NEXT_PUBLIC_ASSET_LOGO_PROVIDER=logo-dev
NEXT_PUBLIC_LOGO_DEV_TOKEN=
```

If the token is missing, the app uses the local fallback. Builds and tests do not require the token.

## No scraping

The app does not scrape TradingView, Investing, Finviz, Google Images, broker websites or market portals for logos.
