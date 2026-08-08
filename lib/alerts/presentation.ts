import type { PersonalAlertCondition, PersonalAlertSubscription } from "./types";

export type AlertUiLanguage = "es" | "en";

type ConditionCopy = {
  label: string;
  description: string;
  inputLabel: string;
  placeholder: string;
  defaultValue: string;
  example: string;
};

const CONDITION_COPY: Record<AlertUiLanguage, Record<PersonalAlertCondition, ConditionCopy>> = {
  es: {
    price_above: {
      label: "Precio alcanza o supera",
      description: "Avisa cuando el cierre cruza desde abajo el precio objetivo.",
      inputLabel: "Precio objetivo",
      placeholder: "Ej. 550",
      defaultValue: "",
      example: "Si el objetivo es 550 USD, se activa cuando el cierre pasa de menos de 550 a 550 o más.",
    },
    price_below: {
      label: "Precio alcanza o cae por debajo",
      description: "Avisa cuando el cierre cruza desde arriba el precio objetivo.",
      inputLabel: "Precio objetivo",
      placeholder: "Ej. 450",
      defaultValue: "",
      example: "Si el objetivo es 450 USD, se activa cuando el cierre pasa de más de 450 a 450 o menos.",
    },
    rapid_rise: {
      label: "Suba brusca",
      description: "Compara el último cierre con el cierre de la rueda anterior.",
      inputLabel: "Suba diaria mínima (%)",
      placeholder: "Ej. 5",
      defaultValue: "5",
      example: "Con 5%, se activa si el último cierre sube 5% o más frente al cierre anterior.",
    },
    rapid_fall: {
      label: "Baja brusca",
      description: "Compara el último cierre con el cierre de la rueda anterior.",
      inputLabel: "Baja diaria mínima (%)",
      placeholder: "Ej. 5",
      defaultValue: "5",
      example: "Con 5%, se activa si el último cierre cae 5% o más frente al cierre anterior.",
    },
    near_ema200: {
      label: "Cerca de la EMA 200",
      description: "Mide la distancia porcentual entre el último cierre y la media móvil exponencial de 200 ruedas.",
      inputLabel: "Distancia máxima a la EMA 200 (%)",
      placeholder: "Recomendado: 1",
      defaultValue: "1",
      example: "Con 1% y una EMA 200 de 500, se activa si el cierre queda entre 495 y 505, desde arriba o desde abajo.",
    },
    near_period_low: {
      label: "Cerca del mínimo del período",
      description: "Compara el cierre con el mínimo verificable de las ruedas seleccionadas.",
      inputLabel: "Distancia máxima al mínimo (%)",
      placeholder: "Recomendado: 1",
      defaultValue: "1",
      example: "Con 1%, se activa cuando el cierre queda a 1% o menos del mínimo del período. No es un mínimo histórico absoluto.",
    },
    near_period_high: {
      label: "Cerca del máximo del período",
      description: "Compara el cierre con el máximo verificable de las ruedas seleccionadas.",
      inputLabel: "Distancia máxima al máximo (%)",
      placeholder: "Recomendado: 1",
      defaultValue: "1",
      example: "Con 1%, se activa cuando el cierre queda a 1% o menos del máximo del período. No es un máximo histórico absoluto.",
    },
  },
  en: {
    price_above: { label: "Price reaches or exceeds", description: "Notifies when the close crosses the target from below.", inputLabel: "Target price", placeholder: "E.g. 550", defaultValue: "", example: "With a 550 USD target, it triggers when the close crosses from below 550 to 550 or higher." },
    price_below: { label: "Price reaches or falls below", description: "Notifies when the close crosses the target from above.", inputLabel: "Target price", placeholder: "E.g. 450", defaultValue: "", example: "With a 450 USD target, it triggers when the close crosses from above 450 to 450 or lower." },
    rapid_rise: { label: "Sharp rise", description: "Compares the latest close with the previous session's close.", inputLabel: "Minimum daily rise (%)", placeholder: "E.g. 5", defaultValue: "5", example: "At 5%, it triggers when the latest close rises 5% or more from the previous close." },
    rapid_fall: { label: "Sharp fall", description: "Compares the latest close with the previous session's close.", inputLabel: "Minimum daily fall (%)", placeholder: "E.g. 5", defaultValue: "5", example: "At 5%, it triggers when the latest close falls 5% or more from the previous close." },
    near_ema200: { label: "Near EMA 200", description: "Measures the percentage distance between the latest close and the 200-session exponential moving average.", inputLabel: "Maximum distance to EMA 200 (%)", placeholder: "Recommended: 1", defaultValue: "1", example: "At 1% with EMA 200 at 500, it triggers between 495 and 505, from either side." },
    near_period_low: { label: "Near period low", description: "Compares the close with the verified low of the selected sessions.", inputLabel: "Maximum distance to the low (%)", placeholder: "Recommended: 1", defaultValue: "1", example: "At 1%, it triggers within 1% of the period low. This is not an all-time low." },
    near_period_high: { label: "Near period high", description: "Compares the close with the verified high of the selected sessions.", inputLabel: "Maximum distance to the high (%)", placeholder: "Recommended: 1", defaultValue: "1", example: "At 1%, it triggers within 1% of the period high. This is not an all-time high." },
  },
};

export const PERSONAL_ALERT_CONDITIONS = Object.keys(CONDITION_COPY.es) as PersonalAlertCondition[];

export function personalAlertConditionCopy(condition: PersonalAlertCondition, language: AlertUiLanguage) {
  return CONDITION_COPY[language][condition];
}

export function personalAlertSchedule(assetType: string, market: string, language: AlertUiLanguage) {
  const isCrypto = assetType === "crypto" || market === "crypto";
  const isArgentina = ["argentina", "cedear"].includes(market) || ["cedear", "cedear_etf"].includes(assetType);
  if (language === "en") {
    if (isCrypto) return "Evaluated hourly, every day";
    if (isArgentina) return "Evaluated on business days around 18:00 Argentina time";
    return "Evaluated on business days around 19:00 Argentina time";
  }
  if (isCrypto) return "Se evalúa cada hora, todos los días";
  if (isArgentina) return "Se evalúa los días hábiles cerca de las 18:00 (Argentina)";
  return "Se evalúa los días hábiles cerca de las 19:00 (Argentina)";
}

function percent(value: number | null, language: AlertUiLanguage) {
  return `${(value ?? 0).toLocaleString(language === "es" ? "es-AR" : "en-US")} %`;
}

export function describePersonalAlert(subscription: PersonalAlertSubscription, language: AlertUiLanguage) {
  const value = percent(subscription.thresholdPercent, language);
  if (language === "en") {
    if (subscription.condition === "price_above") return `Close crosses above ${subscription.targetValue?.toLocaleString("en-US")} ${subscription.currency}`;
    if (subscription.condition === "price_below") return `Close crosses below ${subscription.targetValue?.toLocaleString("en-US")} ${subscription.currency}`;
    if (subscription.condition === "rapid_rise") return `Daily close rises ${value} or more`;
    if (subscription.condition === "rapid_fall") return `Daily close falls ${value} or more`;
    if (subscription.condition === "near_ema200") return `Close is within ${value} of EMA 200`;
    if (subscription.condition === "near_period_low") return `Close is within ${value} of the ${subscription.lookbackBars}-session low`;
    return `Close is within ${value} of the ${subscription.lookbackBars}-session high`;
  }
  if (subscription.condition === "price_above") return `El cierre cruza por encima de ${subscription.targetValue?.toLocaleString("es-AR")} ${subscription.currency}`;
  if (subscription.condition === "price_below") return `El cierre cruza por debajo de ${subscription.targetValue?.toLocaleString("es-AR")} ${subscription.currency}`;
  if (subscription.condition === "rapid_rise") return `El cierre diario sube ${value} o más`;
  if (subscription.condition === "rapid_fall") return `El cierre diario cae ${value} o más`;
  if (subscription.condition === "near_ema200") return `El cierre queda a ${value} o menos de la EMA 200`;
  if (subscription.condition === "near_period_low") return `El cierre queda a ${value} o menos del mínimo de ${subscription.lookbackBars} ruedas`;
  return `El cierre queda a ${value} o menos del máximo de ${subscription.lookbackBars} ruedas`;
}
