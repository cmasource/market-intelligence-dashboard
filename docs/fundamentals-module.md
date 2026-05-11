# Fundamentals Module

## Purpose

Sprint 7 adds the first fundamentals data layer for CMA Market Intelligence. It introduces provider-based fundamentals for selected USA stocks and ETFs while preserving fallback mock behavior and keeping the internal financial engine intact.

## Provider Abstraction

Fundamentals data flows through `lib/fundamentals-data/fundamentals-service.ts`.

Provider modules:

- `mock-provider.ts`: reuses existing mock asset fundamentals.
- `yahoo-fundamentals-provider.ts`: MVP Yahoo-compatible fundamentals adapter.
- `fundamentals-score.ts`: conservative score and interpretation builder.
- `symbol-map.ts`: controls which symbols can attempt provider fundamentals.

UI components do not fetch provider data directly.

## Sprint 7 Supported Symbols

Provider attempt:

- `AAPL`
- `SPY`
- `QQQ`

Fallback/non-applicable behavior:

- `GGAL`
- `YPFD`
- `BTC-USD`
- `ETH-USD`
- `AL30`
- `GD30`
- `TX26`
- Unknown symbols

## Metrics Normalized

- Market price.
- Market cap.
- Enterprise value.
- Trailing P/E.
- Forward P/E.
- P/B.
- P/S.
- PEG.
- EPS.
- Book value per share.
- ROE.
- ROA.
- Gross margin.
- Operating margin.
- EBITDA margin.
- Net margin.
- Revenue growth.
- Earnings growth.
- Debt/equity.
- Current ratio.
- Quick ratio.
- Dividend yield.
- Beta.
- 52-week high.
- 52-week low.
- Currency.

Percent-style provider values are normalized to decimals where appropriate.

## Score Methodology

The score is a conservative 0 to 100 MVP score. It uses:

- Profitability: ROE, ROA and margins.
- Valuation: P/E, forward P/E, P/B and PEG.
- Growth: revenue and earnings growth.
- Financial risk/liquidity: debt/equity, current ratio and quick ratio.
- Market profile: beta, dividend yield and 52-week range context.

The score is not a buy or sell recommendation.

## Current Limitations

- Yahoo-compatible data is an MVP public adapter, not a licensed production fundamentals feed.
- ETF fundamentals can be limited or sparse.
- No BYMA, IOL, CNV, AIF or Argentine real fundamentals are integrated yet.
- No Argentine bond fundamentals are integrated.
- No historical fundamentals or quarterly trend analysis yet.

## Future Improvements

- SEC EDGAR company facts.
- CNV/AIF Argentina statements.
- Sector comparisons.
- Historical fundamentals.
- Quarterly trends.
- Valuation bands.
- Peer comparison.
- Quality of earnings.
- Cash flow metrics.
