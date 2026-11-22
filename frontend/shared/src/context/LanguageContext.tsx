import { createContext, useContext } from "react";
import { Language, TranslationKey } from "../locales/translations";

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
  getLocalizedText: (item: Record<string, unknown>, fieldName?: string) => string;
  getLocalizedLabel: (type: LabelType, value?: string | null) => string;
  getOrderStatusLabel: (status?: string | null) => string;
  getReturnStatusLabel: (status?: string | null) => string;
  getReturnReasonLabel: (reason?: string | null) => string;
  getLocalizedTierName: (tierName?: string | null) => string;
  translateApiMessage: (msg?: string | null) => string;
}

export type LabelType = "orderStatus" | "returnStatus" | "returnReason";

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
