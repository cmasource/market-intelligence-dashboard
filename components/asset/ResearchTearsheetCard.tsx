"use client";

import { buildScoreSemantic, scoreToneClass } from "@/lib/analysis/score-semantics";
import { formatScore } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { Asset } from "@/types/asset";
import { Badge } from "../ui/Badge";
import { SectionHeader } from "../ui/SectionHeader";
import { useAssetAnalysis } from "./AssetAnalysisProvider";

function scoreText(score: number | null | undefined) {
  return typeof score === "number" && Number.isFinite(score) ? formatScore(score) : "N/D";
}

function catalystText(technicalScore: number | null | undefined, fundamentalScore: number | null | undefined, isSpanish: boolean) {
  if (typeof technicalScore === "number" && technicalScore >= 70) {
    return isSpanish ? "Confirmar continuidad de tendencia y volumen." : "Confirm trend continuation and volume.";
  }
  if (typeof fundamentalScore === "number" && fundamentalScore >= 70) {
    return isSpanish ? "Buscar punto tecnico que acompane los fundamentos." : "Wait for a technical entry that confirms fundamentals.";
  }
  if (typeof technicalScore === "number" && technicalScore <= 35) {
    return isSpanish ? "Esperar recuperacion de tendencia antes de priorizar." : "Wait for trend recovery before prioritizing.";
  }
  return isSpanish ? "Necesita un disparador claro de precio, resultados o noticias." : "Needs a clear price, earnings or news trigger.";
}

function riskText(asset: Asset, technicalScore: number | null | undefined, fundamentalScore: number | null | undefined, isSpanish: boolean) {
  if (asset.riskLevel === "very_high" || asset.riskLevel === "high") {
    return isSpanish ? "Riesgo alto: validar volatilidad, liquidez y tamano de posicion." : "High risk: validate volatility, liquidity and position size.";
  }
  if (typeof fundamentalScore === "number" && fundamentalScore < 40) {
    return isSpanish ? "La lectura fundamental puede limitar la calidad de la tesis." : "Fundamental reading may limit thesis quality.";
  }
  if (typeof technicalScore === "number" && technicalScore < 45) {
    return isSpanish ? "El timing tecnico todavia no acompana." : "Technical timing does not confirm yet.";
  }
  return isSpanish ? "El principal riesgo es pagar demasiado por una lectura ya descontada." : "Main risk is paying too much for a reading already priced in.";
}

export function ResearchTearsheetCard({ asset }: { asset: Asset }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const { bundle, loading } = useAssetAnalysis();
  const technicalScore = bundle?.technical.isFallback ? null : bundle?.technical.technicalScore ?? asset.technicalScore;
  const fundamentalScore = bundle?.fundamentals.fundamentalScore ?? asset.fundamentalScore ?? null;
  const marketSignal = bundle?.marketSignal ?? null;
  const semantic = buildScoreSemantic({
    score: marketSignal?.score ?? null,
    confidence: marketSignal?.confidence ?? "limited",
    language,
  });

  return (
    <section className="cma-panel-elevated border-white/10 p-5" data-testid="research-tearsheet-card">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <SectionHeader
          eyebrow={isSpanish ? "Research del activo" : "Asset research"}
          title={isSpanish ? "Tesis y siguiente validacion" : "Thesis and next validation"}
          description={
            isSpanish
              ? "Resumen accionable para ordenar el analisis antes de profundizar en valuacion, catalizadores o riesgo."
              : "Actionable summary to organize the analysis before deeper valuation, catalysts or risk work."
          }
          action={loading ? <Badge tone="accent">{isSpanish ? "Actualizando" : "Refreshing"}</Badge> : undefined}
        />
        <div className={`rounded-lg border p-4 ${scoreToneClass(semantic.tone)}`}>
          <p className="text-xs uppercase tracking-[0.16em] opacity-80">{isSpanish ? "Lectura integrada" : "Integrated read"}</p>
          <p className="mt-2 text-2xl font-semibold">{semantic.actionLabel}</p>
          <p className="mt-1 text-sm opacity-85">{semantic.researchPriorityLabel}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ResearchMetric label={isSpanish ? "Score tecnico" : "Technical score"} value={scoreText(technicalScore)} />
        <ResearchMetric label={isSpanish ? "Score fundamental" : "Fundamental score"} value={scoreText(fundamentalScore)} />
        <ResearchMetric label={isSpanish ? "Confianza" : "Confidence"} value={semantic.confidenceLabel} />
        <ResearchMetric label={isSpanish ? "Tipo de activo" : "Asset type"} value={asset.typeLabel} />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <ResearchNote title={isSpanish ? "Por que mirar" : "Why watch"} text={asset.summaryEs ?? asset.summary} />
        <ResearchNote title={isSpanish ? "Disparador a validar" : "Trigger to validate"} text={catalystText(technicalScore, fundamentalScore, isSpanish)} />
        <ResearchNote title={isSpanish ? "Primer riesgo" : "First risk"} text={riskText(asset, technicalScore, fundamentalScore, isSpanish)} />
      </div>
    </section>
  );
}

function ResearchMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950/45 p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function ResearchNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  );
}
