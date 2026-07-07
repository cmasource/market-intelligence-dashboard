import type { InstrumentImporter } from "./base";

export const bymaInstrumentsImporter: InstrumentImporter = {
  name: "byma-instruments",
  async import() {
    return {
      instruments: [],
      warnings: ["BYMA instruments importer preparado. Pendiente mapear endpoint oficial de maestro de instrumentos."],
      source: "byma",
    };
  },
};
