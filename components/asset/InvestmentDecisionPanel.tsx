"use client";

import type { TechnicalIndicatorSnapshot } from "@/lib/analysis/types";
import { calculateMarketSignalScore } from "@/lib/analysis/market-signal";
import type { FundamentalsAssetClass, FundamentalsSnapshot } from "@/lib/fundamentals-data/types";
import { formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import {
  buildFundamentalVerdict,
  buildTechnicalVerdict,
  type Verdict,
} from "@/lib/intelligence/actionable-verdicts";
import type { Asset, AssetType } from "@/types/asset";
import type { FundamentalMetrics } from "@/types/fundamentals";
import type { TechnicalIndicators } from "@/types/technical";
import { SignalGauge } from "../analysis/SignalGauge";
import { Badge } from "../ui/Badge";
import { SectionHeader } from "../ui/SectionHeader";
import { useAssetAnalysis } from "./AssetAnalysisProvider";

function fallbackTechnicalSnapshot(asset: Asset, fallbackTechnicalData?: TechnicalIndicators): TechnicalIndicatorSnapshot {
  const technical = fallbackTechnicalData ?? asset.technical;

  return {
    lastClose: asset.price ?? null,
    sma20: technical?.sma20 ?? null,
    sma50: technical?.sma50 ?? null,
    sma200: technical?.sma200 ?? null,
    ema12: technical?.ema12 ?? null,
    ema26: technical?.ema26 ?? null,
    rsi14: technical?.rsi14 ?? null,
    macd: null,
    macdSignal: null,
    macdHistogram: null,
    support: technical?.support ?? null,
    resistance: technical?.resistance ?? null,
    volumeTrend: "unavailable",
    trendLabel: technical?.signal ?? "Trend unavailable",
    momentumLabel: technical?.macd ?? "Momentum unavailable",
  };
}

function fallbackFundamentalSnapshot(asset: Asset, fallbackFundamentals?: FundamentalMetrics): FundamentalsSnapshot {
  const fundamentals = fallbackFundamentals ?? asset.fundamentals;
  if (!fundamentals) return {};

  return {
    marketPrice: asset.price,
    trailingPE: fundamentals.peRatio,
    priceToBook: fundamentals.pbRatio,
    eps: fundamentals.eps,
    bookValuePerShare: fundamentals.bookValuePerShare,
    roe: fundamentals.roe / 100,
    roa: fundamentals.roa / 100,
    ebitdaMargin: fundamentals.ebitdaMargin / 100,
    dividendYield: fundamentals.dividendYield / 100,
    currency: asset.currency.includes("/") ? undefined : asset.currency,
  };
}

function toFundamentalsAssetClass(assetType: AssetType): FundamentalsAssetClass {
  if (assetType === "sovereign_bond" || assetType === "cer_bond" || assetType === "corporate_bond" || assetType === "letra") return "bond";
  if (assetType === "index" || assetType === "fx_reference") return "unknown";
  return assetType;
}

function badgeTone(tone: Verdict["tone"]) {
  if (tone === "positive") return "positive" as const;
  if (tone === "negative") return "negative" as const;
  if (tone === "warning") return "warning" as const;
  return "neutral" as const;
}

export function InvestmentDecisionPanel({ asset }: { asset: Asset }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const { bundle, loading, error } = useAssetAnalysis();

  if (loading && !bundle) {
    return (
      <section className="cma-panel-elevated border-cyan-300/20 p-5" data-testid="investment-decision-panel">
        <SectionHeader
          eyebrow={isSpanish ? "Lectura integrada" : "Integrated reading"}
          title={isSpanish ? "Actualizando analisis" : "Refreshing analysis"}
          description={isSpanish ? "Validando indicadores tecnicos y fundamentales." : "Validating technical and fundamental indicators."}
        />
      </section>
    );
  }

  if (!bundle) {
    return (
      <section className="cma-panel-elevated border-amber-300/20 p-5" data-testid="investment-decision-panel">
        <SectionHeader
          eyebrow={isSpanish ? "Lectura integrada" : "Integrated reading"}
          title={isSpanish ? "Analisis no disponible" : "Analysis unavailable"}
          description={isSpanish ? "No se publican scores sin datos de mercado verificados." : "Scores are not published without verified market data."}
        />
      </section>
    );
  }

  const technicalSnapshot = bundle?.technical.snapshot ?? fallbackTechnicalSnapshot(asset);
  const technicalScore = bundle.technical.isFallback ? null : bundle.technical.technicalScore;
  const fundamentalSnapshot = bundle?.fundamentals.snapshot ?? fallbackFundamentalSnapshot(asset);
  const fundamentalScore = bundle.fundamentals.fundamentalScore;
  const assetClass = bundle?.fundamentals.assetClass ?? toFundamentalsAssetClass(asset.type);
  const technicalVerdict = buildTechnicalVerdict(technicalSnapshot, technicalScore, language);
  const fundamentalVerdict = buildFundamentalVerdict(fundamentalSnapshot, fundamentalScore, assetClass, language);
  const marketSignal = bundle?.marketSignal ?? calculateMarketSignalScore({
    technicalScore,
    fundamentalScore,
    assetType: asset.type,
    riskLevel: asset.riskLevel,
    language,
  });
  const coverage = bundle?.fundamentals.coverageRatio;

  return (
    <section className="cma-panel-elevated border-cyan-300/20 p-5" data-testid="investment-decision-panel">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_288px] lg:items-center">
        <SectionHeader
          eyebrow={isSpanish ? "Lectura integrada" : "Integrated reading"}
          title={marketSignal.label}
          description={marketSignal.description}
          action={loading ? <Badge tone="accent">{isSpanish ? "Actualizando" : "Refreshing"}</Badge> : null}
        />
        <SignalGauge
          score={marketSignal.score}
          confidenceLabel={marketSignal.confidenceLabel}
          language={language}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-cyan-200">{isSpanish ? "Técnico" : "Technical"}</p>
            <Badge tone={badgeTone(technicalVerdict.tone)}>{technicalScore === null ? "N/D" : formatScore(technicalScore)}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">{technicalVerdict.label}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{technicalVerdict.summary}</p>
        </div>

        <div className="rounded-lg border border-violet-300/20 bg-violet-300/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-violet-200">{isSpanish ? "Fundamental" : "Fundamentals"}</p>
            <Badge tone={badgeTone(fundamentalVerdict.tone)}>{fundamentalScore == null ? "N/D" : formatScore(fundamentalScore)}</Badge>
          </div>
          <h3 className="mt-3 text-base font-semibold text-white">{fundamentalVerdict.label}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{fundamentalVerdict.summary}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-slate-950/45 p-4 md:col-span-2 xl:col-span-1">
          <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
            {isSpanish ? "Calidad del dato" : "Data quality"}
          </p>
          <p className="mt-3 text-base font-semibold text-white">
            {coverage === undefined
              ? (isSpanish ? "Validando cobertura" : "Validating coverage")
              : `${Math.round(coverage * 100)}% ${isSpanish ? "fundamental" : "fundamentals"}`}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {isSpanish
              ? "El score mide la calidad de los indicadores disponibles; la cobertura muestra cuánto pudo verificar el proveedor."
              : "The score measures the quality of available indicators; coverage shows how much the provider could verify."}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          {isSpanish ? "No se pudo actualizar el análisis; se mantiene la última referencia disponible." : "Analysis could not refresh; the latest available reference remains visible."}
        </p>
      ) : null}
    </section>
  );
}
