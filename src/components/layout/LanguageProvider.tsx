"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("locale", newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback(
    (key: TranslationKey) => getTranslation(locale)(key),
    [locale]
  );

  // Avoid hydration mismatch by rendering children only after mount
  if (!mounted) {
    return (
      <LanguageContext.Provider value={{ locale: "en", setLocale, t: getTranslation("en") }}>
        {children}
      </LanguageContext.Provider>
    );
  }

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
