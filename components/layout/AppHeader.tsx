"use client";

import { Menu } from "lucide-react";
import { MarketTicker } from "./MarketTicker";

type AppHeaderProps = {
  onOpenMobileNav: () => void;
};

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  return (
    <header className="cma-app-header sticky top-0 z-20 flex shrink-0 items-center gap-3 border-b border-[var(--cma-border-soft)] bg-[color-mix(in_srgb,var(--cma-bg-base)_94%,transparent)] px-3 backdrop-blur-xl sm:px-4">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Abrir navegación"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[var(--cma-border-soft)] text-[var(--cma-text-secondary)] transition hover:border-[var(--cma-border-strong)] hover:text-[var(--cma-text-primary)] lg:hidden"
      >
        <Menu aria-hidden="true" size={17} strokeWidth={1.8} />
      </button>
      <MarketTicker />
    </header>
  );
}
