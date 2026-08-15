import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations } from "./translations.js";

const LanguageContext = createContext(null);

const STORAGE_KEY = "trisak-lang";

function getInitialLang() {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "th" || saved === "en") return saved;
  return "en";
}

/** Look up a dot-path like "nav.home" inside a translations object. */
function resolve(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLang);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "th" : "en"));
  }, []);

  const t = useCallback(
    (path) => {
      const value = resolve(translations[lang], path);
      if (value === undefined) {
        // fall back to English, then to the raw key, so a missing
        // translation never breaks the page
        const fallback = resolve(translations.en, path);
        return fallback !== undefined ? fallback : path;
      }
      return value;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
