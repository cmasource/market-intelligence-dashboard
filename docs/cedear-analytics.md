# CEDEAR Analytics

## Overview

Sprint 17 adds the first CEDEAR analytics layer for CMA Market Intelligence. The module links a local Argentine CEDEAR reference with its international underlying asset.

## Implemented Fields

- `localSymbol`: BYMA CEDEAR ticker.
- `underlyingSymbol`: international ticker.
- `underlyingName`: international company or ETF name.
- `ratio`: number of CEDEARs equivalent to one underlying share.
- `localPrice`: mock local ARS price.
- `underlyingPrice`: provider/fallback or mock USD price.
- `impliedCcl`: calculated ARS/USD reference.
- `cclSpread`: comparison against a mock reference CCL.

## Data Policy

Local CEDEAR prices and ratios are mock structured values until BYMA/IOL or licensed provider integration is enabled. USA underlying prices may use the existing provider/fallback market data layer where available.

## User-Facing Behavior

Asset pages for `AAPL`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL`, `KO`, `SPY` and `QQQ` can show both the USA stock or ETF context and the local Argentine CEDEAR context.
