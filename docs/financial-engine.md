# CMA Market Intelligence Financial Engine

## Purpose

The financial engine is the first internal calculation layer for CMA Market Intelligence. It translates spreadsheet-style financial education logic into deterministic, reusable TypeScript modules that can later power dashboards, asset reports, AI summaries and screening workflows.

The engine is created for the CMA Consulting platform and technologically developed by cma_source. It uses mock inputs for now and does not connect to external APIs.

## Implemented Modules

### Fundamentals

File: `lib/finance/fundamentals.ts`

Implemented ratios:

- ROE
- ROA
- EBITDA margin
- EPS/BPA
- P/E
- Book value per share
- Price to book
- Dividend yield

### Bonds

File: `lib/finance/bonds.ts`

Implemented analytics:

- Annual coupon
- Coupon per period
- Total periods
- Current yield
- Parity
- Bullet-bond cash flow schedule
- Present value of a cash flow
- Estimated YTM/TIR using bisection
- Macaulay duration
- Modified duration

### CAPM and Beta

File: `lib/finance/capm.ts`

Implemented calculations:

- Market risk premium
- CAPM expected return
- Mean
- Covariance
- Variance
- Beta

### Trade Result

File: `lib/finance/trade-result.ts`

Implemented calculations:

- Gross purchase amount
- Gross sale amount
- Buy commission
- Sell commission
- Total cost
- Net sale proceeds
- Gross profit
- Net profit
- Total return
- Annualized return

### Technical Indicators

File: `lib/finance/technical.ts`

Implemented indicators:

- Simple returns
- SMA
- EMA
- RSI
- MACD line
- MACD signal line
- MACD histogram

### Interpretation Helpers

File: `lib/finance/interpretation.ts`

Implemented helpers:

- ROE interpretation
- ROA interpretation
- P/E interpretation
- Risk placeholder interpretation
- Bond YTM interpretation
- Bond duration interpretation
- RSI interpretation
- Technical score interpretation
- Fundamental score interpretation

## Formula List

### Fundamental Ratios

- ROE = Net Income / Equity
- ROA = Net Income / Total Assets
- EBITDA Margin = EBITDA / Revenue
- EPS = Net Income / Shares Outstanding
- P/E = Market Price / EPS
- Book Value Per Share = Book Value / Shares Outstanding
- P/B = Market Price / Book Value Per Share
- Dividend Yield = Dividends Per Share / Market Price

### Bonds

- Annual Coupon = Face Value * Annual Coupon Rate
- Coupon Per Period = Face Value * Annual Coupon Rate / Payments Per Year
- Total Periods = Years To Maturity * Payments Per Year
- Current Yield = Annual Coupon / Market Price
- Parity = Market Price / Face Value
- Present Value = Cash Flow / (1 + Rate Per Period) ^ Period
- Modified Duration = Macaulay Duration / (1 + Annual Yield / Payments Per Year)

### CAPM and Beta

- Market Risk Premium = Market Return - Risk Free Rate
- Expected Return = Risk Free Rate + Beta * Market Risk Premium
- Beta = Covariance(Asset Returns, Market Returns) / Variance(Market Returns)

### Trade Result

- Gross Purchase Amount = Buy Price * Quantity
- Gross Sale Amount = Sell Price * Quantity
- Commission = Amount * Commission Rate
- Total Cost = Gross Purchase Amount + Buy Commission
- Net Sale Proceeds = Gross Sale Amount - Sell Commission - Taxes
- Gross Profit = Gross Sale Amount - Gross Purchase Amount
- Net Profit = Net Sale Proceeds - Total Cost + Dividends Received
- Total Return = Net Profit / Total Cost
- Annualized Return = (1 + Total Return) ^ (365 / Holding Days) - 1

### Technical Indicators

- Simple Return = Current Price / Previous Price - 1
- SMA = Average price over selected period
- EMA = Exponential moving average with recent-price weighting
- RSI = 100 - 100 / (1 + Average Gain / Average Loss)
- MACD = EMA fast - EMA slow
- MACD Histogram = MACD line - Signal line

## Current Assumptions

- Outputs use decimal values for rates and returns.
- Example: `0.12` means `12%`.
- Invalid or unavailable calculations return `null`.
- Fundamentals use simplified statement inputs.
- Bond module assumes bullet bonds.
- Bond module assumes constant coupons.
- Bond module does not include accrued interest yet.
- Bond module does not include CER adjustment yet.
- Bond module does not include amortizing schedules yet.
- Bond module does not include settlement-date precision yet.
- Technical indicators use simple deterministic arrays and return `null` where history is insufficient.

## Current Limitations

- No real market data.
- No real financial statements.
- No real OHLCV feeds.
- No API integration.
- No database persistence.
- No sector comparison engine.
- No backtesting framework.
- No portfolio-level analytics.
- No tax jurisdiction modeling.
- No broker-specific fee model.

## Future Improvements

- CER bond adjustment.
- Accrued interest.
- Amortizing bonds.
- Clean price vs dirty price.
- Convexity.
- Sector comparisons.
- Historical fundamentals.
- Real OHLCV data.
- Real API integration.
- Backtesting.
- Scenario analysis.
- Agent-ready financial explanations.
