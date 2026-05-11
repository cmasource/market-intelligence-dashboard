# Instrument Universe Module

## Purpose

The instrument universe module models relationships between tradable symbols in CMA Market Intelligence. It is currently mock/structured data and prepares future coverage for Argentina instruments, CEDEARs, ADRs, crypto pairs and arbitrage relationships.

## Argentine Instrument Relationships

Argentina instruments can have multiple related trading symbols for the same underlying asset. The first implemented group is sovereign bond species:

- `AL30`, `AL30D`, `AL30C`.
- `GD30`, `GD30D`, `GD30C`.
- `TX26`.

## Bond Species Model

- `AL30`: peso species for the AL30 underlying bond.
- `AL30D`: dollar MEP species for the AL30 underlying bond.
- `AL30C`: dollar cable/CCL species for the AL30 underlying bond.
- `GD30`: peso species for the GD30 underlying bond.
- `GD30D`: dollar MEP species for the GD30 underlying bond.
- `GD30C`: dollar cable/CCL species for the GD30 underlying bond.
- `TX26`: CER-linked ARS bond.

## Primary vs Related Instruments

Each universe item can define a `primarySymbol`, an `underlyingSymbol` and a `relatedSymbols` list. This allows an asset page to show the main instrument and the related symbols a user can open directly.

## CEDEAR and ADR Future Model

The current CEDEAR entries are placeholders. Future versions can map:

- Local CEDEAR symbol.
- Dollar species.
- ADR.
- Underlying stock.
- CEDEAR ratio.
- CCL reference.

Sprint 12 adds an explicit CEDEAR model foundation under `lib/instrument-universe/cedears.ts`. CEDEAR cards are now more prominent on the Markets page and in the screener, with data coverage labeled as mock/future unless a supported global underlying is being used.

## Data Coverage

The instrument universe is paired with a data provenance model under `lib/data-coverage`. Each symbol can now communicate whether price, technical, fundamentals, fixed income, news and AI summary layers are real/provider, mock/fallback, future, not applicable or unavailable.

## Crypto Universe Roadmap

The first crypto universe contains `BTC-USD`, `ETH-USD`, `BNB-USD`, `SOL-USD`, `XRP-USD`, `ADA-USD`, `DOGE-USD`, `AVAX-USD`, `LINK-USD` and `DOT-USD`. Only the currently supported market-data symbols should be considered live/fallback-ready. The target is a top 50 crypto universe.

## Current Limitations

- Mock relationship data only.
- No real BYMA, IOL or CNV data.
- No official CEDEAR ratio mapping.
- No live CCL/MEP arbitrage calculation.
- No database or persistent instrument master.
- The screener uses structured local arrays and does not yet persist user filters.

## Future Expansion

- Screener filters for full BYMA coverage.
- Panel lider.
- General panel.
- CEDEARs.
- ONs.
- Letras.
- Lecaps.
- Top 50 crypto assets.
- ADR/CEDEAR/underlying mapping.
- CCL/MEP/arbitrage relations.
