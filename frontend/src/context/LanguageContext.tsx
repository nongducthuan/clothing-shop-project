import React, { createContext, useContext, useEffect, useState } from "react";
import { Language, translations, TranslationKey } from "../locales/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
  getLocalizedText: (item: any, fieldName?: string) => string;
  getLocalizedLabel: (type: LabelType, value?: string | null) => string;
  getOrderStatusLabel: (status?: string | null) => string;
  getReturnStatusLabel: (status?: string | null) => string;
  getReturnReasonLabel: (reason?: string | null) => string;
}

export type LabelType = "orderStatus" | "returnStatus" | "returnReason";

/**
 * Bang map tap trung: enum code -> translation key.
 * Them status/reason moi chi can them 1 dong o day.
 * Tach theo type de tranh trung ma (vd: "Pending" vua la OrderStatus
 * vua la ReturnStatus nhung nghia khac nhau).
 */
const LABEL_MAPS: Record<LabelType, Record<string, string>> = {
  orderStatus: {
    Pending: "order_status.pending",
    Confirmed: "order_status.confirmed",
    Shipping: "order_status.shipping",
    Delivered: "order_status.delivered",
    Cancelled: "order_status.cancelled",
  },
  returnStatus: {
    Pending: "order_status.return_pending",
    Approved: "order_status.return_approved",
    Rejected: "order_status.return_rejected",
  },
  returnReason: {
    "Damaged": "return_reason.damaged",
    "Wrong item": "return_reason.wrong_item",
    "Change mind": "return_reason.change_mind",
    "Change of mind": "return_reason.change_mind",
    "Not as described": "return_reason.not_as_described",
    "Other": "return_reason.other",
  },
};

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
   * Checks item[`${field}_${lang}`] first, e.g. item.name_vi or item.name_en.
   * Falls back to the other language variant if the current one is empty.
   */
  const getLocalizedText = (item: any, fieldName: string = "name"): string => {
    if (!item) return "";
    const langField = `${fieldName}_${language}`;
    if (item[langField]) return item[langField];
    // Fallback to the other language (vi <-> en)
    const otherLang = language === "vi" ? "en" : "vi";
    const otherLangField = `${fieldName}_${otherLang}`;
    return item[otherLangField] || item[fieldName] || "";
  };

  /**
   * Ham chung duy nhat de dich cac ma enum co dinh (vi/en theo ngon ngu dang chon).
   * Dung: getLocalizedLabel("orderStatus", status)
   *       getLocalizedLabel("returnStatus", status)
   *       getLocalizedLabel("returnReason", reason)
   * Fallback: tra ve gia tri goc neu chua co map.
   */
  const getLocalizedLabel = (type: LabelType, value?: string | null): string => {
    if (!value) return "";
    const key = LABEL_MAPS[type]?.[value];
    return key ? t(key, value) : value;
  };

  /** Wrapper giu tuong thich nguoc — goi lai getLocalizedLabel. */
  const getOrderStatusLabel = (status?: string | null): string =>
    getLocalizedLabel("orderStatus", status);

  /** Wrapper giu tuong thich nguoc — goi lai getLocalizedLabel. */
  const getReturnStatusLabel = (status?: string | null): string =>
    getLocalizedLabel("returnStatus", status);

  /** Wrapper giu tuong thich nguoc — goi lai getLocalizedLabel. */
  const getReturnReasonLabel = (reason?: string | null): string =>
    getLocalizedLabel("returnReason", reason);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedText, getLocalizedLabel, getOrderStatusLabel, getReturnStatusLabel, getReturnReasonLabel }}>
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
