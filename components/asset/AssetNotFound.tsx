"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";

type AssetNotFoundProps = {
  symbol: string;
};

export function AssetNotFound({ symbol }: AssetNotFoundProps) {
  const { t } = useLanguage();

  return (
    <section className="mx-auto max-w-3xl rounded-lg border border-white/10 bg-slate-900/70 p-8 text-center shadow-2xl shadow-black/10 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{t("assetNotFoundEyebrow")}</p>
      <h1 className="mt-3 text-3xl font-semibold text-white">{t("assetNotFoundTitle", { symbol })}</h1>
      <p className="mt-4 text-sm leading-6 text-slate-400">{t("assetNotFoundText")}</p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-200/60 hover:bg-cyan-300/20"
      >
        {t("backToDashboard")}
      </Link>
    </section>
  );
}
