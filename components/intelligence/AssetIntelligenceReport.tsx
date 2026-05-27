"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrencyValue, formatNumber, formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { translateProviderLabel } from "@/lib/i18n/interpretation-labels";
import type { AssetIntelligenceReport as AssetIntelligenceReportData } from "@/lib/intelligence";

type AssetIntelligenceReportProps = {
  symbol: string;
  compact?: boolean;
  mode?: "full" | "report";
};

function sourceBadge(label: string) {
  return (
    <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
      {label}
    </span>
  );
}

function missingValue(language: "en" | "es") {
  return language === "es" ? "N/D" : "n/a";
}

function formatNullablePercent(value: number | null, language: "en" | "es") {
  return value === null ? missingValue(language) : formatPercent(value);
}

function formatNullableNumber(value: number | null, language: "en" | "es") {
  return value === null ? missingValue(language) : formatNumber(value, language);
}

function cardClass(extra = "") {
  return `rounded-lg border border-white/10 bg-slate-950/45 p-5 shadow-sm shadow-slate-950/20 ${extra}`.trim();
}

function sectionTitleClass() {
  return "text-sm font-semibold uppercase tracking-[0.12em] text-slate-200";
}

function trimPoint(point: string) {
  const firstSentence = point.split(/(?<=[.!?])\s+/)[0]?.trim() ?? point.trim();
  return firstSentence.length > 150 ? `${firstSentence.slice(0, 147).trim()}...` : firstSentence;
}

function riskCategory(risk: string, isSpanish: boolean) {
  const value = risk.toLowerCase();
  if (value.includes("valu") || value.includes("multiple")) return isSpanish ? "Valuación" : "Valuation";
  if (value.includes("earning") || value.includes("resultado")) return isSpanish ? "Resultados" : "Earnings";
  if (value.includes("sector")) return "Sector";
  if (value.includes("rate") || value.includes("tasa") || value.includes("duration")) return isSpanish ? "Tasas" : "Rates";
  if (value.includes("cedear") || value.includes("ccl") || value.includes("fx") || value.includes("cambi") || value.includes("subyacente")) {
    return "CEDEAR/FX";
  }
  if (value.includes("liquid")) return isSpanish ? "Liquidez" : "Liquidity";
  return isSpanish ? "Mercado" : "Market";
}

export function AssetIntelligenceReport({ symbol, compact = false, mode = "full" }: AssetIntelligenceReportProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const isReportMode = mode === "report" || compact;
  const [report, setReport] = useState<AssetIntelligenceReportData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadReport() {
      try {
        setError(null);
        const response = await fetch(`/api/intelligence/${encodeURIComponent(symbol)}?language=${language}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Intelligence API returned HTTP ${response.status}.`);
        const data = (await response.json()) as AssetIntelligenceReportData;
        if (!controller.signal.aborted) setReport(data);
      } catch (requestError) {
        if (controller.signal.aborted) return;
        setReport(null);
        setError(requestError instanceof Error ? requestError.message : "Report request failed.");
      }
    }

    void loadReport();
    return () => controller.abort();
  }, [symbol, language]);

  if (error) {
    return (
      <section className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
        <h2 className="text-xl font-semibold text-white">
          {isSpanish ? "Lectura ejecutiva no disponible" : "Executive reading unavailable"}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          {isSpanish
            ? "La página continúa disponible, pero el reporte no pudo generarse en este momento."
            : "The page remains available, but the report could not be generated right now."}
        </p>
      </section>
    );
  }

  if (!report) {
    return (
      <section className="rounded-lg border border-white/10 bg-slate-950/55 p-5">
        <p className="text-sm text-slate-400">
          {isSpanish ? "Generando lectura ejecutiva..." : "Generating executive reading..."}
        </p>
      </section>
    );
  }

  const labels = {
    executive: isSpanish ? "Lectura ejecutiva" : "Executive reading",
    technicalSynthesis: isSpanish ? "Síntesis técnica" : "Technical synthesis",
    fundamentalSynthesis: isSpanish ? "Síntesis fundamental" : "Fundamental synthesis",
    keyTakeaways: isSpanish ? "Puntos clave" : "Key takeaways",
    price: isSpanish ? "Precio" : "Price",
    currentPrice: isSpanish ? "Precio actual" : "Current price",
    signal: isSpanish ? "Señal" : "Signal",
    marketSignal: isSpanish ? "Señal de mercado" : "Market signal",
    technical: isSpanish ? "Lectura técnica" : "Technical view",
    fundamental: isSpanish ? "Lectura fundamental" : "Fundamental view",
    news: isSpanish ? "Pulso de noticias" : "News pulse",
    cedear: isSpanish ? "Contexto CEDEAR" : "CEDEAR context",
    fixedIncome: isSpanish ? "Lectura de renta fija" : "Fixed income view",
    risks: isSpanish ? "Riesgos principales" : "Key risks",
    coverage: isSpanish ? "Cobertura y limitaciones de datos" : "Data coverage and limitations",
    notAdvice: isSpanish ? "No constituye asesoramiento de inversión." : "Not investment advice.",
    confidence: isSpanish ? "Confianza" : "Confidence",
    source: isSpanish ? "Fuente" : "Source",
    viewReport: isSpanish ? "Ver reporte" : "View report",
    methodology: isSpanish ? "Metodología" : "Methodology",
    howToRead: isSpanish ? "Cómo leerlo" : "How to read it",
    openNews: isSpanish ? "Abrir noticia" : "Open story",
    newsLanguage: isSpanish
      ? "Los titulares pueden mostrarse en el idioma original de la fuente."
      : "Headlines may appear in the source's original language.",
  };

  const displayPrice =
    report.priceSummary.price === null
      ? missingValue(language)
      : formatCurrencyValue(report.priceSummary.price, report.priceSummary.currency, language);
  const providerLabel = translateProviderLabel(report.priceSummary.sourceLabel, language);
  const finalTakeaways = report.finalReading.bulletPoints.slice(0, isReportMode ? 4 : 5).map(trimPoint);
  const technicalShort =
    report.technicalSummary.humanSummary?.shortSummary ??
    report.technicalSummary.humanSummary?.expandedSummary ??
    report.technicalSummary.interpretation;
  const fundamentalShort =
    report.fundamentalSummary.humanSummary?.shortSummary ??
    report.fundamentalSummary.humanSummary?.expandedSummary ??
    report.fundamentalSummary.interpretation;
  const limitationText = report.cedearSummary
    ? isSpanish
      ? "Este informe combina datos de proveedor, datos compatibles de respaldo, datos simulados estructurados y cobertura futura. No constituye asesoramiento de inversión. Los datos locales de CEDEAR continúan simulados hasta integrar BYMA/IOL o proveedor licenciado."
      : "This report combines provider data, compatible fallback data, structured mock data and future coverage. It is not investment advice. Local CEDEAR data remains simulated until BYMA/IOL or licensed-provider data is integrated."
    : isSpanish
      ? "Este informe combina datos de proveedor, datos compatibles de respaldo, datos simulados estructurados y cobertura futura. No constituye asesoramiento de inversión."
      : "This report combines provider data, compatible fallback data, structured mock data and future coverage. It is not investment advice.";

  const summaryStrip = [
    { label: labels.price, value: displayPrice },
    { label: labels.signal, value: report.marketSignalSummary.label },
    { label: labels.confidence, value: report.marketSignalSummary.confidence },
    { label: labels.source, value: providerLabel },
  ];

  return (
    <section
      className={
        isReportMode
          ? "space-y-5"
          : "rounded-lg border border-cyan-300/20 bg-slate-900/70 p-5 shadow-2xl shadow-cyan-950/15 backdrop-blur"
      }
    >
      <div className="grid gap-3 rounded-lg border border-cyan-300/20 bg-slate-950/60 p-4 shadow-lg shadow-cyan-950/10 sm:grid-cols-2 lg:grid-cols-4">
        {summaryStrip.map((item) => (
          <div key={item.label} className="rounded-md bg-white/[0.035] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
            <p className="mt-1 truncate text-sm font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-cyan-300/20 bg-slate-900/80 p-6 shadow-xl shadow-cyan-950/10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
              CMA Market Intelligence
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{labels.executive}</h2>
            <p className="mt-3 text-base leading-7 text-slate-200">{report.finalReading.summary}</p>
            {!isReportMode ? (
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {isSpanish
                  ? "Esta lectura integra precio, señal de mercado, análisis técnico, fundamentos disponibles, noticias y calidad de datos en un marco informativo."
                  : "This reading integrates price, market signal, technical analysis, available fundamentals, news and data quality in an informational framework."}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 lg:max-w-xs lg:justify-end">
            {sourceBadge(report.finalReading.label)}
            {sourceBadge(`${labels.confidence}: ${report.marketSignalSummary.confidence}`)}
          </div>
        </div>
      </div>

      {finalTakeaways.length ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <h3 className={sectionTitleClass()}>{labels.keyTakeaways}</h3>
          <ul className="mt-4 grid list-disc gap-3 pl-5 text-sm leading-6 text-slate-300 md:grid-cols-2">
            {finalTakeaways.map((point, index) => (
              <li key={`${point}-${index}`} className="pl-1">
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!isReportMode ? (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className={cardClass()}>
            <h3 className="font-semibold text-white">{labels.currentPrice}</h3>
            <p className="mt-2 text-2xl font-semibold text-white">{displayPrice}</p>
            <p className="mt-1 text-sm text-slate-400">
              {formatNullablePercent(report.priceSummary.changePercent, language)}
            </p>
            <p className="mt-3 text-xs text-cyan-100">
              {labels.source}: {providerLabel}
            </p>
          </div>

          <div className={cardClass()}>
            <h3 className="font-semibold text-white">{labels.marketSignal}</h3>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-2xl font-semibold text-white">{report.marketSignalSummary.score ?? missingValue(language)}/100</p>
              <p className="text-sm font-medium text-cyan-100">{report.marketSignalSummary.label}</p>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{report.marketSignalSummary.explanation}</p>
          </div>
        </div>
      ) : (
        <div className={cardClass()}>
          <h3 className="font-semibold text-white">{labels.marketSignal}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {sourceBadge(`${report.marketSignalSummary.score ?? missingValue(language)}/100`)}
            {sourceBadge(report.marketSignalSummary.label)}
            {sourceBadge(`${labels.confidence}: ${report.marketSignalSummary.confidence}`)}
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className={cardClass()}>
          <h3 className="font-semibold text-white">{labels.technicalSynthesis}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{technicalShort}</p>
          {!isReportMode && report.technicalSummary.humanSummary?.bulletPoints.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">
              {report.technicalSummary.humanSummary.bulletPoints.slice(0, 4).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {!isReportMode ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {report.technicalSummary.keyIndicators.map((indicator) => (
                <span key={indicator}>{sourceBadge(indicator)}</span>
              ))}
            </div>
          ) : null}
        </div>

        <div className={cardClass()}>
          <h3 className="font-semibold text-white">{labels.fundamentalSynthesis}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{fundamentalShort}</p>
          {!isReportMode && report.fundamentalSummary.humanSummary?.bulletPoints.length ? (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-400">
              {report.fundamentalSummary.humanSummary.bulletPoints.slice(0, 4).map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          ) : null}
          {!isReportMode ? (
            <p className="mt-3 text-xs text-slate-500">
              {labels.source}: {translateProviderLabel(report.fundamentalSummary.sourceLabel, language)}
            </p>
          ) : null}
        </div>
      </div>

      {report.newsSummary.latestHeadlines.length ? (
        <div className={cardClass()}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-white">{labels.news}</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">{labels.newsLanguage}</p>
            </div>
            {sourceBadge(translateProviderLabel(report.newsSummary.sourceLabel, language))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {report.newsSummary.latestHeadlines.slice(0, isReportMode ? 3 : 4).map((headline) => (
              <article key={`${headline.title}-${headline.source}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-medium leading-5 text-slate-200">{headline.title}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{headline.source}</span>
                  {headline.url ? (
                    <a href={headline.url} target="_blank" rel="noopener noreferrer" className="font-medium text-cyan-100 hover:text-white">
                      {labels.openNews}
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {report.cedearSummary ? (
          <div className={cardClass()}>
            <h3 className="font-semibold text-white">{labels.cedear}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{report.cedearSummary.interpretation}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
              <span>
                {isSpanish ? "CEDEAR local" : "Local CEDEAR"}:{" "}
                {formatCurrencyValue(report.cedearSummary.localPrice ?? 0, report.cedearSummary.localCurrency, language)}
              </span>
              <span>
                {isSpanish ? "Subyacente" : "Underlying"}:{" "}
                {report.cedearSummary.underlyingPrice === null
                  ? missingValue(language)
                  : formatCurrencyValue(report.cedearSummary.underlyingPrice, "USD", language)}
              </span>
              <span>
                CCL:{" "}
                {report.cedearSummary.impliedCcl === null
                  ? missingValue(language)
                  : `${formatNumber(report.cedearSummary.impliedCcl, language)} ARS/USD`}
              </span>
            </div>
            <div className="mt-4 rounded-lg border border-violet-300/15 bg-violet-300/10 p-3">
              <p className="text-sm font-semibold text-white">{labels.howToRead}</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-300">
                <li>{isSpanish ? "Usar el subyacente para evaluar tendencia y fundamentos." : "Use the underlying asset to evaluate trend and fundamentals."}</li>
                <li>{isSpanish ? "Usar el CEDEAR para analizar precio local, liquidez y CCL implícito." : "Use the CEDEAR to analyze local price, liquidity and implied CCL."}</li>
                <li>{isSpanish ? "No interpretar el CCL simulado como dato operativo real." : "Do not treat simulated CCL as live operating data."}</li>
              </ul>
            </div>
          </div>
        ) : null}

        {report.fixedIncomeSummary ? (
          <div className={cardClass()}>
            <h3 className="font-semibold text-white">{labels.fixedIncome}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{report.fixedIncomeSummary.interpretation}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-400">
              <span>YTM: {formatNullablePercent(report.fixedIncomeSummary.estimatedYTM, language)}</span>
              <span>Duration: {formatNullableNumber(report.fixedIncomeSummary.modifiedDuration, language)}</span>
              <span>Parity: {formatNullablePercent(report.fixedIncomeSummary.parity, language)}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-5">
          <h3 className="font-semibold text-white">{labels.risks}</h3>
          <div className="mt-3 grid gap-2">
            {report.riskSummary.keyRisks.map((risk, index) => (
              <div key={`${risk}-${index}`} className="flex flex-col gap-1 rounded-lg border border-amber-300/10 bg-slate-950/25 p-3 sm:flex-row sm:items-center sm:gap-3">
                <span className="w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                  {riskCategory(risk, isSpanish)}
                </span>
                <span className="text-sm text-slate-300">{risk}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
          <h3 className="font-semibold text-white">{labels.coverage}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              report.dataCoverageSummary.price,
              report.dataCoverageSummary.technical,
              report.dataCoverageSummary.fundamentals,
              report.dataCoverageSummary.news,
              report.dataCoverageSummary.fixedIncome,
            ]
              .filter(Boolean)
              .map((item, index) => (
                <span key={`${item}-${index}`}>{sourceBadge(item as string)}</span>
              ))}
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-400">{limitationText}</p>
          {report.warnings.length ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-500">
              {report.warnings.slice(0, isReportMode ? 3 : 4).map((warning, index) => (
                <li key={`${warning}-${index}`}>{warning}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {!isReportMode ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/report/${encodeURIComponent(report.symbol)}`}
            className="rounded-lg border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100"
          >
            {labels.viewReport}
          </Link>
          <Link href="/methodology" className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-slate-300">
            {labels.methodology}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
