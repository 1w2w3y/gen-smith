"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { type Locale, type TranslationKey, getTranslation } from "@/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);
const localeListeners = new Set<() => void>();

function detectLocale(): Locale {
  // Check localStorage first
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("locale");
    if (stored === "en" || stored === "zh") return stored;

    // Auto-detect from browser
    const browserLang = navigator.language || "";
    if (browserLang.startsWith("zh")) return "zh";
  }
  return "en";
}

function subscribeToLocale(callback: () => void) {
  localeListeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    localeListeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

function getServerLocale(): Locale {
  return "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocale,
    detectLocale,
    getServerLocale
  );

  const setLocale = useCallback((newLocale: Locale) => {
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
    localeListeners.forEach((listener) => listener());
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(locale)(key),
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
