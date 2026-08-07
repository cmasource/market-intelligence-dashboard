# Extractable layout components

Existing shared layout components to reuse as fixed visual context:

- `AppShell` — overall sidebar/header/main/footer geometry.
- `Sidebar` — desktop navigation and mobile drawer.
- `AppHeader` — sticky market ticker header.
- `AppFooter` — legal/secondary navigation footer.
- `AppearanceToggle` and `LanguageSwitcher` — sidebar controls.

Radar-specific reusable candidates for implementation after draft approval:

- `ProviderLogo` — provider domain/logo with deterministic initials fallback.
- `MarketAssetTabs` — USD_BANK / USDT / USDC selection.
- `ProviderQuoteCard` — one provider, both client-side buy and sell prices, provenance and freshness.
- `RouteSummaryCard` — same-asset route, gross spread, verification state, blockers.
- `VerificationBadge` — quote/capability/cost status.

Do not extract or modify Trade Radar, watchlist, Instrument Master, or alert-system components.
