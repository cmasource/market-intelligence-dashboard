# Sprint 26: Brand, deployment parity and logos

## Brand polish

- Header uses a theme-aware white capsule around the CMA mark to keep contrast in dark and light modes.
- Product name remains `CMA Market Intelligence`.
- Footer keeps concise institutional attribution: CMA Consulting and cma_source.

## Favicon strategy

The app now uses the working institutional `icon-192.png` reference from `cma-consulting-web` and regenerates:

- `app/icon.png`
- `app/apple-icon.png`
- `app/favicon.ico`
- `public/icon.png`
- `public/apple-icon.png`
- `public/favicon.ico`

All generated icons use a navy background, centered mark and internal padding.

## Asset logos

Asset logos use curated domains plus optional Logo.dev. Fallback monograms remain first-class and never show as broken images.

## Deployment parity

Runtime diagnostics now report:

- NODE_ENV
- Vercel environment
- configured market/news/fundamentals provider
- active provider
- FMP key present as yes/no
- Logo.dev token present as yes/no
- fallback providers enabled

No secret values are exposed.

## No scraping

No TradingView, Investing, Finviz, Google Images or broker site scraping was added.
