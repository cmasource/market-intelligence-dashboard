"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssetLogo } from "@/components/assets/AssetLogo";
import type { CedearAnalytics } from "@/lib/cedears";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getAssetHref } from "@/lib/instruments/assetHref";

type CedearMarketGridProps = {
  fallbackItems: Array<{
    localSymbol: string;
    underlyingName: string;
    ratio: number | null;
  }>;
};

function formatNumber(value: number | null | undefined, digits = 2) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/D";
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value >= 1000 ? 0 : digits,
  }).format(value);
}

function statusText(item: CedearAnalytics, isSpanish: boolean) {
  if (item.status === "local_provider") return isSpanish ? "Mercado local" : "Local market";
  if (item.status === "provider_underlying") return isSpanish ? "Subyacente" : "Underlying";
  return isSpanish ? "Referencia" : "Reference";
}

export function CedearMarketGrid({ fallbackItems }: CedearMarketGridProps) {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const [items, setItems] = useState<CedearAnalytics[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCedears() {
      try {
        const response = await fetch("/api/cedears", { signal: controller.signal });
        if (!response.ok) throw new Error(`CEDEAR API returned HTTP ${response.status}`);
        const data = (await response.json()) as CedearAnalytics[];
        if (!controller.signal.aborted) setItems(data);
      } catch {
        if (!controller.signal.aborted) setItems([]);
      }
    }

    void loadCedears();
    return () => controller.abort();
  }, []);

  const visibleItems = useMemo(() => {
    if (items.length) return items;
    return fallbackItems.map((item) => ({
      localSymbol: item.localSymbol,
      underlyingSymbol: item.localSymbol,
      underlyingName: item.underlyingName,
      ratio: item.ratio,
      localPrice: null,
      underlyingPrice: null,
      impliedCcl: null,
      sourceLabel: "",
      isMock: true,
      status: "unavailable" as const,
      interpretation: {
        label: "",
        tone: "neutral" as const,
        summary: "",
        bulletPoints: [],
      },
    }));
  }, [fallbackItems, items]);

  return (
    <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-3">
      {visibleItems.map((cedear) => (
        <Link
          key={cedear.localSymbol}
          href={getAssetHref(cedear.localSymbol, `cedear:${cedear.localSymbol}`)}
          className="min-w-0 rounded-lg border border-white/10 bg-slate-950/45 p-3 transition hover:border-violet-300/40 hover:bg-violet-300/10"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <AssetLogo symbol={cedear.underlyingSymbol} name={cedear.underlyingName} type="cedear" size="sm" />
              <div className="min-w-0">
                <p className="font-semibold text-white">{cedear.localSymbol}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{cedear.underlyingName}</p>
              </div>
            </div>
            <span className="rounded-full border border-violet-300/25 px-2 py-0.5 text-xs text-violet-100">CEDEAR</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-slate-500">{isSpanish ? "Precio local" : "Local price"}</p>
              <p className="mt-1 font-semibold text-white">{formatNumber(cedear.localPrice, 2)} ARS</p>
            </div>
            <div>
              <p className="text-slate-500">CCL</p>
              <p className="mt-1 font-semibold text-white">{formatNumber(cedear.impliedCcl, 2)}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
              {statusText(cedear, isSpanish)}
            </span>
            {cedear.ratio ? (
              <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
                {cedear.ratio}:1
              </span>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  );
}
