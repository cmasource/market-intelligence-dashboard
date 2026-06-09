# Sprint 24: CNV Documents Intelligence

Sprint 24 introduces a first structured CNV document layer for Argentina coverage.

## Delivered

- `lib/cnv` module with types, issuer registry, demo documents, source status and service helpers.
- API routes:
  - `/api/cnv/issuer/[symbol]`
  - `/api/cnv/documents/[symbol]`
  - `/api/cnv/documents`
  - `/api/cnv/status`
- CNV issuer and document UI components.
- Argentine asset page CNV context in the secondary detail zone.
- Argentina page section for CNV issuers and documents.
- Data audit and methodology coverage for CNV status.
- Asset Intelligence Report compact CNV context for local issuers.

## Safety Rules

- No API keys are used.
- No scraping is implemented.
- No database is added.
- Demo documents are clearly labeled as structured placeholders.
- CNV is positioned for filings, relevant events and issuer context, not live market prices.

## Remaining Work

- Add validated manual document metadata imports.
- Integrate official/public CNV sources only when a compliant access path is confirmed.
- Expand document coverage and issuer mappings.
- Add richer document summaries when official data is available.
