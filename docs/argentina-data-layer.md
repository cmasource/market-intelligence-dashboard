# Argentina Data Layer

CMA Market Intelligence now has a first Argentina data layer under `lib/argentina`.

## Purpose

The layer prepares the platform for real local market coverage while keeping the public demo safe and deployable on Vercel. It does not scrape brokers and does not connect live BYMA, IOL, PPI or CNV APIs yet.

## Provider Order

1. Validated manual JSON quotes.
2. Structured mock fallback for known Argentina instruments.
3. Future BYMA, CNV, broker or licensed-provider placeholders.
4. Unavailable result.

Manual data is marked as real but not real-time. Mock data is clearly labeled as structured simulation.

## Initial Coverage

The registry includes Argentine equities, sovereign bond species, a sample Lecap and CEDEAR references. Bond species keep quote currency separate from settlement/species context, preserving the Sprint 16.2 conventions.

## Market Presentation

Sprint 23 adds a more useful Argentina market panel:

- local market snapshot;
- sovereign bond cards;
- Argentine equity cards;
- featured CEDEAR cards;
- source and limitation badges.

The Argentina page now uses the local quote layer first, then falls back to structured simulation or future integration labels. Detailed provider limitations remain visible, but compact source badges keep the user interface readable.

## Current Limits

- BYMA integration is future-scoped and may require access, licensing or homologation.
- CNV is planned for filings, relevant facts and fundamentals, not live intraday quotes.
- IOL/PPI or other broker/API integrations require authorization.
- No unauthorized scraping is part of this architecture.
