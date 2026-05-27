"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const isLight = resolvedMode === "light";

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${isLight ? "border-slate-200/80 bg-white/78 shadow-sm shadow-slate-900/5" : "border-white/10 bg-[#020617]/72 shadow-2xl shadow-black/20"}`}>
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 px-4 py-3 sm:px-6 lg:px-10 xl:flex-row xl:items-center xl:justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <span
            aria-label="CMA"
            className={`grid h-10 w-12 place-items-center rounded-xl border text-[0.68rem] font-black tracking-[0.16em] shadow-lg transition ${
              isLight
                ? "border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-100 text-cyan-900 shadow-cyan-900/10"
                : "border-cyan-300/35 bg-gradient-to-br from-cyan-300/25 via-slate-900/80 to-violet-400/20 text-cyan-100 shadow-cyan-950/40"
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
