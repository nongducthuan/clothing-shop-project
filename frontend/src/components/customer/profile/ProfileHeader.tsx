import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProfileHeader({ user, logout }) {
  const { t } = useLanguage();

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 sm:px-12 py-8 mb-8">
      <div className="max-w-[1200px] mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">{t("profile.account", "Account")}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{user.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-full font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          {t("profile.logout", "Logout")}
        </button>
      </div>
    </div>
  );
}
