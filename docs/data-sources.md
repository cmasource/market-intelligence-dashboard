# Data sources

CMA Market Intelligence uses a provider chain and fallback-safe demo data strategy.

## Current source layers

- Public/provider attempts for supported USA stocks, ETFs and crypto instruments.
- Yahoo-compatible fallback where applicable.
- Structured mock/fallback OHLCV data for offline-safe charts, rankings and tests.
- Current caucion rates from the public invertirOnline market table, with a PPI public-page fallback when it belongs to the current trading session.
- CNV issuer/document placeholders for context only, not live market prices.
- Fixed income mock analytics for sovereign bonds and species.

## Argentina reference hierarchy

The public UI uses one canonical selection policy instead of letting each component choose an unrelated dollar value:

| Domain | Primary | Fallback | Presentation rule |
|---|---|---|---|
| Official, blue, wholesale, card, MEP and CCL dollar references | CriptoYa `/api/dolar` | DolarAPI `/v1/dolares` by the same canonical category | Candidates are compared by freshness bucket before source preference and rejected after 96 hours. DolarAPI fills missing or older categories; sources are preserved per value. |
| Aggregate crypto dollar reference | DolarAPI `cripto` | CriptoYa `cripto.ccb` | This is an informational ARS reference. It is not substituted for global crypto spot prices or exchange-specific executable quotes. |
| CER and UVA | Official BCRA monetary series 30 and 31 | CriptoYa `/api/cer` and `/api/uva` | BCRA remains authoritative. CriptoYa is fetched for reconciliation and is displayed only as an explicit fallback if the official series fails. |
| Exchange-specific USDT/USDC quotes | CriptoYa general endpoints with an explicit volume | No synthetic fallback | Used by the Arbitrage Radar as `reference_only`; assets, volume, costs and route capabilities remain separate. |
| Bank boards | Direct public provider source when verified | None | CriptoYa `/api/bancostodos` is monitored but not imported wholesale because its real payload mixes current and historical rows. |

The global market ticker consumes the canonical dollar selection, so the header and the dashboard market pulse receive the same IDs and values. The Argentina macro monitor exposes CER and UVA with the source attached to each metric. Individual asset pages continue using their own instrument-grade market providers; an aggregate FX reference never replaces OHLCV or a tradable quote.

### Real-source reconciliation, 5 August 2026

- CriptoYa and DolarAPI agreed on the observed official and blue sell references.
- MEP and CCL can differ because CriptoYa identifies the AL30 24-hour settlement calculation while DolarAPI publishes a category-level value. They remain one canonical display value with visible provenance, not averaged together.
- CriptoYa CER `817.91` and UVA `2064.25` matched the latest BCRA values after the aggregator's two-decimal rounding.
- The CriptoYa bank payload returned current BNA data but historical timestamps for several rows including Santander, Galicia, Macro, Brubank and BBVA. Those rows are excluded rather than presented as current.

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
