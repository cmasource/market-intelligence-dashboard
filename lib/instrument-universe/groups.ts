import { instrumentUniverse } from "./universe";
import type { InstrumentUniverseItem } from "./types";

type InstrumentUniverseGroupId =
  | "argentine_equities"
  | "argentine_adrs"
  | "cedears"
  | "sovereign_bonds"
  | "etfs"
  | "usa_stocks"
  | "crypto";

type InstrumentUniverseGroup = {
  id: InstrumentUniverseGroupId;
  title: string;
  description: string;
  instruments: InstrumentUniverseItem[];
};

function byPriority(left: InstrumentUniverseItem, right: InstrumentUniverseItem) {
  return (right.priority ?? 0) - (left.priority ?? 0) || left.symbol.localeCompare(right.symbol);
}

function buildGroup(
  id: InstrumentUniverseGroupId,
  language: "en" | "es",
  predicate: (instrument: InstrumentUniverseItem) => boolean,
): InstrumentUniverseGroup {
  const labels: Record<InstrumentUniverseGroupId, Record<"en" | "es", { title: string; description: string }>> = {
    argentine_equities: {
      en: {
        title: "Argentine equities",
        description: "Initial local equity universe prepared for future BYMA coverage.",
      },
      es: {
        title: "Acciones argentinas",
        description: "Universo inicial de acciones locales preparado para futura cobertura BYMA.",
      },
    },
    cedears: {
      en: {
        title: "CEDEARs",
        description: "CEDEAR references prepared for ADR, ratio and CCL mapping.",
      },
      es: {
        title: "CEDEARs",
        description: "Referencias CEDEAR preparadas para mapeo de ADR, ratios y CCL.",
      },
    },
    argentine_adrs: {
      en: {
        title: "Argentine ADRs",
        description: "Argentine companies listed abroad, with provider-backed quote and technical analysis when available.",
      },
      es: {
        title: "ADRs argentinos",
        description: "Empresas argentinas listadas afuera, con cotizacion y analisis tecnico de proveedor cuando esta disponible.",
      },
    },
    sovereign_bonds: {
      en: {
        title: "Sovereign bonds and species",
        description: "Peso, dollar MEP, cable/CCL and CER-linked instruments with local quotes when a configured source responds.",
      },
      es: {
        title: "Bonos soberanos y especies",
        description: "Instrumentos argentinos en pesos, dolar MEP, cable/CCL y CER, con precios locales cuando la fuente responde.",
      },
    },
    etfs: {
      en: {
        title: "ETFs",
        description: "ETF examples prepared for global and local market workflows.",
      },
      es: {
        title: "ETFs",
        description: "Ejemplos de ETFs preparados para flujos globales y locales.",
      },
    },
    usa_stocks: {
      en: {
        title: "USA stocks",
        description: "Selected USA equities with available price and analysis coverage.",
      },
      es: {
        title: "Acciones USA",
        description: "Acciones de Estados Unidos con cobertura disponible de precio y analisis.",
      },
    },
    crypto: {
      en: {
        title: "Crypto",
        description: "Crypto roadmap from BTC and ETH toward a broader top 50 universe.",
      },
      es: {
        title: "Cripto",
        description: "Hoja de ruta cripto desde BTC y ETH hacia un universo top 50.",
      },
    },
  };

  return {
    id,
    title: labels[id][language].title,
    description: labels[id][language].description,
    instruments: instrumentUniverse.filter(predicate).sort(byPriority),
  };
}

export function getInstrumentUniverseGroups(language: "en" | "es" = "en") {
  return [
    buildGroup(
      "argentine_equities",
      language,
      (instrument) => instrument.country === "AR" && instrument.category === "equity",
    ),
    buildGroup("cedears", language, (instrument) => instrument.category === "cedear"),
    buildGroup(
      "argentine_adrs",
      language,
      (instrument) => instrument.category === "adr",
    ),
    buildGroup(
      "sovereign_bonds",
      language,
      (instrument) =>
        instrument.category === "sovereign_bond" ||
        instrument.category === "global_bond" ||
        instrument.category === "cer_bond" ||
        instrument.category === "dollar_linked_bond",
    ),
    buildGroup("etfs", language, (instrument) => instrument.category === "etf"),
    buildGroup(
      "usa_stocks",
      language,
      (instrument) => instrument.country === "US" && instrument.category === "equity",
    ),
    buildGroup("crypto", language, (instrument) => instrument.category === "crypto"),
  ];
}
