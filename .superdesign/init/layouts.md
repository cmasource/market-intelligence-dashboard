# Layouts

The shared dashboard layout is `AppShell`; it owns the fixed/collapsible sidebar, sticky market ticker header, responsive main width, and footer.

```tsx
"use client";

import { useState } from "react";
import { AppHeader } from "./AppHeader";
import { AppFooter } from "./AppFooter";
import { Sidebar } from "./Sidebar";
import { useTheme } from "@/lib/theme/useTheme";

type AppShellProps = {
  children: React.ReactNode;
  width?: "dashboard" | "asset" | "report";
  background?: "market" | "report" | "argentina";
};

const widthClasses = {
  dashboard: "max-w-[1400px]",
  asset: "max-w-[1360px]",
  report: "max-w-[1100px]",
};

export function AppShell({ children, width = "dashboard" }: AppShellProps) {
  const { resolvedMode } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="cma-shell flex" data-app-theme={resolvedMode}>
      <Sidebar mobileOpen={mobileNavOpen} onCloseMobile={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className={`mx-auto w-full flex-1 ${widthClasses[width]} px-4 py-5 sm:px-6 lg:px-7 lg:py-7`}>{children}</main>
        <AppFooter />
      </div>
    </div>
  );
}
```

Nested sources used without altering their public contract:

- `components/layout/Sidebar.tsx`: 14.5rem expanded / 4rem collapsed; CMA monogram; navigation; account; dark/light; EN/ES.
- `components/layout/AppHeader.tsx`: 3rem sticky header containing mobile menu and `MarketTicker`.
- `components/layout/AppFooter.tsx`: CMA branding, legal disclaimer, secondary navigation.

Radar layout: `<AppShell><div className="space-y-6 py-4 sm:py-6">...</div></AppShell>`.
