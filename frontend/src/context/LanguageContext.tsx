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
  getLocalizedTierName: (tierName?: string | null) => string;
  translateApiMessage: (msg?: string | null) => string;
}

export type LabelType = "orderStatus" | "returnStatus" | "returnReason";

const LABEL_MAPS: Record<LabelType, Record<string, string>> = {
  orderStatus: {
    Pending: "order_status.pending",
    Confirmed: "order_status.confirmed",
    Shipping: "order_status.shipping",
    Delivered: "order_status.delivered",
    Cancelled: "order_status.cancelled",
    "Return Requested": "order_status.return_requested",
    "Return_Requested": "order_status.return_requested",
    "Return Approved": "order_status.return_approved",
    "Return_Approved": "order_status.return_approved",
    "Return Rejected": "order_status.return_rejected",
    "Return_Rejected": "order_status.return_rejected",
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
    "Defective": "return_reason.defective",
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
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const dict = translations[language];
    if (dict && (key in dict)) {
      return (dict as any)[key];
    }
    const apiMsgKey = `api_msg.${key}`;
    if (dict && (apiMsgKey in dict)) {
      return (dict as any)[apiMsgKey];
    }
    return fallback || key;
  };

  const translateApiMessage = (msg?: string | null): string => {
    if (!msg) return "";
    return t(msg);
  };

  const getLocalizedText = (item: any, fieldName: string = "name"): string => {
    if (!item) return "";
    const langField = `${fieldName}_${language}`;
    if (item[langField]) return item[langField];
    const otherLang = language === "vi" ? "en" : "vi";
    const otherLangField = `${fieldName}_${otherLang}`;
    return item[otherLangField] || item[fieldName] || "";
  };

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

  /** Helper de dich ten tier thanh vien. */
  const getLocalizedTierName = (tierName?: string | null): string => {
    if (!tierName) return "";
    const key = `tier.${tierName.toLowerCase()}`;
    return t(key, tierName);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, getLocalizedText, getLocalizedLabel, getOrderStatusLabel, getReturnStatusLabel, getReturnReasonLabel, getLocalizedTierName, translateApiMessage }}>
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
