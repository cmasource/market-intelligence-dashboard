# Data sources

CMA Market Intelligence uses a provider chain and fallback-safe demo data strategy.

## Current source layers

- Public/provider attempts for supported USA stocks, ETFs and crypto instruments.
- Yahoo-compatible fallback where applicable.
- Structured mock/fallback OHLCV data for offline-safe charts, rankings and tests.
- Manual or structured local data for Argentina demo coverage.
- CNV issuer/document placeholders for context only, not live market prices.
- Fixed income mock analytics for sovereign bonds and species.

## Sprint 25 rankings

The rankings module uses the existing internal universe, available scores, fallback OHLCV history and coverage metadata. It does not expose API keys and does not require authentication or a database.

## External references

Market platforms such as Finviz can inform product concepts like heatmaps, screeners and ranking workflows. They are not used as data sources in this app unless a legitimate licensed integration is configured in a future sprint.

## Out of scope

- Live BYMA, IOL, CNV, PPI or broker APIs.
- Scraping market websites.
- Authentication.
- Database persistence.
- Direct investment recommendation language.
