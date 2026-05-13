# News Module

The news module provides a small market-news MVP for CMA Market Intelligence.

## Sources

- FMP news when `FMP_API_KEY` is configured.
- Finnhub company news when `FINNHUB_API_KEY` is configured.
- Alpha Vantage news sentiment when `ALPHA_VANTAGE_API_KEY` is configured.
- Google News RSS fallback when provider keys are not available.
- Mock news if all external sources fail.

The UI shows title, source, provider/fallback badge, date, link and a short available summary. It does not reproduce full articles.

## Limitations

News quality depends on provider availability and key limits. RSS and mock news are fallback layers, not licensed market news feeds.
