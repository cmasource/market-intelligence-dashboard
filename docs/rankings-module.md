# Rankings module

Sprint 25 adds market ranking modules to the homepage and API layer.

## Ranking types

- Technical ranking: orders instruments by available technical score, trend, momentum, RSI, SMA relation and MACD context.
- Fundamental ranking: orders equity-like instruments by estimated fundamental quality using available score, profitability, valuation, margins and coverage.
- Combined ranking: blends technical score at 45%, fundamental or applicable analytical score at 45%, and data coverage/confidence at 10%.
- Performance ranking: estimates 30D, 180D and YTD return from available historical/fallback OHLCV series and excludes rows that cannot be calculated.

## Universe

Rankings start from the existing CMA Market Intelligence universe:

- `mockAssets`
- USA stocks and ETFs already covered by provider/fallback flows
- crypto instruments
- Argentine equities
- CEDEAR-related instruments
- sovereign bond species and CER-linked examples
- instrument-universe metadata for coverage accounting

The module does not hardcode only AAPL/TSLA and does not introduce a database.

## Compliance language

Rows use informational terms such as:

- Ranking tecnico
- Ranking fundamental
- Ranking combinado
- Mejores rendimientos
- Lectura informativa
- Senal constructiva
- No constituye recomendacion de inversion

The module avoids direct investment recommendation wording.

## Sources and limitations

Rankings combine available local data structures, provider/fallback market data, mock OHLCV series, technical indicators and fallback fundamentals. The source chip on each row distinguishes provider/fallback, local structured coverage, crypto fallback, or fixed income structured data.

Performance rankings use the same fallback-safe OHLCV engine already used elsewhere in the app when historical provider data is unavailable. The UI labels this as estimated/fallback rather than pretending precision.

## Finviz note

Finviz is a conceptual product inspiration for market maps, screeners and ranking/filter workflows only. CMA Market Intelligence does not scrape Finviz, does not copy its visual design exactly and does not use Finviz data.
