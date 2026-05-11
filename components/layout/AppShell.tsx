"use client";

import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { useTheme } from "@/lib/theme/useTheme";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";

  return (
    <div className={`min-h-screen ${isLight ? "bg-slate-50 text-slate-950" : "bg-slate-950 text-slate-100"}`} data-app-theme={resolvedMode}>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className={
            isLight
              ? "absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.16),transparent_24%,rgba(248,250,252,0.96)_48%,rgba(139,92,246,0.12)_74%,transparent_100%),linear-gradient(180deg,#f8fafc_0%,#dbeafe_52%,#f8fafc_100%)]"
              : "absolute inset-0 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),transparent_24%,rgba(15,23,42,0.9)_48%,rgba(139,92,246,0.14)_74%,transparent_100%),linear-gradient(180deg,#020617_0%,#0f172a_46%,#020617_100%)]"
          }
        />
        <div
          className={`absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] ${
            isLight ? "opacity-70 mix-blend-multiply" : "opacity-40"
          }`}
        />
      </div>
      <AppHeader />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      <AppFooter />
    </div>
  );
}
