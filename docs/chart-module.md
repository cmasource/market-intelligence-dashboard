# Chart Module

## Purpose

The chart module gives CMA Market Intelligence an interactive asset price view while preserving the current CMA Consulting and cma_source MVP scope. It replaces the static chart placeholder with a client-side Lightweight Charts component that can later receive real market data.

## Current Mock OHLCV Behavior

- Data is generated locally by `lib/chart/mock-chart-data.ts`.
- Sprint 5 connects the chart to the internal market-data API route, which may attempt supported public provider data before falling back to mock candles.
- No authentication or database is required.
- Symbols receive different base prices and volatility profiles.
- Generated candles include `open`, `high`, `low`, `close` and `volume`.
- Candle integrity is enforced so `high` is at least the max of open/close and `low` is at most the min of open/close.
- The current implementation is deterministic enough for stable UI demos and validation.

## Supported Timeframes

- `1D`: 48 intraday-like points.
- `5D`: 120 intraday-like points.
- `1M`: 22 daily points.
- `6M`: 126 daily points.
- `YTD`: safe mock equivalent for year-to-date style viewing.
- `1Y`: 252 daily points.
- `5Y`: 260 weekly points.

## Current Limitations

- OHLCV values are simulated and should not be used for investment decisions.
- The chart does not yet use licensed production-grade exchanges, brokers or market data vendors.
- The module does not include corporate actions, splits, dividends, bond accrued interest or clean/dirty price adjustments.
- Volume is simulated and displayed as an overlay-style histogram, not yet as a dedicated advanced panel.
- Intraday sessions are approximate and do not model exchange calendars.

## Future Real Data Integration

- Add a normalized market-data adapter layer before connecting any provider.
- Keep mock data as a development fallback.
- Validate timestamp, currency, session, volume and symbol mapping before chart rendering.
- Add explicit loading, stale-data and provider-error states.

## Future Technical Overlays

- SMA 20.
- SMA 50.
- SMA 200.
- EMA overlays.
- RSI subpanel.
- MACD subpanel.

## Future Volume and Indicator Panels

- Move volume into a configurable panel when the chart layout supports richer multi-pane interactions.
- Add indicator visibility toggles.
- Add tooltip-ready calculations backed by the validated financial engine where appropriate.
