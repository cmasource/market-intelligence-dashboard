# Data sources

CMA Market Intelligence uses a provider chain and fallback-safe demo data strategy.

## Current source layers

- Public/provider attempts for supported USA stocks, ETFs and crypto instruments.
- Yahoo-compatible fallback where applicable.
- Structured mock/fallback OHLCV data for offline-safe charts, rankings and tests.
- Current caucion rates from the public invertirOnline market table, with a PPI public-page fallback when it belongs to the current trading session.
- CNV issuer/document placeholders for context only, not live market prices.
- Fixed income mock analytics for sovereign bonds and species.

## Sprint 25 rankings

The rankings module uses a liquid subset of the internal universe and recalculates scores with the shared provider-backed technical and fundamental services. Results refresh every two minutes, exclude unavailable instruments, do not expose API keys and do not require authentication or a database.

## External references

Market platforms such as Finviz can inform product concepts like heatmaps, screeners and ranking workflows. They are not used as data sources in this app unless a legitimate licensed integration is configured in a future sprint.

## Cauciones

The cauciones panel accepts only quotes whose last operation belongs to the current Argentine trading session. This prevents a valid but stale broker page from carrying yesterday's rate into the next wheel. The primary public table is refreshed during the session; authorized PPI REST credentials can be added later as a higher-priority source without changing the UI contract.

## Out of scope

- Live BYMA, CNV or broker APIs beyond the cauciones-specific public quote adapter.
- Unauthorized access to broker endpoints.
- Authentication.
- Database persistence.
- Direct investment recommendation language.
