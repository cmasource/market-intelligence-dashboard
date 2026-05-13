# Manual Fundamental Validation

This guide helps compare CMA Market Intelligence fundamentals with Yahoo Finance, company filings and other financial platforms.

## AAPL Example

1. Open `/asset/AAPL`.
2. Review the fundamental source label.
3. Compare the displayed metrics against Yahoo Finance, company filings or another financial data platform.
4. Check:
   - P/E
   - Forward P/E
   - P/B
   - EPS
   - ROE
   - ROA
   - Margins
   - Dividend yield
   - Beta
   - 52-week range

## Expected Differences

- Trailing vs forward metrics.
- TTM vs annual data.
- Provider update frequency.
- GAAP vs adjusted metrics.
- ETF fundamentals differ from company fundamentals.
- Missing provider values may trigger fallback mock fundamentals.

## Argentina Limitation

Spanish: Los fundamentos de acciones argentinas, CEDEARs y balances CNV todavía no están integrados como fuente real en esta demo.

English: Argentine equity fundamentals, CEDEAR fundamentals and CNV filings are not yet integrated as real sources in this demo.

## Current Scope

Provider fundamentals are attempted for selected USA stocks and ETFs through the existing fallback-safe fundamentals layer. Crypto and fixed income instruments use non-applicable messaging for equity fundamentals.

This validation process is informational only and does not constitute investment advice.
