"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { useTheme } from "@/lib/theme/useTheme";
import { AppearanceToggle } from "./AppearanceToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

const navItems = [
  { labelKey: "navDashboard", href: "/" },
  { labelKey: "navMarkets", href: "/markets" },
  { labelKey: "navScreener", href: "/screener" },
  { labelKey: "navArgentina", href: "/argentina" },
  { labelKey: "navCrypto", href: "/crypto" },
  { labelKey: "navReports", href: "/reports" },
  { labelKey: "navAgents", href: "/agents" },
];

export function AppHeader() {
  const { t } = useLanguage();
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${isLight ? "border-slate-200 bg-white/85" : "border-white/10 bg-slate-950/80"}`}>
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-label="CMA"
            className={`grid h-10 w-12 place-items-center rounded-xl border text-[0.68rem] font-black tracking-[0.14em] shadow-lg transition ${
              isLight
                ? "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-indigo-100 text-cyan-900 shadow-cyan-900/10"
                : "border-cyan-300/35 bg-gradient-to-br from-cyan-300/20 via-slate-900/80 to-indigo-400/20 text-cyan-100 shadow-cyan-950/30"
            }`}
          >
            CMA
          </span>
          <span>
            <span className={`block text-base font-semibold tracking-tight group-hover:text-cyan-300 ${isLight ? "text-slate-950" : "text-white"}`}>
              {t("productName")}
            </span>
            <span className={`block text-xs ${isLight ? "text-slate-600" : "text-slate-400"}`}>
              {t("headerSubtitle")}
            </span>
          </span>
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <nav aria-label="Primary navigation" className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.labelKey}
              href={item.href}
              className={`rounded-full border px-3.5 py-2 text-sm transition hover:border-cyan-300/40 hover:bg-cyan-300/10 ${
                isLight ? "border-slate-200 text-slate-700 hover:text-slate-950" : "border-white/10 text-slate-300 hover:text-white"
              }`}
            >
              {t(item.labelKey)}
            </Link>
          ))}
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
