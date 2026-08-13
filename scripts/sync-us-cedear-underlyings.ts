import { writeFile } from "node:fs/promises";
import path from "node:path";
import { providerCedearSymbols } from "../lib/argentina/provider-universe";
import { cedearUnderlyingSymbols } from "../lib/instruments/cedearMappings";

type ListedSecurity = {
  symbol: string;
  officialSymbol: string;
  name: string;
  exchange: string;
  assetClass: "stock" | "etf";
  tradingViewSymbol: string;
};

const NASDAQ_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/nasdaqlisted.txt";
const OTHER_LISTED_URL = "https://www.nasdaqtrader.com/dynamic/SymDir/otherlisted.txt";

function rows(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift()?.split("|") ?? [];
  return lines
    .filter((line) => line && !line.startsWith("File Creation Time"))
    .map((line) => Object.fromEntries(headers.map((header, index) => [header, line.split("|")[index] ?? ""])));
}

function cleanCompanyName(value: string) {
  return value
    .replace(/\s+-\s+Common Stock.*$/i, "")
    .replace(/\s+Common Stock.*$/i, "")
    .replace(/\s+-\s+Class [A-Z].*$/i, "")
    .replace(/\s+Class [A-Z] Common Shares.*$/i, "")
    .replace(/\s+American Depositary (Shares|Receipts).*$/i, "")
    .replace(/\s+Ordinary Shares.*$/i, "")
    .trim();
}

function lookupKeys(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return new Set([
    normalized,
    normalized.replace(/\./g, "-"),
    normalized.replace(/-/g, "."),
    normalized.replace(/[.\- ]/g, ""),
  ]);
}

function addSecurity(map: Map<string, ListedSecurity>, security: ListedSecurity) {
  for (const key of lookupKeys(security.officialSymbol)) map.set(key, security);
}

async function fetchText(url: string) {
  const response = await fetch(url, { headers: { "User-Agent": "CMA-Markets-Instrument-Sync/1.0" } });
  if (!response.ok) throw new Error(`Unable to download ${url}: HTTP ${response.status}`);
  return response.text();
}

async function main() {
  const [nasdaqText, otherText] = await Promise.all([
    fetchText(NASDAQ_LISTED_URL),
    fetchText(OTHER_LISTED_URL),
  ]);
  const listed = new Map<string, ListedSecurity>();

  for (const row of rows(nasdaqText)) {
    if (row["Test Issue"] !== "N" || row["Financial Status"] === "D") continue;
    const officialSymbol = row.Symbol;
    addSecurity(listed, {
      symbol: officialSymbol,
      officialSymbol,
      name: cleanCompanyName(row["Security Name"]),
      exchange: "NASDAQ",
      assetClass: row.ETF === "Y" ? "etf" : "stock",
      tradingViewSymbol: `NASDAQ:${officialSymbol}`,
    });
  }

  const exchangeMap: Record<string, { exchange: string; tradingViewPrefix: string }> = {
    A: { exchange: "NYSE American", tradingViewPrefix: "AMEX" },
    N: { exchange: "NYSE", tradingViewPrefix: "NYSE" },
    P: { exchange: "NYSE Arca", tradingViewPrefix: "AMEX" },
    V: { exchange: "IEX", tradingViewPrefix: "IEX" },
    Z: { exchange: "Cboe BZX", tradingViewPrefix: "BATS" },
  };

  for (const row of rows(otherText)) {
    if (row["Test Issue"] !== "N") continue;
    const exchange = exchangeMap[row.Exchange];
    if (!exchange) continue;
    const officialSymbol = row["ACT Symbol"];
    addSecurity(listed, {
      symbol: officialSymbol,
      officialSymbol,
      name: cleanCompanyName(row["Security Name"]),
      exchange: exchange.exchange,
      assetClass: row.ETF === "Y" ? "etf" : "stock",
      tradingViewSymbol: `${exchange.tradingViewPrefix}:${officialSymbol}`,
    });
  }

  const underlyingSymbols = Array.from(new Set(providerCedearSymbols.map((localSymbol) => {
    const mapping = cedearUnderlyingSymbols[localSymbol];
    if (mapping?.exchange && !["NYSE", "NASDAQ", "NYSE Arca", "NYSE American"].includes(mapping.exchange)) return null;
    return mapping?.underlyingSymbol ?? localSymbol;
  }).filter((symbol): symbol is string => Boolean(symbol))));

  const missing: string[] = [];
  const metadata = underlyingSymbols.flatMap((symbol) => {
    const security = Array.from(lookupKeys(symbol)).map((key) => listed.get(key)).find(Boolean);
    if (!security) {
      missing.push(symbol);
      return [];
    }
    return [{
      symbol,
      name: security.name,
      exchange: security.exchange,
      assetClass: security.assetClass,
      tradingViewSymbol: security.tradingViewSymbol,
    }];
  }).sort((left, right) => left.symbol.localeCompare(right.symbol));

  const outputPath = path.join(process.cwd(), "data", "us-cedear-underlyings.generated.json");
  await writeFile(outputPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    sources: [NASDAQ_LISTED_URL, OTHER_LISTED_URL],
    instruments: metadata,
  }, null, 2)}\n`, "utf8");

  console.log(`Wrote ${metadata.length} US instruments to ${outputPath}.`);
  console.log(`Skipped ${missing.length} symbols not present in the US listings: ${missing.join(", ")}`);
}

void main();
