"use client";

import Link from "next/link";
import { cryptoMonitorItems } from "@/lib/mock-data";
import { formatPercent } from "@/lib/formatters";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { SectionHeader } from "../ui/SectionHeader";

export function CryptoMonitor() {
  const { t } = useLanguage();
  const contextLabels: Record<string, string> = {
    "BTC-USD": t("contextVolatilityElevated"),
    "ETH-USD": t("constructiveTrend"),
    "USDT/ARS": t("contextCryptoDollar"),
    "DAI/ARS": t("placeholderPair"),
  };

  return (
    <section id="crypto">
      <SectionHeader
        eyebrow={t("cryptoEyebrow")}
        title={t("cryptoTitle")}
        description={t("cryptoDescription")}
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cryptoMonitorItems.map((item) => {
          const isLink = item.symbol.includes("-USD");
          const content = (
            <div className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 p-4 shadow-2xl shadow-cyan-950/10 transition hover:border-cyan-200/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{item.symbol}</p>
                  <p className="mt-1 text-xs text-slate-400">{item.label}</p>
                </div>
                <span className={item.change >= 0 ? "text-sm text-emerald-300" : "text-sm text-rose-300"}>
                  {formatPercent(item.change)}
                </span>
              </div>
              <p className="mt-5 text-2xl font-semibold text-white">{item.value}</p>
              <p className="mt-2 text-sm text-slate-400">{contextLabels[item.symbol] ?? item.context}</p>
            </div>
          );

          return isLink ? (
            <Link key={item.symbol} href={`/asset/${encodeURIComponent(item.symbol)}`}>
              {content}
            </Link>
          ) : (
            <div key={item.symbol}>{content}</div>
          );
        })}
      </div>
    </section>
  );
}
