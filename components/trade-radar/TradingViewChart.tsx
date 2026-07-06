"use client";

import { TradingViewAdvancedChart } from "@/components/charts/TradingViewAdvancedChart";
import type { TradeRadarInterval } from "@/lib/market-data/providers/base";

type TradingViewChartProps = {
  symbol: string;
  interval: TradeRadarInterval;
};

function toTradingViewInterval(interval: TradeRadarInterval) {
  if (interval === "1h") return "60";
  if (interval === "4h") return "240";
  return "D";
}

export function TradingViewChart({ symbol, interval }: TradingViewChartProps) {
  return (
    <TradingViewAdvancedChart
      symbol={symbol}
      interval={toTradingViewInterval(interval)}
      height={520}
    />
  );
}
