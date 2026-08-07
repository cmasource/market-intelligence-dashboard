"use client";

import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";

type InfoTooltipProps = {
  title: string;
  description: string;
  formula?: string;
  caution?: string;
  children?: ReactNode;
};

export function InfoTooltip({ title, description, formula, caution, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ left: number; top: number; width: number; above: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();

  function openTooltip() {
    const button = buttonRef.current;
    if (button) {
      const rect = button.getBoundingClientRect();
      const width = Math.min(288, Math.max(160, window.innerWidth - 16));
      const left = Math.min(Math.max(8, rect.left + rect.width / 2 - width / 2), window.innerWidth - width - 8);
      const above = rect.bottom + 176 > window.innerHeight;
      setPosition({ left, top: above ? rect.top - 8 : rect.bottom + 8, width, above });
    }
    setOpen(true);
  }

  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        ref={buttonRef}
        aria-label={title}
        aria-describedby={tooltipId}
        onClick={openTooltip}
        onFocus={openTooltip}
        onBlur={() => setOpen(false)}
        onMouseEnter={openTooltip}
        onMouseLeave={() => setOpen(false)}
        className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-cyan-300/45 bg-cyan-300/10 p-0 text-[11px] font-semibold leading-none text-cyan-100 outline-none transition hover:bg-cyan-300/20 focus:ring-2 focus:ring-cyan-300/50"
      >
        <span aria-hidden="true" className="block font-sans text-[10px] font-bold leading-none">
          i
        </span>
      </button>
      {open && position ? (
        <span
          id={tooltipId}
          role="tooltip"
          style={{ left: position.left, top: position.top, width: position.width, transform: position.above ? "translateY(-100%)" : undefined }}
          className="fixed z-[120] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-lg border border-cyan-300/25 bg-slate-950 p-3 text-left normal-case tracking-normal text-slate-200 shadow-2xl shadow-black/30"
        >
          <span className="block text-sm font-semibold text-white">{title}</span>
          <span className="mt-1 block text-xs leading-5 text-slate-300">{description}</span>
          {formula ? <span className="mt-2 block rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-cyan-100">{formula}</span> : null}
          {caution ? <span className="mt-2 block text-[11px] leading-4 text-amber-100">{caution}</span> : null}
        </span>
      ) : null}
    </span>
  );
}
