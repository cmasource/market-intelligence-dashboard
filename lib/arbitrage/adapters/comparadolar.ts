import type { ArbitrageIssueCode, ArbitrageQuoteProvider, FxInstrument, ProviderQuoteResult, VerificationLevel } from "../types";
import { parseNumber, readJsonResponse } from "./shared";

const COMPARADOLAR_API_URL = "https://api.comparadolar.ar/usd";
const COMPARADOLAR_DOCS_URL = "https://comparadolar.ar/docs/introduction.html";

type ComparaDolarRow = {
  slug?: unknown;
  bid?: unknown;
  ask?: unknown;
};

type ProviderMapping = {
  providerId: string;
  instrument: FxInstrument;
  transferVerification: VerificationLevel;
};

const CURATED_PROVIDERS: Record<string, ProviderMapping> = {
  "fiwind-cripto": { providerId: "fiwind", instrument: "crypto_usd_route", transferVerification: "partially_verified" },
  balanz: { providerId: "balanz", instrument: "bank_usd", transferVerification: "partially_verified" },
  "banco-ciudad": { providerId: "banco-ciudad", instrument: "bank_usd", transferVerification: "partially_verified" },
  "banco-hipotecario": { providerId: "banco-hipotecario", instrument: "bank_usd", transferVerification: "partially_verified" },
  "banco-provincia": { providerId: "banco-provincia", instrument: "bank_usd", transferVerification: "partially_verified" },
  "banco-supervielle": { providerId: "banco-supervielle", instrument: "bank_usd", transferVerification: "partially_verified" },
  reba: { providerId: "reba", instrument: "bank_usd", transferVerification: "partially_verified" },
  uala: { providerId: "uala", instrument: "bank_usd", transferVerification: "partially_verified" },
};

function median(values: number[]) {
  if (!values.length) return undefined;
  const sorted = values.toSorted((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[middle];
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

function isPlausibleRate(value: number | undefined, marketMedian: number) {
  return value !== undefined && value >= marketMedian / 4 && value <= marketMedian * 4;
}

export function normalizeComparaDolarUsdPayload(payload: unknown, fetchedAt: string): ProviderQuoteResult {
  if (!Array.isArray(payload)) {
    return { providerId: "comparadolar-usd", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  }

  const rows = payload.filter((row): row is ComparaDolarRow => Boolean(row) && typeof row === "object" && !Array.isArray(row));
  const marketMedian = median(rows.flatMap((row) => [parseNumber(row.bid), parseNumber(row.ask)].filter((value): value is number => value !== undefined)));
  if (!marketMedian) {
    return { providerId: "comparadolar-usd", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  }

  const quotes = rows.flatMap((row) => {
    const slug = typeof row.slug === "string" ? row.slug.toLowerCase() : "";
    const mapping = CURATED_PROVIDERS[slug];
    if (!mapping) return [];

    const userBuysUsdAt = parseNumber(row.ask);
    const userSellsUsdAt = parseNumber(row.bid);
    if (userBuysUsdAt === undefined || userSellsUsdAt === undefined) return [];
    if (!isPlausibleRate(userBuysUsdAt, marketMedian) || !isPlausibleRate(userSellsUsdAt, marketMedian)) return [];
    if (userBuysUsdAt < userSellsUsdAt) return [];

    const isCryptoCircuit = mapping.instrument === "crypto_usd_route";
    const warnings: ArbitrageIssueCode[] = ["observed_at_unavailable", "costs_unverified", "verify_final_price", "provider_partial_data"];

    return [{
      id: `${mapping.providerId}-${isCryptoCircuit ? "usd-via-usdt" : "usd"}`,
      providerId: mapping.providerId,
      instrument: mapping.instrument,
      transferAsset: "USD_BANK" as const,
      userBuysUsdAt,
      userSellsUsdAt,
      originalBuyLabel: isCryptoCircuit ? "ask (USD → USDT → ARS, ComparaDólar)" : "ask (Comprás a, ComparaDólar)",
      originalSellLabel: isCryptoCircuit ? "bid (USD → USDT → ARS, ComparaDólar)" : "bid (Vendés a, ComparaDólar)",
      quoteCurrency: "ARS" as const,
      fetchedAt,
      sourceUrl: COMPARADOLAR_API_URL,
      sourceType: "aggregator" as const,
      status: "delayed" as const,
      estimatedDelaySeconds: 300,
      fees: {
        description: isCryptoCircuit
          ? "Tipo de cambio compuesto USD → USDT → ARS agregado por ComparaDólar; costos y monto final deben verificarse en Fiwind."
          : "Cotización agregada por ComparaDólar; costos operativos, límites y precio final no verificados.",
        confidence: "unknown" as const,
      },
      warnings,
      verification: {
        quote: "reference_only" as const,
        costs: "unverified" as const,
        limits: "unverified" as const,
        transferAsset: mapping.transferVerification,
      },
    }];
  });

  return {
    providerId: "comparadolar-usd",
    quotes,
    status: quotes.length ? "partial" : "error",
    fetchedAt,
    errorCode: quotes.length ? undefined : "invalid_payload",
  };
}

export class ComparaDolarUsdAdapter implements ArbitrageQuoteProvider {
  readonly id = "comparadolar-usd";
  readonly ttlSeconds = 60;

  async fetchQuotes(): Promise<ProviderQuoteResult> {
    const fetchedAt = new Date().toISOString();
    const response = await fetch(COMPARADOLAR_API_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Referer: COMPARADOLAR_DOCS_URL,
        "User-Agent": "CMA-Market-Intelligence/1.0 (+informational-quote-monitor)",
      },
      signal: AbortSignal.timeout(7_000),
    });
    if (!response.ok) throw new Error(`ComparaDólar upstream returned ${response.status}`);
    return normalizeComparaDolarUsdPayload(await readJsonResponse(response, 128_000), fetchedAt);
  }
}
