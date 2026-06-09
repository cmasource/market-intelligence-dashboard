# CNV Documents Layer

Sprint 24 adds the first CNV/Argentina documents intelligence layer for CMA Market Intelligence.

## Purpose

The CNV layer prepares local Argentine equities for issuer and document context:

- issuer registry;
- financial statement placeholders;
- relevant event placeholders;
- corporate document structure;
- future official CNV integration status.

## What It Does

- Registers initial BYMA issuers such as GGAL, YPFD, PAMP, TXAR, ALUA, TGSU2, CEPU, COME, BYMA, SUPV and VALO.
- Provides structured demo documents for selected issuers.
- Exposes safe API routes under `/api/cnv`.
- Adds issuer/document context to Argentine asset pages, the Argentina page, data audit and reports.

## What It Does Not Do

- It does not scrape CNV, brokers or private endpoints.
- It does not add authentication.
- It does not add a database.
- It does not provide live prices.
- It does not claim demo documents are official filings.

## Source Status

Current source labels:

- Structured demo document
- Future CNV integration
- Manual document load
- Unavailable

`isOfficialSource` remains `false` for demo documents. Future official integration can flip this only when the source is validated and compliant.

## Future Integration Path

Future versions can connect official or public CNV sources if available and compliant. The layer should keep issuer metadata, document metadata and live market prices separate.
