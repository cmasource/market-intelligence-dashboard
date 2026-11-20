import type { ArbitrageIssueCode, ArbitrageQuoteProvider, FxInstrument, ProviderQuoteResult, VerificationLevel } from "../types";
import { deriveQuoteStatus } from "../freshness";
import { parseNumber, readJsonResponse } from "./shared";

const COMPARADOLAR_API_URL = "https://api.comparadolar.ar/usd";
const COMPARADOLAR_DOCS_URL = "https://comparadolar.ar/docs/introduction.html";

type ComparaDolarRow = {
  slug?: unknown;
  bid?: unknown;
  ask?: unknown;
  usdType?: unknown;
  lastSeenAt?: unknown;
  stale?: unknown;
  conditions?: unknown;
};

type ProviderMapping = {
  providerId: string;
  instrument: FxInstrument;
  transferVerification: VerificationLevel;
  expectedUsdType: "Oficial" | "MEP" | "Cripto";
};

const CURATED_PROVIDERS: Record<string, ProviderMapping> = {
  "fiwind-cripto": { providerId: "fiwind", instrument: "crypto_usd_route", transferVerification: "partially_verified", expectedUsdType: "Cripto" },
  "fiwind-mep": { providerId: "fiwind", instrument: "mep", transferVerification: "partially_verified", expectedUsdType: "MEP" },
  cocos: { providerId: "cocos", instrument: "mep", transferVerification: "partially_verified", expectedUsdType: "MEP" },
  "plus-inversiones": { providerId: "plus", instrument: "mep", transferVerification: "partially_verified", expectedUsdType: "MEP" },
  "banco-bica": { providerId: "banco-bica", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  "banco-ciudad": { providerId: "banco-ciudad", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  "banco-hipotecario": { providerId: "banco-hipotecario", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  "banco-provincia": { providerId: "banco-provincia", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  bancor: { providerId: "bancor", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  "brubank-ultra": { providerId: "brubank-ultra", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  "cocos-bank": { providerId: "cocos-bank", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  reba: { providerId: "reba", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  tiendadolar: { providerId: "tiendadolar", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  uala: { providerId: "uala", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
  "voii-oficial": { providerId: "cocos-bank", instrument: "official_usd", transferVerification: "partially_verified", expectedUsdType: "Oficial" },
};

function parseObservedAt(value: unknown, fetchedAt: string) {
  if (typeof value !== "string") return undefined;
  const timestamp = new Date(value);
  const fetched = new Date(fetchedAt);
  if (!Number.isFinite(timestamp.getTime()) || !Number.isFinite(fetched.getTime())) return undefined;
  if (timestamp.getTime() > fetched.getTime() + 60_000) return undefined;
  return timestamp.toISOString();
}

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
    if (typeof row.usdType === "string" && row.usdType !== mapping.expectedUsdType) return [];

    const userBuysUsdAt = parseNumber(row.ask);
    const userSellsUsdAt = parseNumber(row.bid);
    if (userBuysUsdAt === undefined || userSellsUsdAt === undefined) return [];
    if (!isPlausibleRate(userBuysUsdAt, marketMedian) || !isPlausibleRate(userSellsUsdAt, marketMedian)) return [];
    if (userBuysUsdAt < userSellsUsdAt) return [];

    const isCryptoCircuit = mapping.instrument === "crypto_usd_route";
    const isMep = mapping.instrument === "mep";
    const quoteKind = isCryptoCircuit ? "usd-via-usdt" : isMep ? "mep" : "usd";
    const observedAt = parseObservedAt(row.lastSeenAt, fetchedAt);
    const sourceStale = row.stale === true;
    const status = sourceStale
      ? "stale" as const
      : observedAt
        ? deriveQuoteStatus(mapping.providerId, observedAt, new Date(fetchedAt))
        : "delayed" as const;
    const warnings: ArbitrageIssueCode[] = ["costs_unverified", "verify_final_price", "provider_partial_data"];
    if (!observedAt) warnings.push("observed_at_unavailable");
    if (status === "stale") warnings.push("stale_quote");

    return [{
      id: `${mapping.providerId}-${quoteKind}`,
      providerId: mapping.providerId,
      instrument: mapping.instrument,
      transferAsset: "USD_BANK" as const,
      userBuysUsdAt,
      userSellsUsdAt,
      originalBuyLabel: isCryptoCircuit ? "ask (USD → USDT → ARS, ComparaDólar)" : `ask (${isMep ? "Dólar MEP" : "Comprás a"}, ComparaDólar)`,
      originalSellLabel: isCryptoCircuit ? "bid (USD → USDT → ARS, ComparaDólar)" : `bid (${isMep ? "Dólar MEP" : "Vendés a"}, ComparaDólar)`,
      quoteCurrency: "ARS" as const,
      observedAt,
      fetchedAt,
      sourceUrl: COMPARADOLAR_API_URL,
      sourceType: "aggregator" as const,
      status,
      estimatedDelaySeconds: 300,
      sourcePollingIntervalSeconds: 300,
      availabilityNote: typeof row.conditions === "string" && row.conditions.trim() ? row.conditions.trim() : undefined,
      fees: {
        description: isCryptoCircuit
          ? "Tipo de cambio compuesto USD → USDT → ARS agregado por ComparaDólar; costos y monto final deben verificarse en Fiwind."
          : isMep
            ? "Cotización MEP agregada por ComparaDólar; especie, liquidación, costos, límites y precio final deben verificarse en la plataforma."
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
