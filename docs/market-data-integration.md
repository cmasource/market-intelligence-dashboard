# Market Data Integration

## Purpose

Sprint 5 adds the first real market data integration layer for CMA Market Intelligence while preserving the current CMA Consulting and cma_source MVP fallback behavior. The goal is to keep UI components isolated from provider details and route all market-data access through a service abstraction.

## Provider Abstraction

Market data now flows through `lib/market-data/market-data-service.ts`.

Provider modules:

- `mock-provider.ts`: wraps the existing deterministic OHLCV mock generator.
- `yahoo-provider.ts`: MVP adapter for USA stocks and ETFs through a Yahoo Finance compatible chart endpoint.
- `crypto-provider.ts`: MVP adapter for BTC and ETH public crypto candles through Binance klines.
- `symbol-map.ts`: normalizes symbols and controls which instruments are eligible for Sprint 5 real data.

UI components do not call external providers directly. The chart uses the internal API route and falls back to client-side mock candles only if the API request itself fails.

## Sprint 5 Real Data Support

USA stocks and ETFs:

- `AAPL`
- `SPY`
- `QQQ`

Crypto:

- `BTC-USD`
- `ETH-USD`

## Unsupported Assets Using Mock Fallback

Argentina assets and bonds remain mocked in this sprint, including:

- `GGAL`
- `YPFD`
- `AL30`
- `GD30`
- `TX26`

Unknown symbols also fall back to mock OHLCV data.

## API Route

Endpoint:

```text
/api/market-data/[symbol]?timeframe=[timeframe]
```

Examples:

```text
/api/market-data/AAPL?timeframe=1M
/api/market-data/BTC-USD?timeframe=1Y
```

Supported timeframes:

- `1D`
- `5D`
- `1M`
- `6M`
- `YTD`
- `1Y`
- `5Y`

The response includes symbol, provider, asset class, timeframe, candles, fallback status, source label and optional error context.

## Current Limitations

- Yahoo-compatible data is an MVP adapter and not a licensed production feed.
- Binance public klines may be rate-limited, unavailable or region-dependent.
- No API keys or secrets are used.
- No caching database exists yet.
- No BYMA, IOL, CNV, AIF or Argentine bond real data is integrated yet.
- Corporate actions, dividends, splits, clean/dirty bond pricing and settlement calendars are not modeled.

## Future Provider Strategy

- Licensed USA market data provider for equities and ETFs.
- BYMA/IOL adapter for Argentina equities and local instruments.
- CNV/AIF source layer for statements and filings.
- Expanded crypto exchange data and normalized venue selection.
- Caching/database layer for reliability, rate limits and historical analytics.
