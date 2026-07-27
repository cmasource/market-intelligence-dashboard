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
  baselineRateTna: number;
  increasePoints: number;
  thresholdPoints: number;
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
    alertBasis: "previous_close_until_rolling_30d_available";
    thresholdPoints: number;
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
const ALERT_THRESHOLD_POINTS = 10;

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
  if (!oneDay || oneDay.previousRateTna === null) return null;

  const increasePoints = oneDay.rateTna - oneDay.previousRateTna;
  if (increasePoints <= ALERT_THRESHOLD_POINTS) return null;

  return {
    severity: "spike",
    termDays: 1,
    rateTna: oneDay.rateTna,
    baselineRateTna: oneDay.previousRateTna,
    increasePoints,
    thresholdPoints: ALERT_THRESHOLD_POINTS,
    message: `La caucion a 1 dia subio ${increasePoints.toFixed(1)} puntos porcentuales contra el cierre previo.`,
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
      alertBasis: "previous_close_until_rolling_30d_available",
      thresholdPoints: ALERT_THRESHOLD_POINTS,
      historicalWindowDays: 30,
    },
  };
}

export async function getCauciones() {
  const response = await fetch(PPI_CAUCIONES_URL, {
    headers: {
      "User-Agent": "CMA-Markets/1.0",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`PPI cauciones request failed with status ${response.status}.`);
  }

  return parsePpiCauciones(await response.text());
}
