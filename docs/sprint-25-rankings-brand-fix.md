# Sprint 25: Rankings and brand polish

## Scope

Sprint 25 improves brand presentation and adds homepage market rankings.

## Brand updates

- Header now uses a compact CMA monogram lockup with CMA Market Intelligence and a subdued desktop subline.
- Favicon, app icon and apple icon are regenerated from the official CMA icon with safe internal padding.
- Footer shows CMA Consulting and cma_source with concise institutional copy.

## Ranking updates

- Added technical, fundamental, combined and performance rankings.
- Added `/api/rankings` and `/api/rankings/[type]`.
- Added homepage section: Rankings de oportunidad informativa.
- Added period tabs for 30D, 180D and YTD performance.

## Methodology

- Technical score uses available technical score plus trend, momentum, RSI and MACD context.
- Fundamental score uses existing fundamental score where present, otherwise available profitability, margin and valuation metrics.
- Combined score weights technical 45%, fundamentals or applicable score 45%, and data confidence 10%.
- Crypto rankings clearly rely on technical/momentum and coverage because traditional equity fundamentals are not applicable.
- Bond rows use fixed income structured context when fundamental score is unavailable.

## Compliance

All ranking copy is informational and includes non-advisory language. No API keys are exposed. Finviz is product inspiration only, not a data source.
