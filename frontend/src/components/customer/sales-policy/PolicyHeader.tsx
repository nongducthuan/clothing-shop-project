import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function PolicyHeader() {
  const { t } = useLanguage();

  return (
    <div className="text-center mb-16">
      <h1 className="text-4xl sm:text-5xl font-medium text-slate-900 dark:text-slate-100 tracking-tight mb-4">
        {t("policy.header_title", "Sales Policy")}
      </h1>
      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
        {t("policy.header_subtitle", "We always strive to provide the best shopping experience with commitments to product quality and thoughtful after-sales service.")}
      </p>
    </div>
  );
}

