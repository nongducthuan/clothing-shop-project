import React from "react";
import SectionHeader from "./SectionHeader";
import { POLICIES } from "./homeData";
import { useLanguage } from "../../../context/LanguageContext";

export default function Policies() {
  const { t } = useLanguage();

  return (
    <section className="my-12 text-center" data-aos="fade-up">
      <SectionHeader title={t("home.policy_title", "Preferential Policy")} />
      <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {POLICIES.map((policy, idx) => {
          const Icon = policy.icon;
          return (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg p-6 flex flex-col items-center border border-slate-100 dark:border-slate-700 transition-colors">
              <div className={`w-12 h-12 rounded-2xl ${policy.color} flex items-center justify-center mb-3`}>
                <Icon className="w-6 h-6" />
              </div>
              <h5 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">{t(policy.titleKey, policy.title)}</h5>
              <p className="text-gray-600 dark:text-slate-300 text-sm">{t(policy.descKey, policy.desc)}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
