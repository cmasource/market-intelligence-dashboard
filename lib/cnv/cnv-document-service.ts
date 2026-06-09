import { cnvIssuers, getCnvIssuerFromRegistry, normalizeCnvSymbol } from "./cnv-issuer-registry";
import { cnvMockDocuments } from "./cnv-mock-documents";
import { cnvSourceStatus } from "./cnv-source-status";
import type { CnvDocument } from "./cnv-types";

function byPublishedAtDesc(a: CnvDocument, b: CnvDocument) {
  return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
}

export function getCnvIssuer(symbol: string) {
  return getCnvIssuerFromRegistry(symbol);
}

export function getCnvDocumentsForSymbol(symbol: string) {
  const normalized = normalizeCnvSymbol(symbol);
  return cnvMockDocuments
    .filter((document) => document.symbol === normalized)
    .sort(byPublishedAtDesc);
}

export function getLatestCnvDocuments(limit = 8) {
  return [...cnvMockDocuments].sort(byPublishedAtDesc).slice(0, Math.max(0, limit));
}

export function getCnvSourceStatus() {
  return {
    sources: cnvSourceStatus,
    issuers: cnvIssuers,
    documentsCount: cnvMockDocuments.length,
    officialIntegrationEnabled: false,
  };
}

export function hasCnvIssuer(symbol: string) {
  return Boolean(getCnvIssuer(symbol));
}
