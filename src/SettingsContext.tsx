import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Locale, Theme, Translator } from "./localization";
import { translator } from "./localization";

export const PREFERENCES_KEY = "alote-shauk.preferences.v1";
type Preferences = { language: Locale; theme: Theme };
function readPreferences(): Preferences {
  try {
    const saved = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || "{}");
    return {
      language: saved.language === "en" ? "en" : "my",
      theme: ["light", "dark", "system"].includes(saved.theme)
        ? saved.theme
        : "system",
    };
  } catch {
    return { language: "my", theme: "system" };
  }
}

const SettingsContext = createContext<{
  language: Locale;
  theme: Theme;
  resolvedTheme: "light" | "dark";
  t: Translator;
  setLanguage: (language: Locale) => void;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState(readPreferences);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches,
  );
  const resolvedTheme =
    preferences.theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : preferences.theme;
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const change = () => setSystemDark(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    document.documentElement.lang = preferences.language;
    document.documentElement.dataset.theme = resolvedTheme;
    document.title =
      preferences.language === "en"
        ? "အလုပ်လျှောက် — CV Builder"
        : "အလုပ်လျှောက် — ကိုယ်ရေးအကျဉ်း ဖန်တီးရန်";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute(
        "content",
        resolvedTheme === "dark" ? "#17241d" : "#244b40",
      );
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    } catch {
      /* Memory preferences still work. */
    }
  }, [preferences, resolvedTheme]);
  const value = useMemo(
    () => ({
      ...preferences,
      resolvedTheme,
      t: translator(preferences.language),
      setLanguage: (language: Locale) =>
        setPreferences((previous) => ({ ...previous, language })),
      setTheme: (theme: Theme) =>
        setPreferences((previous) => ({ ...previous, theme })),
    }),
    [preferences, resolvedTheme],
  );
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error("SettingsProvider is required");
  return settings;
}
