export type CnvSourceStatus = "future" | "manual" | "mock" | "unavailable";

export type CnvDocumentSource = "structured_demo" | "cnv_future" | "manual" | "unavailable";

export type CnvDocumentType =
  | "financial_statement"
  | "relevant_event"
  | "annual_report"
  | "board_decision"
  | "corporate_action"
  | "prospectus"
  | "rating"
  | "other";

export type CnvIssuer = {
  symbol: string;
  issuerName: string;
  market: "BYMA" | "MAE" | "local";
  sector?: string;
  cnvProfileUrl?: string | null;
  website?: string | null;
  localTicker: string;
  relatedCedears?: string[];
  relatedAdr?: string;
  sourceStatus: CnvSourceStatus;
};

export type CnvDocument = {
  id: string;
  symbol: string;
  issuerName: string;
  documentType: CnvDocumentType;
  title: string;
  publishedAt: string;
  period?: string;
  source: CnvDocumentSource;
  sourceLabel: string;
  url?: string | null;
  isOfficialSource: boolean;
  isMock: boolean;
  summary?: string;
};

export type CnvSourceStatusEntry = {
  source: CnvDocumentSource;
  enabled: boolean;
  mode: "structured_demo" | "manual" | "future" | "unavailable";
  label: string;
  notes: string;
};
