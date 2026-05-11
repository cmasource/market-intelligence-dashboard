# Argentina Bond Species

## Purpose

This document explains the initial mock model for Argentine bond trading species in CMA Market Intelligence.

## AL30 Species

- `AL30`: peso trading species.
- `AL30D`: dollar MEP species.
- `AL30C`: dollar cable/CCL species.

All three symbols refer to the same AL30 underlying bond but differ in trading currency and settlement context.

## GD30 Species

- `GD30`: peso trading species.
- `GD30D`: dollar MEP species.
- `GD30C`: dollar cable/CCL species.

All three symbols refer to the same GD30 underlying bond but differ in trading currency and settlement context.

## TX26

`TX26` is modeled as a CER-linked ARS bond. It does not currently have related dollar species in the mock universe.

## Current Data Status

Current values are mock structured data. They are not official prices, official terms or production bond analytics.

## Future Integration Plan

- BYMA market data.
- IOL or licensed broker/provider data.
- CNV/AIF documents and official terms.
- Actual coupon calendars.
- Clean and dirty price conventions.
- MEP/CCL and arbitrage relations.
