"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppearanceMode = "dark" | "light";

type ThemeContextValue = {
  mode: AppearanceMode;
  resolvedMode: "dark" | "light";
  setMode: (mode: AppearanceMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppearanceMode>("dark");
  const resolvedMode = mode;

  useEffect(() => {
    queueMicrotask(() => {
      const saved = window.localStorage.getItem("cma-appearance-mode") as AppearanceMode | null;
      const nextMode = saved === "light" || saved === "dark" ? saved : "dark";
      setModeState(nextMode);
      document.documentElement.dataset.theme = nextMode;
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedMode;
  }, [resolvedMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      setMode: (nextMode) => {
        setModeState(nextMode);
        window.localStorage.setItem("cma-appearance-mode", nextMode);
      },
    }),
    [mode, resolvedMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return context;
}
