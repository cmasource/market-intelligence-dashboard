import type { ArbitrageIssueCode, ArbitrageQuoteProvider, FxInstrument, ProviderQuoteResult, TransferAsset } from "../types";
import { readJsonResponse, parseNumber } from "./shared";

const CRIPTOYA_BASE_URL = "https://criptoya.com/api";
const CRIPTOYA_DOCS_URL = "https://docs.criptoya.com/argentina/";
const REFERENCE_VOLUME = 1_000;
const SUPPORTED_PROVIDERS = new Set(["belo", "dolarapp", "fiwind", "satoshitango"]);

type CriptoYaAsset = "USDT" | "USDC";
type CriptoYaQuote = {
  ask?: unknown;
  totalAsk?: unknown;
  bid?: unknown;
  totalBid?: unknown;
  time?: unknown;
};

function assetMetadata(asset: CriptoYaAsset): { transferAsset: TransferAsset; instrument: FxInstrument } {
  return asset === "USDT"
    ? { transferAsset: "USDT", instrument: "usdt" }
    : { transferAsset: "USDC", instrument: "usdc" };
}

function parseObservedAt(value: unknown, fetchedAt: string) {
  const epochSeconds = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(epochSeconds) || epochSeconds < 1_577_836_800) return undefined;
  const observedAt = new Date(epochSeconds * 1_000);
  const fetchedTime = new Date(fetchedAt).getTime();
  if (!Number.isFinite(observedAt.getTime()) || !Number.isFinite(fetchedTime) || observedAt.getTime() > fetchedTime + 5 * 60_000) return undefined;
  return observedAt.toISOString();
}

export function normalizeCriptoYaPayloads(
  payloads: Partial<Record<CriptoYaAsset, unknown>>,
  fetchedAt: string,
  quotedAmountUsd = REFERENCE_VOLUME,
): ProviderQuoteResult {
  const quotes = (Object.entries(payloads) as Array<[CriptoYaAsset, unknown]>).flatMap(([assetName, payload]) => {
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
    const asset = assetMetadata(assetName);
    return Object.entries(payload).flatMap(([rawProviderId, rawQuote]) => {
      const providerId = rawProviderId.toLowerCase();
      if (!SUPPORTED_PROVIDERS.has(providerId) || !rawQuote || typeof rawQuote !== "object" || Array.isArray(rawQuote)) return [];
      const row = rawQuote as CriptoYaQuote;
      const userBuysUsdAt = parseNumber(row.totalAsk) ?? parseNumber(row.ask);
      const userSellsUsdAt = parseNumber(row.totalBid) ?? parseNumber(row.bid);
      if (!userBuysUsdAt && !userSellsUsdAt) return [];
      const observedAt = parseObservedAt(row.time, fetchedAt);
      const warnings: ArbitrageIssueCode[] = ["costs_unverified", "verify_final_price", "volume_specific_quote"];
      if (!observedAt) warnings.push("observed_at_unavailable");

      return [{
        id: `${providerId}-${asset.transferAsset.toLowerCase()}`,
        providerId,
        instrument: asset.instrument,
        transferAsset: asset.transferAsset,
        userBuysUsdAt,
        userSellsUsdAt,
        originalBuyLabel: "totalAsk (precio efectivo informado por CriptoYa)",
        originalSellLabel: "totalBid (precio efectivo informado por CriptoYa)",
        quoteCurrency: "ARS" as const,
        quotedAmountUsd,
        observedAt,
        fetchedAt,
        sourceUrl: `${CRIPTOYA_BASE_URL}/${assetName}/ARS/${quotedAmountUsd}`,
        sourceType: "aggregator" as const,
        status: observedAt ? "delayed" as const : "stale" as const,
        estimatedDelaySeconds: 60,
        fees: {
          description: "CriptoYa informa totalAsk/totalBid para el volumen consultado; no confirma todos los costos de transferencia, retiro o conversión.",
          confidence: "unknown" as const,
        },
        warnings,
        verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" } as const,
      }];
    });
  });

  return {
    providerId: "criptoya-stablecoins",
    quotes,
    status: quotes.length ? (quotes.some((quote) => !quote.observedAt) ? "partial" : "success") : "error",
    fetchedAt,
    errorCode: quotes.length ? undefined : "invalid_payload",
  };
}

export class CriptoYaStablecoinAdapter implements ArbitrageQuoteProvider {
  readonly id = "criptoya-stablecoins";
  readonly ttlSeconds = 60;

  async fetchQuotes(): Promise<ProviderQuoteResult> {
    const fetchedAt = new Date().toISOString();
    const results = await Promise.allSettled((["USDT", "USDC"] as const).map(async (asset) => {
      const response = await fetch(`${CRIPTOYA_BASE_URL}/${asset}/ARS/${REFERENCE_VOLUME}`, {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          Referer: CRIPTOYA_DOCS_URL,
          "User-Agent": "CMA-Market-Intelligence/1.0 (+informational-quote-monitor)",
        },
        signal: AbortSignal.timeout(7_000),
      });
      if (!response.ok) throw new Error(`CriptoYa upstream returned ${response.status}`);
      return [asset, await readJsonResponse(response, 256_000)] as const;
    }));
    const payloads = Object.fromEntries(results.flatMap((result) => result.status === "fulfilled" ? [result.value] : []));
    if (!Object.keys(payloads).length) throw new Error("CriptoYa stablecoin sources unavailable");
    const normalized = normalizeCriptoYaPayloads(payloads, fetchedAt);
    if (results.every((result) => result.status === "fulfilled")) return normalized;
    return {
      ...normalized,
      status: "partial",
      quotes: normalized.quotes.map((quote) => ({
        ...quote,
        warnings: [...new Set([...quote.warnings, "provider_partial_data" as const])],
      })),
    };
  }
}
