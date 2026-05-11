# CEDEAR Module

## Purpose

The CEDEAR module defines the foundation for local Argentine exposure to foreign companies and ETFs inside CMA Market Intelligence. It is currently a structured model for product experience and future integration, not an official market-data feed.

## Current Model

The initial examples include:

- `AAPL`
- `MSFT`
- `NVDA`
- `TSLA`
- `AMZN`
- `META`
- `GOOGL`
- `SPY`
- `QQQ`
- `KO`

Each CEDEAR entry can track a local symbol, underlying symbol, underlying name, local currency, underlying currency, related symbols and current support status.

## Future Data Requirements

- CEDEAR local price in ARS.
- Underlying foreign price in USD.
- CEDEAR ratio.
- Dollar trading species.
- Implied CCL.
- Volume and liquidity.
- Settlement context.

## Current Limitations

- CEDEAR coverage is mock/future-only unless the global underlying symbol is already supported elsewhere.
- No BYMA, IOL or licensed local-market feed is connected yet.
- No implied CCL calculation is active.
- No arbitrage signal is generated.

## Future Integration

- BYMA, IOL or licensed local data for CEDEAR prices and volumes.
- ADR, CEDEAR and underlying mapping.
- CCL calculation using local and underlying prices.
- Arbitrage intelligence with liquidity and execution-risk controls.
