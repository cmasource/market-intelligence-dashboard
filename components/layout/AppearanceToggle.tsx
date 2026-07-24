"use client";

import { useTheme, type AppearanceMode } from "@/lib/theme/theme-provider";
import { useLanguage } from "@/lib/i18n/useLanguage";

const modes: AppearanceMode[] = ["dark", "light"];

export function AppearanceToggle() {
  const { mode, setMode } = useTheme();
  const { resolvedMode } = useTheme();
  const { language } = useLanguage();
  const isSpanish = language === "es";

  const labels: Record<AppearanceMode, string> = {
    dark: isSpanish ? "Oscuro" : "Dark",
    light: isSpanish ? "Claro" : "Light",
  };

  return (
    <div
      aria-label={isSpanish ? "Modo de apariencia" : "Appearance mode"}
      data-theme-mode={resolvedMode}
      className="flex rounded-md border border-[var(--cma-border-soft)] bg-[var(--cma-bg-panel)] p-0.5"
    >
      {modes.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setMode(item)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition ${
            mode === item ? "bg-[var(--cma-border-strong)] text-[var(--cma-accent-cyan)]" : "text-slate-400 hover:text-white"
          }`}
        >
          {labels[item]}
        </button>
      ))}
    </div>
  );
}
