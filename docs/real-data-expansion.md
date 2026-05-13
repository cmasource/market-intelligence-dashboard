# Real Data Expansion

Sprint 18 adds provider architecture for USA market data, fundamentals and news. It does not add authentication, a database, BYMA, IOL, CNV or broker integrations.

## Works Without Keys

- App builds and deploys.
- Yahoo-compatible market data/fundamentals can still be attempted where supported.
- Google News RSS or mock news can provide fallback headlines.
- Argentina bonds and CEDEAR local data stay clearly marked as mock.

## Keys

- `FMP_API_KEY`: FMP market data, fundamentals and news.
- `FINNHUB_API_KEY`: Finnhub quotes, candles, company profile, basic financials and company news.
- `ALPHA_VANTAGE_API_KEY`: Alpha Vantage daily prices, overview and news sentiment.

Local Argentine equities, bonds and CEDEAR local prices still require future BYMA/IOL/CNV or licensed-provider integration.

## Configured vs Actual Provider

`/api/providers/status` reports the configured active provider chain. It does not guarantee that every endpoint and symbol returned data from the first provider.

For quote verification:

- `/api/market-data/quote/AAPL` returns the compact actual quote source.
- `/api/market-data/quotes` accepts a POST body like `{ "symbols": ["AAPL", "SPY"] }` for dashboard quote hydration.
- `/api/market-data/quote/AAPL?debug=1` includes `providerTrace`.
- `/api/providers/verify/AAPL` compares configured provider, actual provider and fallback chain.

FMP can be enabled while an individual quote falls back to Yahoo-compatible data. That is expected when FMP returns an empty response, an invalid quote price, a rate limit, a plan restriction or another safe failure.

The verified Sprint 18.4 behavior for AAPL is:

- FMP is the configured primary provider.
- FMP quote can return HTTP 403 with `reason: "plan_restricted"` depending on the FMP plan.
- Yahoo-compatible data can then succeed as the actual provider.
- Yahoo-compatible data is provider-compatible real-data fallback, not mock.
- Mock fallback remains the last resort.

Asset pages, featured dashboard cards and visible dashboard search results all use the same provider quote chain for supported USA/crypto symbols. They may initially render the static server seed and then update client-side after mount. Argentine local equities, CEDEAR local prices and fixed income instruments remain structured mock/local data until a licensed local provider is integrated.
