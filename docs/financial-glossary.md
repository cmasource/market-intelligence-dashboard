# Financial Glossary

## Purpose

The glossary explains the technical, fundamental and fixed income metrics shown in CMA Market Intelligence. It is designed for contextual education inside the product, not for investment recommendations.

## Product Integration

- Metric labels can use glossary tooltips through `GlossaryLabel`.
- `GlossaryLabel` reads definitions from `lib/glossary/definitions.ts` and renders `InfoTooltip` for compact contextual help.
- `TechnicalAnalysisCard`, `FundamentalAnalysisCard`, `BondMetricsCard` and practical fixed income comparison labels use glossary-backed labels.
- The full glossary is available at `/glossary`.
- Definitions are intentionally short so they fit cards, tooltips and mobile screens.

## Coverage

- Technical analysis: trend, momentum, SMA, EMA, RSI, MACD, support, resistance and volume trend.
- Fundamentals: valuation, profitability, growth, liquidity, leverage and market profile metrics.
- Fixed income: TIR/YTM, current yield, parity, duration, modified duration, convexity, accrued interest, clean price and dirty price.

## Compliance Style

Tooltips explain what a metric means. They do not say that a user should buy or sell. Where appropriate, they warn that a metric should not be used as a standalone signal.

## Current Limitations

- Definitions are MVP-level and intentionally concise.
- Future versions can add examples, charts and formula walkthroughs.
- Some conventions may be refined after real Argentina market data and bond calendars are integrated.
