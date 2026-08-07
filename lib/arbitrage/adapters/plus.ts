import { deriveQuoteStatus } from "../freshness";
import type { ArbitrageQuoteProvider, ProviderQuoteResult } from "../types";
import { parseArgentinaTimestamp, parseNumber, readJsonResponse } from "./shared";

const PLUS_QUOTES_URL = "https://api.plus.com.ar/currencies?front-web=true";

type PlusCurrency = {
  code?: unknown;
  sell?: unknown;
  buy?: unknown;
  date?: unknown;
};

export function normalizePlusPayload(payload: unknown, fetchedAt: string): ProviderQuoteResult {
  const currencies = Array.isArray(payload) ? payload : [payload];
  const usd = currencies.find((item): item is PlusCurrency => Boolean(item && typeof item === "object" && String((item as PlusCurrency).code).toLowerCase() === "usd"));
  const userBuysUsdAt = parseNumber(usd?.sell);
  const userSellsUsdAt = parseNumber(usd?.buy);
  const observedAt = typeof usd?.date === "string" ? parseArgentinaTimestamp(usd.date) : undefined;
  if (!usd || (!userBuysUsdAt && !userSellsUsdAt) || !observedAt) {
    return { providerId: "plus", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  }

  return {
    providerId: "plus",
    status: userBuysUsdAt && userSellsUsdAt ? "success" : "partial",
    fetchedAt,
    quotes: [{
      id: "plus-usd-bank",
      providerId: "plus",
      instrument: "bank_usd",
      transferAsset: "USD_BANK",
      userBuysUsdAt,
      userSellsUsdAt,
      originalBuyLabel: "sell",
      originalSellLabel: "buy",
      quoteCurrency: "ARS",
      observedAt,
      fetchedAt,
      sourceUrl: "https://plus.com.ar/operar/",
      sourceType: "public_endpoint",
      status: deriveQuoteStatus("plus", observedAt, new Date(fetchedAt)),
      fees: { fixedArs: 0, percentage: 0, fixedUsd: 0, description: "Sin comisión adicional publicada para Plus Cambio.", confidence: "confirmed" },
      warnings: ["same_holder_required", "verify_final_price"],
      verification: { quote: "verified", costs: "verified", limits: "unverified", transferAsset: "partially_verified" },
    }],
  };
}

export class PlusQuoteAdapter implements ArbitrageQuoteProvider {
  readonly id = "plus";
  readonly ttlSeconds = 60;

  async fetchQuotes() {
    const fetchedAt = new Date().toISOString();
    const response = await fetch(PLUS_QUOTES_URL, {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Origin: "https://plus.com.ar",
        Referer: "https://plus.com.ar/operar/",
        "User-Agent": "CMA-Market-Intelligence/1.0 (+informational-quote-monitor)",
      },
      signal: AbortSignal.timeout(7_000),
    });
    if (!response.ok) throw new Error(`Plus upstream returned ${response.status}`);
    return normalizePlusPayload(await readJsonResponse(response, 64_000), fetchedAt);
  }
}
