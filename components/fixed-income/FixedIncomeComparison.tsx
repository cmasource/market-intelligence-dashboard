"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { GlossaryLabel } from "@/components/glossary/GlossaryLabel";
import {
  translateBondLaw,
  translateRiskLevel,
  translateSettlementContext,
  translateSpeciesType,
  translateTradingCurrency,
} from "@/lib/i18n/display-labels";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { BondComparisonItem } from "@/lib/fixed-income";
import { sectionAccents } from "@/lib/ui/section-accents";
import { SectionHeader } from "../ui/SectionHeader";

function formatRate(value: number | null, fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? formatPercent(value * 100) : fallback;
}

function formatValue(value: number | null, fallback: string) {
  return typeof value === "number" && Number.isFinite(value) ? formatNumber(value) : fallback;
}

export function FixedIncomeComparison() {
  const { language, t } = useLanguage();
  const [items, setItems] = useState<BondComparisonItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const unavailable = t("notAvailable");
  const realItems = items.filter((item) => !item.isMock);

  useEffect(() => {
    let isMounted = true;

    async function loadComparison() {
      try {
        const response = await fetch("/api/fixed-income/comparison");
        if (!response.ok) throw new Error("Fixed income comparison unavailable");
        const data = (await response.json()) as BondComparisonItem[];
        if (isMounted) setItems(data);
      } catch {
        if (isMounted) setItems([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadComparison();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className={`rounded-lg border bg-slate-950/55 p-5 backdrop-blur ${sectionAccents.fixedIncome.card}`}>
      <SectionHeader
        eyebrow={t("fixedIncome")}
        title={t("fixedIncomeAnalyticsTitle")}
        description={t("fixedIncomeAnalyticsDescription")}
      />
      <p className="mb-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
        {language === "es"
          ? "Comparador bloqueado para uso operativo hasta integrar precios reales y cronogramas oficiales. El motor calcula TIR, duracion, convexidad y paridad, pero no se muestran valores no operativos como senales."
          : "Comparator blocked for operational use until real prices and official schedules are integrated. The engine calculates YTM, duration, convexity and parity, but non-operational values are not shown as signals."}
      </p>

      {isLoading ? (
        <p className="text-sm text-slate-300">{t("fixedIncomeLoading")}</p>
      ) : realItems.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
          <p className="text-sm font-semibold text-white">
            {language === "es" ? "Sin bonos con datos reales operativos" : "No bonds with operational real data"}
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            {language === "es"
              ? "El modulo requiere una cotizacion local y un archivo validado de cashflows. Sin esos insumos no publica precio, TIR ni duracion."
              : "This module is ready for BYMA, a licensed broker provider, or a validated cash-flow file. Until then, simulated prices, YTM and durations are not displayed."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-3">
          {realItems.map((item) => (
            <article key={item.symbol} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.symbol}</h3>
                  <p className="mt-1 text-sm text-slate-400">{item.name}</p>
                </div>
                <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-2.5 py-1 text-xs text-violet-100">
                  {translateRiskLevel(item.riskLevel, language)}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t("underlyingBond")}</dt>
                  <dd className="mt-1 font-semibold text-white">{item.underlyingSymbol}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t("tradingSpecies")}</dt>
                  <dd className="mt-1 font-semibold text-white">{translateSpeciesType(item.speciesType, language)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t("tradingCurrency")}</dt>
                  <dd className="mt-1 font-semibold text-white">{translateTradingCurrency(item.tradingCurrency, language)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t("priceLabel")}</dt>
                  <dd className="mt-1 font-semibold text-white">{formatCurrency(item.price, item.quoteCurrency ?? item.displayCurrency, language)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">{t("settlementCurrency")}</dt>
                  <dd className="mt-1 font-semibold text-white">{translateSettlementContext(item.settlementContext, language)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500"><GlossaryLabel termKey="parity" fallbackLabel={t("parity")} /></dt>
                  <dd className="mt-1 font-semibold text-white">{formatRate(item.parity, unavailable)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500"><GlossaryLabel termKey="ytm" fallbackLabel="YTM" /></dt>
                  <dd className="mt-1 font-semibold text-white">{formatRate(item.estimatedYTM, unavailable)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500"><GlossaryLabel termKey="duration" fallbackLabel={t("duration")} /></dt>
                  <dd className="mt-1 font-semibold text-white">{formatValue(item.duration, unavailable)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500"><GlossaryLabel termKey="modifiedDuration" fallbackLabel={t("modifiedDuration")} /></dt>
                  <dd className="mt-1 font-semibold text-white">{formatValue(item.modifiedDuration, unavailable)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500"><GlossaryLabel termKey="convexity" fallbackLabel={t("convexity")} /></dt>
                  <dd className="mt-1 font-semibold text-white">{formatValue(item.convexity, unavailable)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.14em] text-slate-500"><GlossaryLabel termKey="law" fallbackLabel={t("law")} /></dt>
                  <dd className="mt-1 font-semibold text-white">{translateBondLaw(item.law, language)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
