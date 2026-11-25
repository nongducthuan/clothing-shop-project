import { useLanguage } from "@shop/shared/context/LanguageContext";
import type { FormEvent } from "react";

export default function OtpStep({ otp, setOtp, onSubmit, loading, onBack }: {
  otp: string; setOtp: (otp: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  loading: boolean; onBack: () => void;
}) {
  const { t } = useLanguage();
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="text-center">
        <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">{t("lookup.otp_label")}</label>
        <input
          type="text"
          required
          autoFocus
          className="w-full max-w-[260px] mx-auto block text-center text-2xl sm:text-3xl tracking-[0.25em] font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-violet-600 dark:focus:ring-violet-400 focus:border-violet-600 dark:focus:border-violet-400 outline-none py-3 text-violet-800 dark:text-violet-300 transition-all"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
          maxLength={6}
          placeholder="••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-full shadow-md transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
      >
        {loading && <i className="fa-solid fa-spinner animate-spin text-sm" />}
        {loading ? t("lookup.otp_verifying") : t("lookup.otp_verify")}
      </button>
      <div className="text-center mt-4">
        <button type="button" onClick={onBack} className="text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 text-sm font-medium transition">
          <i className="fa-solid fa-arrow-left mr-1"></i> {t("lookup.otp_back")}
        </button>
      </div>
    </form>
  );
}
