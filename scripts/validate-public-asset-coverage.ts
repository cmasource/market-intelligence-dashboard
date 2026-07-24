import { getArgentinaInstrument, isArgentinaInstrument } from "../lib/argentina";
import { getCedearRatio } from "../lib/instruments/cedearMappings";
import { resolveInstrument } from "../lib/instruments/resolveInstrument";
import { isProviderQuoteSupported } from "../lib/market-data/provider-symbols";
import { mockAssets } from "../lib/mock-data";

const fixedIncomeTypes = new Set(["sovereign_bond", "cer_bond", "corporate_bond", "letra"]);
const failures: string[] = [];
const rows = mockAssets.map((asset) => {
  const argentinaInstrument = getArgentinaInstrument(asset.symbol);
  const resolution = resolveInstrument({ symbol: asset.symbol });
  const hasArgentinaRoute = isArgentinaInstrument(asset.symbol);
  const hasGlobalRoute = isProviderQuoteSupported(asset.symbol);
  const hasPriceRoute = hasArgentinaRoute || hasGlobalRoute;
  const isFixedIncome = fixedIncomeTypes.has(asset.type);
  const isCedear = argentinaInstrument?.type === "cedear";

  if (!hasPriceRoute) failures.push(`${asset.symbol}: no real-price provider route`);
  if (!resolution && !isFixedIncome) failures.push(`${asset.symbol}: no instrument-master analysis resolution`);

  if (isCedear) {
    const centralRatio = getCedearRatio(asset.symbol);
    if (!centralRatio) failures.push(`${asset.symbol}: no central CEDEAR ratio`);
    if (centralRatio !== argentinaInstrument.cedearRatio) {
      failures.push(`${asset.symbol}: CEDEAR ratio differs between registries`);
    }
  }

  return {
    symbol: asset.symbol,
    price: hasArgentinaRoute ? "argentina-provider-chain" : hasGlobalRoute ? "global-provider-chain" : "unavailable",
    analysis: isFixedIncome ? "quote-only" : resolution?.technicalLayer?.status ?? "unavailable",
    fundamentals: isFixedIncome
      ? "not-applicable"
      : resolution?.dataCoverage.some((capability) => capability === "fundamentals_full" || capability === "fundamentals_underlying")
        ? "routed"
        : "unavailable",
  };
});

const duplicateSymbols = rows
  .map((row) => row.symbol)
  .filter((symbol, index, symbols) => symbols.indexOf(symbol) !== index);
if (duplicateSymbols.length) failures.push(`duplicate symbols: ${Array.from(new Set(duplicateSymbols)).join(", ")}`);

const summary = {
  visibleAssets: rows.length,
  priceRouted: rows.filter((row) => row.price !== "unavailable").length,
  technicalRouted: rows.filter((row) => row.analysis !== "unavailable" && row.analysis !== "quote-only").length,
  quoteOnly: rows.filter((row) => row.analysis === "quote-only").length,
  fundamentalsRouted: rows.filter((row) => row.fundamentals !== "unavailable" && row.fundamentals !== "not-applicable").length,
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exit(1);
}

console.log("Public asset coverage routing is internally consistent.");
