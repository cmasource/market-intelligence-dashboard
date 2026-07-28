import { adrToLocalSymbol, localToAdrSymbol } from "./argentinaMappings";
import { providerCedearSymbols, providerEquitySymbols, providerInstrumentNames } from "@/lib/argentina/provider-universe";
import { cedearUnderlyingSymbols, cedearWarning } from "./cedearMappings";
import { fixedIncomeGroups } from "./fixedIncomeMappings";
import type { Instrument, InstrumentAssetClass } from "./types";

type UsSeed = { symbol: string; name: string; exchange: string; assetClass: "stock" | "etf" | "adr"; tv?: string; tags?: string[] };

const usEtfs: UsSeed[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:SPY" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", assetClass: "etf", tv: "NASDAQ:QQQ" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF Trust", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:DIA" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:IWM" },
  { symbol: "GLD", name: "SPDR Gold Shares", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:GLD" },
  { symbol: "SLV", name: "iShares Silver Trust", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:SLV" },
  { symbol: "USO", name: "United States Oil Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:USO", tags: ["commodity", "oil"] },
  { symbol: "UNG", name: "United States Natural Gas Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:UNG", tags: ["commodity", "natural gas"] },
  { symbol: "DBA", name: "Invesco DB Agriculture Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:DBA", tags: ["commodity", "agriculture"] },
  { symbol: "CPER", name: "United States Copper Index Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:CPER", tags: ["commodity", "copper"] },
  { symbol: "PPLT", name: "abrdn Physical Platinum Shares ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:PPLT", tags: ["commodity", "platinum"] },
  { symbol: "PALL", name: "abrdn Physical Palladium Shares ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:PALL", tags: ["commodity", "palladium"] },
  { symbol: "TLT", name: "iShares 20+ Year Treasury Bond ETF", exchange: "NASDAQ", assetClass: "etf", tv: "NASDAQ:TLT" },
  { symbol: "HYG", name: "iShares iBoxx High Yield Corporate Bond ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:HYG" },
  { symbol: "VOO", name: "Vanguard S&P 500 ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:VOO" },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:VTI" },
  { symbol: "ARKK", name: "ARK Innovation ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:ARKK" },
  { symbol: "XLF", name: "Financial Select Sector SPDR Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:XLF" },
  { symbol: "XLK", name: "Technology Select Sector SPDR Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:XLK" },
  { symbol: "XLE", name: "Energy Select Sector SPDR Fund", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:XLE" },
  { symbol: "EWZ", name: "iShares MSCI Brazil ETF", exchange: "NYSE Arca", assetClass: "etf", tv: "AMEX:EWZ" },
];

const usStocks: UsSeed[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", assetClass: "stock" },
  { symbol: "BAC", name: "Bank of America Corporation", exchange: "NYSE", assetClass: "stock" },
  { symbol: "KO", name: "The Coca-Cola Company", exchange: "NYSE", assetClass: "stock" },
  { symbol: "PEP", name: "PepsiCo Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "WMT", name: "Walmart Inc.", exchange: "NYSE", assetClass: "stock" },
  { symbol: "COST", name: "Costco Wholesale Corporation", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "MCD", name: "McDonald's Corporation", exchange: "NYSE", assetClass: "stock" },
  { symbol: "DIS", name: "The Walt Disney Company", exchange: "NYSE", assetClass: "stock" },
  { symbol: "NFLX", name: "Netflix Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "MELI", name: "MercadoLibre Inc.", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "INTC", name: "Intel Corporation", exchange: "NASDAQ", assetClass: "stock" },
  { symbol: "V", name: "Visa Inc.", exchange: "NYSE", assetClass: "stock" },
  { symbol: "MA", name: "Mastercard Incorporated", exchange: "NYSE", assetClass: "stock" },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", assetClass: "stock" },
  { symbol: "CVX", name: "Chevron Corporation", exchange: "NYSE", assetClass: "stock" },
  { symbol: "UNH", name: "UnitedHealth Group Incorporated", exchange: "NYSE", assetClass: "stock" },
  { symbol: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", assetClass: "stock" },
  { symbol: "PG", name: "Procter & Gamble Company", exchange: "NYSE", assetClass: "stock" },
  { symbol: "NKE", name: "NIKE Inc.", exchange: "NYSE", assetClass: "stock" },
  { symbol: "CRM", name: "Salesforce Inc.", exchange: "NYSE", assetClass: "stock" },
  { symbol: "ORCL", name: "Oracle Corporation", exchange: "NYSE", assetClass: "stock" },
  { symbol: "IBM", name: "International Business Machines Corporation", exchange: "NYSE", assetClass: "stock" },
];

const adrSeeds: UsSeed[] = [
  { symbol: "GGAL", name: "Grupo Financiero Galicia S.A. ADR", exchange: "NASDAQ", assetClass: "adr" },
  { symbol: "BMA", name: "Banco Macro S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "YPF", name: "YPF S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "PAM", name: "Pampa Energia S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "TGS", name: "Transportadora de Gas del Sur S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "VIST", name: "Vista Energy S.A.B. de C.V.", exchange: "NYSE", assetClass: "adr" },
  { symbol: "EDN", name: "Edenor S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "CEPU", name: "Central Puerto S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "LOMA", name: "Loma Negra C.I.A.S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "IRS", name: "IRSA Inversiones y Representaciones S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "SUPV", name: "Grupo Supervielle S.A. ADR", exchange: "NYSE", assetClass: "adr" },
  { symbol: "BBAR", name: "Banco BBVA Argentina S.A. ADR", exchange: "NYSE", assetClass: "adr" },
];

const localEquities = [
  ["GGAL", "Grupo Financiero Galicia S.A."],
  ["YPFD", "YPF S.A."],
  ["PAMP", "Pampa Energia S.A."],
  ["TGSU2", "Transportadora de Gas del Sur S.A."],
  ["CEPU", "Central Puerto S.A."],
  ["EDN", "Edenor S.A."],
  ["LOMA", "Loma Negra C.I.A.S.A."],
  ["TXAR", "Ternium Argentina S.A."],
  ["ALUA", "Aluar Aluminio Argentino S.A.I.C."],
  ["COME", "Sociedad Comercial del Plata S.A."],
  ["BYMA", "Bolsas y Mercados Argentinos S.A."],
  ["VALO", "Grupo Financiero Valores S.A."],
  ["BBAR", "Banco BBVA Argentina S.A."],
  ["BMA", "Banco Macro S.A."],
  ["SUPV", "Grupo Supervielle S.A."],
  ["MIRG", "Mirgor S.A.C.I.F.I.A."],
  ["CRES", "Cresud S.A.C.I.F. y A."],
  ["IRSA", "IRSA Inversiones y Representaciones S.A."],
  ["TRAN", "Transener S.A."],
  ["TGNO4", "Transportadora de Gas del Norte S.A."],
  ["TECO2", "Telecom Argentina S.A."],
] as const;

const cryptoSeeds = [
  ["BTC-USD", "Bitcoin"],
  ["ETH-USD", "Ethereum"],
  ["SOL-USD", "Solana"],
  ["BNB-USD", "BNB"],
  ["XRP-USD", "XRP"],
  ["ADA-USD", "Cardano"],
  ["DOGE-USD", "Dogecoin"],
  ["AVAX-USD", "Avalanche"],
  ["LINK-USD", "Chainlink"],
  ["DOT-USD", "Polkadot"],
  ["MATIC-USD", "Polygon"],
  ["POL-USD", "Polygon Ecosystem Token"],
  ["LTC-USD", "Litecoin"],
  ["BCH-USD", "Bitcoin Cash"],
] as const;

const cryptoProviderSymbols: Record<string, string> = {
  "BTC-USD": "BTCUSDT",
  "ETH-USD": "ETHUSDT",
  "SOL-USD": "SOLUSDT",
  "BNB-USD": "BNBUSDT",
  "XRP-USD": "XRPUSDT",
  "ADA-USD": "ADAUSDT",
  "DOGE-USD": "DOGEUSDT",
  "AVAX-USD": "AVAXUSDT",
  "LINK-USD": "LINKUSDT",
  "DOT-USD": "DOTUSDT",
  "MATIC-USD": "MATICUSDT",
  "POL-USD": "POLUSDT",
  "LTC-USD": "LTCUSDT",
  "BCH-USD": "BCHUSDT",
};

function usInstrument(seed: UsSeed): Instrument {
  const exchangePrefix = seed.exchange === "NYSE" ? "NYSE" : seed.exchange === "NYSE Arca" ? "AMEX" : "NASDAQ";
  return {
    id: `${seed.assetClass}:${seed.symbol}`,
    symbol: seed.symbol,
    displaySymbol: seed.symbol,
    name: seed.name,
    assetClass: seed.assetClass,
    market: "us",
    exchange: seed.exchange,
    country: seed.assetClass === "adr" ? "AR/US" : "US",
    currency: "USD",
    providerSymbol: seed.symbol,
    tradingViewSymbol: seed.tv ?? `${exchangePrefix}:${seed.symbol}`,
    underlyingCurrency: "USD",
    tags: [seed.assetClass, "us", "technical", ...(seed.tags ?? [])],
    aliases: seed.assetClass === "adr" && adrToLocalSymbol[seed.symbol] ? [adrToLocalSymbol[seed.symbol]] : [],
    dataCapabilities: ["technical_full", "fundamentals_full"],
    warnings: [],
    source: "seed",
    enabled: true,
  };
}

function localEquity(symbol: string, name: string): Instrument {
  const adr = localToAdrSymbol[symbol];
  return {
    id: `ar-equity:${symbol}`,
    symbol,
    displaySymbol: symbol,
    name,
    assetClass: "stock",
    market: "argentina",
    exchange: "BYMA",
    country: "AR",
    currency: "ARS",
    bymaSymbol: symbol,
    providerSymbol: adr ?? symbol,
    tradingViewSymbol: `BCBA:${symbol}`,
    underlyingSymbol: adr,
    underlyingExchange: adr ? "US" : undefined,
    underlyingMarket: adr ? "us" : undefined,
    underlyingCurrency: adr ? "USD" : undefined,
    settlementPeriods: ["0000", "0001", "0002"],
    aliases: adr ? [adr] : [],
    tags: ["argentina", "byma", "local", "accion"],
    dataCapabilities: adr ? ["technical_underlying", "quote_only"] : ["quote_only"],
    warnings: adr ? ["El tecnico usa el ADR/subyacente US; la accion local puede diferir por CCL, liquidez y plazo."] : ["Solo cotizacion local hasta contar con historico OHLCV suficiente."],
    source: "seed",
    enabled: true,
  };
}

function cedear(symbol: string, name: string, assetClass: InstrumentAssetClass): Instrument {
  const mapping = cedearUnderlyingSymbols[symbol];
  return {
    id: `${assetClass}:${symbol}`,
    symbol,
    displaySymbol: `${symbol} CEDEAR`,
    name,
    assetClass,
    market: "argentina",
    exchange: "BYMA",
    country: "AR",
    currency: "ARS",
    bymaSymbol: symbol,
    providerSymbol: mapping?.underlyingSymbol ?? symbol,
    tradingViewSymbol: `BCBA:${symbol}`,
    underlyingSymbol: mapping?.underlyingSymbol ?? symbol,
    underlyingExchange: "US",
    underlyingMarket: "us",
    underlyingCurrency: "USD",
    ratio: mapping?.ratio,
    settlementPeriods: ["0000", "0001", "0002"],
    aliases: [`${symbol} CEDEAR`],
    tags: [assetClass === "cedear_etf" ? "cedear etf" : "cedear", "argentina", "byma", "subyacente"],
    dataCapabilities: ["technical_underlying", "quote_only", "fundamentals_underlying"],
    warnings: [cedearWarning, "El analisis tecnico corresponde al subyacente US."],
    source: "seed",
    enabled: true,
  };
}

function fixedIncome(symbol: string): Instrument {
  const assetClass = fixedIncomeGroups[symbol] ?? "bond";
  return {
    id: `${assetClass}:${symbol}`,
    symbol,
    displaySymbol: symbol,
    name: `${symbol} renta fija argentina`,
    assetClass,
    market: "argentina",
    exchange: "BYMA",
    country: "AR",
    currency: symbol.endsWith("D") ? "USD" : "ARS",
    bymaSymbol: symbol,
    providerSymbol: symbol,
    tradingViewSymbol: `BCBA:${symbol}`,
    settlementPeriods: ["0000", "0001", "0002"],
    tags: [assetClass, "renta fija", "byma"],
    dataCapabilities: ["quote_only"],
    warnings: ["Las metricas de renta fija se publican solo para especies con flujos contractuales validados."],
    source: "seed",
    enabled: true,
  };
}

function crypto(symbol: string, name: string): Instrument {
  const providerSymbol = cryptoProviderSymbols[symbol] ?? symbol;
  return {
    id: `crypto:${symbol}`,
    symbol,
    displaySymbol: symbol,
    name,
    assetClass: "crypto",
    market: "crypto",
    exchange: "Binance",
    country: "Global",
    currency: "USD",
    providerSymbol,
    tradingViewSymbol: `BINANCE:${providerSymbol}`,
    tags: ["crypto", "binance", "technical"],
    dataCapabilities: ["technical_full"],
    warnings: [],
    source: "seed",
    enabled: true,
  };
}

const cedearStocks = ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "AMD", "AVGO", "KO", "PEP", "MCD", "WMT", "JPM", "BAC", "DIS", "NFLX", "MELI"];
const cedearEtfs = ["SPY", "QQQ", "DIA", "IWM", "EWZ", "ARKK", "XLF", "XLK", "XLE"];
const fixedIncomeSymbols = ["AL30", "AL30D", "AL30C", "GD30", "GD30D", "GD30C", "AE38", "AE38D", "AL35", "AL35D", "TX26", "TZX26", "S31L6", "S30N6", "D31L6"];

const usBySymbol = new Map([...usEtfs, ...usStocks, ...adrSeeds].map((item) => [item.symbol, item]));
const seededLocalEquitySymbols = new Set<string>(localEquities.map(([symbol]) => symbol));
const seededCedearSymbols = new Set<string>([...cedearStocks, ...cedearEtfs]);

const providerLocalEquities = providerEquitySymbols
  .filter((symbol) => !seededLocalEquitySymbols.has(symbol))
  .map((symbol) => [symbol, providerInstrumentNames[symbol] ?? `${symbol} accion argentina`] as const);

const providerCedearStocks = providerCedearSymbols
  .filter((symbol) => !seededCedearSymbols.has(symbol) && cedearUnderlyingSymbols[symbol]?.type !== "etf");

const providerCedearEtfs = providerCedearSymbols
  .filter((symbol) => !seededCedearSymbols.has(symbol) && cedearUnderlyingSymbols[symbol]?.type === "etf");

export const instrumentMasterSeed: Instrument[] = [
  ...usEtfs.map(usInstrument),
  ...usStocks.map(usInstrument),
  ...adrSeeds.map(usInstrument),
  ...localEquities.map(([symbol, name]) => localEquity(symbol, name)),
  ...providerLocalEquities.map(([symbol, name]) => localEquity(symbol, name)),
  ...cedearStocks.map((symbol) => cedear(symbol, `${usBySymbol.get(symbol)?.name ?? symbol} CEDEAR`, "cedear")),
  ...cedearEtfs.map((symbol) => cedear(symbol, `${usBySymbol.get(symbol)?.name ?? symbol} CEDEAR ETF`, "cedear_etf")),
  ...providerCedearStocks.map((symbol) => cedear(symbol, `${providerInstrumentNames[symbol] ?? symbol} CEDEAR`, "cedear")),
  ...providerCedearEtfs.map((symbol) => cedear(symbol, `${providerInstrumentNames[symbol] ?? symbol} CEDEAR ETF`, "cedear_etf")),
  ...fixedIncomeSymbols.map(fixedIncome),
  ...cryptoSeeds.map(([symbol, name]) => crypto(symbol, name)),
];
