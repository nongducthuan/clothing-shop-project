import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function EmailStep({ email, setEmail, onSubmit, loading }) {
  const { t } = useLanguage();
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-600 dark:text-slate-300 mb-2">{t("lookup.email_label")}</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 pointer-events-none">
            <i className="fa-solid fa-envelope"></i>
          </span>
          <input
            type="email"
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
          />
        </div>
      </div>
      <button
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg shadow-md transition disabled:opacity-70"
      >
        {loading ? <span><i className="fa-solid fa-circle-notch fa-spin mr-2"></i>{t("lookup.sending")}</span> : t("lookup.send_otp")}
      </button>
    </form>
  );
}
