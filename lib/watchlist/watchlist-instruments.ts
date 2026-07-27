import type { Instrument } from "@/lib/instruments/types";
import type { WatchlistItemInput } from "./watchlist-types";

export function watchlistItemFromInstrument(instrument: Instrument): WatchlistItemInput {
  return {
    instrumentId: instrument.id,
    symbol: instrument.symbol,
    normalizedSymbol: instrument.providerSymbol ?? instrument.bymaSymbol ?? instrument.symbol,
    displaySymbol: instrument.displaySymbol,
    providerSymbol: instrument.providerSymbol,
    bymaSymbol: instrument.bymaSymbol,
    name: instrument.name,
    assetType: instrument.assetClass,
    market: instrument.market,
    exchange: instrument.exchange,
    currency: instrument.currency,
  };
}
