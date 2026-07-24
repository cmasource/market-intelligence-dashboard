import {
  normalizeProviderSymbol,
  parseFiniteNumber,
  ProviderError,
  type BymaFeed,
  type BymaQuote,
  type MarketDataProvider,
  type ProviderRequest,
  type ProviderResponse,
} from "./base";
import { getBymaAuthorizationHeader, getBymaToken } from "./bymaAuth";

type BymaParams = Record<string, string | undefined>;

const feedBasePath: Record<BymaFeed, string> = {
  snapshot: "/snapshot/v1",
  delay20: "/delay20/v1",
  eod: "/eod/v1",
};

function bymaBaseUrl() {
  return process.env.BYMA_BASE_URL?.trim() || "https://apigw.byma.com.ar";
}

function defaultFeed(): BymaFeed {
  const feed = process.env.BYMA_DEFAULT_FEED?.trim();
  return feed === "snapshot" || feed === "eod" || feed === "delay20" ? feed : "delay20";
}

function bymaErrorMessage(status: number, path: string) {
  if (status === 401) return "BYMA devolvio 401: falta token o el token es invalido.";
  if (status === 403) return "BYMA devolvio 403: el usuario no tiene permiso para este feed o recurso.";
  if (status === 404) return `BYMA devolvio 404: endpoint o recurso inexistente (${path}).`;
  if (status === 405) return `BYMA devolvio 405: metodo incorrecto para ${path}.`;
  if (status >= 500) return "BYMA devolvio error de servidor.";
  return `BYMA devolvio HTTP ${status}.`;
}

function firstString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function firstNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = parseFiniteNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

function extractRows(data: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(data)) return data.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  if (typeof data !== "object" || data === null) return [];
  const record = data as Record<string, unknown>;
  for (const key of ["data", "result", "items", "instruments", "securities", "quotes"]) {
    const value = record[key];
    if (Array.isArray(value)) return extractRows(value);
  }
  return [];
}

function normalizeBymaQuote(row: Record<string, unknown>, feed: BymaFeed): BymaQuote {
  const trade = firstNumber(row, ["trade", "last_price", "lastPrice", "price"]);
  const close = firstNumber(row, ["closing_price", "closingPrice", "close"]);
  const previousClose = firstNumber(row, ["previous_close", "previousClose", "prev_close"]);

  return {
    provider: "byma",
    feed,
    securityId: firstString(row, ["security_id", "securityId", "security", "instrument"]),
    symbol: firstString(row, ["symbol", "ticker", "security_symbol", "securitySymbol"]) ?? "",
    category: firstString(row, ["category", "group"]),
    categoryDesc: firstString(row, ["category_desc", "categoryDesc", "category_description"]),
    market: firstString(row, ["market"]),
    operativeForm: firstString(row, ["operative_form", "operativeForm", "operativeform"]),
    currency: firstString(row, ["currency"]) ?? "ARS",
    settlPeriod: firstString(row, ["settl_period", "settlPeriod", "settlperiod"]),
    lastPrice: trade ?? close ?? previousClose,
    open: firstNumber(row, ["opening_price", "openingPrice", "open"]),
    high: firstNumber(row, ["trading_session_high_price", "tradingSessionHighPrice", "high"]),
    low: firstNumber(row, ["trading_session_low_price", "tradingSessionLowPrice", "low"]),
    previousClose,
    close: close ?? trade,
    vwap: firstNumber(row, ["vwap_price", "vwap", "volume_weighted_average_price"]),
    trades: firstNumber(row, ["trades", "number_of_trades"]),
    volume: firstNumber(row, ["trade_volume", "tradeVolume", "volume"]),
    amount: firstNumber(row, ["trade_amount", "tradeAmount", "amount"]),
    imbalance: firstNumber(row, ["imbalance"]),
    bestBid: firstNumber(row, ["best_purchase_price", "bestPurchasePrice", "bid", "best_bid"]),
    bidSize: firstNumber(row, ["purchase_amount", "best_purchase_size", "bestPurchaseSize", "bid_size"]),
    bestAsk: firstNumber(row, ["best_selling_price", "bestSellingPrice", "ask", "best_ask"]),
    askSize: firstNumber(row, ["selling_amount", "best_selling_size", "bestSellingSize", "ask_size"]),
    broadcastTime: firstString(row, ["broadcast_time", "broadcastTime", "time"]),
    date: firstString(row, ["Date", "date", "trade_date", "tradeDate"]),
  };
}

function findQuote(rows: BymaQuote[], symbol: string) {
  const normalized = normalizeProviderSymbol(symbol);
  return rows.find((row) => normalizeProviderSymbol(row.symbol) === normalized || normalizeProviderSymbol(row.securityId ?? "") === normalized) ?? null;
}

export async function bymaFetch(path: string, params: BymaParams = {}, feed: BymaFeed = defaultFeed()) {
  const url = new URL(`${feedBasePath[feed]}${path}`, bymaBaseUrl());
  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: await getBymaAuthorizationHeader(),
    next: { revalidate: feed === "snapshot" ? 5 : feed === "delay20" ? 60 : 300 },
  });

  if (!response.ok) {
    throw new ProviderError("byma", bymaErrorMessage(response.status, path), { statusCode: response.status });
  }

  return response.json();
}

export async function getEquityQuotes(params: {
  group: "ACCIONES" | "CEDEARS" | "FONDOSINVERSION" | "ADRS" | "ACCIONESPYMES";
  subGroup?: "GENERAL" | "LIDER";
  operativeform?: "CONTADO" | "GRIS";
  currency?: "ARS" | "USD" | "EXT";
  settlperiod?: "0000" | "0001" | "0002";
  feed?: BymaFeed;
}) {
  const feed = params.feed ?? defaultFeed();
  const data = await bymaFetch("/equity", {
    group: params.group,
    subGroup: params.subGroup,
    operativeform: params.operativeform ?? "CONTADO",
    currency: params.currency,
    settlperiod: params.settlperiod,
  }, feed);
  return extractRows(data).map((row) => normalizeBymaQuote(row, feed));
}

export async function getFixedIncomeQuotes(params: {
  group: "TITULOSPUBLICOS" | "BONOSCONSOLIDACION" | "LETRAS" | "LETRASTESORO" | "TITULOSDEUDA" | "CERTPARTICIPACION" | "OBLIGACIONESNEGOC" | "ONPYMES";
  market?: "PPT" | "SENEBI";
  operativeform?: "CONTADO" | "GRIS";
  currency?: "ARS" | "USD" | "EXT";
  settlperiod?: "0000" | "0001" | "0002";
  feed?: BymaFeed;
}) {
  const feed = params.feed ?? defaultFeed();
  const data = await bymaFetch("/fixed_income", {
    group: params.group,
    market: params.market ?? "PPT",
    operativeform: params.operativeform ?? "CONTADO",
    currency: params.currency,
    settlperiod: params.settlperiod,
  }, feed);
  return extractRows(data).map((row) => normalizeBymaQuote(row, feed));
}

export function getIntradayTrades(instrument: string, feed: BymaFeed = defaultFeed()) {
  return bymaFetch("/intraday", { instrument }, feed);
}

export function getIndices(feed: BymaFeed = defaultFeed()) {
  return bymaFetch("/indices", {}, feed);
}

export function getTurnover(feed: BymaFeed = defaultFeed()) {
  return bymaFetch("/turnover", {}, feed);
}

export async function getBymaLocalQuote(symbol: string, params: { group?: "ACCIONES" | "CEDEARS"; feed?: BymaFeed } = {}) {
  const quotes = await getEquityQuotes({
    group: params.group ?? "ACCIONES",
    operativeform: "CONTADO",
    feed: params.feed,
  });
  const quote = findQuote(quotes, symbol);
  if (!quote) throw new ProviderError("byma", `BYMA no devolvio cotizacion local para ${symbol}.`);
  return quote;
}

export { getBymaToken };

export const bymaProvider: MarketDataProvider = {
  name: "byma",
  async getOhlcv(request: ProviderRequest): Promise<ProviderResponse> {
    const symbol = normalizeProviderSymbol(request.symbol);
    const quote = request.market === "bond"
      ? findQuote(await getFixedIncomeQuotes({ group: "TITULOSPUBLICOS" }), symbol)
      : await getBymaLocalQuote(symbol, { group: request.market === "cedear" ? "CEDEARS" : "ACCIONES" });

    if (!quote) throw new ProviderError("byma", `BYMA no devolvio cotizacion local para ${symbol}.`);

    return {
      symbol,
      resolvedSymbol: quote.symbol || symbol,
      market: request.market,
      provider: "byma",
      interval: request.interval,
      currency: quote.currency,
      dataDelay: quote.feed === "snapshot" ? "realtime" : quote.feed === "eod" ? "eod" : "delayed",
      ohlcv: [],
      localQuote: quote,
      sourceLabel: `BYMA ${quote.feed} local quote`,
      fetchedAt: new Date().toISOString(),
    };
  },
};
