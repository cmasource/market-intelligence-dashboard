"use client";

import type { Language } from "@/lib/i18n/types";
import { useLanguage } from "@/lib/i18n/useLanguage";

const languages: Language[] = ["en", "es"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-0.5">
      {languages.map((option) => {
        const active = language === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            className={
              active
                ? "rounded bg-[var(--cma-accent-cyan)] px-2.5 py-1 text-xs font-semibold text-[#0b0f14]"
                : "rounded px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:text-white"
            }
            aria-pressed={active}
          >
            {option.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
