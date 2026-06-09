# Local watchlist

CMA Market Intelligence includes a browser-local watchlist for public demos.

- Storage: `localStorage`, key `cma-market-intelligence-watchlist`.
- No login, no backend and no database are required.
- Items store symbol, name, asset type, market, currency and `addedAt`.
- The list is scoped to the current browser and does not sync across devices.
- Removing or clearing items only changes local browser state.

The watchlist is intended as a lightweight workflow aid until account-level persistence is introduced in a future sprint.
