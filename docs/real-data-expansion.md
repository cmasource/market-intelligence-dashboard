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
