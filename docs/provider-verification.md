# Provider Verification

Sprint 18.2 wires visible asset prices to the provider quote path instead of relying only on the static mock asset seed.

## Checks

1. Provider status:
   - Open `/api/providers/status`.
   - Confirm whether `fmp` is enabled for market data, fundamentals and news.
   - The response must never include actual API key values.

2. Quote endpoint:
   - Open `/api/market-data/quote/AAPL`.
   - A valid FMP quote returns `provider: "fmp"`, `sourceLabel: "FMP provider"` and `isFallback: false`.
   - If FMP is missing, rate-limited or malformed, the endpoint falls back safely to Yahoo-compatible data or mock fallback.
   - Open `/api/market-data/quote/AAPL?debug=1` to see `providerTrace`.
   - If the compact quote returns `provider: "yahoo"`, debug mode should show the FMP quote attempt and its non-secret failure reason.

3. Provider verification:
   - Open `/api/providers/verify/AAPL`.
   - Compare `configuredProvider` with `actualProvider`.
   - `configuredProvider: "fmp"` and `actualProvider: "yahoo"` means FMP was configured but the symbol/endpoint used the fallback chain.

4. AAPL asset page:
   - Open `/asset/AAPL`.
   - The main header price should update from the server seed to the quote endpoint when provider data is valid.
   - The header source should show provider copy such as `Provider price: FMP`, `Provider price: Yahoo-compatible`, `Precio proveedor: FMP` or `Precio proveedor: Yahoo compatible`.
   - If mock is the actual provider, the header should show `Mock fallback price` / `Precio simulado de respaldo`.
   - The chart can use historical provider candles while the header uses the latest quote.

5. Dashboard cards:
   - Open `/`.
   - Featured assets and visible search results render static seed values during SSR, then hydrate provider-supported symbols through `/api/market-data/quotes`.
   - Provider-supported USA/crypto symbols can update to FMP, Yahoo-compatible or mock fallback quotes after mount.
   - Argentina local equities and fixed income instruments keep structured mock values until local provider integration exists.

6. CEDEAR distinction:
   - The CEDEAR panel on `/asset/AAPL` keeps the local CEDEAR price labeled as mock.
   - The underlying USA price may use provider or fallback data.
   - Local CEDEAR mock pricing must not overwrite the main USA stock price.

## Troubleshooting

- Missing key: add `FMP_API_KEY` locally or in Vercel Project Settings > Environment Variables, then redeploy.
- Endpoint limit: FMP may return a non-price response when the account is rate-limited or the plan does not allow the endpoint.
- Plan restriction: FMP can return HTTP 403 with `reason: "plan_restricted"` for the quote endpoint. This is not an API-key leak or a crash; the app should use Yahoo-compatible data as the effective provider.
- Invalid symbol mapping: verify the symbol is supported by the provider chain and `lib/market-data/symbol-map.ts`.
- Fallback activated: inspect `providerTrace` in `/api/market-data/quote/AAPL?debug=1`.
- Fundamental coverage: inspect `/api/fundamentals/AAPL?debug=1`. The response includes `metrics`, `missingFields` and a non-secret `providerTrace` so partial provider coverage can be distinguished from a mapping issue or a true unavailable field.
- Stale deployment: confirm the Vercel deployment has the latest build and environment variables.

Provider status means a provider is configured. A visible UI field uses that provider only when the field is wired to the provider data path and the provider returns valid data.

FMP can be configured and active while a specific endpoint still falls back. For quotes, the current chain is FMP quote, Yahoo-compatible market data, then mock fallback. Yahoo-compatible data is a valid provider fallback, not a mock value.

For fundamentals, provider responses are considered usable only when actual financial metrics are present. Metadata-only responses such as currency or period do not stop the fallback chain.
