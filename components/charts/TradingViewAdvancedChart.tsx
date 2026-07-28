"use client";

import { useEffect, useMemo, useRef } from "react";
import { getTradingViewSymbol } from "@/lib/tradingview/symbol-map";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";

type TradingViewAdvancedChartProps = {
  symbol: string;
  theme?: "dark" | "light";
  height?: number;
  locale?: "en" | "es";
  interval?: string;
};

function tradingViewSymbolSlug(symbol: string) {
  return symbol.replace(":", "-").replace(/[^A-Z0-9-]/gi, "").toUpperCase();
}

export function TradingViewAdvancedChart({
  symbol,
  theme,
  height = 620,
  locale,
  interval = "D",
}: TradingViewAdvancedChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { language } = useLanguage();
  const { resolvedMode } = useTheme();
  const mapping = useMemo(() => getTradingViewSymbol(symbol), [symbol]);
  const resolvedTheme = theme ?? (resolvedMode === "light" ? "light" : "dark");
  const resolvedLocale = locale ?? (language === "es" ? "es" : "en");
  const symbolSlug = tradingViewSymbolSlug(mapping.tradingViewSymbol);
  const chartHeight = `clamp(420px, 62vh, ${Math.max(height, 620)}px)`;
  const priceActionLabel = language === "es" ? "Acci\u00f3n del precio" : "Price action";

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return undefined;
    const widgetKey = `${mapping.tradingViewSymbol}-${interval}-${resolvedTheme}-${resolvedLocale}`;
    if (root.dataset.tradingviewWidgetKey === widgetKey) return undefined;
    root.dataset.tradingviewWidgetKey = widgetKey;

    for (const child of Array.from(root.children)) {
      child.setAttribute("aria-hidden", "true");
      if (child instanceof HTMLElement) child.style.display = "none";
    }

    const container = document.createElement("div");
    container.className = "tradingview-widget-container h-full w-full";
    container.dataset.tradingviewWidgetInstance = widgetKey;

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container__widget";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.text = JSON.stringify({
      autosize: true,
      symbol: mapping.tradingViewSymbol,
      interval,
      timezone: "America/Argentina/Buenos_Aires",
      theme: resolvedTheme,
      style: "1",
      locale: resolvedLocale,
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      save_image: false,
      calendar: false,
      studies: ["STD;Volume"],
      support_host: "https://www.tradingview.com",
    });

    container.appendChild(widgetContainer);
    container.appendChild(script);
    root.appendChild(container);

    const cleanupStaleWidgets = window.setTimeout(() => {
      for (const child of Array.from(root.children)) {
        if (child instanceof HTMLElement && child.dataset.tradingviewWidgetInstance !== widgetKey) {
          root.removeChild(child);
        }
      }
    }, 6000);

    return () => {
      // TradingView's async embed can still execute after React dev-mode effect
      // cleanup. Removing the script immediately leaves the embed without a
      // parent node and raises an external querySelector error in local QA.
      window.clearTimeout(cleanupStaleWidgets);
    };
  }, [interval, mapping.tradingViewSymbol, resolvedLocale, resolvedTheme]);

  return (
    <section
      className="cma-panel-elevated cma-glow-cyan p-4 sm:p-5"
      data-chart-provider="tradingview"
      data-testid="price-action-section"
    >
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">{priceActionLabel}</p>
          <h2 className="mt-1 text-xl font-semibold text-white">{priceActionLabel}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            {language === "es"
              ? "Gr\u00e1fico interactivo provisto por TradingView. Las m\u00e9tricas internas de CMA Market Intelligence pueden usar otros proveedores."
              : "Interactive chart provided by TradingView. CMA Market Intelligence internal metrics may use other providers."}
          </p>
        </div>
        <span className="w-fit rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-medium text-cyan-100">
          {mapping.tradingViewSymbol}
        </span>
      </div>

      <div
        className="overflow-hidden rounded-lg border border-white/10 bg-slate-950/80 shadow-2xl shadow-slate-950/30"
        data-chart-provider="tradingview"
        data-testid="tradingview-chart"
        data-tradingview-symbol={mapping.tradingViewSymbol}
        data-tradingview-verified={String(mapping.verified)}
        style={{ height: chartHeight, minHeight: 420, width: "100%" }}
      >
        <div ref={containerRef} className="h-full w-full" />
      </div>

      <div className="mt-3 space-y-1 text-xs leading-5 text-slate-400">
        <p>
          {language === "es"
            ? "El gr\u00e1fico puede usar simbolog\u00eda y datos de TradingView."
            : "The chart may use TradingView symbols and data. CMA Market Intelligence internal metrics may use other providers."}
          <a
            className="ml-1 text-cyan-200 underline-offset-4 hover:text-cyan-100 hover:underline"
            href={`https://www.tradingview.com/symbols/${symbolSlug}/?utm_source=cma-market-intelligence&utm_medium=widget&utm_campaign=advanced-chart`}
            rel="noopener nofollow"
            target="_blank"
          >
            {mapping.tradingViewSymbol}
          </a>
        </p>
      </div>
    </section>
  );
}
