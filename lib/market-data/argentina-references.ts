const CRIPTOYA_BASE_URL = "https://criptoya.com/api";
const DOLAR_API_URL = "https://dolarapi.com/v1/dolares";
const MAX_RESPONSE_BYTES = 256_000;
const MAX_REFERENCE_AGE_MS = 96 * 60 * 60_000;

export type ArgentinaReferenceSource = "CriptoYa" | "DolarAPI";

export type ArgentinaDollarReference = {
  id: string;
  label: string;
  value: number;
  changePercent: number | null;
  currency: "ARS";
  source: ArgentinaReferenceSource;
  sourceUrl: string;
  updatedAt: string;
  quality: "primary" | "fallback";
};

export type ArgentinaIndexReference = {
  id: 30 | 31;
  label: "CER" | "UVA";
  unit: "indice" | "ARS";
  value: number;
  date: string;
  updatedAt: string;
  source: "CriptoYa";
  sourceUrl: string;
};

type Candidate = Omit<ArgentinaDollarReference, "quality">;

const labels = new Map([
  ["usd-oficial", "USD oficial"],
  ["usd-blue", "USD blue"],
  ["usd-bolsa", "USD MEP"],
  ["usd-contadoconliqui", "USD CCL"],
  ["usd-mayorista", "USD mayorista"],
  ["usd-cripto", "USD cripto"],
  ["usd-tarjeta", "USD tarjeta"],
]);

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function positiveNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function epochTimestamp(value: unknown) {
  const epoch = positiveNumber(value);
  if (!epoch) return undefined;
  const date = new Date(epoch * 1_000);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function isoTimestamp(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

function isUsableTimestamp(value: string, now: Date) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) && time <= now.getTime() + 5 * 60_000 && now.getTime() - time <= MAX_REFERENCE_AGE_MS;
}

function freshnessRank(value: string, now: Date) {
  const age = now.getTime() - new Date(value).getTime();
  if (age <= 6 * 60 * 60_000) return 0;
  if (age <= 36 * 60 * 60_000) return 1;
  return 2;
}

function criptoYaCandidate(id: string, node: unknown, valueKey: "ask" | "price"): Candidate | undefined {
  const row = record(node);
  const value = positiveNumber(row?.[valueKey]);
  const updatedAt = epochTimestamp(row?.timestamp);
  const label = labels.get(id);
  if (!value || !updatedAt || !label) return undefined;
  return {
    id,
    label,
    value,
    changePercent: finiteNumber(row?.variation) ?? null,
    currency: "ARS",
    source: "CriptoYa",
    sourceUrl: `${CRIPTOYA_BASE_URL}/dolar`,
    updatedAt,
  };
}

export function normalizeCriptoYaDollarPayload(payload: unknown): Candidate[] {
  const root = record(payload);
  if (!root) return [];
  const mep = record(record(record(root.mep)?.al30)?.["24hs"]);
  const ccl = record(record(record(root.ccl)?.al30)?.["24hs"]);
  const crypto = record(record(root.cripto)?.ccb);
  return [
    criptoYaCandidate("usd-oficial", root.oficial, "ask"),
    criptoYaCandidate("usd-blue", root.blue, "ask"),
    criptoYaCandidate("usd-mayorista", root.mayorista, "price"),
    criptoYaCandidate("usd-tarjeta", root.tarjeta, "price"),
    criptoYaCandidate("usd-bolsa", mep, "price"),
    criptoYaCandidate("usd-contadoconliqui", ccl, "price"),
    criptoYaCandidate("usd-cripto", crypto, "ask"),
  ].filter((item): item is Candidate => Boolean(item));
}

export function normalizeDolarApiPayload(payload: unknown): Candidate[] {
  if (!Array.isArray(payload)) return [];
  return payload.flatMap((item) => {
    const row = record(item);
    const casa = typeof row?.casa === "string" ? row.casa : "";
    const id = `usd-${casa}`;
    const label = labels.get(id);
    const value = positiveNumber(row?.venta);
    const updatedAt = isoTimestamp(row?.fechaActualizacion);
    if (!label || !value || !updatedAt) return [];
    return [{
      id,
      label,
      value,
      changePercent: null,
      currency: "ARS" as const,
      source: "DolarAPI" as const,
      sourceUrl: DOLAR_API_URL,
      updatedAt,
    }];
  });
}

export function mergeDollarReferences(criptoYa: Candidate[], dolarApi: Candidate[], now = new Date()): ArgentinaDollarReference[] {
  return [...labels.keys()].flatMap((id) => {
    const candidates = [...criptoYa, ...dolarApi].filter((item) => item.id === id && isUsableTimestamp(item.updatedAt, now));
    if (!candidates.length) return [];
    const preferredSource: ArgentinaReferenceSource = id === "usd-cripto" ? "DolarAPI" : "CriptoYa";
    candidates.sort((left, right) => {
      const freshnessOrder = freshnessRank(left.updatedAt, now) - freshnessRank(right.updatedAt, now);
      if (freshnessOrder) return freshnessOrder;
      const sourceOrder = Number(right.source === preferredSource) - Number(left.source === preferredSource);
      return sourceOrder || new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
    const selected = candidates[0];
    return [{ ...selected, quality: selected.source === preferredSource ? "primary" as const : "fallback" as const }];
  });
}

async function readJson(url: string, revalidate: number) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "CMA-Market-Intelligence/1.0 (+public-market-references)" },
    ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
    signal: AbortSignal.timeout(7_000),
  });
  if (!response.ok) throw new Error(`Reference source returned HTTP ${response.status}`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) throw new Error("Reference payload exceeds size limit");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES) throw new Error("Reference payload exceeds size limit");
  return JSON.parse(text) as unknown;
}

export async function getArgentinaDollarReferences(now = new Date()) {
  const [criptoYaResult, dolarApiResult] = await Promise.allSettled([
    readJson(`${CRIPTOYA_BASE_URL}/dolar`, 30),
    readJson(DOLAR_API_URL, 30),
  ]);
  const criptoYa = criptoYaResult.status === "fulfilled" ? normalizeCriptoYaDollarPayload(criptoYaResult.value) : [];
  const dolarApi = dolarApiResult.status === "fulfilled" ? normalizeDolarApiPayload(dolarApiResult.value) : [];
  return {
    references: mergeDollarReferences(criptoYa, dolarApi, now),
    sources: {
      criptoYa: criptoYaResult.status === "fulfilled" ? "available" as const : "unavailable" as const,
      dolarApi: dolarApiResult.status === "fulfilled" ? "available" as const : "unavailable" as const,
    },
  };
}

export function normalizeCriptoYaIndexPayload(kind: "cer" | "uva", payload: unknown, now = new Date()): ArgentinaIndexReference | undefined {
  const row = record(payload);
  const value = positiveNumber(row?.value);
  const updatedAt = epochTimestamp(row?.time);
  if (!value || !updatedAt || !isUsableTimestamp(updatedAt, now)) return undefined;
  return {
    id: kind === "cer" ? 30 : 31,
    label: kind === "cer" ? "CER" : "UVA",
    unit: kind === "cer" ? "indice" : "ARS",
    value,
    date: updatedAt.slice(0, 10),
    updatedAt,
    source: "CriptoYa",
    sourceUrl: `${CRIPTOYA_BASE_URL}/${kind}`,
  };
}

export async function getCriptoYaIndexReferences() {
  const results = await Promise.allSettled([readJson(`${CRIPTOYA_BASE_URL}/cer`, 3600), readJson(`${CRIPTOYA_BASE_URL}/uva`, 3600)]);
  return (["cer", "uva"] as const).flatMap((kind, index) => {
    const result = results[index];
    if (result.status !== "fulfilled") return [];
    const normalized = normalizeCriptoYaIndexPayload(kind, result.value);
    return normalized ? [normalized] : [];
  });
}
