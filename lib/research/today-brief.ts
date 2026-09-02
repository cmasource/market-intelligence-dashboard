import type { NewsArticle } from "@/lib/news";

export type TodayBriefLanguage = "en" | "es";
export type TodayBriefTone = "constructive" | "neutral" | "cautious";
export type TodayBriefMethod = "openai" | "deterministic";

export type TodayMarketSnapshot = {
  symbol: string;
  label: string;
  market: "international" | "argentina" | "crypto";
  price: number | null;
  dailyChange: number | null;
  weeklyChange: number | null;
  currency: string;
  sourceLabel: string;
  observedAt: string | null;
};

export type TodayBriefSection = {
  headline: string;
  summary: string;
  points: string[];
};

export type TodayBriefNarrative = {
  title: string;
  deck: string;
  tone: TodayBriefTone;
  toneLabel: string;
  day: TodayBriefSection;
  week: TodayBriefSection;
  international: TodayBriefSection;
  argentina: TodayBriefSection;
  outlook: TodayBriefSection;
  recommendedStance: {
    label: string;
    rationale: string;
    actions: string[];
    invalidation: string;
  };
  watchlist: string[];
  risks: string[];
};

export type TodayBriefSource = {
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string;
  market: "international" | "argentina";
};

export type TodayBrief = TodayBriefNarrative & {
  generatedAt: string;
  method: TodayBriefMethod;
  model?: string;
  snapshots: TodayMarketSnapshot[];
  sources: TodayBriefSource[];
  coverage: {
    availableSnapshots: number;
    totalSnapshots: number;
    internationalHeadlines: number;
    argentinaHeadlines: number;
  };
  disclaimer: string;
};

function finiteAverage(values: Array<number | null>) {
  const usable = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return usable.length ? usable.reduce((total, value) => total + value, 0) / usable.length : null;
}

function direction(value: number | null, language: TodayBriefLanguage) {
  if (value === null) return language === "es" ? "sin una señal agregada confiable" : "without a reliable aggregate signal";
  if (value > 0.45) return language === "es" ? "con sesgo positivo" : "with a positive bias";
  if (value < -0.45) return language === "es" ? "bajo presión" : "under pressure";
  return language === "es" ? "mixto y sin dirección dominante" : "mixed and without a dominant direction";
}

function compactHeadlines(articles: NewsArticle[], limit = 3) {
  return articles.slice(0, limit).map((article) => article.title).filter(Boolean);
}

export function buildDeterministicTodayNarrative(
  language: TodayBriefLanguage,
  snapshots: TodayMarketSnapshot[],
  internationalNews: NewsArticle[],
  argentinaNews: NewsArticle[],
): TodayBriefNarrative {
  const global = snapshots.filter((item) => item.market !== "argentina");
  const local = snapshots.filter((item) => item.market === "argentina");
  const globalDay = finiteAverage(global.map((item) => item.dailyChange));
  const globalWeek = finiteAverage(global.map((item) => item.weeklyChange));
  const localDay = finiteAverage(local.map((item) => item.dailyChange));
  const combinedDay = finiteAverage([globalDay, localDay]);
  const tone: TodayBriefTone = combinedDay === null ? "neutral" : combinedDay > 0.6 ? "constructive" : combinedDay < -0.6 ? "cautious" : "neutral";
  const globalHeadlines = compactHeadlines(internationalNews);
  const localHeadlines = compactHeadlines(argentinaNews);

  if (language === "en") {
    return {
      title: "Markets today: the signal behind the noise",
      deck: `International assets are ${direction(globalDay, language)}, while Argentina trades ${direction(localDay, language)}. The useful reading is to separate confirmed price action from headline risk.`,
      tone,
      toneLabel: tone === "constructive" ? "Constructive with discipline" : tone === "cautious" ? "Defensive caution" : "Selective neutrality",
      day: {
        headline: "What is moving the session",
        summary: `The available cross-market sample is ${direction(combinedDay, language)}. Short-term decisions should privilege confirmation over anticipation.`,
        points: [...globalHeadlines.slice(0, 2), ...localHeadlines.slice(0, 2)].slice(0, 4),
      },
      week: {
        headline: "The week in perspective",
        summary: `The international sample is ${direction(globalWeek, language)} over the latest five sessions. Local headlines remain especially sensitive to rates, FX expectations and sovereign risk.`,
        points: [...globalHeadlines, ...localHeadlines].slice(0, 4),
      },
      international: {
        headline: "Global context",
        summary: `Equities, duration and crypto are sending a ${direction(globalDay, language)} message. Watch whether breadth and bonds confirm the move instead of relying on a single index.`,
        points: globalHeadlines,
      },
      argentina: {
        headline: "Argentina context",
        summary: `The local sample is ${direction(localDay, language)}. The key transmission channels remain the dollar, peso liquidity, sovereign spreads and external risk appetite.`,
        points: localHeadlines,
      },
      outlook: {
        headline: "What could come next",
        summary: "The base case is continuity with volatility. A stronger signal requires price confirmation across several assets; a deterioration in breadth or liquidity would favor a more defensive stance.",
        points: ["Confirm the move with market breadth", "Watch rates, the dollar and energy", "Reassess if local and global signals diverge"],
      },
      recommendedStance: {
        label: tone === "cautious" ? "Protect capital and wait for confirmation" : "Stay selective and scale entries",
        rationale: "The current evidence supports measured positioning rather than an all-in directional bet.",
        actions: ["Avoid chasing large opening moves", "Size positions in stages", "Define invalidation before entering"],
        invalidation: "Change the stance if market breadth, rates or the local FX/risk picture contradict the base case.",
      },
      watchlist: ["US rates and dollar", "Equity breadth", "Oil and geopolitical risk", "Argentina sovereign spreads"],
      risks: ["Headline-driven reversals", "Stale or delayed quotes", "Divergence between global and local markets"],
    };
  }

  return {
    title: "Mercados hoy: la señal detrás del ruido",
    deck: `Los activos internacionales operan ${direction(globalDay, language)}, mientras que Argentina se mueve ${direction(localDay, language)}. La lectura útil es separar la acción de precios confirmada del riesgo de titulares.`,
    tone,
    toneLabel: tone === "constructive" ? "Constructivo con disciplina" : tone === "cautious" ? "Cautela defensiva" : "Neutralidad selectiva",
    day: {
      headline: "Qué mueve la rueda",
      summary: `La muestra disponible entre mercados está ${direction(combinedDay, language)}. Para decisiones de corto plazo conviene privilegiar confirmación antes que anticipación.`,
      points: [...globalHeadlines.slice(0, 2), ...localHeadlines.slice(0, 2)].slice(0, 4),
    },
    week: {
      headline: "La semana en perspectiva",
      summary: `La muestra internacional está ${direction(globalWeek, language)} en las últimas cinco ruedas. En Argentina, los titulares siguen especialmente sensibles a tasas, expectativa cambiaria y riesgo soberano.`,
      points: [...globalHeadlines, ...localHeadlines].slice(0, 4),
    },
    international: {
      headline: "Contexto internacional",
      summary: `Acciones, duration y cripto envían un mensaje ${direction(globalDay, language)}. Conviene mirar si amplitud y bonos confirman el movimiento, en lugar de depender de un solo índice.`,
      points: globalHeadlines,
    },
    argentina: {
      headline: "Contexto argentino",
      summary: `La muestra local opera ${direction(localDay, language)}. Los canales centrales siguen siendo dólar, liquidez en pesos, riesgo soberano y apetito global por riesgo.`,
      points: localHeadlines,
    },
    outlook: {
      headline: "Qué puede venir",
      summary: "El escenario base es de continuidad con volatilidad. Una señal más firme requiere confirmación de precios en varios activos; un deterioro de amplitud o liquidez justificaría una postura más defensiva.",
      points: ["Confirmar el movimiento con amplitud de mercado", "Seguir tasas, dólar y energía", "Reevaluar si divergen las señales locales y globales"],
    },
    recommendedStance: {
      label: tone === "cautious" ? "Priorizar capital y esperar confirmación" : "Mantener selectividad y escalonar entradas",
      rationale: "La evidencia actual favorece una exposición medida, no una apuesta direccional total.",
      actions: ["No perseguir movimientos fuertes de apertura", "Dimensionar posiciones por etapas", "Definir la invalidación antes de entrar"],
      invalidation: "Cambiar la postura si la amplitud, las tasas o el cuadro cambiario y de riesgo local contradicen el escenario base.",
    },
    watchlist: ["Tasas y dólar en EE. UU.", "Amplitud de acciones", "Petróleo y riesgo geopolítico", "Spreads soberanos argentinos"],
    risks: ["Reversiones por titulares", "Cotizaciones demoradas o desactualizadas", "Divergencia entre mercado global y local"],
  };
}

export function todaySources(articles: NewsArticle[], market: TodayBriefSource["market"], limit = 6): TodayBriefSource[] {
  const seen = new Set<string>();
  return articles.flatMap((article) => {
    if (!article.url || article.url === "#" || seen.has(article.url)) return [];
    seen.add(article.url);
    return [{ title: article.title, publisher: article.source, url: article.url, publishedAt: article.publishedAt, market }];
  }).slice(0, limit);
}
