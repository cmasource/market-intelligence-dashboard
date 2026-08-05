import type { ProviderQuoteResult } from "../types";

const DEFAULT_MAX_RESPONSE_BYTES = 512_000;

export async function readTextResponse(response: Response, maxBytes = DEFAULT_MAX_RESPONSE_BYTES) {
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error("Upstream payload exceeds size limit");
  const text = await response.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new Error("Upstream payload exceeds size limit");
  return text;
}

export async function readJsonResponse(response: Response, maxBytes = DEFAULT_MAX_RESPONSE_BYTES) {
  return JSON.parse(await readTextResponse(response, maxBytes)) as unknown;
}

export function parseNumber(value: unknown) {
  let parsed: number;
  if (typeof value === "number") {
    parsed = value;
  } else {
    const raw = String(value).trim().replace(/[^\d,.-]/g, "");
    const comma = raw.lastIndexOf(",");
    const dot = raw.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      const decimalSeparator = comma > dot ? "," : ".";
      const thousandsSeparator = decimalSeparator === "," ? "." : ",";
      parsed = Number.parseFloat(raw.replaceAll(thousandsSeparator, "").replace(decimalSeparator, "."));
    } else {
      parsed = Number.parseFloat(raw.replace(",", "."));
    }
  }
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function parseArgentinaTimestamp(value: string) {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute, second = "00"] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:${second}-03:00`;
}

export function parseArgentinaDateTime(date: string, time: string) {
  const dateMatch = date.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!dateMatch || !timeMatch) return undefined;
  const [, day, month, year] = dateMatch;
  const [, hour, minute, second = "00"] = timeMatch;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute}:${second}-03:00`;
}

export function errorResult(providerId: string, error: unknown): ProviderQuoteResult {
  const fetchedAt = new Date().toISOString();
  if (error instanceof DOMException && error.name === "TimeoutError") {
    return { providerId, quotes: [], status: "error", fetchedAt, errorCode: "timeout" };
  }
  return { providerId, quotes: [], status: "error", fetchedAt, errorCode: "upstream_unavailable" };
}
