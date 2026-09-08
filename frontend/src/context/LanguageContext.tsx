import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations, TranslationKey } from "../locales/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
  getLocalizedText: (item: any, fieldName?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("language");
    if (saved === "vi" || saved === "en") return saved;
    return "vi";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const dict = translations[language];
    if (dict && (key in dict)) {
      return (dict as any)[key];
    }
    return fallback || key;
  };

  /**
   * Helper to resolve localized product/category names.
   * Checks item[`${field}_${lang}`] first, e.g. item.name_vi or item.name_en,
   * before falling back to item[field] (e.g. item.name).
   */
  const getLocalizedText = (item: any, fieldName: string = "name"): string => {
    if (!item) return "";
    const langField = `${fieldName}_${language}`;
    if (item[langField]) return item[langField];
    return item[fieldName] || "";
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedText }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
