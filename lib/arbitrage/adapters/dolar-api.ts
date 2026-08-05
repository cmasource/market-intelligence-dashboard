import type { ArbitrageIssueCode, ArbitrageQuoteProvider, FxInstrument, ProviderQuoteResult, TransferAsset } from "../types";
import { parseNumber, readJsonResponse } from "./shared";

const DOLAR_API_URL = "https://dolarapi.com/v1/exchanges/monedas/usd/ars";
const SUPPORTED_EXCHANGES = new Set(["belo", "dolarapp", "satoshitango"]);

type DolarApiExchangeQuote = {
  exchange?: unknown;
  compra?: unknown;
  venta?: unknown;
  criptomonedaBase?: unknown;
  fechaActualizacion?: unknown;
};

function assetFromRow(row: DolarApiExchangeQuote): { transferAsset: TransferAsset; instrument: FxInstrument } | undefined {
  const asset = String(row.criptomonedaBase ?? "").toUpperCase();
  if (asset === "USDT") return { transferAsset: "USDT", instrument: "usdt" };
  if (asset === "USDC") return { transferAsset: "USDC", instrument: "usdc" };
  return undefined;
}

export function normalizeDolarApiExchangePayload(payload: unknown, fetchedAt: string): ProviderQuoteResult {
  if (!Array.isArray(payload)) return { providerId: "dolarapi-exchanges", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  const quotes = payload.flatMap((unknownRow) => {
    if (!unknownRow || typeof unknownRow !== "object") return [];
    const row = unknownRow as DolarApiExchangeQuote;
    const providerId = String(row.exchange ?? "").toLowerCase();
    const asset = assetFromRow(row);
    if (!SUPPORTED_EXCHANGES.has(providerId) || !asset) return [];
    const userBuysUsdAt = parseNumber(row.compra);
    const userSellsUsdAt = parseNumber(row.venta);
    if (!userBuysUsdAt && !userSellsUsdAt) return [];
    const sourceObservedAt = typeof row.fechaActualizacion === "string" ? new Date(row.fechaActualizacion) : undefined;
    const observedAt = sourceObservedAt && Number.isFinite(sourceObservedAt.getTime()) ? sourceObservedAt.toISOString() : undefined;
    const warnings: ArbitrageIssueCode[] = sourceObservedAt
      ? ["costs_unverified", "verify_final_price"]
      : ["observed_at_unavailable", "costs_unverified", "verify_final_price"];
    return [{
      id: `${providerId}-${asset.transferAsset.toLowerCase()}`,
      providerId,
      instrument: asset.instrument,
      transferAsset: asset.transferAsset,
      userBuysUsdAt,
      userSellsUsdAt,
      originalBuyLabel: "compra (perspectiva del usuario en DolarApi Exchanges)",
      originalSellLabel: "venta (perspectiva del usuario en DolarApi Exchanges)",
      quoteCurrency: "ARS" as const,
      observedAt,
      fetchedAt,
      sourceUrl: DOLAR_API_URL,
      sourceType: "aggregator" as const,
      status: "delayed" as const,
      fees: { description: "El agregador no informa todos los costos de transferencia y conversión.", confidence: "unknown" as const },
      warnings,
      verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "unverified" } as const,
    }];
  });
  return {
    providerId: "dolarapi-exchanges",
    quotes,
    status: quotes.length ? "partial" : "error",
    fetchedAt,
    errorCode: quotes.length ? undefined : "invalid_payload",
  };
}

export class DolarApiExchangeAdapter implements ArbitrageQuoteProvider {
  readonly id = "dolarapi-exchanges";
  readonly ttlSeconds = 60;

  async fetchQuotes() {
    const fetchedAt = new Date().toISOString();
    const response = await fetch(DOLAR_API_URL, {
      cache: "no-store",
      headers: { Accept: "application/json", "User-Agent": "CMA-Market-Intelligence/1.0 (+informational-quote-monitor)" },
      signal: AbortSignal.timeout(7_000),
    });
    if (!response.ok) throw new Error(`DolarApi upstream returned ${response.status}`);
    return normalizeDolarApiExchangePayload(await readJsonResponse(response, 128_000), fetchedAt);
  }
}
