# Sprint 28 - Analysis Coverage Expansion

## Objective

Sprint 28 expands technical, fundamental and fixed income coverage across the curated CMA Market Intelligence universe without implying unsupported analysis exists.

## Coverage Model

The central coverage model lives in `lib/analysis/analysis-coverage.ts`.

Each instrument is classified across:

- Technical analysis: provider, fallback, mock, manual or unavailable.
- Fundamentals: provider, fallback, manual, mock, not applicable or unavailable.
- Fixed income: provider, fallback, manual, mock, not applicable or unavailable.
- Chart: verified TradingView symbol or unverified fallback.

TradingView remains a visual charting widget only. CMA Market Intelligence technical and fundamental analysis continues to come from the internal provider/fallback chain.

## Universe Expansion

The curated priority universe now includes additional USA equities, ETFs, Argentine ADR/local mappings, sovereign bond species and crypto pairs. This is intentionally not a blind bulk import.

Coverage is exposed through:

- `/api/analysis/coverage`
- `/api/analysis/coverage/[symbol]`
- `/api/analysis/batch?symbols=AAPL,MSFT,GGAL,BTC-USD`
- `/api/analysis/universe?type=equity|argentina|crypto|bond|etf`

The batch endpoint is capped and does not make live provider calls.

## Fundamental Rules

- Equities, ADRs and ETFs may show fundamentals when a provider or verified underlying is available.
- CEDEAR and Argentine ADR-linked symbols can use verified underlyings.
- Crypto shows equity fundamentals as not applicable.
- Bonds show equity fundamentals as not applicable and use fixed income analytics instead.
- Pure local equities without verified provider mapping must not receive fake equity fundamentals.

## UI Surfaces

- Asset pages continue showing technical analysis when coverage exists.
- Fundamental cards disclose when a different underlying is used.
- Screener includes analysis availability filters.
- Rankings filter instruments by enough coverage for the ranking type.
- Data audit includes an analysis coverage matrix.

## Limitations

- Provider data can vary by deployment configuration and provider plan.
- Some demo rows use structured fallback/mock data and are labeled accordingly.
- BYMA, IOL, PPI and CNV live market integrations remain future work.
- No direct investment recommendation wording is used.

