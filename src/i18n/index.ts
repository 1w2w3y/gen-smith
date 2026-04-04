import en from "./en";
import zh from "./zh";

export type Locale = "en" | "zh";
export type TranslationKey = keyof typeof en;

const translations: Record<Locale, Record<string, string>> = { en, zh };

export function getTranslation(locale: Locale) {
  const strings = translations[locale];
  return (key: TranslationKey): string => strings[key] || key;
}
