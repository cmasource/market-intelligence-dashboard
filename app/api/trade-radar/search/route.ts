import { searchSymbolCatalog, type SymbolCatalogItem } from "@/lib/market-data/symbol-catalog";
import { getTradeRadarProviderStatus } from "@/lib/market-data/trade-radar-provider-status";
import type { TradeRadarMarket } from "@/lib/market-data/providers/base";

export const dynamic = "force-dynamic";

type SearchSource = "local_catalog" | "provider" | "mixed";

type ProviderSearchItem = SymbolCatalogItem & { source?: string };

function normalizeLimit(value: string | null) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(1, Math.min(parsed, 25)) : 8;
}

function supportedMarket(value: string | null): TradeRadarMarket | undefined {
  if (!value) return undefined;
  if (["us", "argentina", "cedear", "crypto", "bond", "auto"].includes(value)) return value as TradeRadarMarket;
  return undefined;
}

async function searchTwelveData(query: string, limit: number): Promise<ProviderSearchItem[]> {
  const key = process.env.TWELVE_DATA_API_KEY?.trim();
  if (!key) return [];
  const url = new URL("https://api.twelvedata.com/symbol_search");
  url.searchParams.set("symbol", query);
  url.searchParams.set("apikey", key);

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = await response.json() as { data?: Array<{ symbol?: string; instrument_name?: string; exchange?: string; currency?: string; country?: string; type?: string }> };
    return (data.data ?? []).slice(0, limit).flatMap((item) => {
      if (!item.symbol) return [];
      const symbol = item.symbol.toUpperCase();
      return [{
        symbol,
        name: item.instrument_name ?? symbol,
        market: "us",
        type: item.type?.toLowerCase().includes("etf") ? "ETF" : "Stock",
        providerSymbol: symbol,
        tradingViewSymbol: item.exchange ? `${item.exchange}:${symbol}` : symbol,
        currency: item.currency ?? "USD",
        exchange: item.exchange ?? "Unknown",
        source: "twelveData",
      }];
    });
  } catch {
    return [];
  }
}

async function searchAlphaVantage(query: string, limit: number): Promise<ProviderSearchItem[]> {
  const key = process.env.ALPHA_VANTAGE_API_KEY?.trim();
  if (!key) return [];
  const url = new URL("https://www.alphavantage.co/query");
  url.searchParams.set("function", "SYMBOL_SEARCH");
  url.searchParams.set("keywords", query);
  url.searchParams.set("apikey", key);

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = await response.json() as { bestMatches?: Array<Record<string, string | undefined>> };
    return (data.bestMatches ?? []).slice(0, limit).flatMap((item) => {
      const symbol = item["1. symbol"]?.toUpperCase();
      if (!symbol) return [];
      const exchange = item["4. region"] ?? item["3. type"] ?? "Unknown";
      return [{
        symbol,
        name: item["2. name"] ?? symbol,
        market: "us",
        type: item["3. type"]?.toLowerCase().includes("etf") ? "ETF" : "Stock",
        providerSymbol: symbol,
        tradingViewSymbol: symbol,
        currency: item["8. currency"] ?? "USD",
        exchange,
        source: "alphaVantage",
      }];
    });
  } catch {
    return [];
  }
}

async function searchBinance(query: string, limit: number): Promise<ProviderSearchItem[]> {
  const normalized = query.trim().toUpperCase();
  if (normalized.length < 2) return [];
  const baseUrl = process.env.BINANCE_BASE_URL?.trim() || "https://api.binance.com";
  const url = new URL("/api/v3/exchangeInfo", baseUrl);

  try {
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) return [];
    const data = await response.json() as { symbols?: Array<{ symbol?: string; baseAsset?: string; quoteAsset?: string; status?: string }> };
    return (data.symbols ?? [])
      .filter((item) => item.status === "TRADING")
      .filter((item) => item.symbol?.includes(normalized) || item.baseAsset?.includes(normalized))
      .filter((item) => item.quoteAsset === "USDT")
      .slice(0, limit)
      .flatMap((item) => {
        if (!item.symbol) return [];
        return [{
          symbol: item.symbol,
          name: `${item.baseAsset ?? item.symbol} / ${item.quoteAsset ?? "USDT"}`,
          market: "crypto",
          type: "Crypto",
          providerSymbol: item.symbol,
          tradingViewSymbol: `BINANCE:${item.symbol}`,
          currency: "USD",
          exchange: "Binance",
          source: "binance",
        }];
      });
  } catch {
    return [];
  }
}

function dedupe(items: ProviderSearchItem[], limit: number) {
  const seen = new Set<string>();
  const results: SymbolCatalogItem[] = [];
  for (const item of items) {
    const key = `${item.market}:${item.providerSymbol}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push({
      symbol: item.symbol,
      name: item.name,
      market: item.market,
      type: item.type,
      providerSymbol: item.providerSymbol,
      tradingViewSymbol: item.tradingViewSymbol,
      currency: item.currency,
      exchange: item.exchange,
    });
    if (results.length >= limit) break;
  }
  return results;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const market = supportedMarket(url.searchParams.get("market"));
  const limit = normalizeLimit(url.searchParams.get("limit"));
  const localResults = searchSymbolCatalog({ query, market, limit });
  const status = getTradeRadarProviderStatus();
  const providerResults = query.trim()
    ? [
        ...(market === "crypto" || market === "auto" || !market ? await searchBinance(query, limit) : []),
        ...(status.hasTwelveDataKey && market !== "crypto" ? await searchTwelveData(query, limit) : []),
        ...(status.hasAlphaVantageKey && market !== "crypto" ? await searchAlphaVantage(query, limit) : []),
      ]
    : [];
  const results = dedupe([...localResults, ...providerResults], limit);
  const source: SearchSource = providerResults.length && localResults.length ? "mixed" : providerResults.length ? "provider" : "local_catalog";

  return Response.json({ query, results, source }, { headers: { "Cache-Control": "no-store" } });
}
