import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function OrderLookupHeader({ step, email }) {
  const { t } = useLanguage();
  const stepConfig = {
    1: { icon: "fa-envelope", title: t("lookup.title"), sub: t("lookup.email_sub") },
    2: { icon: "fa-lock", title: t("lookup.otp_title"), sub: t("lookup.otp_sub") },
    3: { icon: "fa-box-open", title: t("lookup.orders_title"), sub: t("lookup.orders_sub").replace("{email}", email) },
    4: { icon: "fa-rotate-left", title: t("lookup.return_title"), sub: t("lookup.return_sub") },
  };

  const currentStep = stepConfig[step];

  return (
    <div className="bg-violet-600 p-4 sm:p-6 text-center text-white">
      <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mb-2 sm:mb-3">
        <i className={`fa-solid ${currentStep.icon} text-xl sm:text-2xl`}></i>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold leading-tight">{currentStep.title}</h2>
      <p className="text-violet-100 text-xs sm:text-sm mt-1 truncate px-2">{currentStep.sub}</p>
    </div>
  );
}
