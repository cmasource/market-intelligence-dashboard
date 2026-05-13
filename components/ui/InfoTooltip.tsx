"use client";

import { useId, useState } from "react";
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
  const tooltipId = useId();

  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button
        type="button"
        aria-label={title}
        aria-describedby={tooltipId}
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-cyan-300/45 bg-cyan-300/10 text-[11px] font-semibold leading-none text-cyan-100 outline-none transition hover:bg-cyan-300/20 focus:ring-2 focus:ring-cyan-300/50"
      >
        <span aria-hidden="true" className="translate-y-[-0.5px] font-serif italic">
          i
        </span>
      </button>
      {open ? (
        <span
          id={tooltipId}
          role="tooltip"
          className="absolute left-0 top-6 z-50 w-[min(18rem,80vw)] rounded-lg border border-cyan-300/25 bg-slate-950 p-3 text-left normal-case tracking-normal text-slate-200 shadow-2xl shadow-black/30"
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
