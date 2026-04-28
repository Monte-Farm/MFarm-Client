import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import translationSP from "./locales/sp.json";
import translationENG from "./locales/en.json";
import translationPT from "./locales/pt.json";

const resources = {
  sp: {
    translation: translationSP,
  },
  en: {
    translation: translationENG,
  },
  pt: {
    translation: translationPT,
  },
};

const SUPPORTED = ["sp", "en", "pt"] as const;

const mapBrowserLang = (lng?: string): string => {
  if (!lng) return "sp";
  const lower = lng.toLowerCase();
  if (lower.startsWith("pt")) return "pt";
  if (lower.startsWith("en")) return "en";
  if (lower.startsWith("es")) return "sp";
  return "sp";
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: SUPPORTED as unknown as string[],
    fallbackLng: "sp",
    keySeparator: ".",
    nsSeparator: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "I18N_LANGUAGE",
      caches: ["localStorage"],
      convertDetectedLanguage: mapBrowserLang,
    },
  });

export default i18n;
