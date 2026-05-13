# Argentina Bond Species

## Purpose

This document explains the current mock model for Argentine bond trading species in CMA Market Intelligence.

## Core Model

- `tradingSymbol`: the listed species users search or open, such as `AL30D`.
- `underlyingSymbol`: the base bond family, such as `AL30`.
- `speciesType`: pesos, dollar MEP species, dollar cable/CCL species or CER bond.
- `quoteCurrency`: the currency printed in the price line, currently `ARS` or `USD`.
- `settlementContext`: the market context shown separately from the price, such as `Dólar MEP` or `Ajustado por CER`.

## AL30 Species

- `AL30`: peso species, price line `58,400 ARS`, context `Especie en pesos`.
- `AL30D`: dollar MEP species, price line `58.40 USD`, context `Especie dólar MEP`.
- `AL30C`: dollar cable/CCL species, price line `57.90 USD`, context `Especie dólar cable/CCL`.

All three symbols refer to the same AL30 underlying bond but differ in species and settlement context.

## GD30 Species

- `GD30`: peso species, price line `92,300 ARS`, context `Especie en pesos`.
- `GD30D`: dollar MEP species, price line `61.70 USD`, context `Especie dólar MEP`.
- `GD30C`: dollar cable/CCL species, price line `61.20 USD`, context `Especie dólar cable/CCL`.

All three symbols refer to the same GD30 underlying bond but differ in species and settlement context.

## TX26

`TX26` is modeled as a CER-linked ARS bond. Its price line is `142.80 ARS`; CER is shown as indexation context, not as a price currency.

## Visible vs Analytical Price

Peso species use realistic-looking local mock prices for display while preserving normalized analytical prices for fixed income metrics.

- `marketDisplayPrice`: visible local price shown in UI.
- `analyticalPrice`: normalized price used for parity, YTM, duration, modified duration and convexity.

## Current Data Status

Precios simulados hasta habilitar integración con BYMA/IOL o proveedor licenciado.

Mock prices until BYMA/IOL or licensed provider integration is enabled.

## Future Integration Plan

- BYMA market data.
- IOL or licensed broker/provider data.
- CNV/AIF documents and official terms.
- Actual coupon calendars.
- Clean and dirty price conventions.
- MEP/CCL and arbitrage relations.
