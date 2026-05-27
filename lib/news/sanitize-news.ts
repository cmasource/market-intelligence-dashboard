import type { NewsArticle } from "./types";

const namedEntities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: "\"",
  apos: "'",
  nbsp: " ",
  ndash: "-",
  mdash: "-",
  hellip: "...",
  rsquo: "'",
  lsquo: "'",
  rdquo: "\"",
  ldquo: "\"",
};

export function decodeHtmlEntities(text: string | undefined | null) {
  if (!text) return "";

  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, entity: string) => {
    const normalized = entity.toLowerCase();
    if (normalized.startsWith("#x")) {
      const codePoint = Number.parseInt(normalized.slice(2), 16);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    if (normalized.startsWith("#")) {
      const codePoint = Number.parseInt(normalized.slice(1), 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
    }
    return namedEntities[normalized] ?? match;
  });
}

export function stripHtmlTags(text: string | undefined | null) {
  return decodeHtmlEntities(text).replace(/<[^>]*>/g, " ");
}

export function normalizeWhitespace(text: string | undefined | null) {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

export function sanitizeNewsText(text: string | undefined | null, maxLength?: number) {
  const cleaned = normalizeWhitespace(decodeHtmlEntities(stripHtmlTags(text)));
  if (!maxLength || cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

export function sanitizeNewsArticle(article: NewsArticle): NewsArticle {
  return {
    ...article,
    title: sanitizeNewsText(article.title, 180) || "Market update",
    source: sanitizeNewsText(article.source, 80) || article.provider,
    summary: article.summary ? sanitizeNewsText(article.summary, 240) : undefined,
  };
}
