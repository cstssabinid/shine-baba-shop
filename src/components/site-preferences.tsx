"use client";

import { localeOptions } from "@/lib/i18n";
import { usePreferences } from "@/components/preferences-provider";
import { Icon } from "@/components/icons";

export function SitePreferences() {
  const { locale, theme, setLocale, toggleTheme, t } = usePreferences();

  return (
    <div className="site-preferences" role="group" aria-label={t("Display preferences")}>
      <label className="locale-control">
        <span className="sr-only">{t("Language")}</span>
        <select value={locale} onChange={(event) => setLocale(event.target.value as typeof locale)} aria-label={t("Language")}>
          {localeOptions.map((option) => <option key={option.code} value={option.code}>{option.label}</option>)}
        </select>
      </label>
      <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={theme === "light" ? t("Switch to dark mode") : t("Switch to light mode")} title={theme === "light" ? t("Switch to dark mode") : t("Switch to light mode")}>
        <Icon name={theme === "light" ? "moon" : "sun"} size={16} />
        <span>{theme === "light" ? t("Dark") : t("Light")}</span>
      </button>
    </div>
  );
}
