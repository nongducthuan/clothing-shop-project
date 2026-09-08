import React from "react";
import { Zap, Star, Gift, Crown, Check } from "lucide-react";
import { NEW_CUSTOMER_BENEFITS, VIP_BENEFITS, DISCOUNT_CODE } from "./salesPolicyData";
import { useLanguage } from "../../../context/LanguageContext";

export default function PolicyOffers({ state, actions }) {
  const { activeTab } = state;
  const { setActiveTab, handleShopNow, handleContactSupport } = actions;
  const { t, language } = useLanguage();

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden">

      {/* TABS HEADER */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab("new")}
          className={`flex-1 py-6 font-medium flex items-center justify-center gap-2 border-0 transition-colors text-sm sm:text-base cursor-pointer ${
            activeTab === "new"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent"
          }`}
        >
          <Zap size={20} className={activeTab === "new" ? "text-amber-500" : ""} />
          {t("policy.tab_new", "New Customers")}
        </button>
        <button
          onClick={() => setActiveTab("vip")}
          className={`flex-1 py-6 font-medium flex items-center justify-center gap-2 border-0 transition-colors text-sm sm:text-base cursor-pointer ${
            activeTab === "vip"
              ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-b-2 border-slate-900 dark:border-slate-100"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-transparent"
          }`}
        >
          <Star size={20} className={activeTab === "vip" ? "text-violet-500" : ""} />
          {t("policy.tab_vip", "Loyal Members")}
        </button>
      </div>

      {/* TABS CONTENT */}
      <div className="p-8 sm:p-12 bg-white dark:bg-slate-900">
        {activeTab === "new" ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-2">
              {t("policy.welcome_title", "Welcome offer for new friends")} <Gift size={24} className="text-amber-500" />
            </h2>
            <div className="grid md:grid-cols-2 gap-10">
              <ul className="space-y-5 p-0 list-none">
                {NEW_CUSTOMER_BENEFITS.map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-full flex-shrink-0">
                      <Zap size={16} />
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                      {typeof item === "string" ? item : (item[language] || item.en)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="bg-slate-900 dark:bg-slate-800 rounded-[2rem] p-8 text-white flex flex-col justify-center items-center text-center shadow-lg border border-slate-800 dark:border-slate-700">
                <p className="text-xs text-slate-400 mb-3 uppercase tracking-widest font-bold">
                  {t("policy.discount_code_label", "Discount Code")}
                </p>
                <h3 className="text-3xl sm:text-4xl font-bold text-white mb-3 tracking-tight">
                  {DISCOUNT_CODE}
                </h3>
                <p className="text-sm text-slate-400">
                  {t("policy.apply_checkout", "Apply at checkout step")}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-2xl font-medium text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-2">
              {t("policy.vip_title", "VIP Member Privileges")} <Crown size={24} className="text-violet-500" />
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-700">
              <ul className="grid md:grid-cols-2 gap-6 p-0 list-none">
                {VIP_BENEFITS.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-300">
                    <Check size={18} className="text-violet-500 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">
                      {typeof item === "string" ? item : (item[language] || item.en)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* CALL TO ACTIONS */}
        <div className="mt-12 pt-12 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleShopNow}
            className="px-10 py-4 bg-slate-900 dark:bg-violet-600 text-white font-medium rounded-full hover:bg-slate-800 dark:hover:bg-violet-700 transition-all active:scale-95 border-0 cursor-pointer"
          >
            {t("policy.shop_now_btn", "Shop Now")}
          </button>
          <button
            onClick={handleContactSupport}
            className="px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-full hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {t("policy.contact_support_btn", "Contact Support")}
          </button>
        </div>
      </div>
    </div>
  );
}

