import type { ArbitrageQuoteProvider, ProviderQuoteResult, QuoteStatus } from "../types";
import { parseNumber, readTextResponse } from "./shared";

const SUPERVIELLE_QUOTES_URL = "https://personas.supervielle.com.ar/Pages/QuotesPanel/Quotes.aspx";
const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function argentinaDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ARGENTINA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseSourceDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (!match) return undefined;
  const [, day, month, year] = match;
  const sourceDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  const parsed = new Date(`${sourceDate}T12:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return undefined;
  if (parsed.getUTCFullYear() !== Number(year) || parsed.getUTCMonth() + 1 !== Number(month) || parsed.getUTCDate() !== Number(day)) return undefined;
  return sourceDate;
}

function sourceDateStatus(sourceDate: string, fetchedAt: string): QuoteStatus {
  const fetched = new Date(fetchedAt);
  if (!Number.isFinite(fetched.getTime())) return "stale";
  const currentDate = argentinaDate(fetched);
  if (sourceDate === currentDate) return "live";
  const sourceDay = new Date(`${sourceDate}T12:00:00-03:00`).getTime();
  const currentDay = new Date(`${currentDate}T12:00:00-03:00`).getTime();
  if (!Number.isFinite(sourceDay) || sourceDay > currentDay) return "stale";
  return currentDay - sourceDay <= 24 * 60 * 60 * 1000 ? "delayed" : "stale";
}

export function parseSupervielleQuotesHtml(html: string, fetchedAt: string): ProviderQuoteResult {
  const sourceDate = parseSourceDate(stripHtml(html.match(/id=["']lblDate["'][^>]*>([\s\S]*?)<\/span>/i)?.[1] ?? ""));
  const usdRow = html.match(/<tr[^>]*>[\s\S]*?U\$S\s*EEUU[\s\S]*?<td[^>]*class=["']coti["'][^>]*>([\s\S]*?)<\/td>\s*<td[^>]*class=["']coti["'][^>]*>([\s\S]*?)<\/td>[\s\S]*?<\/tr>/i);
  const userSellsUsdAt = parseNumber(stripHtml(usdRow?.[1] ?? ""));
  const userBuysUsdAt = parseNumber(stripHtml(usdRow?.[2] ?? ""));
  if (!sourceDate || !userBuysUsdAt || !userSellsUsdAt || userBuysUsdAt < userSellsUsdAt) {
    return { providerId: "banco-supervielle", quotes: [], status: "error", fetchedAt, errorCode: "invalid_payload" };
  }

  const status = sourceDateStatus(sourceDate, fetchedAt);
  return {
    providerId: "banco-supervielle",
    status: status === "live" ? "success" : "partial",
    fetchedAt,
    quotes: [{
      id: "banco-supervielle-usd",
      providerId: "banco-supervielle",
      instrument: "official_usd",
      transferAsset: "USD_BANK",
      userBuysUsdAt,
      userSellsUsdAt,
      originalBuyLabel: "Venta",
      originalSellLabel: "Compra",
      quoteCurrency: "ARS",
      sourceDate,
      fetchedAt,
      sourceUrl: SUPERVIELLE_QUOTES_URL,
      sourceType: "public_page",
      status,
      estimatedDelaySeconds: 300,
      sourcePollingIntervalSeconds: 300,
      availabilityNote: "Cotización vigente para operaciones de Online Banking.",
      fees: { description: "Costos operativos, límites y precio final deben verificarse antes de confirmar.", confidence: "unknown" },
      warnings: ["same_holder_required", "costs_unverified", "verify_final_price", ...(status === "stale" ? ["stale_quote" as const] : [])],
      verification: { quote: "partially_verified", costs: "unverified", limits: "unverified", transferAsset: "partially_verified" },
    }],
  };
}

export class SupervielleQuoteAdapter implements ArbitrageQuoteProvider {
  readonly id = "banco-supervielle";
  readonly ttlSeconds = 300;

  async fetchQuotes() {
    const fetchedAt = new Date().toISOString();
    const response = await fetch(SUPERVIELLE_QUOTES_URL, {
      cache: "no-store",
      headers: { Accept: "text/html", "User-Agent": "CMA-Market-Intelligence/1.0 (+informational-quote-monitor)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Supervielle upstream returned ${response.status}`);
    return parseSupervielleQuotesHtml(await readTextResponse(response, 128_000), fetchedAt);
  }
}
