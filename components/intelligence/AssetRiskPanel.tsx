"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { AssetIntelligenceReport } from "@/lib/intelligence";

type AssetRiskPanelProps = {
  symbol: string;
};

function riskCategory(risk: string, isSpanish: boolean) {
  const value = risk.toLowerCase();
  if (value.includes("valu") || value.includes("multiple")) return isSpanish ? "Valuacion" : "Valuation";
  if (value.includes("earning") || value.includes("resultado")) return isSpanish ? "Resultados" : "Earnings";
  if (value.includes("rate") || value.includes("tasa") || value.includes("duration")) return isSpanish ? "Tasas" : "Rates";
  if (value.includes("cedear") || value.includes("ccl") || value.includes("fx") || value.includes("cambi")) return "CEDEAR/FX";
  if (value.includes("liquid")) return isSpanish ? "Liquidez" : "Liquidity";
  return isSpanish ? "Mercado" : "Market";
}

export function AssetRiskPanel({ symbol }: AssetRiskPanelProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [report, setReport] = useState<AssetIntelligenceReport | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(`/api/intelligence/${encodeURIComponent(symbol)}?language=${language}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Risk request failed.");
        if (!controller.signal.aborted) setReport((await response.json()) as AssetIntelligenceReport);
      } catch {
        if (!controller.signal.aborted) setReport(null);
      }
    }

    void load();
    return () => controller.abort();
  }, [language, symbol]);

  const risks = report?.riskSummary.keyRisks.slice(0, 5) ?? [];

  return (
    <section className="cma-card-risk p-5" data-testid="asset-risk-panel">
      <p className="cma-kicker text-amber-200">{isSpanish ? "Riesgo" : "Risk"}</p>
      <h2 className="mt-2 text-xl font-semibold text-white">{isSpanish ? "Riesgos principales" : "Key risks"}</h2>
      {risks.length ? (
        <div className="mt-4 space-y-2">
          {risks.map((risk) => (
            <div key={risk} className="rounded-xl border border-amber-300/12 bg-slate-950/25 p-3">
              <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-100">
                {riskCategory(risk, isSpanish)}
              </span>
              <p className="mt-2 text-sm leading-6 text-slate-300">{risk}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-400">
          {isSpanish ? "Riesgos en preparacion con la lectura disponible." : "Risks are being prepared from the available reading."}
        </p>
      )}
    </section>
  );
}

