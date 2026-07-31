export type CaucionQuote = {
  termDays: number;
  label: string;
  currency: "ARS" | "USD";
  rateTna: number;
  variationPercent: number | null;
  variationPoints: number | null;
  previousRateTna: number | null;
  bidRateTna: number | null;
  askRateTna: number | null;
  volume: number | null;
  minRateTna: number | null;
  maxRateTna: number | null;
  lastQuote: string | null;
  expirationDate: string | null;
};

export type CaucionAlert = {
  severity: "spike";
  termDays: 1;
  rateTna: number;
  currentRateTna: number;
  baselineRateTna: number;
  increasePoints: number;
  increasePercent: number;
  thresholdPercent: number;
  basis: "intraday_high" | "last_rate";
  message: string;
};

export type CaucionesPayload = {
  updatedAt: string;
  source: {
    name: string;
    url: string;
  };
  quotes: CaucionQuote[];
  alert: CaucionAlert | null;
  methodology: {
    alertBasis: "intraday_high_or_last_rate_vs_previous_close";
    thresholdPercent: number;
    historicalWindowDays: number;
  };
};

type PpiCaucionInstrument = {
  ticker?: unknown;
  description?: unknown;
  lastPrice?: unknown;
  variation?: unknown;
  amountPurchase?: unknown;
  pricePurchase?: unknown;
  amountSale?: unknown;
  priceSale?: unknown;
  volumen?: unknown;
  previousClosing?: unknown;
  minDay?: unknown;
  maxDay?: unknown;
  lastQuote?: unknown;
  expirationDate?: unknown;
  currency?: {
    id?: unknown;
    description?: unknown;
  };
};

const PPI_CAUCIONES_URL = "https://www.portfoliopersonal.com/Cotizaciones/Cauciones";
const IOL_CAUCIONES_URL = "https://iol.invertironline.com/mercado/cotizaciones/argentina/cauciones";
const ARS_CURRENCY_ID = 10000;
const ALERT_THRESHOLD_PERCENT = 10;

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function parseLocaleNumber(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>(\s*)/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIolTimestamp(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, day, month, year, hour, minute, second] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}-03:00`;
}

function extractTermDays(item: PpiCaucionInstrument) {
  const ticker = toStringOrNull(item.ticker) ?? "";
  const description = toStringOrNull(item.description) ?? "";
  const match = ticker.match(/^PESOS(\d{1,3})$/i) ?? description.match(/PESOS\s+(\d{1,3})/i);
  if (!match) return null;
  const termDays = Number(match[1]);
  return Number.isInteger(termDays) && termDays > 0 ? termDays : null;
}

function extractNextData(html: string) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("PPI cauciones payload not found.");
  return JSON.parse(match[1]) as {
    props?: {
      pageProps?: {
        instruments?: PpiCaucionInstrument[];
      };
    };
  };
}

function normalizeCaucion(item: PpiCaucionInstrument): CaucionQuote | null {
  const termDays = extractTermDays(item);
  const rateTna = toNumber(item.lastPrice);
  const currencyId = toNumber(item.currency?.id);
  if (!termDays || termDays > 30 || currencyId !== ARS_CURRENCY_ID || rateTna === null || rateTna <= 0) return null;

  const previousRateTna = toNumber(item.previousClosing);
  return {
    termDays,
    label: `${termDays}D`,
    currency: "ARS",
    rateTna,
    variationPercent: toNumber(item.variation),
    variationPoints: previousRateTna === null ? null : rateTna - previousRateTna,
    previousRateTna,
    bidRateTna: toNumber(item.pricePurchase),
    askRateTna: toNumber(item.priceSale),
    volume: toNumber(item.volumen),
    minRateTna: toNumber(item.minDay),
    maxRateTna: toNumber(item.maxDay),
    lastQuote: toStringOrNull(item.lastQuote),
    expirationDate: toStringOrNull(item.expirationDate),
  };
}

function buildAlert(quotes: CaucionQuote[]): CaucionAlert | null {
  const oneDay = quotes.find((quote) => quote.termDays === 1);
  if (!oneDay || oneDay.previousRateTna === null || oneDay.previousRateTna <= 0) return null;

  const intradayHigh = oneDay.maxRateTna && oneDay.maxRateTna > 0 ? oneDay.maxRateTna : oneDay.rateTna;
  const observedRateTna = Math.max(oneDay.rateTna, intradayHigh);
  const increasePoints = observedRateTna - oneDay.previousRateTna;
  const increasePercent = (increasePoints / oneDay.previousRateTna) * 100;
  if (increasePercent <= ALERT_THRESHOLD_PERCENT) return null;

  const basis = observedRateTna > oneDay.rateTna ? "intraday_high" : "last_rate";
  const peakCopy = basis === "intraday_high"
    ? `alcanzo ${observedRateTna.toFixed(1)}% TNA durante la rueda`
    : `subio a ${observedRateTna.toFixed(1)}% TNA`;
  const currentCopy = basis === "intraday_high" ? ` Ultima tasa: ${oneDay.rateTna.toFixed(1)}%.` : "";

  return {
    severity: "spike",
    termDays: 1,
    rateTna: observedRateTna,
    currentRateTna: oneDay.rateTna,
    baselineRateTna: oneDay.previousRateTna,
    increasePoints,
    increasePercent,
    thresholdPercent: ALERT_THRESHOLD_PERCENT,
    basis,
    message: `La caucion a 1 dia ${peakCopy}: +${increasePercent.toFixed(1)}% contra el cierre previo de ${oneDay.previousRateTna.toFixed(1)}%.${currentCopy}`,
  };
}

function buildPayload(quotes: CaucionQuote[], source: { name: string; url: string }): CaucionesPayload {
  const latestQuote = quotes
    .map((quote) => quote.lastQuote)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return {
    updatedAt: latestQuote ?? new Date().toISOString(),
    source,
    quotes: quotes.sort((left, right) => left.termDays - right.termDays),
    alert: buildAlert(quotes),
    methodology: {
      alertBasis: "intraday_high_or_last_rate_vs_previous_close",
      thresholdPercent: ALERT_THRESHOLD_PERCENT,
      historicalWindowDays: 30,
    },
  };
}

export function parsePpiCauciones(html: string): CaucionesPayload {
  const data = extractNextData(html);
  const instruments = data.props?.pageProps?.instruments ?? [];
  const quotes = instruments
    .map(normalizeCaucion)
    .filter((quote): quote is CaucionQuote => Boolean(quote))
    .sort((left, right) => left.termDays - right.termDays);

  return buildPayload(quotes, { name: "Portfolio Personal Inversiones", url: PPI_CAUCIONES_URL });
}

export function parseIolCauciones(html: string): CaucionesPayload {
  const quotes: CaucionQuote[] = [];
  const rows = html.match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) ?? [];

  for (const row of rows) {
    const cells = [...row.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => stripHtml(match[1]));
    if (cells.length < 7 || cells[1].toUpperCase() !== "PESOS") continue;

    const termDays = Number(cells[0].replace(/\D/g, ""));
    const rateTna = parseLocaleNumber(cells[5]);
    const lastQuote = parseIolTimestamp(cells[6]);
    if (!Number.isInteger(termDays) || termDays < 1 || termDays > 30 || rateTna === null) continue;

    quotes.push({
      termDays,
      label: `${termDays}D`,
      currency: "ARS",
      rateTna,
      variationPercent: null,
      variationPoints: null,
      previousRateTna: null,
      bidRateTna: null,
      askRateTna: null,
      volume: parseLocaleNumber(cells[2]),
      minRateTna: null,
      maxRateTna: null,
      lastQuote,
      expirationDate: null,
    });
  }

  return buildPayload(quotes, { name: "invertirOnline", url: IOL_CAUCIONES_URL });
}

async function fetchCaucionesHtml(url: string) {
  const sourceUrl = new URL(url);
  sourceUrl.searchParams.set("cma", String(Math.floor(Date.now() / 30_000)));
  const response = await fetch(sourceUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; CMA-Markets/1.0)",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Cauciones source failed with status ${response.status}.`);
  }

  return response.text();
}

function argentinaDateKey(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function expectedMarketDateKey(now = new Date()) {
  const weekdayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
  }).format(now);
  const offset = weekdayName === "Sunday" ? -2 : weekdayName === "Monday" ? -3 : 0;
  const marketDate = new Date(now.getTime() + offset * 86_400_000);
  return argentinaDateKey(marketDate);
}

function isCurrentSessionQuote(quote: CaucionQuote, marketDateKey: string) {
  return Boolean(quote.lastQuote && argentinaDateKey(quote.lastQuote) === marketDateKey);
}

function enrichCurrentQuotes(current: CaucionesPayload, ppi: CaucionesPayload | null, marketDateKey: string) {
  const ppiByTerm = new Map(
    (ppi?.quotes ?? [])
      .filter((quote) => isCurrentSessionQuote(quote, marketDateKey))
      .map((quote) => [quote.termDays, quote]),
  );

  return {
    ...current,
    quotes: current.quotes.map((quote) => {
      const context = ppiByTerm.get(quote.termDays);
      if (!context) return quote;
      return {
        ...quote,
        variationPercent: context.variationPercent,
        previousRateTna: context.previousRateTna,
        variationPoints: context.previousRateTna === null ? null : quote.rateTna - context.previousRateTna,
        bidRateTna: context.bidRateTna,
        askRateTna: context.askRateTna,
        minRateTna: context.minRateTna,
        maxRateTna: context.maxRateTna,
        expirationDate: context.expirationDate,
      };
    }),
  };
}

export async function getCauciones() {
  const marketDateKey = expectedMarketDateKey();
  const [iolResult, ppiResult] = await Promise.allSettled([
    fetchCaucionesHtml(IOL_CAUCIONES_URL),
    fetchCaucionesHtml(PPI_CAUCIONES_URL),
  ]);

  const iolPayload = iolResult.status === "fulfilled" ? parseIolCauciones(iolResult.value) : null;
  const ppiPayload = ppiResult.status === "fulfilled" ? parsePpiCauciones(ppiResult.value) : null;
  const currentIolQuotes = iolPayload?.quotes.filter((quote) => isCurrentSessionQuote(quote, marketDateKey)) ?? [];

  if (iolPayload && currentIolQuotes.length) {
    return enrichCurrentQuotes({ ...iolPayload, quotes: currentIolQuotes }, ppiPayload, marketDateKey);
  }

  const currentPpiQuotes = ppiPayload?.quotes.filter((quote) => isCurrentSessionQuote(quote, marketDateKey)) ?? [];
  if (ppiPayload && currentPpiQuotes.length) {
    return { ...ppiPayload, quotes: currentPpiQuotes, alert: buildAlert(currentPpiQuotes) };
  }

  throw new Error("No hay cauciones de la rueda actual disponibles.");
}
