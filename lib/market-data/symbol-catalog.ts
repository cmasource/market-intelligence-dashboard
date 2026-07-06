import type { TradeRadarMarket } from "./providers/base";

export type SymbolCatalogItem = {
  symbol: string;
  name: string;
  market: Exclude<TradeRadarMarket, "auto" | "bond">;
  type: "ETF" | "Stock" | "ADR" | "Crypto";
  providerSymbol: string;
  tradingViewSymbol: string;
  currency: string;
  exchange: string;
};

export const symbolCatalog: SymbolCatalogItem[] = [
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", market: "us", type: "ETF", providerSymbol: "SPY", tradingViewSymbol: "AMEX:SPY", currency: "USD", exchange: "NYSE Arca" },
  { symbol: "QQQ", name: "Invesco QQQ Trust", market: "us", type: "ETF", providerSymbol: "QQQ", tradingViewSymbol: "NASDAQ:QQQ", currency: "USD", exchange: "NASDAQ" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Average ETF Trust", market: "us", type: "ETF", providerSymbol: "DIA", tradingViewSymbol: "AMEX:DIA", currency: "USD", exchange: "NYSE Arca" },
  { symbol: "IWM", name: "iShares Russell 2000 ETF", market: "us", type: "ETF", providerSymbol: "IWM", tradingViewSymbol: "AMEX:IWM", currency: "USD", exchange: "NYSE Arca" },
  { symbol: "AAPL", name: "Apple Inc.", market: "us", type: "Stock", providerSymbol: "AAPL", tradingViewSymbol: "NASDAQ:AAPL", currency: "USD", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", market: "us", type: "Stock", providerSymbol: "MSFT", tradingViewSymbol: "NASDAQ:MSFT", currency: "USD", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", market: "us", type: "Stock", providerSymbol: "GOOGL", tradingViewSymbol: "NASDAQ:GOOGL", currency: "USD", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", market: "us", type: "Stock", providerSymbol: "AMZN", tradingViewSymbol: "NASDAQ:AMZN", currency: "USD", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms Inc.", market: "us", type: "Stock", providerSymbol: "META", tradingViewSymbol: "NASDAQ:META", currency: "USD", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", market: "us", type: "Stock", providerSymbol: "NVDA", tradingViewSymbol: "NASDAQ:NVDA", currency: "USD", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla Inc.", market: "us", type: "Stock", providerSymbol: "TSLA", tradingViewSymbol: "NASDAQ:TSLA", currency: "USD", exchange: "NASDAQ" },
  { symbol: "TSM", name: "Taiwan Semiconductor Manufacturing Company", market: "us", type: "ADR", providerSymbol: "TSM", tradingViewSymbol: "NYSE:TSM", currency: "USD", exchange: "NYSE" },
  { symbol: "AMD", name: "Advanced Micro Devices Inc.", market: "us", type: "Stock", providerSymbol: "AMD", tradingViewSymbol: "NASDAQ:AMD", currency: "USD", exchange: "NASDAQ" },
  { symbol: "AVGO", name: "Broadcom Inc.", market: "us", type: "Stock", providerSymbol: "AVGO", tradingViewSymbol: "NASDAQ:AVGO", currency: "USD", exchange: "NASDAQ" },
  { symbol: "MELI", name: "MercadoLibre Inc.", market: "us", type: "Stock", providerSymbol: "MELI", tradingViewSymbol: "NASDAQ:MELI", currency: "USD", exchange: "NASDAQ" },
  { symbol: "BMA", name: "Banco Macro S.A. ADR", market: "us", type: "ADR", providerSymbol: "BMA", tradingViewSymbol: "NYSE:BMA", currency: "USD", exchange: "NYSE" },
  { symbol: "GGAL", name: "Grupo Financiero Galicia S.A. ADR", market: "us", type: "ADR", providerSymbol: "GGAL", tradingViewSymbol: "NASDAQ:GGAL", currency: "USD", exchange: "NASDAQ" },
  { symbol: "YPF", name: "YPF S.A. ADR", market: "us", type: "ADR", providerSymbol: "YPF", tradingViewSymbol: "NYSE:YPF", currency: "USD", exchange: "NYSE" },
  { symbol: "PAMP", name: "Pampa Energia S.A. ADR", market: "us", type: "ADR", providerSymbol: "PAMP", tradingViewSymbol: "NYSE:PAM", currency: "USD", exchange: "NYSE" },
  { symbol: "TGS", name: "Transportadora de Gas del Sur S.A. ADR", market: "us", type: "ADR", providerSymbol: "TGS", tradingViewSymbol: "NYSE:TGS", currency: "USD", exchange: "NYSE" },
  { symbol: "VIST", name: "Vista Energy S.A.B. de C.V.", market: "us", type: "Stock", providerSymbol: "VIST", tradingViewSymbol: "NYSE:VIST", currency: "USD", exchange: "NYSE" },
  { symbol: "CEPU", name: "Central Puerto S.A. ADR", market: "us", type: "ADR", providerSymbol: "CEPU", tradingViewSymbol: "NYSE:CEPU", currency: "USD", exchange: "NYSE" },
  { symbol: "EDN", name: "Edenor S.A. ADR", market: "us", type: "ADR", providerSymbol: "EDN", tradingViewSymbol: "NYSE:EDN", currency: "USD", exchange: "NYSE" },
  { symbol: "LOMA", name: "Loma Negra C.I.A.S.A. ADR", market: "us", type: "ADR", providerSymbol: "LOMA", tradingViewSymbol: "NYSE:LOMA", currency: "USD", exchange: "NYSE" },
  { symbol: "BTCUSDT", name: "Bitcoin / Tether USD", market: "crypto", type: "Crypto", providerSymbol: "BTCUSDT", tradingViewSymbol: "BINANCE:BTCUSDT", currency: "USD", exchange: "Binance" },
  { symbol: "ETHUSDT", name: "Ethereum / Tether USD", market: "crypto", type: "Crypto", providerSymbol: "ETHUSDT", tradingViewSymbol: "BINANCE:ETHUSDT", currency: "USD", exchange: "Binance" },
  { symbol: "SOLUSDT", name: "Solana / Tether USD", market: "crypto", type: "Crypto", providerSymbol: "SOLUSDT", tradingViewSymbol: "BINANCE:SOLUSDT", currency: "USD", exchange: "Binance" },
];

function scoreItem(item: SymbolCatalogItem, query: string) {
  const symbol = item.symbol.toLowerCase();
  const providerSymbol = item.providerSymbol.toLowerCase();
  const name = item.name.toLowerCase();
  if (symbol === query || providerSymbol === query) return 0;
  if (symbol.startsWith(query) || providerSymbol.startsWith(query)) return 1;
  if (name.startsWith(query)) return 2;
  if (symbol.includes(query) || providerSymbol.includes(query)) return 3;
  if (name.includes(query)) return 4;
  return 9;
}

export function searchSymbolCatalog(params: {
  query: string;
  market?: TradeRadarMarket;
  limit?: number;
}) {
  const query = params.query.trim().toLowerCase();
  const limit = Math.max(1, Math.min(params.limit ?? 8, 25));
  const market = params.market === "auto" ? undefined : params.market;

  if (!query) return symbolCatalog.slice(0, limit);

  return symbolCatalog
    .filter((item) => !market || item.market === market)
    .filter((item) => {
      const haystack = `${item.symbol} ${item.providerSymbol} ${item.name} ${item.exchange}`.toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => scoreItem(a, query) - scoreItem(b, query) || a.symbol.localeCompare(b.symbol))
    .slice(0, limit);
}

export function findSymbolCatalogItem(symbol: string) {
  const normalized = symbol.trim().toUpperCase();
  return symbolCatalog.find((item) => item.symbol === normalized || item.providerSymbol === normalized) ?? null;
}
