import { calculateMarketSignalScore } from "@/lib/analysis/market-signal";
import { getTechnicalAnalysis } from "@/lib/analysis/technical-analysis-service";
import { getCedearAnalytics, isCedearSymbol } from "@/lib/cedears";
import { getCnvDocumentsForSymbol, getCnvIssuer } from "@/lib/cnv";
import { getCoverageStatusLabel, getInstrumentDataCoverage } from "@/lib/data-coverage";
import { getFixedIncomeAnalytics } from "@/lib/fixed-income";
import { getFundamentals } from "@/lib/fundamentals-data";
import { getInstrumentBySymbol } from "@/lib/instrument-universe";
import { getMarketQuote } from "@/lib/market-data";
import { getNewsForSymbol } from "@/lib/news";
import { sanitizeNewsText } from "@/lib/news/sanitize-news";
import { formatCurrencyValue, formatNumber, formatPercent } from "@/lib/formatters";
import { translateProviderLabel } from "@/lib/i18n/interpretation-labels";
import { findAsset } from "@/lib/mock-data";
import type { Asset } from "@/types/asset";
import {
  buildFinalReading,
  buildFundamentalInterpretation,
  buildHumanFundamentalSummary,
  buildHumanTechnicalSummary,
  buildNewsInterpretation,
  buildTechnicalInterpretation,
  buildCedearInterpretation,
  buildFixedIncomeInterpretation,
} from "./interpretation";
import { buildRiskSummary } from "./risk-summary";
import type {
  AssetIntelligenceReport,
  DataCoverageSummary,
  FundamentalSummary,
  IntelligenceLanguage,
  NewsSummary,
  PriceSummary,
  TechnicalSummary,
} from "./types";

function l<T>(language: IntelligenceLanguage, en: T, es: T) {
  return language === "es" ? es : en;
}

function isBondType(type: string | undefined) {
  return Boolean(type && (type.includes("bond") || type === "letra"));
}

function safeHeadline(title: string) {
  return sanitizeNewsText(title, 180)
    .replace(/strong buy/gi, "constructive rating")
    .replace(/strong sell/gi, "defensive rating")
    .replace(/compra fuerte/gi, "lectura constructiva")
    .replace(/venta fuerte/gi, "lectura defensiva");
}

function assetDisplayName(asset: Asset | null | undefined, language: IntelligenceLanguage, symbol: string) {
  if (!asset) return getInstrumentBySymbol(symbol)?.displayName ?? symbol;
  if (language === "es" && asset.nameEs) return asset.nameEs;
  return asset.nameEn ?? asset.name;
}

function buildCoverageSummary(symbol: string, language: IntelligenceLanguage): DataCoverageSummary {
  const coverage = getInstrumentDataCoverage(symbol);
  return {
    price: getCoverageStatusLabel(coverage.price, language),
    chart: getCoverageStatusLabel(coverage.chart, language),
    technical: getCoverageStatusLabel(coverage.technical, language),
    fundamentals: getCoverageStatusLabel(coverage.fundamentals, language),
    news: getCoverageStatusLabel(coverage.news, language),
    fixedIncome: getCoverageStatusLabel(coverage.fixedIncome, language),
    notes: coverage.notes ?? [],
  };
}

function buildPriceSummary(asset: Asset | null, quote: Awaited<ReturnType<typeof getMarketQuote>> | null): PriceSummary {
  if (quote) {
    return {
      price: quote.price,
      currency: quote.currency,
      change: quote.change,
      changePercent: quote.changePercent,
      provider: quote.provider,
      sourceLabel: quote.sourceLabel,
      isFallback: quote.isFallback,
    };
  }

  return {
    price: asset?.price ?? null,
    currency: asset?.quoteCurrency ?? asset?.currency ?? "USD",
    change: null,
    changePercent: asset?.dailyChange ?? null,
    provider: asset ? "mock" : "unavailable",
    sourceLabel: asset ? "Mock fallback" : "Unavailable",
    isFallback: true,
  };
}

function unavailableFields(snapshot: Record<string, unknown>, fields: string[]) {
  return fields.filter((field) => snapshot[field] === undefined || snapshot[field] === null);
}

function quality(value: number | undefined, good: number, weak: number, language: IntelligenceLanguage) {
  if (typeof value !== "number" || !Number.isFinite(value)) return l(language, "unavailable", "no disponible");
  if (value >= good) return l(language, "solid", "solida");
  if (value <= weak) return l(language, "weak", "debil");
  return l(language, "mixed", "mixta");
}

function valuation(pe: number | undefined, language: IntelligenceLanguage) {
  if (typeof pe !== "number" || !Number.isFinite(pe)) return l(language, "unavailable", "no disponible");
  if (pe >= 35) return l(language, "demanding", "exigente");
  if (pe <= 15) return l(language, "moderate", "moderada");
  return l(language, "balanced", "equilibrada");
}

async function maybeFixedIncome(symbol: string, asset: Asset | null) {
  if (!isBondType(asset?.type) && !isBondType(getInstrumentBySymbol(symbol)?.category)) return null;
  try {
    return await getFixedIncomeAnalytics(symbol);
  } catch {
    return null;
  }
}

export async function getAssetIntelligenceReport(
  symbol: string,
  language: IntelligenceLanguage = "en",
): Promise<AssetIntelligenceReport | null> {
  const normalized = symbol.trim().toUpperCase();
  const asset = findAsset(normalized) ?? null;
  const instrument = getInstrumentBySymbol(normalized);

  if (!asset && !instrument) return null;

  const warnings: string[] = [];
  const [quoteResult, technicalResult, fundamentalsResult, newsResult, cedearResult, fixedIncomeResult] = await Promise.allSettled([
    getMarketQuote(normalized),
    getTechnicalAnalysis(normalized, "1Y"),
    getFundamentals({ symbol: normalized, assetClass: isBondType(asset?.type) ? "bond" : asset?.type === "crypto" ? "crypto" : undefined }),
    getNewsForSymbol(normalized, 3),
    isCedearSymbol(normalized) ? getCedearAnalytics(normalized) : Promise.resolve(null),
    maybeFixedIncome(normalized, asset),
  ]);

  const quote = quoteResult.status === "fulfilled" ? quoteResult.value : null;
  if (quoteResult.status === "rejected") warnings.push(l(language, "Quote layer used fallback data.", "La capa de precio uso datos de respaldo."));

  const technical = technicalResult.status === "fulfilled" ? technicalResult.value : null;
  if (!technical) warnings.push(l(language, "Technical layer unavailable.", "Capa tecnica no disponible."));

  const fundamentals = fundamentalsResult.status === "fulfilled" ? fundamentalsResult.value : null;
  if (!fundamentals) warnings.push(l(language, "Fundamental layer unavailable.", "Capa fundamental no disponible."));

  const news = newsResult.status === "fulfilled" ? newsResult.value : null;
  const cedear = cedearResult.status === "fulfilled" ? cedearResult.value : null;
  const fixedIncome = fixedIncomeResult.status === "fulfilled" ? fixedIncomeResult.value : null;
  const cnvIssuer = getCnvIssuer(normalized);
  const cnvDocuments = cnvIssuer ? getCnvDocumentsForSymbol(normalized) : [];

  const priceSummary = buildPriceSummary(asset, quote);
  if (priceSummary.isFallback) warnings.push(l(language, "Price layer is fallback or mock.", "La capa de precio es fallback o simulada."));
  if (cedear?.isMock) warnings.push(l(language, "Local CEDEAR data is mock.", "Los datos locales CEDEAR son simulados."));
  if (fixedIncome?.isMock) warnings.push(l(language, "Fixed income data is structured mock local data.", "Los datos de renta fija son locales estructurados simulados."));
  if (cnvIssuer) {
    warnings.push(
      l(
        language,
        "CNV corporate documents are structured demo context until real integration is enabled.",
        "Documentacion societaria estructurada de demostracion hasta integracion CNV real.",
      ),
    );
  }

  const technicalSummary: TechnicalSummary = {
    available: Boolean(technical),
    score: technical?.technicalScore ?? asset?.technicalScore ?? null,
    trend: technical?.snapshot.trendLabel ?? "Unavailable",
    momentum: technical?.snapshot.momentumLabel ?? "Unavailable",
    keyIndicators: technical
      ? [
          `RSI 14: ${technical.snapshot.rsi14 === null ? "n/a" : formatNumber(technical.snapshot.rsi14, language)}`,
          `SMA 20: ${technical.snapshot.sma20 === null ? "n/a" : formatNumber(technical.snapshot.sma20, language)}`,
          `SMA 200: ${technical.snapshot.sma200 === null ? "n/a" : formatNumber(technical.snapshot.sma200, language)}`,
        ]
      : [],
    interpretation: technical?.interpretation.summary ?? l(language, "Technical view unavailable.", "Lectura tecnica no disponible."),
    sourceLabel: translateProviderLabel(technical?.sourceLabel ?? "Unavailable", language),
  };
  technicalSummary.humanSummary = buildHumanTechnicalSummary({
    technicalScore: technicalSummary.score,
    trend: technicalSummary.trend,
    momentum: technicalSummary.momentum,
    rsi: technical?.snapshot.rsi14 ?? null,
    sma20: technical?.snapshot.sma20 ?? null,
    sma50: technical?.snapshot.sma50 ?? null,
    sma200: technical?.snapshot.sma200 ?? null,
    macd: technical?.snapshot.macd ?? null,
    macdSignal: technical?.snapshot.macdSignal ?? null,
    support: technical?.snapshot.support ?? null,
    resistance: technical?.snapshot.resistance ?? null,
    latestClose: technical?.snapshot.lastClose ?? null,
    provider: technical?.provider ?? null,
    sourceLabel: technical?.sourceLabel ?? null,
    dataQuality: technical?.isFallback
      ? l(language, "Technical data is fallback or mock.", "Los datos tecnicos son de respaldo o simulados.")
      : undefined,
  }, language);
  technicalSummary.interpretation = buildTechnicalInterpretation(technicalSummary, language);

  const fundamentalSummary: FundamentalSummary = {
    available: Boolean(fundamentals && fundamentals.fundamentalScore !== null && fundamentals.fundamentalScore !== undefined),
    score: fundamentals?.fundamentalScore ?? asset?.fundamentalScore ?? null,
    valuation: valuation(fundamentals?.snapshot.trailingPE ?? asset?.fundamentals?.peRatio, language),
    profitability: quality(fundamentals?.snapshot.roe ?? asset?.fundamentals?.roe, 20, 8, language),
    solvency: quality(fundamentals?.snapshot.currentRatio, 1.5, 0.8, language),
    growth: quality(fundamentals?.snapshot.revenueGrowth, 0.08, -0.02, language),
    interpretation: fundamentals?.interpretation.summary ?? l(language, "Fundamentals unavailable.", "Fundamentos no disponibles."),
    sourceLabel: translateProviderLabel(fundamentals?.sourceLabel ?? "Unavailable", language),
  };
  fundamentalSummary.humanSummary = buildHumanFundamentalSummary({
    fundamentalScore: fundamentalSummary.score,
    pe: fundamentals?.snapshot.trailingPE ?? asset?.fundamentals?.peRatio ?? null,
    forwardPe: fundamentals?.snapshot.forwardPE ?? null,
    pb: fundamentals?.snapshot.priceToBook ?? asset?.fundamentals?.pbRatio ?? null,
    ps: fundamentals?.snapshot.priceToSales ?? null,
    roe: fundamentals?.snapshot.roe ?? (asset?.fundamentals?.roe ? asset.fundamentals.roe / 100 : null),
    roa: fundamentals?.snapshot.roa ?? (asset?.fundamentals?.roa ? asset.fundamentals.roa / 100 : null),
    grossMargin: fundamentals?.snapshot.grossMargin ?? null,
    ebitdaMargin: fundamentals?.snapshot.ebitdaMargin ?? (asset?.fundamentals?.ebitdaMargin ? asset.fundamentals.ebitdaMargin / 100 : null),
    netMargin: fundamentals?.snapshot.netMargin ?? null,
    debtToEquity: fundamentals?.snapshot.debtToEquity ?? null,
    currentRatio: fundamentals?.snapshot.currentRatio ?? null,
    quickRatio: fundamentals?.snapshot.quickRatio ?? null,
    dividendYield: fundamentals?.snapshot.dividendYield ?? (asset?.fundamentals?.dividendYield ? asset.fundamentals.dividendYield / 100 : null),
    beta: fundamentals?.snapshot.beta ?? null,
    sourceLabel: fundamentals?.sourceLabel ?? null,
    unavailableFields: unavailableFields(fundamentals?.snapshot ?? {}, [
      "trailingPE",
      "forwardPE",
      "priceToBook",
      "priceToSales",
      "roe",
      "roa",
      "grossMargin",
      "ebitdaMargin",
      "netMargin",
      "debtToEquity",
      "currentRatio",
      "quickRatio",
    ]),
  }, language);
  fundamentalSummary.interpretation = buildFundamentalInterpretation(fundamentalSummary, language);

  const newsSummary: NewsSummary = {
    available: Boolean(news?.articles.length),
    articlesCount: news?.articles.length ?? 0,
    latestHeadlines:
      news?.articles.slice(0, 3).map((article) => ({
        title: safeHeadline(article.title),
        source: sanitizeNewsText(article.source, 80),
        url: article.url,
        publishedAt: article.publishedAt,
      })) ?? [],
    interpretation: "",
    sourceLabel: news?.sourceLabel ?? "Unavailable",
  };
  newsSummary.interpretation = buildNewsInterpretation(newsSummary, language);

  const fixedIncomeScore =
    fixedIncome?.risk.overallRisk === "low"
      ? 75
      : fixedIncome?.risk.overallRisk === "medium"
        ? 60
        : fixedIncome?.risk.overallRisk === "high"
          ? 42
          : fixedIncome?.risk.overallRisk === "very_high"
            ? 28
            : undefined;
  const marketSignal = calculateMarketSignalScore({
    technicalScore: technicalSummary.score,
    fundamentalScore: fundamentalSummary.available ? fundamentalSummary.score : null,
    fixedIncomeScore,
    assetType: asset?.type ?? instrument?.category,
    riskLevel: asset?.riskLevel,
    language,
  });

  const reportShell: Omit<AssetIntelligenceReport, "finalReading"> = {
    symbol: normalized,
    name: assetDisplayName(asset, language, normalized),
    category: asset?.type ?? instrument?.category ?? "unknown",
    market: asset?.market ?? instrument?.market ?? "Unknown",
    currency: priceSummary.currency,
    priceSummary,
    marketSignalSummary: {
      score: marketSignal.score,
      label: marketSignal.label,
      confidence: marketSignal.confidenceLabel,
      explanation: marketSignal.description,
    },
    technicalSummary,
    fundamentalSummary,
    newsSummary,
    ...(cedear
      ? {
          cedearSummary: {
            available: true,
            localPrice: cedear.localPrice,
            localCurrency: "ARS",
            underlyingSymbol: cedear.underlyingSymbol,
            underlyingName: cedear.underlyingName,
            underlyingPrice: cedear.underlyingPrice,
            impliedCcl: cedear.impliedCcl,
            interpretation: buildCedearInterpretation(language),
            sourceLabel: language === "es" ? "Subyacente con proveedor / CEDEAR local simulado" : cedear.sourceLabel,
          },
        }
      : {}),
    ...(fixedIncome
      ? {
          fixedIncomeSummary: {
            available: true,
            instrumentType: fixedIncome.instrument.type,
            estimatedYTM: fixedIncome.estimatedYTM,
            modifiedDuration: fixedIncome.modifiedDuration,
            parity: fixedIncome.parity,
            interpretation: buildFixedIncomeInterpretation(language),
            sourceLabel: fixedIncome.sourceLabel,
          },
        }
      : {}),
    ...(cnvIssuer
      ? {
          cnvSummary: {
            available: true,
            issuerName: cnvIssuer.issuerName,
            documentsCount: cnvDocuments.length,
            latestDocuments: cnvDocuments.slice(0, 3).map((document) => ({
              title: document.title,
              documentType: document.documentType,
              publishedAt: document.publishedAt,
              sourceLabel: l(language, "Structured demo document", "Documento estructurado de demostracion"),
            })),
            interpretation: l(
              language,
              "Structured demo corporate documentation until real CNV integration is enabled.",
              "Documentacion societaria estructurada de demostracion hasta integracion CNV real.",
            ),
            sourceLabel: l(language, "Future CNV integration", "Integracion CNV futura"),
          },
        }
      : {}),
    riskSummary: buildRiskSummary({ asset, cedear, fixedIncome, language }),
    dataCoverageSummary: buildCoverageSummary(normalized, language),
    warnings: Array.from(new Set(warnings)),
    sourceLabels: Array.from(
      new Set([
        priceSummary.sourceLabel,
        technicalSummary.sourceLabel,
        fundamentalSummary.sourceLabel,
        newsSummary.sourceLabel,
        cedear?.sourceLabel,
        fixedIncome?.sourceLabel,
        cnvIssuer ? l(language, "Future CNV integration", "Integracion CNV futura") : undefined,
      ].filter(Boolean) as string[]),
    ),
    generatedAt: new Date().toISOString(),
  };

  return {
    ...reportShell,
    finalReading: buildFinalReading(reportShell, language),
  };
}

export function formatIntelligencePrice(price: number | null, currency: string, language: IntelligenceLanguage) {
  return price === null ? (language === "es" ? "No disponible" : "Unavailable") : formatCurrencyValue(price, currency, language);
}

export function formatIntelligencePercent(value: number | null, language: IntelligenceLanguage) {
  return value === null ? (language === "es" ? "No disponible" : "Unavailable") : formatPercent(value);
}
