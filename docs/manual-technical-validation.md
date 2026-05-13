# Manual Technical Validation

This guide helps compare CMA Market Intelligence technical analysis with external platforms such as TradingView, Investing or Yahoo Finance.

## AAPL Example

1. Open `/asset/AAPL` in CMA Market Intelligence.
2. Use the `1Y` timeframe for a long enough candle history.
3. Compare the latest close and overall chart shape against an external chart.
4. Review:
   - SMA 20
   - SMA 50
   - SMA 200
   - RSI 14
   - MACD line
   - MACD signal
   - MACD histogram
   - Support
   - Resistance
5. Validate first for trend coherence, level ranges and indicator magnitude before expecting exact numeric equality.

## Expected Differences

- Provider source differences.
- Adjusted vs non-adjusted prices.
- Intraday vs daily candles.
- Timezone and close-time differences.
- RSI smoothing methodology differences.
- Support and resistance methodology differences.
- Fallback mock candles when a provider is unavailable.

## Spanish Validation Notes

- No es esperable que todos los valores coincidan exactamente con TradingView o Investing si la fuente, el ajuste de precios o la metodología del indicador difieren.
- La validación debe concentrarse primero en coherencia general de tendencia, niveles y magnitudes.

## Current Scope

Expanded provider/fallback technical coverage is prepared for selected USA stocks, ETFs and crypto assets. Argentina instruments still use mock/fallback behavior until local market data integrations are enabled.

This validation process is informational only and does not constitute investment advice.
