import { adrToLocalSymbol } from "@/lib/instruments/argentinaMappings";
import type { FundamentalsResponse, FundamentalsSnapshot } from "./types";

const ratioFields: Array<keyof FundamentalsSnapshot> = [
  "trailingPE",
  "forwardPE",
  "priceToBook",
  "priceToSales",
  "pegRatio",
  "debtToEquity",
  "currentRatio",
  "quickRatio",
  "beta",
];

function finitePositive(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

export function isArgentineAdrSymbol(symbol: string) {
  return Object.prototype.hasOwnProperty.call(adrToLocalSymbol, symbol.trim().toUpperCase());
}

export function sanitizeFundamentalsResponse(
  response: FundamentalsResponse,
  options: { providerSymbol: string },
): FundamentalsResponse {
  const snapshot: FundamentalsSnapshot = { ...response.snapshot };
  const warnings = [...(response.warnings ?? [])];
  const isArgentineAdr = isArgentineAdrSymbol(options.providerSymbol);

  for (const field of ratioFields) {
    const value = snapshot[field];
    if (typeof value === "number" && !Number.isFinite(value)) delete snapshot[field];
  }

  if (isArgentineAdr && response.provider === "finnhub" && snapshot.currency && snapshot.currency !== "USD") {
    const marketPrice = snapshot.marketPrice;
    const period = snapshot.period;
    for (const key of Object.keys(snapshot) as Array<keyof FundamentalsSnapshot>) delete snapshot[key];
    if (finitePositive(marketPrice)) snapshot.marketPrice = marketPrice;
    snapshot.currency = "USD";
    if (period) snapshot.period = period;
    warnings.push(
      `Se excluyeron magnitudes de Finnhub reportadas en ${response.snapshot.currency} para no mezclarlas con la cotizacion del ADR en USD.`,
    );
  }

  if (isArgentineAdr && response.provider === "alpha_vantage") {
    if (typeof snapshot.priceToSales === "number" && snapshot.priceToSales < 0.01) {
      delete snapshot.priceToSales;
      warnings.push("Se excluyo un P/S incompatible con la moneda de reporte del emisor.");
    }
    if (typeof snapshot.beta === "number" && snapshot.beta <= 0) {
      delete snapshot.beta;
      warnings.push("Se excluyo un beta no consistente para esta cotizacion ADR.");
    }
  }

  if (
    finitePositive(snapshot.fiftyTwoWeekHigh)
    && finitePositive(snapshot.fiftyTwoWeekLow)
    && (snapshot.fiftyTwoWeekLow as number) > (snapshot.fiftyTwoWeekHigh as number)
  ) {
    delete snapshot.fiftyTwoWeekHigh;
    delete snapshot.fiftyTwoWeekLow;
    warnings.push("Se excluyo un rango de 52 semanas internamente inconsistente.");
  }

  return {
    ...response,
    snapshot,
    warnings: warnings.length ? Array.from(new Set(warnings)) : undefined,
  };
}

export function sanitizeMergedAdrSnapshot(
  snapshot: FundamentalsSnapshot,
  options: { providerSymbol: string },
) {
  const sanitized: FundamentalsSnapshot = { ...snapshot };
  const warnings: string[] = [];
  const hasCrossCurrencyStatements =
    isArgentineAdrSymbol(options.providerSymbol)
    && Boolean(sanitized.currency)
    && Boolean(sanitized.reportingCurrency)
    && sanitized.currency !== sanitized.reportingCurrency;

  if (hasCrossCurrencyStatements) {
    const perShareFields: Array<keyof FundamentalsSnapshot> = [
      "eps",
      "bookValuePerShare",
      "trailingPE",
      "forwardPE",
      "pegRatio",
    ];
    const removedFields = perShareFields.filter((field) => sanitized[field] !== undefined);

    for (const field of perShareFields) delete sanitized[field];

    if (removedFields.length > 0) {
      warnings.push(
        `Se excluyeron metricas por accion sin conversion ADR verificable entre ${sanitized.reportingCurrency} y ${sanitized.currency}.`,
      );
    }
  }

  return { snapshot: sanitized, warnings };
}
