# Screener Module

## Purpose

The instrument screener gives CMA Market Intelligence an expandable interface for exploring the current mock and real-supported instrument universe. It is designed to grow into a full multi-asset coverage surface without adding authentication, databases or paid data providers yet.

## Current Mock Universe

- Argentina bond species: `AL30`, `AL30D`, `AL30C`, `GD30`, `GD30D`, `GD30C`, `TX26`.
- Argentina equities: `GGAL`, `YPFD`, `PAMP`, `COME`, `BMA`, `TXAR`, `TGSU2`, `TRAN`, `CEPU`, `MIRG`.
- CEDEAR examples: `AAPL`, `MSFT`, `KO`, `TSLA`, `AMZN`, `NVDA`, `META`, `GOOGL`, `SPY`, `QQQ`.
- USA examples: `AAPL`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL`, `SPY`, `QQQ`.
- Crypto roadmap examples: `BTC-USD`, `ETH-USD`, `BNB-USD`, `SOL-USD`, `XRP-USD`, `ADA-USD`, `DOGE-USD`, `AVAX-USD`, `LINK-USD`, `DOT-USD`.

## Supported vs Future Coverage

The screener separates instruments by `sourceStatus`:

- `real_supported`: currently has a real-data attempt or provider-backed layer.
- `mock_supported`: works through mock or structured fallback data.
- `future_supported`: searchable roadmap entry without a complete asset page yet.

## Filter Options

- Search query.
- Category.
- Market.
- Country.
- Currency.
- Data status.

## Current Limitations

- No real BYMA, IOL, CNV or paid-provider integration.
- Future instruments may appear without active asset pages.
- No saved filters, user watchlists or persisted preferences.
- No database-backed instrument master.

## Future Expansion

- Full BYMA instrument list.
- CEDEAR universe.
- ONs.
- Letras and lecaps.
- Top 50 crypto assets.
- ADR/CEDEAR mapping.
- Real data coverage status.
- User watchlists.
- Saved screeners.
