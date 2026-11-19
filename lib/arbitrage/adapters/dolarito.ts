import { deriveQuoteStatus } from "../freshness";
import type { ArbitrageQuoteProvider, ProviderQuoteResult } from "../types";
import { readTextResponse } from "./shared";

const DOLARITO_BRUBANK_URL = "https://www.dolarito.ar/cotizacion/dolar/banco/brubank";

function parseEmbeddedBrubankQuote(html: string) {
  const normalized = html.replaceAll('\\"', '"');
  const match = normalized.match(/"quotation":\{"name":"Brubank","buy":([\d.]+),"sell":([\d.]+),"timestamp":(\d+)/);
  if (!match) return undefined;

  const userSellsUsdAt = Number(match[1]);
  const userBuysUsdAt = Number(match[2]);
  const timestamp = Number(match[3]);
  if (!Number.isFinite(userBuysUsdAt) || !Number.isFinite(userSellsUsdAt) || !Number.isFinite(timestamp)) return undefined;
  if (userBuysUsdAt <= 0 || userSellsUsdAt <= 0 || userBuysUsdAt < userSellsUsdAt) return undefined;

  return { userBuysUsdAt, userSellsUsdAt, timestamp };
}

export function parseDolaritoBrubankHtml(html: string, fetchedAt: string): ProviderQuoteResult {
  const parsed = parseEmbeddedBrubankQuote(html);
  const fetchedTimestamp = new Date(fetchedAt).getTime();
  if (!parsed || !Number.isFinite(fetchedTimestamp) || parsed.timestamp > fetchedTimestamp + 60_000) {
    return { providerId: "dolarito-brubank", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  }

  const observedAt = new Date(parsed.timestamp).toISOString();
  const status = deriveQuoteStatus("brubank", observedAt, new Date(fetchedAt));
  return {
    providerId: "dolarito-brubank",
    status: status === "stale" ? "partial" : "success",
    fetchedAt,
    quotes: [{
      id: "brubank-standard-usd",
      providerId: "brubank",
      instrument: "official_usd",
      transferAsset: "USD_BANK",
      userBuysUsdAt: parsed.userBuysUsdAt,
      userSellsUsdAt: parsed.userSellsUsdAt,
      originalBuyLabel: "Venta (Dolarito)",
      originalSellLabel: "Compra (Dolarito)",
      quoteCurrency: "ARS",
      observedAt,
      fetchedAt,
      sourceUrl: DOLARITO_BRUBANK_URL,
      sourceType: "aggregator",
      status,
      estimatedDelaySeconds: 300,
      sourcePollingIntervalSeconds: 300,
      availabilityNote: "Cotización estándar; el tipo de cambio Ultra se muestra por separado.",
      fees: { description: "Cotización minorista agregada; verificar el precio final en la app de Brubank.", confidence: "unknown" },
      warnings: ["costs_unverified", "verify_final_price", "provider_partial_data"],
      verification: { quote: "reference_only", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" },
    }],
  };
}

export class DolaritoBrubankAdapter implements ArbitrageQuoteProvider {
  readonly id = "dolarito-brubank";
  readonly ttlSeconds = 300;

  async fetchQuotes() {
    const fetchedAt = new Date().toISOString();
    const response = await fetch(DOLARITO_BRUBANK_URL, {
      cache: "no-store",
      headers: {
        Accept: "text/html",
        "User-Agent": "Mozilla/5.0 (compatible; CMA-Market-Intelligence/1.0; +informational-quote-monitor)",
      },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Dolarito upstream returned ${response.status}`);
    return parseDolaritoBrubankHtml(await readTextResponse(response), fetchedAt);
  }
}
