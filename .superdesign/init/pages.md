# Page dependency tree

## `/radar-arbitraje`

```text
app/radar-arbitraje/page.tsx
└── ArbitrageRadarPage (client)
    └── AppShell
        ├── Sidebar
        │   ├── CMA brand
        │   ├── AuthNavigation
        │   ├── AppearanceToggle
        │   └── LanguageSwitcher
        ├── AppHeader
        │   └── MarketTicker
        ├── Radar content
        │   ├── hero + refresh + informational disclaimer
        │   ├── filters
        │   ├── best route state
        │   ├── QuoteRankingTable (buy)
        │   ├── QuoteRankingTable (sell)
        │   ├── ArbitrageMatrix
        │   ├── ArbitrageCalculator
        │   └── source/provider status cards
        └── AppFooter
```

Data source: `GET /api/arbitrage/quotes`. Current quotes include separate `USD_BANK`, `USDT`, and `USDC` assets. Those assets must never be visually combined into one arbitrage ranking or route.

Current defects to resolve in the design:

- Plus is incorrectly labeled as `Dólar 24/7`; its public screen is a Plus Cambio USD quote.
- Two giant buy/sell tables hide the bid/ask relationship and cause horizontal overflow.
- Stablecoin quotes from CriptoYa are visually conflated with bank USD.
- The default calculator can select incompatible assets.
- The full cross-product matrix is dominated by stale, incompatible, and same-provider cells.
- Provider identity is weak because logos are absent.

Required target hierarchy:

1. Clear asset switcher: `USD bancario` / `USDT` / `USDC`.
2. Provider quote cards that show both client-side actions together: `Comprás a` (higher ask) and `Vendés a` (lower bid).
3. Verified opportunities and potential references separated from incompatible diagnostics.
4. Compact compatible-route comparison for only the selected asset.
5. Calculator constrained to the selected asset.
6. Source provenance and freshness visible but not repeated as wide table columns.
