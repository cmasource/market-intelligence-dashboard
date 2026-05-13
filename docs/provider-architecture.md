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

## Visible Quote Path

Provider status only confirms configuration. Asset headers verify actual quote data through `/api/market-data/quote/[symbol]`.

For supported USA stocks and ETFs, the quote path tries FMP first when `FMP_API_KEY` is present. A valid quote returns `provider: "fmp"`, `sourceLabel: "FMP provider"` and `isFallback: false`. If the quote endpoint is plan-restricted, rate-limited or returns invalid data, the service falls back to Yahoo-compatible market data and finally to mock seed data.

CEDEAR local prices remain mock. The main USA asset price can use provider data, while the CEDEAR panel separately labels local CEDEAR data as simulated.

Use `/api/market-data/quote/AAPL?debug=1` to inspect a non-secret provider trace. Use `/api/providers/verify/AAPL` to compare configured provider versus actual quote provider. A response with configured FMP and actual Yahoo means FMP is active but did not return valid quote data for that request, so Yahoo-compatible data was used as a real-compatible fallback.

For example, `statusCode: 403` with `reason: "plan_restricted"` means the current FMP plan does not allow that quote endpoint. In that case Yahoo-compatible data is still provider-compatible data, not mock data. Mock fallback is the final fallback only.
