import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProfileTabs({ activeTab, setActiveTab }) {
  const { t } = useLanguage();

  return (
    <div className="flex justify-center mb-12">
      <div className="relative flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full w-full max-w-md select-none shadow-inner">
        <div className="absolute inset-y-1.5 left-1.5 right-1.5 pointer-events-none">
          <div
            className={`w-1/2 h-full bg-white dark:bg-slate-700 rounded-full shadow-sm transition-transform duration-300 ease-out ${
              activeTab === "orders" ? "translate-x-full" : "translate-x-0"
            }`}
          ></div>
        </div>

        <button
          onClick={() => setActiveTab("info")}
          style={{ WebkitTapHighlightColor: "transparent" }}
          className={`relative bg-transparent z-10 flex-1 flex justify-center items-center py-3 text-sm font-medium rounded-full transition-colors duration-300 outline-none ${
            activeTab === "info" ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <i className="fa-solid fa-user mr-2"></i> {t("profile.tab_profile", "Profile")}
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          style={{ WebkitTapHighlightColor: "transparent" }}
          className={`relative bg-transparent z-10 flex-1 flex justify-center items-center py-3 text-sm font-medium rounded-full transition-colors duration-300 outline-none ${
            activeTab === "orders" ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <i className="fa-solid fa-box mr-2"></i> {t("profile.tab_orders", "Orders")}
        </button>
      </div>
    </div>
  );
}
