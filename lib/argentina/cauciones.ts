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
const ARS_CURRENCY_ID = 10000;
const ALERT_THRESHOLD_PERCENT = 10;

function toNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toStringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
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

export function parsePpiCauciones(html: string): CaucionesPayload {
  const data = extractNextData(html);
  const instruments = data.props?.pageProps?.instruments ?? [];
  const quotes = instruments
    .map(normalizeCaucion)
    .filter((quote): quote is CaucionQuote => Boolean(quote))
    .sort((left, right) => left.termDays - right.termDays);

  return {
    updatedAt: new Date().toISOString(),
    source: {
      name: "Portfolio Personal Inversiones",
      url: PPI_CAUCIONES_URL,
    },
    quotes,
    alert: buildAlert(quotes),
    methodology: {
      alertBasis: "intraday_high_or_last_rate_vs_previous_close",
      thresholdPercent: ALERT_THRESHOLD_PERCENT,
      historicalWindowDays: 30,
    },
  };
}

export async function getCauciones() {
  const sourceUrl = new URL(PPI_CAUCIONES_URL);
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
    throw new Error(`PPI cauciones request failed with status ${response.status}.`);
  }

  return parsePpiCauciones(await response.text());
}
