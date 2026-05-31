# Market Heatmap Module

The CMA Market Intelligence heatmap is implemented across:

- `components/market/MarketHeatmap.tsx`
- `components/market/HeatmapCell.tsx`
- `components/market/HeatmapControls.tsx`
- `lib/market/heatmap-service.ts`
- `lib/market/heatmap-types.ts`

## Purpose

The heatmap gives a fast relative view of instruments by segment before a user opens a full asset page.

Supported segments:

- USA
- CEDEARs
- Argentina
- Bonos
- Cripto
- ETFs
- Todos

## Controls

The full heatmap supports:

- segment selection;
- sorting by variation, absolute movement, symbol or source;
- a toggle to include simulated/fallback data or show only provider/manual coverage.

## Data Sources

The module uses existing CMA Market Intelligence data paths:

- provider quotes for supported USA, ETF and crypto symbols when available;
- Argentina quote API for manual or structured local data;
- CEDEAR local context from the Argentina layer;
- fixed income structured data for bond species.

It does not connect to live BYMA, IOL, PPI or CNV APIs yet and does not scrape broker websites.

## Visual Logic

Cells are equal-sized in this version. Each cell shows symbol, short name, price when available, change percentage, source badge and asset type badge.

Color scale:

- strong green for strong positive moves;
- soft green for mild positive moves;
- muted slate for neutral, unavailable or simulated data;
- soft red for mild negative moves;
- rose/red for strong negative moves.

## Transparency

Source badges keep the module public-demo safe:

- Provider
- Yahoo compatible
- Manual validated
- Simulated
- Future
- Fallback
- N/A

## Current Limits

- USA/ETF/crypto prices hydrate from existing provider endpoints and may be delayed or fallback-labeled.
- Argentina prices can be manual or structured simulation until licensed integrations are enabled.
- CEDEAR local prices and ratios remain simulated unless manual data is supplied.
- Cell sizing is equal-weighted; market-cap or volume weighting remains future work.
