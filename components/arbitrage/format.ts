import type { Language } from "@/lib/i18n/types";

export function formatArs(value: number, language: Language, signed = false) {
  const prefix = signed && value > 0 ? "+" : "";
  return `${prefix}${new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatUsd(value: number, language: Language) {
  return new Intl.NumberFormat(language === "es" ? "es-AR" : "en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatTimestamp(value: string | undefined, language: Language) {
  if (!value) return language === "es" ? "No informada" : "Not reported";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat(language === "es" ? "es-AR" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

export function formatAge(value: string | undefined, language: Language) {
  if (!value) return language === "es" ? "No verificable" : "Unverifiable";
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (!Number.isFinite(elapsedSeconds)) return "-";
  if (elapsedSeconds < 60) return language === "es" ? "<1 min" : "<1 min";
  if (elapsedSeconds < 3600) return `${Math.floor(elapsedSeconds / 60)} min`;
  return `${Math.floor(elapsedSeconds / 3600)} h`;
}
