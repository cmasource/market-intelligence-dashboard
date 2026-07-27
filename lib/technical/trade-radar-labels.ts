const trendStatusLabels: Record<string, string> = {
  bullish_strong: "Tendencia alcista fuerte",
  bearish: "Tendencia bajista",
  rebote_alcista_corto_plazo: "Rebote alcista de corto plazo",
  bullish_short_term: "Tendencia alcista de corto plazo",
  neutral_range: "Rango neutral",
  deterioration: "Deterioro tecnico",
  sin_senal: "Sin senal clara",
};

const momentumStatusLabels: Record<string, string> = {
  positivo_fuerte: "Momentum positivo fuerte",
  positivo: "Momentum positivo",
  negativo: "Momentum negativo",
  neutral: "Momentum neutral",
  sin_dato: "Sin dato de momentum",
};

const volatilityStatusLabels: Record<string, string> = {
  alta: "Volatilidad alta",
  baja: "Volatilidad baja",
  normal: "Volatilidad normal",
  sin_dato: "Sin dato de volatilidad",
};

const setupLabels: Record<string, string> = {
  vigilancia_breakout: "Vigilar ruptura",
  pullback_watch: "Monitorear pullback",
  esperar_confirmacion: "Esperar confirmacion",
};

const riskStatusLabels: Record<string, string> = {
  resistencia_cercana: "Resistencia cercana",
  riesgo_bajista: "Riesgo bajista",
  normal: "Riesgo normal",
};

const signalLabels: Record<string, string> = {
  trendStatus: "Tendencia",
  momentumStatus: "Momentum",
  volatilityStatus: "Volatilidad",
  setup: "Escenario",
  riskStatus: "Riesgo",
};

const alertConditionLabels: Record<string, string> = {
  crosses_above: "Supera nivel",
  crosses_below: "Pierde nivel",
};

const dataCoverageLabels: Record<string, string> = {
  technical_full: "Tecnico directo",
  technical_underlying: "Tecnico del subyacente",
  quote_only: "Cotizacion disponible",
  fundamentals_full: "Fundamentos directos",
  fundamentals_underlying: "Fundamentos del subyacente",
};

const marketLabels: Record<string, string> = {
  us: "Estados Unidos",
  argentina: "Argentina",
  cedear: "CEDEAR",
  crypto: "Cripto",
  bond: "Bonos",
};

const providerLabels: Record<string, string> = {
  twelveData: "Datos de mercado",
  alphaVantage: "Datos de mercado",
  fmp: "Datos fundamentales",
  byma: "Mercado local",
  binance: "Mercado cripto",
};

const delayLabels: Record<string, string> = {
  realtime: "Tiempo real",
  delayed: "Demorado",
  eod: "Cierre diario",
  unknown: "Sin confirmar",
};

function fallbackLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatTradeRadarStatus(kind: string, value: string) {
  const labelsByKind: Record<string, Record<string, string>> = {
    trendStatus: trendStatusLabels,
    momentumStatus: momentumStatusLabels,
    volatilityStatus: volatilityStatusLabels,
    setup: setupLabels,
    riskStatus: riskStatusLabels,
  };

  return labelsByKind[kind]?.[value] ?? fallbackLabel(value);
}

export function formatTradeRadarSignalKey(key: string) {
  return signalLabels[key] ?? fallbackLabel(key);
}

export function formatTradeRadarAlertCondition(condition: string) {
  return alertConditionLabels[condition] ?? fallbackLabel(condition);
}

export function formatTradeRadarCoverage(capability: string) {
  return dataCoverageLabels[capability] ?? fallbackLabel(capability);
}

export function formatTradeRadarMarket(market: string) {
  return marketLabels[market] ?? fallbackLabel(market);
}

export function formatTradeRadarProvider(provider: string) {
  return providerLabels[provider] ?? fallbackLabel(provider);
}

export function formatTradeRadarDelay(delay: string) {
  return delayLabels[delay] ?? fallbackLabel(delay);
}

export function formatTradeRadarProviderFailure(message: string) {
  if (message.includes("BYMA_CLIENT_ID") || message.includes("BYMA_CLIENT_SECRET")) {
    return "Fuente local BYMA no configurada para esta consulta.";
  }
  if (message.includes("API key")) {
    return "Proveedor no disponible por configuracion de API.";
  }
  return message;
}
