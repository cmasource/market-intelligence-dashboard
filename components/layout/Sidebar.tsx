"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getWatchlistCount, WATCHLIST_UPDATED_EVENT } from "@/lib/watchlist";
import { AppearanceToggle } from "./AppearanceToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { AuthNavigation } from "@/components/auth/AuthNavigation";

export const navItems = [
  { labelKey: "navDashboard", href: "/", accent: "from-cyan-300 to-emerald-300" },
  { labelKey: "navMarkets", href: "/markets", accent: "from-sky-300 to-cyan-300" },
  { labelKey: "navUSA", href: "/usa", accent: "from-violet-300 to-cyan-300" },
  { labelKey: "navTradeRadar", href: "/trade-radar", accent: "from-amber-300 to-cyan-300" },
  { labelKey: "navArgentina", href: "/argentina", accent: "from-blue-300 to-white" },
  { labelKey: "navCrypto", href: "/crypto", accent: "from-orange-300 to-amber-300" },
  { labelKey: "navWatchlist", href: "/watchlist", accent: "from-emerald-300 to-lime-300" },
  { labelKey: "navReports", href: "/reports", accent: "from-fuchsia-300 to-violet-300" },
  { labelKey: "navContact", href: "/contact", accent: "from-emerald-300 to-cyan-300" },
  { labelKey: "navAgents", href: "/agents", accent: "from-slate-300 to-cyan-300" },
];

const COLLAPSE_KEY = "cma-sidebar-collapsed";

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    });
  }, []);

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

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] transition-transform duration-150 lg:static lg:z-auto lg:translate-x-0 ${
          collapsed ? "lg:w-16" : "lg:w-56"
        } w-56 shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-14 shrink-0 items-center gap-2 border-b border-[var(--cma-border-soft)] px-3">
          <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="CMA Markets">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-[var(--cma-border-soft)] bg-white">
              <Image src="/brand/cma-monogram-transparent.png" alt="CMA" width={355} height={144} priority className="h-6 w-full object-contain" />
            </span>
            {!collapsed ? (
              <span className="text-sm font-semibold text-[var(--cma-text-primary)]">CMA Markets</span>
            ) : null}
          </Link>
        </div>

        <nav aria-label="Primary navigation" className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.labelKey}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? t(item.labelKey) : undefined}
                className={`group relative mb-1 flex items-center gap-3 overflow-hidden rounded-lg border px-2.5 py-2.5 text-sm transition ${
                  isActive
                    ? "border-cyan-300/25 bg-cyan-300/14 text-[var(--cma-accent-cyan)] shadow-lg shadow-cyan-950/20"
                    : "border-transparent text-[var(--cma-text-secondary)] hover:border-[var(--cma-border-soft)] hover:bg-[var(--cma-bg-elevated)] hover:text-[var(--cma-text-primary)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-7 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${item.accent} ${
                    isActive ? "opacity-100" : "opacity-55 group-hover:opacity-90"
                  }`}
                />
                {!collapsed ? (
                  <span className="truncate font-medium">
                    {t(item.labelKey)}
                    {item.labelKey === "navWatchlist" && watchlistCount > 0 ? (
                      <span className="ml-1.5 rounded-full border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-xs text-[var(--cma-text-muted)]">
                        {watchlistCount}
                      </span>
                    ) : null}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className={`shrink-0 border-t border-[var(--cma-border-soft)] p-3 ${collapsed ? "space-y-2" : "space-y-2"}`}>
          <AuthNavigation collapsed={collapsed} onNavigate={onCloseMobile} />
          {!collapsed ? (
            <div className="flex flex-col gap-2">
              <AppearanceToggle />
              <LanguageSwitcher />
            </div>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden w-full rounded-md border border-[var(--cma-border-soft)] py-1.5 text-xs font-medium text-[var(--cma-text-muted)] hover:text-[var(--cma-text-primary)] lg:block"
          >
            {collapsed ? "»" : "« collapse"}
          </button>
        </div>
      </aside>
    </>
  );
}
