import { getFreshnessStatus } from "./freshness";
import type { ArbitrageIssueCode, FreshnessStatus, FxQuote, UsdCryptoCircuit } from "./types";

const DEFAULT_AMOUNT_USD = 1_000;
const BANK_USD_INSTRUMENTS = new Set(["bank_usd", "official_usd", "usd_24_7"]);

type CircuitDefinition = {
  destinationProviderId: string;
  stablecoin: "USDT" | "USDC";
  mode: "automatic" | "manual";
  destinationInstrument: "crypto_usd_route" | "usdt" | "usdc";
  providerDocumentationUrl: string;
  hasEffectiveCompositeQuote: boolean;
};

const CIRCUIT_DEFINITIONS: CircuitDefinition[] = [
  {
    destinationProviderId: "fiwind",
    stablecoin: "USDT",
    mode: "automatic",
    destinationInstrument: "crypto_usd_route",
    providerDocumentationUrl: "https://help.fiwind.io/es/articles/8042234-como-convierto-pesos-por-dolares-en-un-solo-paso",
    hasEffectiveCompositeQuote: true,
  },
  {
    destinationProviderId: "lemoncash",
    stablecoin: "USDT",
    mode: "manual",
    destinationInstrument: "usdt",
    providerDocumentationUrl: "https://help.lemon.me/es/articles/11586417-como-funcionan-las-transferencias-en-dolares-en-lemon",
    hasEffectiveCompositeQuote: false,
  },
];

function newestTimestamp(source: FxQuote, destination: FxQuote) {
  return destination.observedAt ?? source.observedAt;
}

function combinedFreshness(source: FxQuote, destination: FxQuote, now: Date): FreshnessStatus {
  const values = [getFreshnessStatus(source, now), getFreshnessStatus(destination, now)];
  if (values.includes("stale")) return "stale";
  if (values.includes("unverifiable")) return "unverifiable";
  if (values.includes("warning")) return "warning";
  return "fresh";
}

function unique(items: ArbitrageIssueCode[]) {
  return [...new Set(items)];
}

export function buildUsdCryptoCircuits(
  quotes: FxQuote[],
  amountUsd = DEFAULT_AMOUNT_USD,
  now = new Date(),
): UsdCryptoCircuit[] {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) return [];

  const usdSources = quotes
    .filter((quote) => quote.transferAsset === "USD_BANK"
      && BANK_USD_INSTRUMENTS.has(quote.instrument)
      && typeof quote.userBuysUsdAt === "number"
      && quote.userBuysUsdAt > 0
      && getFreshnessStatus(quote, now) !== "stale")
    .toSorted((left, right) => (left.userBuysUsdAt ?? Infinity) - (right.userBuysUsdAt ?? Infinity));

  return CIRCUIT_DEFINITIONS.flatMap((definition) => {
    const destination = quotes.find((quote) => quote.providerId === definition.destinationProviderId
      && quote.instrument === definition.destinationInstrument
      && typeof quote.userSellsUsdAt === "number"
      && quote.userSellsUsdAt > 0);
    const source = usdSources.find((quote) => quote.providerId !== definition.destinationProviderId);
    if (!source || !destination) return [];

    const usdBuyRateArs = source.userBuysUsdAt ?? 0;
    const stablecoinSellRateArs = destination.userSellsUsdAt ?? 0;
    const effectiveSellRateArs = definition.hasEffectiveCompositeQuote ? stablecoinSellRateArs : undefined;
    const grossSpreadUpperBoundArsPerUsd = stablecoinSellRateArs - usdBuyRateArs;
    const warnings: ArbitrageIssueCode[] = [
      "same_holder_required",
      "costs_unverified",
      "verify_final_price",
      ...source.warnings,
      ...destination.warnings,
    ];
    if (!definition.hasEffectiveCompositeQuote) warnings.push("provider_partial_data");

    return [{
      id: `${source.id}--${definition.destinationProviderId}-${definition.stablecoin.toLowerCase()}-circuit`,
      sourceProviderId: source.providerId,
      destinationProviderId: definition.destinationProviderId,
      sourceQuoteId: source.id,
      destinationQuoteId: destination.id,
      stablecoin: definition.stablecoin,
      mode: definition.mode,
      status: definition.hasEffectiveCompositeQuote ? "effective_quote" : "conversion_spread_unavailable",
      amountUsd,
      usdBuyRateArs,
      stablecoinSellRateArs,
      effectiveSellRateArs,
      grossSpreadUpperBoundArsPerUsd,
      grossResultUpperBoundArs: grossSpreadUpperBoundArsPerUsd * amountUsd,
      netResultArs: undefined,
      freshnessStatus: combinedFreshness(source, destination, now),
      observedAt: newestTimestamp(source, destination),
      fetchedAt: new Date(Math.max(new Date(source.fetchedAt).getTime(), new Date(destination.fetchedAt).getTime())).toISOString(),
      requiresSameHolderAccount: true,
      conversionRateVerified: definition.hasEffectiveCompositeQuote,
      sourceUrl: source.sourceUrl,
      destinationQuoteUrl: destination.sourceUrl,
      providerDocumentationUrl: definition.providerDocumentationUrl,
      warnings: unique(warnings),
    } satisfies UsdCryptoCircuit];
  });
}
