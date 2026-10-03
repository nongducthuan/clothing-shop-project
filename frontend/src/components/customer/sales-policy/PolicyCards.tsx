import React from "react";
import { POLICIES } from "./salesPolicyData";
import { useLanguage } from "../../../context/LanguageContext";

export default function PolicyCards() {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
      {POLICIES.map((policy, idx) => {
        const Icon = policy.icon;
        return (
          <div
            key={idx}
            className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors flex flex-col items-start"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${policy.styleClass}`}>
              <Icon size={28} strokeWidth={1.5} />
            </div>
            <h3 className="font-medium text-xl text-slate-900 dark:text-slate-100 mb-3">
              {t(policy.titleKey, policy.title)}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              {t(policy.descKey, policy.desc)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

