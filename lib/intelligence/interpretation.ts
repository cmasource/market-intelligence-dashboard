import type {
  AssetIntelligenceReport,
  FinalReading,
  FundamentalSummary,
  HumanInterpretationSummary,
  IntelligenceLanguage,
  NewsSummary,
  TechnicalSummary,
} from "./types";
import {
  translateMomentumLabel,
  translateProviderLabel,
  translateTrendLabel,
} from "@/lib/i18n/interpretation-labels";

function l<T>(language: IntelligenceLanguage, en: T, es: T) {
  return language === "es" ? es : en;
}

function labelFromScore(score: number | null, language: IntelligenceLanguage) {
  if (score === null) return l(language, "Neutral", "Neutral");
  if (score <= 20) return l(language, "Very defensive", "Muy defensivo");
  if (score <= 40) return l(language, "Defensive", "Defensivo");
  if (score <= 60) return l(language, "Neutral", "Neutral");
  if (score <= 80) return l(language, "Constructive", "Constructivo");
  return l(language, "Very constructive", "Muy constructivo");
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function scoreTone(score: number | null | undefined, language: IntelligenceLanguage) {
  if (!isNumber(score)) return l(language, "limited", "limitada");
  if (score >= 80) return l(language, "very constructive", "muy constructiva");
  if (score >= 65) return l(language, "constructive", "constructiva");
  if (score >= 45) return l(language, "balanced", "equilibrada");
  if (score >= 25) return l(language, "defensive", "defensiva");
  return l(language, "very defensive", "muy defensiva");
}

function metric(value: number | null | undefined, digits = 2) {
  return isNumber(value) ? value.toFixed(digits) : "N/D";
}

export type HumanTechnicalSummaryInput = {
  technicalScore: number | null;
  trend: string;
  momentum: string;
  rsi?: number | null;
  sma20?: number | null;
  sma50?: number | null;
  sma200?: number | null;
  macd?: number | null;
  macdSignal?: number | null;
  support?: number | null;
  resistance?: number | null;
  latestClose?: number | null;
  provider?: string | null;
  sourceLabel?: string | null;
  dataQuality?: string | null;
};

export function buildHumanTechnicalSummary(input: HumanTechnicalSummaryInput, language: IntelligenceLanguage): HumanInterpretationSummary {
  const trend = translateTrendLabel(input.trend, language);
  const momentum = translateMomentumLabel(input.momentum, language);
  const score = input.technicalScore;
  const hasLongTrend = isNumber(input.latestClose) && isNumber(input.sma200) && input.latestClose > input.sma200;
  const hasShortTrend = isNumber(input.latestClose) && isNumber(input.sma20) && input.latestClose > input.sma20;
  const highRsi = isNumber(input.rsi) && input.rsi >= 70;
  const lowRsi = isNumber(input.rsi) && input.rsi <= 30;
  const macdPositive = isNumber(input.macd) && isNumber(input.macdSignal) && input.macd > input.macdSignal;
  const provider = translateProviderLabel(input.sourceLabel ?? input.provider ?? "", language);

  if (!isNumber(score)) {
    return {
      shortSummary: l(language, "Technical reading limited by unavailable indicators.", "Lectura tecnica limitada por indicadores no disponibles."),
      expandedSummary: l(
        language,
        "The technical layer does not have enough valid OHLCV data to explain trend, momentum and confirmation indicators with confidence. Treat this as context only.",
        "La capa tecnica no tiene suficientes datos OHLCV validos para explicar tendencia, momentum e indicadores de confirmacion con confianza. Debe tomarse solo como contexto.",
      ),
      bulletPoints: [
        l(language, "Trend: unavailable.", "Tendencia: no disponible."),
        l(language, "RSI and MACD: unavailable or incomplete.", "RSI y MACD: no disponibles o incompletos."),
      ],
      warnings: [l(language, "Technical reading is informational and not an investment recommendation.", "Lectura tecnica informativa. No constituye recomendacion de inversion.")],
    };
  }

  const shortSummary = l(
    language,
    `Technical reading is ${scoreTone(score, language)}, with ${trend} and ${momentum}.`,
    `Lectura tecnica ${scoreTone(score, language)}, con ${trend} y ${momentum}.`,
  );

  const trendReason = hasShortTrend && hasLongTrend
    ? l(
        language,
        "The main trend is favorable because price is above relevant moving averages such as SMA 20 and SMA 200.",
        "La tendencia principal se mantiene favorable porque el precio esta por encima de medias relevantes como la SMA 20 y la SMA 200.",
      )
    : hasLongTrend
      ? l(
          language,
          "Price remains above the SMA 200, which supports the long-term trend, while shorter-term confirmation should still be monitored.",
          "El precio se mantiene por encima de la SMA 200, lo que sostiene la tendencia de largo plazo, aunque conviene monitorear la confirmacion de corto plazo.",
        )
      : l(
          language,
          "The moving-average structure is mixed or incomplete, so trend confirmation is less robust.",
          "La estructura de medias moviles es mixta o incompleta, por lo que la confirmacion de tendencia es menos robusta.",
        );

  const rsiReason = highRsi
    ? l(
        language,
        "RSI is elevated, confirming short-term strength while also suggesting monitoring possible overbought conditions or profit taking.",
        "El RSI esta elevado, lo que confirma fortaleza de corto plazo, aunque tambien sugiere vigilar posible sobrecompra o toma de ganancias.",
      )
    : lowRsi
      ? l(
          language,
          "RSI is near an oversold zone, which can indicate pressure but also a possible rebound context if price confirms.",
          "El RSI esta cerca de zona de sobreventa, lo que puede indicar presion pero tambien un posible contexto de rebote si el precio confirma.",
        )
      : l(
          language,
          "RSI is not in an extreme zone, so momentum should be read together with trend and MACD.",
          "El RSI no esta en una zona extrema, por lo que el momentum debe leerse junto con tendencia y MACD.",
        );

  const macdReason = macdPositive
    ? l(language, "MACD is above its signal line, adding momentum confirmation.", "El MACD esta por encima de su linea de senal, agregando confirmacion de momentum.")
    : l(language, "MACD should be used to confirm acceleration or loss of momentum.", "El MACD debe usarse para confirmar aceleracion o perdida de momentum.");

  return {
    shortSummary,
    expandedSummary: l(
      language,
      `The technical score is ${score}/100. ${trendReason} ${rsiReason} ${macdReason} The reading is informational and should not be interpreted as a standalone recommendation.`,
      `El score tecnico es ${score}/100. ${trendReason} ${rsiReason} ${macdReason} La lectura es informativa y no debe interpretarse como una recomendacion aislada.`,
    ),
    bulletPoints: [
      l(language, `Trend: ${trend}.`, `Tendencia: ${trend.replace(/^tendencia /, "")}.`),
      highRsi
        ? l(language, `Elevated RSI (${metric(input.rsi, 1)}): strong momentum, but possible overbought conditions.`, `RSI elevado (${metric(input.rsi, 1)}): indica momentum fuerte, pero posible sobrecompra.`)
        : lowRsi
          ? l(language, `Low RSI (${metric(input.rsi, 1)}): pressure or possible rebound watch.`, `RSI bajo (${metric(input.rsi, 1)}): presion o posible rebote a monitorear.`)
          : l(language, `RSI (${metric(input.rsi, 1)}): helps read short-term momentum.`, `RSI (${metric(input.rsi, 1)}): ayuda a leer el momentum de corto plazo.`),
      l(language, "SMA 20 and SMA 200: help evaluate short- and long-term trend.", "SMA 20 y SMA 200: ayudan a evaluar tendencia de corto y largo plazo."),
      l(language, macdPositive ? "MACD: currently confirms positive momentum." : "MACD: use it to confirm acceleration or loss of momentum.", macdPositive ? "MACD: actualmente confirma momentum positivo." : "MACD: usar para confirmar aceleracion o perdida de momentum."),
      l(language, `Source: ${provider}.`, `Fuente: ${provider}.`),
    ],
    warnings: [
      l(language, "Informational technical signal. Not an investment recommendation.", "Senal tecnica informativa. No constituye recomendacion de inversion."),
      ...(input.dataQuality ? [input.dataQuality] : []),
    ],
  };
}

export type HumanFundamentalSummaryInput = {
  fundamentalScore: number | null;
  pe?: number | null;
  forwardPe?: number | null;
  pb?: number | null;
  ps?: number | null;
  roe?: number | null;
  roa?: number | null;
  grossMargin?: number | null;
  ebitdaMargin?: number | null;
  netMargin?: number | null;
  debtToEquity?: number | null;
  currentRatio?: number | null;
  quickRatio?: number | null;
  dividendYield?: number | null;
  beta?: number | null;
  sourceLabel?: string | null;
  unavailableFields?: string[];
};

export function buildHumanFundamentalSummary(input: HumanFundamentalSummaryInput, language: IntelligenceLanguage): HumanInterpretationSummary {
  const score = input.fundamentalScore;
  const unavailableCount = input.unavailableFields?.length ?? 0;
  const source = translateProviderLabel(input.sourceLabel ?? "", language);
  const profitabilitySignals = [input.roe, input.roa, input.grossMargin, input.ebitdaMargin, input.netMargin].filter(isNumber).length;
  const valuationSignals = [input.pe, input.forwardPe, input.pb, input.ps].filter(isNumber).length;
  const leverageSignals = [input.debtToEquity, input.currentRatio, input.quickRatio].filter(isNumber).length;

  if (!isNumber(score) || unavailableCount >= 8) {
    return {
      shortSummary: l(language, "Fundamental reading is limited by unavailable provider fields.", "La lectura fundamental es limitada por falta de datos del proveedor."),
      expandedSummary: l(
        language,
        "The fundamental reading is limited because several indicators are not available from the current provider. In this case, the interpretation should be treated with caution and complemented with financial statements or external sources.",
        "La lectura fundamental es limitada porque varios indicadores no estan disponibles desde el proveedor actual. En este caso, la interpretacion debe tomarse con cautela y complementarse con estados financieros o fuentes externas.",
      ),
      bulletPoints: [
        l(language, "Coverage: incomplete provider fundamentals.", "Cobertura: fundamentos de proveedor incompletos."),
        l(language, "Valuation, profitability and solvency may not all be available.", "Valuacion, rentabilidad y solvencia pueden no estar disponibles en conjunto."),
      ],
      warnings: [l(language, "Do not use this reading as a standalone decision signal.", "No usar esta lectura como senal aislada de decision.")],
    };
  }

  const valuationContext = isNumber(input.pe) && input.pe > 35 || isNumber(input.ps) && input.ps > 10
    ? l(language, "Valuation should be analyzed with caution because multiples such as P/E or P/S are elevated.", "La valuacion debe analizarse con cautela porque multiplos como P/E o P/S se ubican en niveles elevados.")
    : l(language, "Valuation does not show an extreme reading from the available multiples.", "La valuacion no muestra una lectura extrema segun los multiplos disponibles.");

  const profitabilityContext = profitabilitySignals >= 3
    ? l(language, "The company shows enough profitability inputs to evaluate margins and returns.", "La compania presenta suficientes datos de rentabilidad para evaluar margenes y retornos.")
    : l(language, "Profitability coverage is partial, so margins and returns need additional validation.", "La cobertura de rentabilidad es parcial, por lo que margenes y retornos requieren validacion adicional.");

  const sourceNote = l(
    language,
    `The reading depends on provider quality and update timing (${source}).`,
    `La lectura depende de la calidad y actualizacion del proveedor (${source}).`,
  );

  return {
    shortSummary: l(language, `Fundamental reading is ${scoreTone(score, language)}.`, `Lectura fundamental ${scoreTone(score, language)}.`),
    expandedSummary: l(
      language,
      `The fundamental score is ${score}/100. ${profitabilityContext} ${valuationContext} ${sourceNote} This is educational context, not a recommendation.`,
      `El score fundamental es ${score}/100. ${profitabilityContext} ${valuationContext} ${sourceNote} Es contexto educativo, no una recomendacion.`,
    ),
    bulletPoints: [
      l(language, `Profitability: ${profitabilitySignals ? "available context" : "limited data"}.`, `Rentabilidad: ${profitabilitySignals ? "contexto disponible" : "datos limitados"}.`),
      l(language, `Valuation: ${valuationSignals ? "review P/E, P/S and P/B together" : "limited multiples"}.`, `Valuacion: ${valuationSignals ? "revisar P/E, P/S y P/B en conjunto" : "multiplos limitados"}.`),
      l(language, `Solvency/liquidity: ${leverageSignals ? "available context" : "limited data"}.`, `Solvencia/liquidez: ${leverageSignals ? "contexto disponible" : "datos limitados"}.`),
      l(language, `Source: ${source}.`, `Fuente: ${source}.`),
    ],
    warnings: [
      l(language, "Provider accounting definitions and update timing can affect the score.", "Las definiciones contables y la actualizacion del proveedor pueden afectar el score."),
    ],
  };
}

export function buildTechnicalInterpretation(summary: TechnicalSummary, language: IntelligenceLanguage) {
  if (!summary.available) {
    return l(language, "Technical view is unavailable for this asset.", "La lectura tecnica no esta disponible para este activo.");
  }
  return summary.humanSummary?.expandedSummary ?? buildHumanTechnicalSummary({
    technicalScore: summary.score,
    trend: summary.trend,
    momentum: summary.momentum,
    sourceLabel: summary.sourceLabel,
  }, language).expandedSummary;
}

export function buildFundamentalInterpretation(summary: FundamentalSummary, language: IntelligenceLanguage) {
  if (!summary.available) {
    return l(
      language,
      "Equity fundamentals are not applicable or are unavailable for this instrument.",
      "Las metricas fundamentales de tipo accionario no estan disponibles o no aplican para este instrumento.",
    );
  }
  return summary.humanSummary?.expandedSummary ?? buildHumanFundamentalSummary({
    fundamentalScore: summary.score,
    sourceLabel: summary.sourceLabel,
  }, language).expandedSummary;
}

export function buildNewsInterpretation(summary: NewsSummary, language: IntelligenceLanguage) {
  if (!summary.available) {
    return l(language, "No recent headlines are available in this layer.", "No hay titulares recientes disponibles en esta capa.");
  }
  return l(
    language,
    `${summary.articlesCount} headline(s) available; use them as context, not as a standalone signal.`,
    `${summary.articlesCount} titular(es) disponible(s); usarlos como contexto, no como senal aislada.`,
  );
}

export function buildCedearInterpretation(language: IntelligenceLanguage) {
  return l(
    language,
    "For Argentine investors, the CEDEAR offers local exposure to the underlying asset. In this demo, technical and fundamental analysis relies mainly on the underlying share, while the local CEDEAR price and ratio remain simulated until BYMA/IOL or licensed-provider data is integrated.",
    "Para un inversor argentino, el CEDEAR permite exposicion local al subyacente. En esta demo, la lectura tecnica y fundamental se apoya principalmente en la accion subyacente, mientras que el precio local del CEDEAR y el ratio continuan simulados hasta integrar datos de BYMA/IOL o proveedor licenciado.",
  );
}

export function buildFixedIncomeInterpretation(language: IntelligenceLanguage) {
  return l(
    language,
    "Fixed income reading is informational and based on structured mock data until real local market integration is available.",
    "La lectura de renta fija es informativa y se basa en datos estructurados simulados hasta contar con integracion real de mercado local.",
  );
}

export function buildFinalReading(report: Pick<
  AssetIntelligenceReport,
  | "priceSummary"
  | "marketSignalSummary"
  | "technicalSummary"
  | "fundamentalSummary"
  | "newsSummary"
  | "cedearSummary"
  | "fixedIncomeSummary"
  | "warnings"
>, language: IntelligenceLanguage): FinalReading {
  const fallbackHeavy = report.warnings.length >= 3 || report.priceSummary?.isFallback;
  const label = labelFromScore(report.marketSignalSummary.score, language);
  const signalPoint = l(
    language,
    `Integrated signal: ${report.marketSignalSummary.label.toLowerCase()}, with ${report.marketSignalSummary.confidence.toLowerCase()} confidence.`,
    `Senal integrada: ${report.marketSignalSummary.label.toLowerCase()}, con confianza ${report.marketSignalSummary.confidence.toLowerCase()}.`,
  );
  const pricePoint = report.priceSummary?.isFallback
    ? l(language, "Price layer uses fallback or simulated data.", "Precio con datos de respaldo o simulados.")
    : l(language, "Price updated from a compatible provider.", "Precio actualizado desde proveedor compatible.");
  const technicalPoint = report.technicalSummary.humanSummary?.shortSummary
    ?? l(language, "Technical evidence is summarized separately.", "La evidencia tecnica se resume por separado.");
  const fundamentalPoint = report.fundamentalSummary.available
    ? (report.fundamentalSummary.humanSummary?.shortSummary
      ?? l(language, "Fundamentals are summarized separately.", "Los fundamentos se resumen por separado."))
    : l(language, "Fundamental reading is limited by unavailable fields.", "La lectura fundamental es limitada por datos incompletos.");
  const cedearPoint = report.cedearSummary
    ? l(
        language,
        "Local CEDEAR context remains simulated until licensed local data is integrated.",
        "El contexto CEDEAR local continua simulado hasta integrar BYMA/IOL o proveedor licenciado.",
      )
    : null;

  if (report.fixedIncomeSummary?.available) {
    return {
      label,
      summary: buildFixedIncomeInterpretation(language),
      bulletPoints: [
        l(language, "Fixed income analytics use duration, parity and yield context.", "La renta fija combina duration, paridad y rendimiento estimado."),
        l(language, "Review duration, parity, sovereign risk and liquidity together.", "Revisar duration, paridad, riesgo soberano y liquidez en conjunto."),
        l(language, "Data remains structured and informational.", "Los datos siguen siendo estructurados e informativos."),
      ],
    };
  }

  if (fallbackHeavy) {
    return {
      label: l(language, "Cautionary", "Cauteloso"),
      summary: l(
        language,
        "The reading should be treated with caution because a relevant part of the data is fallback, mock or future coverage.",
        "La lectura debe tomarse con cautela porque una parte relevante de los datos corresponde a fallback, simulaciones o cobertura futura.",
      ),
      bulletPoints: [pricePoint, signalPoint, technicalPoint, fundamentalPoint, cedearPoint].filter(Boolean) as string[],
    };
  }

  if ((report.marketSignalSummary.score ?? 50) >= 60) {
    return {
      label,
      summary: l(
        language,
        "The asset shows a constructive reading from the combination of provider price, technical signals and available fundamentals. It should be reviewed together with valuation, recent news and market risk.",
        "El activo muestra una lectura constructiva por combinacion de precio de proveedor, senales tecnicas y fundamentos disponibles. Debe evaluarse junto con valuacion, noticias recientes y riesgo de mercado.",
      ),
      bulletPoints: [pricePoint, signalPoint, technicalPoint, fundamentalPoint, cedearPoint].filter(Boolean) as string[],
    };
  }

  return {
    label,
    summary: l(
      language,
      "The asset presents a balanced reading. There is no clear dominant signal across price, technicals and fundamentals.",
      "El activo presenta una lectura equilibrada. No se observa una senal dominante clara entre precio, tecnico y fundamentos.",
    ),
    bulletPoints: [pricePoint, signalPoint, technicalPoint, fundamentalPoint, cedearPoint].filter(Boolean) as string[],
  };
}
