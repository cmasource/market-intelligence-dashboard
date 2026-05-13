# Provider Architecture

Sprint 18 adds a server-side provider chain for market data, fundamentals and news while preserving fallback behavior.

## Environment Variables

```bash
ALPHA_VANTAGE_API_KEY=
FINNHUB_API_KEY=
FMP_API_KEY=
NEWS_PROVIDER=fallback
MARKET_DATA_PROVIDER=yahoo_fallback
```

Secret keys must stay server-side. Do not prefix provider keys with `NEXT_PUBLIC_`.

## Priority

Market data and fundamentals try FMP, Finnhub, Alpha Vantage, Yahoo-compatible fallback and mock fallback. News tries FMP/Finnhub, Alpha Vantage, Google News RSS and mock news.

## Fallback Rules

Missing keys disable a provider. Failed requests return safe errors and the next provider is attempted. The app must build and run without keys.

`/api/providers/status` returns enabled/disabled provider metadata without exposing API key values.
