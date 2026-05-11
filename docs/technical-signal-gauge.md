# Technical Signal Gauge

## Purpose

The technical signal gauge gives CMA Market Intelligence a quick visual summary of an asset's technical score without presenting it as a trading recommendation.

For the broader asset-page summary, see `docs/market-signal-gauge.md`. The market signal can combine technical and fundamental scores when both are available, while this gauge remains focused on technical analysis only.

## Score Mapping

- `0-20`: Very defensive / Muy defensivo.
- `21-40`: Defensive / Defensivo.
- `41-60`: Neutral.
- `61-80`: Constructive / Constructivo.
- `81-100`: Very constructive / Muy constructivo.

## Terminology Choice

The gauge intentionally avoids direct recommendation language such as buy, sell, strong buy or strong sell. It uses descriptive technical posture labels instead: defensive, neutral and constructive.

## Data Source Dependency

The gauge is only as reliable as the technical score source:

- Provider or real OHLCV data can support a provider-based signal.
- Fallback/mock OHLCV data produces a fallback/mock signal.
- Future-only instruments should not show a misleading signal until data coverage exists.

## Current Limitations

- Single-score summary only.
- No multi-timeframe confirmation yet.
- No confidence score yet.
- No backtesting validation yet.
- Not a recommendation and not investment advice.

## Future Improvements

- Multi-timeframe signal.
- Analyst consensus comparison.
- Volatility adjustment.
- Trend strength.
- Backtesting.
- Confidence score.
