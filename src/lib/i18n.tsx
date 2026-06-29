import React, { createContext, useContext, useState, useEffect } from "react";
import { pt, TranslationType } from "../locales/pt";
import { en } from "../locales/en";

type Locale = "pt" | "en";

interface I18nContextType {
  locale: Locale;
  t: TranslationType;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("atlas_locale");
    if (saved === "en" || saved === "pt") {
      return saved as Locale;
    }
    // Default to Portuguese
    return "pt";
  });

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("atlas_locale", newLocale);
  };

  const t = locale === "en" ? en : pt;

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
};
