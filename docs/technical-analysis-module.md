# Technical Analysis Module

## Purpose

Sprint 6 calculates technical analysis for CMA Market Intelligence from OHLCV candles delivered by the market data layer. The module supports real provider candles where available and fallback mock candles for unsupported or unavailable sources.

## Indicators Calculated

- Last close.
- SMA 20.
- SMA 50.
- SMA 200.
- EMA 12.
- EMA 26.
- RSI 14.
- MACD.
- MACD signal.
- MACD histogram.
- Recent support.
- Recent resistance.
- Volume trend.

## Score Methodology

The technical score is a deterministic MVP score from 0 to 100. It combines:

- Trend alignment: close vs SMA 200, SMA 20 vs SMA 50, SMA 50 vs SMA 200.
- Momentum: RSI range, MACD vs signal and MACD histogram.
- Support/resistance position.
- Volume trend.
- Data quality and indicator availability.

The score is not a trading recommendation.

## Data Source Behavior

The analysis service calls the existing market data service. Supported USA and crypto symbols may use provider data. Unsupported assets or provider failures use mock OHLCV fallback data.

## Real Data vs Fallback Data

Supported real-data attempts:

- `AAPL`
- `SPY`
- `QQQ`
- `BTC-USD`
- `ETH-USD`

Fallback still supports:

- `GGAL`
- `YPFD`
- `AL30`
- `GD30`
- `TX26`
- Unknown symbols

## Current Limitations

- RSI uses the existing simple rolling implementation rather than Wilder smoothing.
- Support and resistance use simple recent close ranges.
- Volume trend compares recent average volume with the previous average window.
- Indicators depend on available candle count, so short timeframes may not expose long indicators.
- No backtesting or portfolio-level signal validation is included.

## Future Improvements

- Wilder RSI.
- ADX.
- Stochastic RSI.
- Ichimoku.
- Bollinger Bands.
- ATR.
- Multi-timeframe confirmation.
- Backtesting.
