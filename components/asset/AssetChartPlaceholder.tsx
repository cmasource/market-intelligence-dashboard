"use client";

import { useLanguage } from "@/lib/i18n/useLanguage";

const timeframes = ["1D", "5D", "1M", "6M", "YTD", "1Y", "5Y"];

export function AssetChartPlaceholder() {
  const { t } = useLanguage();

  return (
    <section className="rounded-lg border border-white/10 bg-slate-900/70 p-4 shadow-2xl shadow-black/10 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{t("priceAction")}</h2>
          <p className="text-sm text-slate-400">{t("chartPrepared")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-300/50 hover:text-white"
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>
      <div className="relative mt-5 h-80 overflow-hidden rounded-lg border border-white/10 bg-slate-950/80">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:100%_20%,12.5%_100%]" />
        <div className="absolute inset-x-8 bottom-12 top-12">
          <div className="chart-line absolute inset-0" />
          <div className="absolute bottom-0 left-[4%] h-20 w-2 rounded-t bg-cyan-300/50" />
          <div className="absolute bottom-0 left-[12%] h-28 w-2 rounded-t bg-violet-300/50" />
          <div className="absolute bottom-0 left-[24%] h-16 w-2 rounded-t bg-cyan-300/40" />
          <div className="absolute bottom-0 left-[36%] h-36 w-2 rounded-t bg-emerald-300/50" />
          <div className="absolute bottom-0 left-[48%] h-24 w-2 rounded-t bg-violet-300/40" />
          <div className="absolute bottom-0 left-[60%] h-44 w-2 rounded-t bg-cyan-300/50" />
          <div className="absolute bottom-0 left-[72%] h-32 w-2 rounded-t bg-emerald-300/50" />
          <div className="absolute bottom-0 left-[84%] h-52 w-2 rounded-t bg-cyan-200/60" />
        </div>
        <div className="absolute left-4 top-4 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
          {t("mockOhlc")}
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        {t("legacyChartFallback")}
      </p>
    </section>
  );
}
