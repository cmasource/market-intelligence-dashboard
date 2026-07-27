# Local watchlists

CMA Market Intelligence includes multiple browser-local watchlists for public demos.

- Storage: versioned `localStorage`, key `cma-market-intelligence-watchlists-v2`.
- The legacy flat key `cma-market-intelligence-watchlist` is migrated once into the initial list named `Mi lista`.
- No login, no backend and no database are required.
- Each list stores only instrument identity and metadata: Instrument Master ID when available, normalized symbol, local/provider symbols, exchange, asset type, market, currency and `addedAt`.
- Quotes, changes, returns and technical indicators are never persisted in watchlist storage.
- Lists are scoped to the current browser and do not sync across devices.
- Watchlists are tracking lists, not portfolios: they contain no positions, quantities, operations, cost basis or performance.

The watchlist is intended as a lightweight workflow aid until account-level persistence is introduced in a future sprint.
