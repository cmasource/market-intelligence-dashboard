# Argentina Data Layer

CMA Market Intelligence now has a first Argentina data layer under `lib/argentina`.

## Purpose

The layer prepares the platform for real local market coverage while keeping the public demo safe and deployable on Vercel. The cauciones module has a dedicated public market-table adapter; the broader Argentina quote layer still does not depend on live BYMA, PPI or CNV APIs.

## Provider Order

1. Current public invertirOnline cauciones table.
2. Current-session PPI public cauciones page, when available.
3. Validated manual JSON quotes for other Argentina instruments.
4. Structured mock fallback for known Argentina instruments.
5. Unavailable result.

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

## CNV Documents Layer

Sprint 24 adds a first CNV document intelligence layer for Argentine issuers. It registers local issuers and structured demo documents for financial statements, relevant events and corporate context.

CNV remains separate from quote data:

- CNV is for issuer filings, relevant events and corporate documents.
- BYMA, IOL, PPI or licensed providers remain future paths for market prices.
- Current CNV documents are structured placeholders unless explicitly marked otherwise.

## Current Limits

- BYMA integration is future-scoped and may require access, licensing or homologation.
- CNV is planned for filings, relevant facts and fundamentals, not live intraday quotes.
- Authorized IOL/PPI or other broker/API integrations remain separate from the public cauciones adapter.
- The cauciones adapter reads the public table only and rejects stale sessions; it does not access private accounts or trading endpoints.
