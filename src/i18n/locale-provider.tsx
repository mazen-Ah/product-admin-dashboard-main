"use client";

import { DEFAULT_LOCALE, type Locale, t, type MessageKey } from "@/i18n/messages";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { I18nProvider } from "react-aria-components";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  dir: "rtl" | "ltr";
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "app-locale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "ar" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const dir: "rtl" | "ltr" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
    root.classList.toggle("font-arabic", locale === "ar");
    root.classList.toggle("font-latin", locale === "en");
  }, [locale, dir]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      dir,
      t: (key: MessageKey) => t(locale, key),
    }),
    [locale, setLocale, dir],
  );

  return (
    <LocaleContext.Provider value={value}>
      <I18nProvider locale={locale === "ar" ? "ar-LY" : "en-US"}>{children}</I18nProvider>
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
