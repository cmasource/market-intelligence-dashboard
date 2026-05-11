"use client";

import type { Language } from "@/lib/i18n/types";
import { useLanguage } from "@/lib/i18n/useLanguage";

const languages: Language[] = ["en", "es"];

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex rounded-full border border-white/10 bg-white/[0.045] p-1">
      {languages.map((option) => {
        const active = language === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setLanguage(option)}
            className={
              active
                ? "rounded-full bg-cyan-300 px-2.5 py-1 text-xs font-semibold text-slate-950 shadow-lg shadow-cyan-950/30"
                : "rounded-full px-2.5 py-1 text-xs font-semibold text-slate-400 transition hover:text-white"
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
