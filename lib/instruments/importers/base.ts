import type { Instrument } from "../types";

export type InstrumentImportResult = {
  instruments: Instrument[];
  warnings: string[];
  source: string;
};

export interface InstrumentImporter {
  name: string;
  import(): Promise<InstrumentImportResult>;
}
