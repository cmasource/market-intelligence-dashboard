"use client";

import { formatPercent } from "@/lib/formatters";
import { getTrendLabel } from "@/lib/i18n/domain";
import { useLanguage } from "@/lib/i18n/useLanguage";
import type { MarketOverviewItem } from "@/types/asset";
import { MetricCard } from "../ui/MetricCard";
import { SectionHeader } from "../ui/SectionHeader";

type MarketOverviewProps = {
  items: MarketOverviewItem[];
};

export function MarketOverview({ items }: MarketOverviewProps) {
  const { t } = useLanguage();
  const contextLabels: Record<string, string> = {
    "S&P 500": t("contextLargeCaps"),
    "Nasdaq 100": t("contextMegaCapTech"),
    Merval: t("contextLocalEquities"),
    Bitcoin: t("contextVolatilityElevated"),
    "USDT/ARS": t("contextCryptoDollar"),
    "CCL reference": t("contextFxSpread"),
  };

  return (
    <section>
      <SectionHeader
        eyebrow={t("marketOverviewEyebrow")}
        title={t("marketOverviewTitle")}
        description={t("marketOverviewDescription")}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => (
          <MetricCard
            key={item.name}
            label={item.name}
            value={item.value}
            change={formatPercent(item.dailyChange)}
            trend={getTrendLabel(item.trend, t)}
            context={contextLabels[item.name] ?? item.context}
            tone={item.dailyChange > 0 ? "positive" : item.dailyChange < 0 ? "negative" : "neutral"}
          />
        ))}
      </div>
    </section>
  );
}
