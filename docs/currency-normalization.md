# Currency Normalization

## Purpose

CMA Market Intelligence uses a centralized currency formatting layer so prices, bond species and instrument cards show consistent units across the public demo.

## Display Rules

- USA stocks and ETFs display as `value USD`.
- Supported USA symbols `AAPL`, `SPY`, `QQQ`, `MSFT`, `NVDA`, `TSLA`, `AMZN`, `META`, `GOOGL` and `KO` display as `value USD`.
- Crypto pairs such as `BTC-USD`, `ETH-USD`, `SOL-USD` and `BNB-USD` display as `value USD`.
- Local Argentine equity mock prices such as `GGAL` and `YPFD` display as `value ARS`.
- Peso bond species such as `AL30` and `GD30` display as local mock market prices in ARS, for example `58,400 ARS` and `92,300 ARS`.
- Dollar bond species such as `AL30D`, `AL30C`, `GD30D` and `GD30C` display as `value USD`.
- CER-linked instruments such as `TX26` display as `value ARS`.
- Settlement and species context is shown separately from the price currency: `Especie dólar MEP`, `Especie dólar cable/CCL`, `Bono CER` or `Ajustado por CER`.
- Legacy composite strings such as `ARS/USD`, `USD/ARS`, `USD MEP`, `USD CABLE`, `ARS CER` and incorrect SAR typos must not appear as visible price currencies.

## Implementation

- Use `formatCurrency`, `formatAssetPrice` or `formatInstrumentPrice` from `lib/formatters.ts` for visible price labels.
- Use `quoteCurrency` for the price line.
- Use `settlementContext`, `speciesType`, `indexationType` and `marketConventionLabel` for badges or explanatory labels.
- Do not bypass the formatter when rendering asset cards, screener rows, fixed income rows or related species labels.

## Bond Price Separation

- `marketDisplayPrice` is the visible mock market convention used by UI cards and asset headers.
- `analyticalPrice` is the normalized fixed income price used for parity, yield, duration and convexity.
- Example: `GD30` may show `92,300 ARS` while fixed income metrics use normalized `61.70`.
- This keeps local Argentine peso species visually realistic without overengineering real bond analytics before a licensed data integration exists.

## Current Limitations

- Argentine instrument prices are simulated until real market integration is available.
- For bonds, the visible price may differ from the normalized price used for analytical metrics.
- BYMA, IOL, CNV, broker and licensed-provider integrations remain future work.
