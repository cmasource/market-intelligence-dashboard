"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BarChart3,
  BellRing,
  Bitcoin,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Contact,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Landmark,
  Newspaper,
  Radar,
  Repeat2,
  ScanSearch,
} from "lucide-react";
import { AuthNavigation } from "@/components/auth/AuthNavigation";
import { useLanguage } from "@/lib/i18n/useLanguage";
import { getWatchlistCountAsync, setWatchlistUser, WATCHLIST_UPDATED_EVENT } from "@/lib/watchlist";
import { ALERTS_UPDATED_EVENT, getUnreadAlertCount } from "@/lib/alerts/client";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { AppearanceToggle } from "./AppearanceToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const navItems = [
  { labelKey: "navDashboard", href: "/", icon: LayoutDashboard },
  { labelKey: "navMarkets", href: "/markets", icon: LineChart },
  { labelKey: "navUSA", href: "/usa", icon: BarChart3 },
  { labelKey: "navTradeRadar", href: "/trade-radar", icon: Radar },
  { labelKey: "navArbitrageRadar", href: "/radar-arbitraje", icon: Repeat2 },
  { labelKey: "navArgentina", href: "/argentina", icon: CircleDollarSign },
  { labelKey: "navCrypto", href: "/crypto", icon: Bitcoin },
  { labelKey: "navWatchlist", href: "/watchlist", icon: ListChecks },
  { labelKey: "navAlerts", href: "/alerts", icon: BellRing },
  { labelKey: "navReports", href: "/reports", icon: ScanSearch },
  { labelKey: "navContact", href: "/contact", icon: Contact },
];

const reportItems = [
  { href: "/reports#news", es: "Noticias", en: "News", icon: Newspaper },
  { href: "/reports#earnings", es: "Calendario de balances", en: "Earnings calendar", icon: CalendarDays },
  { href: "/reports#bonds", es: "Analisis de bonos", en: "Bond analysis", icon: Landmark },
  { href: "/reports#calculators", es: "Calculadoras", en: "Calculators", icon: Calculator },
];

const COLLAPSE_KEY = "cma-sidebar-collapsed";

type SidebarProps = {
  mobileOpen: boolean;
  onCloseMobile: () => void;
};

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { language, t } = useLanguage();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [reportsOpen, setReportsOpen] = useState(pathname.startsWith("/reports"));

  useEffect(() => {
    queueMicrotask(() => setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1"));
  }, []);

  useEffect(() => {
    if (!getSupabaseConfig()) {
      setWatchlistUser(null);
      queueMicrotask(() => {
        setAuthenticated(false);
        setAuthResolved(true);
      });
      return;
    }

    const supabase = createClient();
    const applyUser = (userId: string | null) => {
      setWatchlistUser(userId);
      setAuthenticated(Boolean(userId));
      setAuthResolved(true);
      if (!userId) {
        setAlertCount(0);
        setWatchlistCount(0);
        return;
      }
      void getUnreadAlertCount().then(setAlertCount).catch(() => setAlertCount(0));
      void getWatchlistCountAsync().then(setWatchlistCount).catch(() => setWatchlistCount(0));
    };

    void supabase.auth.getUser().then(({ data }) => applyUser(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user?.id ?? null));
    return () => {
      data.subscription.unsubscribe();
      setWatchlistUser(null);
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      if (!authResolved || !authenticated) {
        setWatchlistCount(0);
        return;
      }
      void getWatchlistCountAsync().then(setWatchlistCount).catch(() => setWatchlistCount(0));
    };
    queueMicrotask(sync);
    window.addEventListener(WATCHLIST_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WATCHLIST_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [authenticated, authResolved]);

  useEffect(() => {
    if (!authenticated) return;
    const sync = () => { void getUnreadAlertCount().then(setAlertCount).catch(() => setAlertCount(0)); };
    window.addEventListener(ALERTS_UPDATED_EVENT, sync);
    return () => window.removeEventListener(ALERTS_UPDATED_EVENT, sync);
  }, [authenticated]);

  function toggleCollapsed() {
    setCollapsed((previous) => {
      const next = !previous;
      window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/55 lg:hidden" onClick={onCloseMobile} aria-hidden="true" />
      ) : null}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full flex-col border-r border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] transition-[width,transform] duration-150 lg:static lg:z-auto lg:translate-x-0 ${
          collapsed ? "lg:w-16" : "lg:w-[14.5rem]"
        } w-[14.5rem] shrink-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[4.5rem] shrink-0 items-center border-b border-[var(--cma-border-soft)] px-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="CMA Markets">
            <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-md border border-[var(--cma-border-soft)] bg-white">
              <Image src="/brand/cma-monogram-transparent.png" alt="CMA" width={355} height={144} priority className="h-6 w-full object-contain" />
            </span>
            {!collapsed ? (
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--cma-text-primary)]">CMA Markets</span>
                <span className="block text-[10px] font-medium text-[var(--cma-text-muted)]">Market intelligence</span>
              </span>
            ) : null}
          </Link>
        </div>

        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-2 py-3">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const Icon = item.icon;
            if (item.labelKey === "navReports" && !collapsed) {
              return (
                <div key={item.labelKey} className="mb-1">
                  <button
                    type="button"
                    onClick={() => setReportsOpen((open) => !open)}
                    aria-expanded={reportsOpen}
                    aria-controls="reports-submenu"
                    className={`group flex min-h-10 w-full items-center gap-3 rounded-md border px-3 py-2 text-left text-sm transition ${isActive ? "border-[var(--cma-border-strong)] bg-[color-mix(in_srgb,var(--cma-accent-cyan)_14%,transparent)] text-[var(--cma-text-primary)]" : "border-transparent text-[var(--cma-text-secondary)] hover:border-[var(--cma-border-soft)] hover:bg-[var(--cma-bg-elevated)] hover:text-[var(--cma-text-primary)]"}`}
                  >
                    <Icon aria-hidden="true" size={17} className={isActive ? "text-[var(--cma-accent-cyan)]" : "text-[var(--cma-text-muted)]"} />
                    <span className="min-w-0 flex-1 truncate font-medium">{t(item.labelKey)}</span>
                    <ChevronDown size={15} aria-hidden="true" className={`text-[var(--cma-text-muted)] transition-transform ${reportsOpen ? "rotate-180" : ""}`} />
                  </button>
                  {reportsOpen ? (
                    <div id="reports-submenu" className="ml-5 mt-1 border-l border-[var(--cma-border-soft)] pl-2">
                      {reportItems.map((report) => {
                        const ReportIcon = report.icon;
                        return (
                          <Link key={report.href} href={report.href} onClick={() => { window.dispatchEvent(new CustomEvent("cma-report-view", { detail: report.href.split("#")[1] })); onCloseMobile(); }} className="flex min-h-9 items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--cma-text-muted)] transition hover:bg-[var(--cma-bg-elevated)] hover:text-[var(--cma-text-primary)]">
                            <ReportIcon size={14} aria-hidden="true" />
                            <span>{language === "es" ? report.es : report.en}</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            }
            return (
              <Link
                key={item.labelKey}
                href={item.href}
                onClick={onCloseMobile}
                title={collapsed ? t(item.labelKey) : undefined}
                className={`group mb-1 flex min-h-10 items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
                  isActive
                    ? "border-[var(--cma-border-strong)] bg-[color-mix(in_srgb,var(--cma-accent-cyan)_14%,transparent)] text-[var(--cma-text-primary)]"
                    : "border-transparent text-[var(--cma-text-secondary)] hover:border-[var(--cma-border-soft)] hover:bg-[var(--cma-bg-elevated)] hover:text-[var(--cma-text-primary)]"
                }`}
              >
                <Icon aria-hidden="true" size={17} strokeWidth={isActive ? 2 : 1.7} className={isActive ? "text-[var(--cma-accent-cyan)]" : "text-[var(--cma-text-muted)]"} />
                {collapsed && item.labelKey === "navAlerts" && alertCount > 0 ? <span aria-label={`${alertCount} ${t("navAlerts")}`} className="rounded-full bg-cyan-300 px-1 text-[9px] font-bold text-slate-950">{Math.min(alertCount, 99)}</span> : null}
                {!collapsed ? (
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {t(item.labelKey)}
                    {item.labelKey === "navWatchlist" && watchlistCount > 0 ? (
                      <span data-testid="watchlist-count" className="ml-1.5 rounded-full border border-[var(--cma-border-soft)] px-1.5 py-0.5 text-[10px] text-[var(--cma-text-muted)]">
                        {watchlistCount}
                      </span>
                    ) : null}
                    {item.labelKey === "navAlerts" && alertCount > 0 ? (
                      <span aria-live="polite" className="ml-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] text-cyan-100">{Math.min(alertCount, 99)}</span>
                    ) : null}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="shrink-0 space-y-2 border-t border-[var(--cma-border-soft)] p-3">
          <AuthNavigation authenticated={authenticated} collapsed={collapsed} onNavigate={onCloseMobile} />
          {!collapsed ? (
            <div className="flex flex-col gap-2">
              <AppearanceToggle />
              <LanguageSwitcher />
            </div>
          ) : null}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expandir navegación" : "Contraer navegación"}
            className="hidden w-full items-center justify-center gap-2 rounded-md border border-[var(--cma-border-soft)] py-1.5 text-xs font-medium text-[var(--cma-text-muted)] transition hover:text-[var(--cma-text-primary)] lg:flex"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            {!collapsed ? "Contraer" : null}
          </button>
        </div>
      </aside>
    </>
  );
}
