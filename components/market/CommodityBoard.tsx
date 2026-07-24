"use client";

import Link from "next/link";
import { AssetLogo } from "@/components/assets/AssetLogo";
import { formatCurrencyValue, formatPercent } from "@/lib/formatters";
import { useProviderQuotes } from "@/lib/hooks/useProviderQuotes";
import { useLanguage } from "@/lib/i18n/useLanguage";

const commodities = [
  { symbol: "GLD", es: "Oro", en: "Gold", family: "Metales" },
  { symbol: "SLV", es: "Plata", en: "Silver", family: "Metales" },
  { symbol: "CPER", es: "Cobre", en: "Copper", family: "Metales" },
  { symbol: "PPLT", es: "Platino", en: "Platinum", family: "Metales" },
  { symbol: "USO", es: "Petroleo", en: "Oil", family: "Energia" },
  { symbol: "UNG", es: "Gas natural", en: "Natural gas", family: "Energia" },
  { symbol: "DBA", es: "Agricultura", en: "Agriculture", family: "Granos" },
  { symbol: "PALL", es: "Paladio", en: "Palladium", family: "Metales" },
] as const;

export function CommodityBoard() {
  const { language } = useLanguage();
  const isSpanish = language === "es";
  const quotes = useProviderQuotes(commodities.map((item) => item.symbol));

  return (
    <section className="cma-panel overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <p className="cma-kicker">Commodities</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{isSpanish ? "Materias primas globales" : "Global commodities"}</h2>
        <p className="mt-2 text-sm text-slate-400">{isSpanish ? "Referencias liquidas negociadas en Estados Unidos para seguir metales, energia y agricultura." : "Liquid US-listed references for metals, energy, and agriculture."}</p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4">
        {commodities.map((item, index) => {
          const quote = quotes[item.symbol];
          const change = quote?.changePercent;
          const backgrounds = ["bg-amber-300/[0.055]", "bg-cyan-300/[0.05]", "bg-emerald-300/[0.05]", "bg-violet-300/[0.055]"];
          return (
            <Link key={item.symbol} href={`/asset/${item.symbol}`} className={`border-b border-r border-white/8 p-4 transition hover:bg-white/[0.075] ${backgrounds[index % backgrounds.length]}`}>
              <div className="flex items-center gap-3"><AssetLogo symbol={item.symbol} name={isSpanish ? item.es : item.en} type="etf" size="sm" /><div><p className="font-semibold text-white">{isSpanish ? item.es : item.en}</p><p className="text-xs text-slate-500">{item.symbol} | {item.family}</p></div></div>
              <div className="mt-4 flex items-end justify-between gap-3"><p className="font-semibold text-slate-100">{typeof quote?.price === "number" ? formatCurrencyValue(quote.price, quote.currency, language) : "-"}</p><p className={`text-sm font-semibold ${typeof change === "number" && change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>{typeof change === "number" ? formatPercent(change) : "-"}</p></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
