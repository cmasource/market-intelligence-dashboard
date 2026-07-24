import type { Instrument } from "@/lib/instruments/types";
import type { Asset, AssetType } from "@/types/asset";

function assetTypeFromInstrument(instrument: Instrument): AssetType {
  if (instrument.assetClass === "adr") return "stock";
  if (instrument.assetClass === "cedear" || instrument.assetClass === "cedear_etf") return "cedear";
  if (instrument.assetClass === "etf") return "etf";
  if (instrument.assetClass === "crypto") return "crypto";
  if (instrument.assetClass === "bill") return "letra";
  if (instrument.assetClass === "bond") return "sovereign_bond";
  if (instrument.assetClass === "corporate_bond") return "corporate_bond";
  if (instrument.market === "argentina" && instrument.assetClass === "stock") return "argentine_equity";
  if (instrument.assetClass === "index") return "index";
  return "stock";
}

function typeLabel(type: AssetType) {
  const labels: Record<AssetType, string> = {
    stock: "Stock",
    etf: "ETF",
    cedear: "CEDEAR",
    argentine_equity: "Accion argentina",
    sovereign_bond: "Bono soberano",
    cer_bond: "Bono CER",
    corporate_bond: "Obligacion negociable",
    letra: "Letra",
    crypto: "Cripto",
    fx_reference: "Referencia FX",
    index: "Indice",
  };
  return labels[type];
}

export function assetFromInstrument(instrument: Instrument): Asset {
  const type = assetTypeFromInstrument(instrument);
  const isArgentina = instrument.market === "argentina";
  const isCrypto = instrument.market === "crypto";

  return {
    symbol: instrument.symbol,
    name: instrument.name,
    nameEn: instrument.name,
    nameEs: instrument.name,
    type,
    typeLabel: typeLabel(type),
    market: instrument.exchange,
    currency: instrument.currency,
    quoteCurrency: instrument.currency,
    priceDisplayCurrency: instrument.currency,
    price: 0,
    dailyChange: 0,
    technicalScore: 0,
    fundamentalScore: undefined,
    riskLevel: type === "crypto" ? "very_high" : isArgentina ? "high" : "medium",
    summary: `${instrument.displaySymbol} forma parte del universo ampliado de CMA Markets. La cotizacion y el analisis se calculan desde proveedores disponibles al abrir el activo.`,
    summaryEn: `${instrument.displaySymbol} is part of the expanded CMA Markets universe. Quote and analysis are calculated from available providers when the asset is opened.`,
    summaryEs: `${instrument.displaySymbol} forma parte del universo ampliado de CMA Markets. La cotizacion y el analisis se calculan desde proveedores disponibles al abrir el activo.`,
    technical: {
      sma20: 0,
      sma50: 0,
      sma200: 0,
      ema12: 0,
      ema26: 0,
      rsi14: 0,
      macd: "N/D",
      atr: 0,
      bollingerBands: "N/D",
      volumeTrend: "N/D",
      support: 0,
      resistance: 0,
      signal: "Neutral consolidation",
    },
    fundamentals: undefined,
    news: [],
    argentinaContext: isArgentina,
    cryptoContext: isCrypto,
    settlementContext: instrument.settlementPeriods?.join(" / "),
    settlementContextEn: instrument.settlementPeriods?.join(" / "),
    settlementContextEs: instrument.settlementPeriods?.join(" / "),
  };
}
