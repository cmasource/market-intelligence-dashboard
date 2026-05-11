# Fixed Income Module

## Purpose

The fixed income module adds structured bond analytics for CMA Market Intelligence while keeping all Argentine fixed income data mock-based for now. It is designed under CMA Consulting and developed by cma_source as a provider-ready layer that can later receive official bond terms, prices and calendars.

## Current Supported Instruments

- `AL30`: Bonar 2030.
- `GD30`: Global 2030.
- `TX26`: CER-linked Argentine Treasury Bond.

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
- Market price is treated as clean price unless dirty price is provided.
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
