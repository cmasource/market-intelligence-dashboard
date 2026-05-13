# Implied CCL Methodology

## Ratio Convention

For this demo, the CEDEAR ratio is defined as the number of CEDEARs equivalent to one underlying share.

Example: a ratio of `20` means 20 CEDEARs represent one underlying share.

## Formula

```text
implied CCL = local CEDEAR ARS price * ratio / underlying USD price
```

## Spread

```text
spread = implied CCL / reference CCL - 1
```

## Safety Rules

- Invalid, missing, zero or negative inputs return `null`.
- Calculations never throw uncontrolled runtime errors.
- The result is informational and not a trading recommendation.

## Current Limitation

The local CEDEAR price, CEDEAR ratio and reference CCL are simulated until BYMA/IOL or licensed-provider integration is enabled.
