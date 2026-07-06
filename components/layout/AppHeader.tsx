"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";
import { getWatchlistCount, WATCHLIST_UPDATED_EVENT } from "@/lib/watchlist";
import { AppearanceToggle } from "./AppearanceToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { labelKey: "navDashboard", href: "/" },
  { labelKey: "navMarkets", href: "/markets" },
  { labelKey: "navScreener", href: "/screener" },
  { labelKey: "navTradeRadar", href: "/trade-radar" },
  { labelKey: "navArgentina", href: "/argentina" },
  { labelKey: "navCrypto", href: "/crypto" },
  { labelKey: "navWatchlist", href: "/watchlist" },
  { labelKey: "navReports", href: "/reports" },
  { labelKey: "navAgents", href: "/agents" },
];

export function AppHeader() {
  const { t } = useLanguage();
  const { resolvedMode } = useTheme();
  const pathname = usePathname();
  const isLight = resolvedMode === "light";
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const sync = () => setWatchlistCount(getWatchlistCount());
    sync();
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${isLight ? "border-slate-200/80 bg-white/78 shadow-sm shadow-slate-900/5" : "border-white/10 bg-[#020617]/72 shadow-2xl shadow-black/20"}`}>
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 px-4 py-2.5 sm:px-6 lg:px-10 xl:flex-row xl:items-center xl:justify-between">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="CMA Market Intelligence">
          <span aria-label="CMA" className="sr-only">CMA</span>
          <span
            className={`relative grid h-11 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border px-2 shadow-lg transition ${
              isLight
                ? "border-slate-200 bg-white shadow-slate-900/10"
                : "border-cyan-200/25 bg-white shadow-cyan-950/30"
            }`}
          >
            <Image
              src="/brand/cma-monogram-transparent.png"
              alt="CMA Market Intelligence"
              width={355}
              height={144}
              priority
              className="h-7 w-full object-contain"
            />
            <span className={`pointer-events-none absolute inset-0 rounded-lg ${isLight ? "ring-1 ring-slate-950/5" : "ring-1 ring-cyan-200/15"}`} />
          </span>
          <span className="min-w-0">
            <span className={`block truncate text-base font-semibold tracking-tight group-hover:text-cyan-300 ${isLight ? "text-slate-950" : "text-white"}`}>
              {t("productName")}
            </span>
          </span>
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <nav
            aria-label="Primary navigation"
            className={`flex gap-1.5 overflow-x-auto rounded-full border p-1 ${isLight ? "border-slate-200 bg-slate-100/70" : "border-white/10 bg-white/[0.035]"}`}
          >
            {navItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.labelKey}
                  href={item.href}
                  className={`relative rounded-full px-3.5 py-2 text-sm transition ${
                    isActive
                      ? isLight
                        ? "bg-white text-slate-950 shadow-sm shadow-slate-900/10"
                        : "bg-cyan-300/12 text-cyan-50 shadow-[0_0_22px_rgba(34,211,238,0.12)]"
                      : isLight
                        ? "text-slate-600 hover:bg-white/70 hover:text-slate-950"
                        : "text-slate-300 hover:bg-white/[0.055] hover:text-white"
                  }`}
                >
                  {t(item.labelKey)}
                  {item.labelKey === "navWatchlist" && watchlistCount > 0 ? (
                    <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-cyan-300/15 px-1.5 text-[0.68rem] text-cyan-100">
                      {watchlistCount}
                    </span>
                  ) : null}
                  {isActive ? <span className="absolute inset-x-4 -bottom-1 h-px bg-cyan-300/70" /> : null}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <AppearanceToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </header>
  );
}
