"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";

export function AIMarketBrief() {
  const { t } = useLanguage();
  const views = [
    { label: t("technicalView"), text: t("aiTechnicalViewText") },
    { label: t("fundamentalView"), text: t("aiFundamentalViewText") },
    { label: t("argentinaContext"), text: t("aiArgentinaContextText") },
    { label: t("cryptoContext"), text: t("aiCryptoContextText") },
    { label: t("riskNote"), text: t("aiRiskNoteText") },
  ];

  return (
    <section className="rounded-lg border border-cyan-300/30 bg-gradient-to-br from-cyan-400/15 via-slate-900/80 to-violet-500/15 p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur" id="agents">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{t("aiMarketBriefEyebrow")}</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{t("aiMarketBriefTitle")}</h2>
          <p className="mt-4 max-w-4xl text-sm leading-6 text-slate-300">
            {t("aiMarketBriefText")}
          </p>
        </div>
        <span className="rounded-full border border-cyan-200/30 bg-cyan-200/10 px-3 py-1 text-xs font-medium text-cyan-100">
          {t("agentReadyStructure")}
        </span>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-5">
        {views.map((view) => (
          <div key={view.label} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
            <p className="text-sm font-semibold text-white">{view.label}</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">{view.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
