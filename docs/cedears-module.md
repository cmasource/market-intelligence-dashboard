# CEDEAR Module

## Purpose

The CEDEAR module defines local Argentine exposure to foreign companies and ETFs inside CMA Market Intelligence. It is currently a structured mock model for product experience and future integration, not an official market-data feed.

## Current Model

The initial CEDEAR examples are:

- `AAPL`
- `MSFT`
- `NVDA`
- `TSLA`
- `AMZN`
- `META`
- `GOOGL`
- `KO`
- `SPY`
- `QQQ`

Each CEDEAR entry tracks:

- Local symbol.
- Underlying symbol and name.
- Local market: BYMA.
- Local currency: ARS.
- Underlying market and currency: USA market / USD.
- Mock CEDEAR ratio.
- Mock local ARS price.
- Underlying USD price from provider/fallback when available.
- Implied CCL calculated from available inputs.

## Coverage Status

- Local CEDEAR price: mock.
- CEDEAR ratio: mock structured data.
- Underlying price: provider/fallback where supported.
- Implied CCL: calculated from available data.
- News and live local market feeds: future.

## Current Limitations

- No BYMA, IOL, broker or licensed local-market feed is connected yet.
- CEDEAR ratios and local prices are not official.
- Implied CCL is informational and depends on the documented ratio convention.
- No arbitrage recommendation is generated.

## Future Integration

- BYMA, IOL or licensed local data for CEDEAR prices and volumes.
- Official ratio source and adjustment history.
- Dollar species and settlement context.
- Arbitrage intelligence with liquidity and execution-risk controls.
