type BcraPoint = { fecha: string; valor: number };
type BcraResult = { idVariable: number; detalle: BcraPoint[] };
type BcraExchangeRate = {
  codigoMoneda: string;
  descripcion: string;
  tipoCotizacion: number;
};

const variables = [
  { id: 1, label: "Reservas internacionales", unit: "USD millones", days: 45 },
  { id: 7, label: "BADLAR privada", unit: "% TNA", days: 45 },
  { id: 12, label: "Plazo fijo 30 dias", unit: "% TNA", days: 45 },
  { id: 27, label: "IPC mensual", unit: "%", days: 520 },
  { id: 28, label: "IPC interanual", unit: "%", days: 520 },
  { id: 29, label: "Inflacion esperada 12 meses", unit: "%", days: 520 },
  { id: 30, label: "CER", unit: "indice", days: 45 },
  { id: 31, label: "UVA", unit: "ARS", days: 45 },
] as const;

export const revalidate = 3600;

function isoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function getSeries(variable: (typeof variables)[number]) {
  const until = new Date();
  const since = new Date(until);
  since.setDate(since.getDate() - variable.days);
  const response = await fetch(
    `https://api.bcra.gob.ar/estadisticas/v4.0/monetarias/${variable.id}?desde=${isoDate(since)}&hasta=${isoDate(until)}`,
    { headers: { "Accept-Language": "es-AR" }, next: { revalidate: 3600 } },
  );
  if (!response.ok) throw new Error(`BCRA variable ${variable.id} unavailable`);
  const payload = (await response.json()) as { results?: BcraResult[] };
  const points = (payload.results?.[0]?.detalle ?? [])
    .filter((point) => Number.isFinite(point.valor))
    .sort((left, right) => left.fecha.localeCompare(right.fecha));
  const current = points.at(-1);
  const previous = points.at(-2);
  if (!current) return null;

  return {
    id: variable.id,
    label: variable.label,
    unit: variable.unit,
    value: current.valor,
    date: current.fecha,
    change: previous ? current.valor - previous.valor : null,
    series: points.slice(-12),
  };
}

async function getExchangeRates() {
  const response = await fetch("https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones", {
    headers: { "Accept-Language": "es-AR" },
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error("BCRA exchange rates unavailable");

  const payload = (await response.json()) as {
    results?: { fecha?: string; detalle?: BcraExchangeRate[] };
  };
  const date = payload.results?.fecha ?? null;
  const selected = new Set(["USD", "EUR", "BRL"]);

  return (payload.results?.detalle ?? [])
    .filter((rate) => selected.has(rate.codigoMoneda) && Number.isFinite(rate.tipoCotizacion) && rate.tipoCotizacion > 0)
    .map((rate) => ({
      code: rate.codigoMoneda,
      label: rate.descripcion,
      value: rate.tipoCotizacion,
      currency: "ARS",
      date,
    }));
}

export async function GET() {
  const [metricResults, exchangeRateResult] = await Promise.all([
    Promise.allSettled(variables.map(getSeries)),
    getExchangeRates().catch(() => []),
  ]);
  const metrics = metricResults.flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : []);
  return Response.json(
    { updatedAt: new Date().toISOString(), metrics, exchangeRates: exchangeRateResult },
    { headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400" } },
  );
}
