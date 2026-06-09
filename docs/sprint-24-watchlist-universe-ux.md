# Sprint 24 - Watchlist, universe and UX clarity

Sprint 24 adds a local watchlist and expands the Argentine-market browsing universe without changing the provider chain or adding a database.

## Implemented direction

- A local watchlist uses browser `localStorage` and remains public-demo safe.
- The header exposes `Mi lista` / `Watchlist` with a client-safe count badge.
- Asset, featured and screener cards can add or remove instruments from the local list.
- The Argentine universe now includes additional local equities, CEDEAR references and sovereign bond species.
- Search supports broader Argentine-market discovery through symbol, company name, asset type, market and aliases such as CEDEAR, bono, Merval and accion argentina.

## UX decisions

- The watchlist is intentionally local and transparent: no login, no database and no device sync.
- Market signal is framed as an integrated signal, while the technical module is framed as a technical engine/factor panel.
- Data coverage remains visible but secondary, so the asset page prioritizes market reading before data provenance.
- Simulated/manual/future labels remain visible for local Argentina and CEDEAR data.

## Limitations

- Expanded local instruments do not imply live BYMA/IOL/PPI data.
- CEDEAR local prices remain mock/manual/future until a licensed source is integrated.
- Some expanded instruments may open preliminary profiles until full data coverage is added.
