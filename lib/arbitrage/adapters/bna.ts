import { deriveQuoteStatus } from "../freshness";
import type { ArbitrageQuoteProvider, ProviderQuoteResult } from "../types";
import { parseArgentinaDateTime, parseNumber } from "./shared";

const BNA_QUOTES_URL = "https://www.bna.com.ar/Empresas";

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

export function parseBnaBilleteHtml(html: string, fetchedAt: string): ProviderQuoteResult {
  const section = html.match(/id=["']billetes["'][^>]*>([\s\S]*?)(?=<div class=["']tab-pane|$)/i)?.[1] ?? html;
  const quoteMatch = section.match(/Dolar U\.S\.A<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i);
  const date = stripHtml(section.match(/class=["']fechaCot["'][^>]*>([\s\S]*?)<\/th>/i)?.[1] ?? "");
  const time = stripHtml(section.match(/Hora Actualizaci(?:ó|o)n:\s*([\d:]+)/i)?.[1] ?? "");
  const userSellsUsdAt = parseNumber(stripHtml(quoteMatch?.[1] ?? ""));
  const userBuysUsdAt = parseNumber(stripHtml(quoteMatch?.[2] ?? ""));
  const observedAt = parseArgentinaDateTime(date, time);
  if (!userBuysUsdAt || !userSellsUsdAt || !observedAt) {
    return { providerId: "bna", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  }

  return {
    providerId: "bna",
    status: "success",
    fetchedAt,
    quotes: [{
      id: "bna-usd-billete",
      providerId: "bna",
      instrument: "bank_usd",
      transferAsset: "USD_BANK",
      userBuysUsdAt,
      userSellsUsdAt,
      originalBuyLabel: "Venta",
      originalSellLabel: "Compra",
      quoteCurrency: "ARS",
      observedAt,
      fetchedAt,
      sourceUrl: BNA_QUOTES_URL,
      sourceType: "public_page",
      status: deriveQuoteStatus("bna", observedAt, new Date(fetchedAt)),
      fees: { description: "Costos de la ruta no verificados.", confidence: "unknown" },
      warnings: ["same_holder_required", "costs_unverified", "verify_final_price"],
    }],
  };
}

export class BnaQuoteAdapter implements ArbitrageQuoteProvider {
  readonly id = "bna";
  readonly ttlSeconds = 300;

  async fetchQuotes() {
    const fetchedAt = new Date().toISOString();
    const response = await fetch(BNA_QUOTES_URL, {
      cache: "no-store",
      headers: { Accept: "text/html", "User-Agent": "CMA-Market-Intelligence/1.0 (+informational-quote-monitor)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`BNA upstream returned ${response.status}`);
    return parseBnaBilleteHtml(await response.text(), fetchedAt);
  }
}
