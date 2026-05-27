"use client";

import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { useTheme } from "@/lib/theme/useTheme";

type AppShellProps = {
  children: React.ReactNode;
  width?: "dashboard" | "asset" | "report";
  background?: "market" | "report" | "argentina";
};

const widthClasses = {
  dashboard: "max-w-[1520px]",
  asset: "max-w-[1480px]",
  report: "max-w-[1240px]",
};

export function AppShell({ children, width = "dashboard", background = "market" }: AppShellProps) {
  const { resolvedMode } = useTheme();
  const isLight = resolvedMode === "light";
  const backgroundClass = background === "report" ? "cma-shell" : background === "argentina" ? "cma-shell cma-market-background" : "cma-shell cma-market-background";

  return (
    <div className={backgroundClass} data-app-theme={resolvedMode}>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className={
            isLight
              ? "absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(8,145,178,0.2),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(124,58,237,0.13),transparent_26%)]"
              : "absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(34,211,238,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(139,92,246,0.16),transparent_26%)]"
          }
        />
        <div
          className={`absolute inset-0 cma-terminal-grid ${
            isLight ? "opacity-70 mix-blend-multiply" : "opacity-40"
          }`}
        />
      </div>
      <AppHeader />
      <main className={`mx-auto w-full ${widthClasses[width]} px-4 py-6 sm:px-6 lg:px-10`}>{children}</main>
      <AppFooter />
    </div>
  );
}
