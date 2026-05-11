"use client";

import { createContext, useEffect, useMemo, useRef, useState } from "react";
import { translate } from "./translations";
import type { Language, LanguageContextValue } from "./types";

const storageKey = "cma-market-intelligence-language";

export const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const userSelectedLanguage = useRef(false);

  useEffect(() => {
    const storedLanguage = window.localStorage.getItem(storageKey);

    if (storedLanguage === "en" || storedLanguage === "es") {
      window.setTimeout(() => {
        if (!userSelectedLanguage.current) setLanguageState(storedLanguage);
      }, 0);
      return;
    }

    const browserLanguage = window.navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
    window.localStorage.setItem(storageKey, browserLanguage);
    window.setTimeout(() => {
      if (!userSelectedLanguage.current) setLanguageState(browserLanguage);
    }, 0);
  }, []);

  const setLanguage = (nextLanguage: Language) => {
    userSelectedLanguage.current = true;
    setLanguageState(nextLanguage);
    window.localStorage.setItem(storageKey, nextLanguage);
  };

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, params) => translate(language, key, params),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
