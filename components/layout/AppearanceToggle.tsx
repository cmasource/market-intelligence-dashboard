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
      className="flex rounded-full border border-white/10 bg-slate-950/65 p-1"
    >
      {modes.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setMode(item)}
          className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
            mode === item ? "bg-cyan-300/20 text-cyan-100" : "text-slate-400 hover:text-white"
          }`}
        >
          {labels[item]}
        </button>
      ))}
    </div>
  );
}
