"use client";

import Link from "next/link";
import { getInstrumentUniverseGroups } from "@/lib/instrument-universe";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { mockAssets } from "@/lib/mock-data";
import { sectionAccents, type SectionAccent } from "@/lib/ui/section-accents";

const supportedAssetSymbols = new Set(mockAssets.map((asset) => asset.symbol));

function formatEnum(value: string) {
  return value.replaceAll("_", " ");
}

function statusLabel(value: string, isSpanish: boolean) {
  const labels: Record<string, { en: string; es: string }> = {
    real_supported: { en: "Real data", es: "Datos reales" },
    mock_supported: { en: "Mock data", es: "Datos simulados" },
    future_supported: { en: "Future data", es: "Datos futuros" },
  };

  return labels[value]?.[isSpanish ? "es" : "en"] ?? formatEnum(value);
}

function groupClasses(groupId: string) {
  const accents: Record<string, SectionAccent> = {
    argentine_equities: "argentina",
    cedears: "cedears",
    sovereign_bonds: "fixedIncome",
    etfs: "usa",
    usa_stocks: "usa",
    crypto: "crypto",
  };

  return sectionAccents[accents[groupId] ?? "default"].card;
}

export function InstrumentUniverseGroups({ argentinaOnly = false }: { argentinaOnly?: boolean }) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const allGroups = getInstrumentUniverseGroups(language);
  const groups = argentinaOnly
    ? allGroups.filter((group) => ["argentine_equities", "cedears", "sovereign_bonds"].includes(group.id))
    : allGroups;

  return (
    <section className="rounded-lg border border-violet-300/20 bg-slate-950/55 p-5 backdrop-blur">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            {argentinaOnly
              ? isSpanish
                ? "Universo argentino inicial"
                : "Initial Argentina universe"
              : isSpanish
                ? "Universo inicial de instrumentos"
                : "Initial instrument universe"}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            {argentinaOnly
              ? isSpanish
                ? "Grupos de mercado argentino"
                : "Argentina market groups"
              : isSpanish
                ? "Grupos estructurados del universo"
                : "Structured universe groups"}
          </h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-300">
            {argentinaOnly
              ? isSpanish
                ? "Vista agrupada de acciones argentinas, CEDEARs y bonos soberanos con especies relacionadas."
                : "Grouped view of Argentine equities, CEDEARs and sovereign bonds with related species."
              : isSpanish
                ? "Explora los primeros grupos estructurados para Argentina, Estados Unidos, ETFs y cripto. La cobertura se ampliara progresivamente."
                : "Explore the first structured groups prepared for Argentina, USA, ETFs and crypto. Coverage will expand progressively."}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <article key={group.id} className={`rounded-lg border p-4 ${groupClasses(group.id)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{group.description}</p>
              </div>
              <span className="rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-xs text-violet-100">
                {group.instruments.length}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              {group.instruments.map((instrument) => {
                const hasAssetPage = supportedAssetSymbols.has(instrument.symbol);
                const contextLabel =
                  instrument.category === "cedear"
                    ? "CEDEAR reference"
                    : instrument.country === "US" && instrument.category === "equity"
                      ? "USA stock"
                      : formatEnum(instrument.category);

                return (
                  <div
                    key={`${group.id}-${instrument.country}-${instrument.market}-${instrument.symbol}-${instrument.category}`}
                    className="rounded-lg border border-white/10 bg-slate-950/45 p-3"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{instrument.symbol}</p>
                          <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-slate-400">
                            {contextLabel}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">{instrument.displayName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {instrument.market} | {instrument.currency}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-100">
                          {statusLabel(instrument.sourceStatus, isSpanish)}
                        </span>
                        {hasAssetPage ? (
                          <Link
                            href={`/asset/${encodeURIComponent(instrument.symbol)}`}
                            className="rounded-lg border border-cyan-300/30 px-3 py-1.5 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/10"
                          >
                            {isSpanish ? "Abrir analisis" : "Open analysis"}
                          </Link>
                        ) : (
                          <span className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-500">
                            {isSpanish ? "Cobertura futura" : "Future coverage"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
