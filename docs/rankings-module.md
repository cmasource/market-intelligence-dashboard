# Rankings module

Sprint 25 adds market ranking modules to the homepage and API layer.

## Ranking types

- Technical ranking: orders instruments by available technical score, trend, momentum, RSI, SMA relation and MACD context.
- Fundamental ranking: orders equity-like instruments by estimated fundamental quality using available score, profitability, valuation, margins and coverage.
- Combined ranking: blends technical score at 45%, fundamental or applicable analytical score at 45%, and data coverage/confidence at 10%.
- Performance ranking: estimates 30D, 180D and YTD return from available historical/fallback OHLCV series and excludes rows that cannot be calculated.

## Universe

Rankings evaluate a liquid cross-market subset of the existing CMA Market Intelligence universe:

- USA stocks and ETFs already covered by provider flows
- crypto instruments
- Argentine equities
- CEDEAR-related instruments
- sovereign bond species and CER-linked examples
- instrument-universe metadata for coverage accounting

The candidate set is explicit to protect free provider quotas, while every score and return is recalculated with the shared live technical and fundamental services. The result is cached for two minutes and does not introduce a database.

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

Rankings combine provider market history, technical indicators and available provider/manual fundamentals. Instruments without usable current coverage are excluded instead of receiving a simulated score.

Performance rankings calculate 30D, 180D and YTD returns from the same verified one-year OHLCV series used by the technical engine.

## Finviz note

Finviz is a conceptual product inspiration for market maps, screeners and ranking/filter workflows only. CMA Market Intelligence does not scrape Finviz, does not copy its visual design exactly and does not use Finviz data.
