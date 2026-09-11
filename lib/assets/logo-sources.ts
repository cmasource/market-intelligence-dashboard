import { cedearUnderlyingSymbols } from "@/lib/instruments/cedearMappings";

export type LogoLookupKind = "domain" | "ticker" | "crypto" | "name";

export type LogoLookup = {
  kind: LogoLookupKind;
  value: string;
};

type LogoSourceInput = {
  symbol: string;
  name?: string;
  type?: string;
  domain?: string;
  cryptoId?: string;
};

const nonCorporateTypes = new Set([
  "bond",
  "bill",
  "sovereign_bond",
  "global_bond",
  "cer_bond",
  "dollar_linked_bond",
  "letra",
  "lecap",
  "fx_reference",
  "index",
  "mutual_fund",
]);

function cleanSymbol(symbol: string) {
  return symbol.trim().toUpperCase().replace(/-USD$/, "");
}

function cleanCompanyName(name?: string) {
  if (!name) return null;
  const cleaned = name
    .replace(/\bCEDEAR(?: ETF)?(?: reference)?\b/gi, "")
    .replace(/\bADR\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.length >= 2 ? cleaned : null;
}

function tickerFor(input: LogoSourceInput) {
  const symbol = cleanSymbol(input.symbol);
  const type = input.type?.toLowerCase();

  if (type === "cedear" || type === "cedear_etf") {
    return cedearUnderlyingSymbols[symbol]?.underlyingSymbol ?? symbol;
  }

  if (type === "argentine_equity") return `${symbol}.BA`;

  return symbol;
}

function uniqueLookups(items: Array<LogoLookup | null>) {
  const seen = new Set<string>();
  return items.filter((item): item is LogoLookup => {
    if (!item) return false;
    const key = `${item.kind}:${item.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function getLogoLookups(input: LogoSourceInput): LogoLookup[] {
  const type = input.type?.toLowerCase();
  const symbol = cleanSymbol(input.symbol);

  if (type === "crypto" || input.cryptoId) {
    return uniqueLookups([
      { kind: "crypto", value: symbol.toLowerCase() || input.cryptoId! },
    ]);
  }

  if (type && nonCorporateTypes.has(type)) {
    return input.domain ? [{ kind: "domain", value: input.domain }] : [];
  }

  const companyName = cleanCompanyName(input.name);
  return uniqueLookups([
    input.domain ? { kind: "domain", value: input.domain } : null,
    symbol ? { kind: "ticker", value: tickerFor(input) } : null,
    companyName ? { kind: "name", value: companyName } : null,
  ]);
}

export function logoLookupPath(lookup: LogoLookup) {
  if (lookup.kind === "domain") return encodeURIComponent(lookup.value);
  return `${lookup.kind}/${encodeURIComponent(lookup.value)}`;
}
