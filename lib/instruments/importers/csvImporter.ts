import type { Instrument, InstrumentAssetClass, InstrumentMarket } from "../types";
import type { InstrumentImportResult, InstrumentImporter } from "./base";

function parseLine(line: string) {
  return line.split(",").map((value) => value.trim());
}

export function importInstrumentsFromCsv(csv: string): InstrumentImportResult {
  const [headerLine, ...rows] = csv.trim().split(/\r?\n/);
  const headers = parseLine(headerLine ?? "");
  const instruments: Instrument[] = [];
  const warnings: string[] = [];

  for (const [index, row] of rows.entries()) {
    const values = parseLine(row);
    const record = Object.fromEntries(headers.map((header, valueIndex) => [header, values[valueIndex] ?? ""]));
    if (!record.id || !record.symbol || !record.name) {
      warnings.push(`Fila ${index + 2}: faltan id, symbol o name.`);
      continue;
    }
    instruments.push({
      id: record.id,
      symbol: record.symbol,
      displaySymbol: record.displaySymbol || record.symbol,
      name: record.name,
      assetClass: (record.assetClass || "stock") as InstrumentAssetClass,
      market: (record.market || "global") as InstrumentMarket,
      exchange: record.exchange || "Unknown",
      country: record.country || "Unknown",
      currency: record.currency || "USD",
      providerSymbol: record.providerSymbol || record.symbol,
      tradingViewSymbol: record.tradingViewSymbol || record.symbol,
      tags: record.tags ? record.tags.split("|") : [],
      dataCapabilities: ["unsupported"],
      warnings: [],
      source: "csv",
      enabled: record.enabled !== "false",
    });
  }

  return { instruments, warnings, source: "csv" };
}

export const csvImporter = (csv: string): InstrumentImporter => ({
  name: "csv-instruments",
  async import() {
    return importInstrumentsFromCsv(csv);
  },
});
