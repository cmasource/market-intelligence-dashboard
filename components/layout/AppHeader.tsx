"use client";

import { MarketTicker } from "./MarketTicker";

type AppHeaderProps = {
  onOpenMobileNav: () => void;
};

export function AppHeader({ onOpenMobileNav }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-3 border-b border-emerald-300/15 bg-[#07110f] px-4">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-emerald-300/20 text-emerald-200 lg:hidden"
      >
        <span className="flex h-3.5 w-4 flex-col justify-between" aria-hidden="true">
          <span className="h-0.5 rounded-full bg-current" />
          <span className="h-0.5 rounded-full bg-current" />
          <span className="h-0.5 rounded-full bg-current" />
        </span>
      </button>
      <MarketTicker />
    </header>
  );
}
