# Market Signal Gauge

## Purpose

The market signal gauge provides a compact, non-advisory reading for an instrument using the data currently available in CMA Market Intelligence.

It is broader than the technical signal gauge because it can combine:

- Technical score
- Fundamental score
- Fixed income score in future versions
- Data coverage and confidence context

## Technical vs integrated signal

The technical signal focuses on OHLCV-derived indicators such as moving averages, RSI, MACD, support, resistance and volume trend.

The integrated market signal combines technical and fundamental inputs when both are available. If one input is missing, the gauge can still show a limited-confidence reading. If no meaningful inputs exist, the signal is unavailable.

## Current weighting

For equities, ETFs and CEDEAR-like instruments:

- Technical score: 55%
- Fundamental score: 45%

For crypto:

- Technical score is the primary input
- Equity fundamentals are not applicable

For fixed income:

- A fixed income score is reserved for a future sprint
- Current bond readings remain limited when only technical data is available

## Confidence levels

- High: technical and fundamentals are both available
- Medium: a primary data layer is available for the asset class
- Limited: only one partial input exists or the asset class requires future scoring work
- Unavailable: no meaningful score inputs exist

## Terminology

The gauge avoids direct buy/sell terminology. Labels are:

- Very defensive
- Defensive
- Neutral
- Constructive
- Very constructive
- Unavailable

This is intentional because the product is informational and does not provide investment recommendations.

## Disclaimer

The gauge displays:

> Informational signal based on available data. Not an investment recommendation.

## Limitations

- The model is deterministic and intentionally simple.
- It does not include analyst consensus, sector comparisons, backtesting or macro context.
- Fundamental data may be provider-based, fallback or unavailable depending on the symbol.
- Argentina market instruments still use mock/fallback data until local integrations are enabled.

## Future Improvements

- Multi-timeframe signal
- Valuation confidence
- Sector comparison
- Risk-adjusted score
- Backtesting
- Real analyst consensus comparison
- Fixed income score derived from duration, convexity, parity, risk and cash-flow quality
