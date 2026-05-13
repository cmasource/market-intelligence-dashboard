# Fixed Income Module

## Purpose

The fixed income module adds structured bond analytics for CMA Market Intelligence while keeping all Argentine fixed income data mock-based for now. It is designed under CMA Consulting and developed by cma_source as a provider-ready layer that can later receive official bond terms, prices and calendars.

## Current Supported Instruments

- `AL30`, `AL30D`, `AL30C`: Bonar 2030 peso, dollar MEP and dollar cable/CCL species.
- `GD30`, `GD30D`, `GD30C`: Global 2030 peso, dollar MEP and dollar cable/CCL species.
- `TX26`: CER-linked Argentine Treasury bond.

## Price Conventions

- Price lines show only price plus quote currency: `ARS` or `USD`.
- MEP, cable/CCL and CER are market context labels, not price currencies.
- Peso species use `marketDisplayPrice` for realistic local mock ARS prices.
- Analytics use `analyticalPrice`, a normalized bond price compatible with current parity, yield and duration calculations.

## Calculated Metrics

- Clean price.
- Dirty price.
- Accrued interest.
- Current yield.
- Parity.
- Estimated YTM / TIR.
- Macaulay duration.
- Modified duration.
- Convexity.
- Cash flows.
- Risk profile.

## Assumptions

- All data is structured mock data.
- No BYMA, IOL or CNV integration is active.
- Market display prices are simulated until a licensed data source is enabled.
- Normalized analytical prices are used for current fixed income calculations.
- Accrued interest is simplified because precise settlement dates and coupon calendars are not available.
- Cash flows use simplified bullet, amortizing or zero-coupon logic.
- CER-linked treatment uses a placeholder coefficient and is not full real indexation.
- Amortization schedules are simplified and do not claim to match official bond terms.

## Limitations

- No real Argentine bond prices.
- No official term sheets.
- No actual coupon calendars.
- No real settlement-date precision.
- No clean/dirty market convention detection.
- No sovereign curve, spread analysis or scenario analysis yet.
- Convexity is an MVP approximation.

## Future Improvements

- BYMA integration.
- IOL API integration.
- Real bond terms.
- Actual coupon calendars.
- Accrued interest precision.
- Clean vs dirty market convention handling.
- Full CER adjustment.
- Dollar-linked adjustment.
- Real amortization schedules.
- Corporate bonds and ONs.
- Lecaps and letras.
- Provincial bonds.
- Sovereign curve construction.
- Spread analysis.
- Scenario analysis.
- Rate shock sensitivity.
- Cash-flow visualization.

## Disclaimer

This module provides informational analytics only and does not constitute investment advice.
