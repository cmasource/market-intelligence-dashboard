# Sprint 23: Heatmap Pro

Sprint 23 upgrades the first heatmap into a professional market-browsing module and improves Argentina market presentation.

## Delivered

- Split the heatmap into service, type, controls and cell components.
- Added segment filters for USA, CEDEARs, Argentina, bonds, crypto, ETFs and all instruments.
- Added sorting by variation, absolute variation, symbol and source.
- Added a simulated-data toggle so users can focus on provider/manual coverage when needed.
- Added accessible cell links to `/asset/[symbol]`.
- Added compact source badges for provider, Yahoo-compatible, manual, simulated, future, fallback and unavailable data.
- Added a local Argentina panel with snapshot, sovereign bonds, Argentine equities and featured CEDEAR sections.
- Added a screener CTA that routes users to the full heatmap.

## Data Policy

The heatmap uses existing CMA Market Intelligence data paths only. It does not add live BYMA, IOL, PPI or CNV integrations and does not scrape broker websites.

## Current Limits

- Heatmap cells are equal-sized rather than weighted by market cap, volume or liquidity.
- Argentina local data remains manual or structured simulation until official or licensed integrations are available.
- CEDEAR context remains local/simulated unless manually supplied through the Argentina data layer.
