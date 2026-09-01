import "server-only";

import OpenAI from "openai";
import type { IntegratedOutlook } from "./integrated-outlook";

const cache = new Map<string, { expiresAt: number; value: IntegratedOutlook }>();
const CACHE_TTL_MS = 30 * 60 * 1000;

type NarrativeResponse = {
  scenario: string;
  confirmation: string;
  risk: string;
};

function containsDigits(value: string) {
  return /\d/.test(value);
}

function isValidNarrative(value: unknown): value is NarrativeResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return [candidate.scenario, candidate.confirmation, candidate.risk].every(
    (field) => typeof field === "string" && field.length >= 20 && field.length <= 420 && !containsDigits(field),
  );
}

function cacheKey(symbol: string, language: "en" | "es", outlook: IntegratedOutlook) {
  return JSON.stringify([
    symbol,
    language,
    outlook.summary,
    outlook.scenario,
    outlook.confirmation,
    outlook.risk,
    outlook.technicalEvidence,
    outlook.fundamentalEvidence,
  ]);
}

export async function enhanceIntegratedOutlook(
  symbol: string,
  language: "en" | "es",
  deterministic: IntegratedOutlook,
): Promise<IntegratedOutlook> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return deterministic;

  const key = cacheKey(symbol, language, deterministic);
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  try {
    const client = new OpenAI({ apiKey, timeout: 12_000, maxRetries: 1 });
    const response = await client.responses.create({
      model: process.env.OPENAI_ANALYSIS_MODEL?.trim() || "gpt-5-mini",
      store: false,
      max_output_tokens: 800,
      reasoning: { effort: "minimal" },
      instructions: [
        "You are a conservative financial editor.",
        "Rewrite only the qualitative scenario, confirmation, and risk supplied by deterministic code.",
        "Do not calculate indicators, scores, prices, valuations, targets, probabilities, or recommendations.",
        "Do not add any number, digit, percentage, currency, or fact not already expressed qualitatively.",
        "Use the requested language and avoid certainty about future performance.",
      ].join(" "),
      input: JSON.stringify({
        language,
        symbol,
        scenario: deterministic.scenario,
        confirmation: deterministic.confirmation.replace(/[\d.,]+/g, ""),
        risk: deterministic.risk.replace(/[\d.,]+/g, ""),
        horizon: deterministic.horizon,
      }),
      text: {
        format: {
          type: "json_schema",
          name: "integrated_outlook_narrative",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              scenario: { type: "string" },
              confirmation: { type: "string" },
              risk: { type: "string" },
            },
            required: ["scenario", "confirmation", "risk"],
          },
        },
      },
    });
    const parsed = JSON.parse(response.output_text) as unknown;
    if (!isValidNarrative(parsed)) return deterministic;

    const enhanced: IntegratedOutlook = {
      ...deterministic,
      scenario: parsed.scenario,
      confirmation: parsed.confirmation,
      risk: parsed.risk,
      method: "openai_explained",
    };
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value: enhanced });
    if (cache.size > 100) cache.delete(cache.keys().next().value ?? key);
    return enhanced;
  } catch {
    return deterministic;
  }
}
