"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type Locale, type Theme } from "@/lib/i18n";

const STORAGE_KEY = "shine-baba-shop-preferences-v1";

type Preferences = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  toggleTheme: () => void;
  t: (phrase: string) => string;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { locale?: Locale; theme?: Theme };
        if (parsed.locale === "en" || parsed.locale === "fr" || parsed.locale === "rw") setLocaleState(parsed.locale);
        if (parsed.theme === "light" || parsed.theme === "dark") setTheme(parsed.theme);
      }
    } catch {
      // Keep the accessible defaults if local storage is unavailable or invalid.
    }
    setReady(true);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
  }, [locale, theme]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, theme }));
    } catch {
      // Preferences still apply for the current session if storage is unavailable.
    }
  }, [locale, theme, ready]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const toggleTheme = useCallback(() => setTheme((current) => current === "light" ? "dark" : "light"), []);
  const value = useMemo(() => ({ locale, theme, setLocale, toggleTheme, t: (phrase: string) => translate(locale, phrase) }), [locale, theme, setLocale, toggleTheme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const preferences = useContext(PreferencesContext);
  if (!preferences) throw new Error("usePreferences must be used within PreferencesProvider");
  return preferences;
}
