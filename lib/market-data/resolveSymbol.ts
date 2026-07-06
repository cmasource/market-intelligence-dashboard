import { getArgentinaInstrument } from "@/lib/argentina";
import { findSymbolCatalogItem } from "./symbol-catalog";
import { normalizeProviderSymbol, type TradeRadarMarket } from "./providers/base";

const cedearUnderlyingMap: Record<string, string> = {
  AAPL: "AAPL",
  MSFT: "MSFT",
  NVDA: "NVDA",
  TSLA: "TSLA",
  AMZN: "AMZN",
  META: "META",
  GOOGL: "GOOGL",
  KO: "KO",
  MELI: "MELI",
  SPY: "SPY",
  QQQ: "QQQ",
};

const cryptoPattern = /^(BTC|ETH|SOL|BNB|XRP|ADA|DOGE|AVAX|LINK|DOT)(-USD|USDT)?$/i;
const localSuffixPattern = /(BA|BCBA)$/i;

export type ResolvedTradeRadarSymbol = {
  inputSymbol: string;
  resolvedSymbol: string;
  market: Exclude<TradeRadarMarket, "auto">;
  underlyingSymbol?: string;
  notes: string[];
};

export function resolveTradeRadarSymbol(symbol: string, market: TradeRadarMarket): ResolvedTradeRadarSymbol {
  const normalized = normalizeProviderSymbol(symbol).replace(/^BCBA:/, "").replace(/^NASDAQ:/, "").replace(/^NYSE:/, "");
  const notes: string[] = [];

  if (!normalized) {
    return { inputSymbol: normalized, resolvedSymbol: normalized, market: "us", notes: ["Symbol is required."] };
  }

  if (market !== "auto") {
    const catalogItem = findSymbolCatalogItem(normalized);
    const underlyingSymbol = market === "cedear" ? catalogItem?.providerSymbol ?? cedearUnderlyingMap[normalized] : undefined;
    return {
      inputSymbol: normalized,
      resolvedSymbol: underlyingSymbol ?? catalogItem?.providerSymbol ?? normalized,
      market,
      underlyingSymbol,
      notes: underlyingSymbol
        ? [
            `CEDEAR mapped to US underlying ${underlyingSymbol}.`,
            "El analisis corresponde al subyacente en USD; el CEDEAR local puede diferir por CCL, ratio, liquidez y spread.",
          ]
        : [],
    };
  }

  const catalogItem = findSymbolCatalogItem(normalized);
  if (catalogItem) {
    return {
      inputSymbol: normalized,
      resolvedSymbol: catalogItem.providerSymbol,
      market: catalogItem.market,
      notes: [],
    };
  }

  if (cryptoPattern.test(normalized)) return { inputSymbol: normalized, resolvedSymbol: normalized, market: "crypto", notes };
  if (getArgentinaInstrument(normalized) || localSuffixPattern.test(normalized)) {
    return {
      inputSymbol: normalized,
      resolvedSymbol: normalized.replace(/\.?(BA|BCBA)$/i, ""),
      market: "argentina",
      notes,
    };
  }
  if (cedearUnderlyingMap[normalized]) {
    return {
      inputSymbol: normalized,
      resolvedSymbol: cedearUnderlyingMap[normalized],
      market: "cedear",
      underlyingSymbol: cedearUnderlyingMap[normalized],
      notes: [
        `Auto-detected possible CEDEAR/US symbol and mapped to ${cedearUnderlyingMap[normalized]}.`,
        "El analisis corresponde al subyacente en USD; el CEDEAR local puede diferir por CCL, ratio, liquidez y spread.",
      ],
    };
  }

  return { inputSymbol: normalized, resolvedSymbol: normalized, market: "us", notes };
}
