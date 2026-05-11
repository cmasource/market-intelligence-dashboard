# Financial Engine Validation

## Summary

The Sprint 3 internal financial engine was reviewed as a deterministic calculation layer for CMA Market Intelligence. The reviewed implementation is mathematically reasonable for MVP mock-data use and keeps the current CMA Consulting / cma_source scope: no external APIs, no authentication and no database.

## Modules Reviewed

- `lib/finance/fundamentals.ts`
- `lib/finance/bonds.ts`
- `lib/finance/capm.ts`
- `lib/finance/trade-result.ts`
- `lib/finance/technical.ts`
- `lib/finance/interpretation.ts`
- `lib/finance/index.ts`
- `types/finance.ts`

## Test Cases Included

- Fundamental ratios using deterministic statement and market inputs.
- CAPM expected return and beta.
- Trade result with commissions, dividends, taxes and 365-day annualization.
- Bullet bond coupon, cash-flow, current-yield, parity, YTM, Macaulay duration and modified duration checks.
- Technical simple returns, SMA, EMA, RSI and MACD sanity checks.
- Error handling for zero denominators and empty arrays.

## Formulas Validated

- ROE = Net Income / Equity
- ROA = Net Income / Total Assets
- EBITDA Margin = EBITDA / Revenue
- EPS = Net Income / Shares Outstanding
- P/E = Market Price / EPS
- Book Value Per Share = Book Value / Shares Outstanding
- P/B = Market Price / Book Value Per Share
- Dividend Yield = Dividends Per Share / Market Price
- Annual Coupon = Face Value * Annual Coupon Rate
- Coupon Per Period = Face Value * Annual Coupon Rate / Payments Per Year
- Current Yield = Annual Coupon / Market Price
- Parity = Market Price / Face Value
- Present Value = Cash Flow / (1 + Rate Per Period) ^ Period
- Estimated YTM = annual rate that equates discounted bullet-bond cash flows to market price
- Macaulay Duration = present-value-weighted average time to cash-flow receipt
- Modified Duration = Macaulay Duration / (1 + Annual Yield / Payments Per Year)
- Market Risk Premium = Market Return - Risk Free Rate
- Expected Return = Risk Free Rate + Beta * Market Risk Premium
- Beta = Covariance(Asset Returns, Market Returns) / Variance(Market Returns)
- Gross Purchase Amount = Buy Price * Quantity
- Gross Sale Amount = Sell Price * Quantity
- Commission = Gross Amount * Commission Rate
- Total Cost = Gross Purchase Amount + Buy Commission
- Net Sale Proceeds = Gross Sale Amount - Sell Commission - Taxes
- Gross Profit = Gross Sale Amount - Gross Purchase Amount
- Net Profit = Net Sale Proceeds - Total Cost + Dividends Received
- Total Return = Net Profit / Total Cost
- Annualized Return = (1 + Total Return) ^ (365 / Holding Days) - 1
- Simple Return = Current Price / Previous Price - 1
- SMA = arithmetic average over the selected window
- EMA = exponential moving average using multiplier 2 / (period + 1)
- RSI = 100 - 100 / (1 + Average Gain / Average Loss)
- MACD = Fast EMA - Slow EMA
- MACD Histogram = MACD Line - Signal Line

## Assumptions

- Rates and returns are decimals, so `0.12` means 12%.
- Invalid or unavailable calculations return `null` or safe empty/aligned arrays according to module design.
- Bond analytics assume bullet bonds, fixed coupons and no accrued interest.
- YTM is estimated numerically by bisection.
- Technical indicators are deterministic and return `null` before enough history is available.
- `calculateSimpleReturns` returns an input-aligned array with the first value as `null`, rather than a shorter `prices.length - 1` array.
- Beta uses sample covariance and sample variance with denominator `n - 1`; the denominator cancels in beta when both series have the same length.

## Limitations

- No real market, broker, financial statement or OHLCV feed is connected.
- No sector normalization, inflation adjustment, tax jurisdiction logic or broker-specific fee model is included.
- Bond calculations do not yet include clean/dirty price, settlement-date precision, accrued interest, CER adjustment, amortizing schedules or convexity.
- RSI uses a simple rolling average approach rather than Wilder smoothing.
- MACD signal starts after enough compact MACD values are available, then maps back to the original price-aligned series.

## Known Issues

- No blocking formula issues were found in the reviewed Sprint 3 engine.
- The technical module documents simple returns through behavior: it returns an aligned array with first value `null`. Future consumers should account for this shape.

## Next Recommendations

- Keep these deterministic validation cases as a pre-integration guard before connecting real data.
- Add fixture-based tests when real statement, bond and OHLCV schemas are introduced.
- Add explicit data-normalization functions before accepting external market data.
- Extend fixed-income analytics with accrued interest, clean/dirty price and convexity before production-grade bond reporting.
