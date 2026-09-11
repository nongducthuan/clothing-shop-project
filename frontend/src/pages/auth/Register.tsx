import React from "react";
import { Link } from "react-router-dom";
import { useRegister } from "../../hooks/auth/useRegister";
import { useLanguage } from "../../context/LanguageContext";
import AuthInput from "../../components/auth/AuthInput";
import AuthAlert from "../../components/auth/AuthAlert";

export default function Register() {
  const { state, actions } = useRegister();
  const { t } = useLanguage();
  const { form, error, success, isLoading } = state;
  const { handleChange, handleSubmit } = actions;

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center py-12 px-6">
      <div className="w-full max-w-md">

        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 dark:text-slate-100 tracking-tight mb-3">
            {t("auth.register_title")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t("auth.register_subtitle")}
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-slate-800 py-10 px-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">

          <AuthAlert type="error" message={error} />
          <AuthAlert type="success" message={success} />

          <form onSubmit={handleSubmit} className="space-y-2">
            <AuthInput
              label={t("auth.fullname_label")}
              name="name"
              type="text"
              placeholder={t("auth.fullname_placeholder")}
              value={form.name}
              onChange={handleChange}
              required
            />

            <AuthInput
              label={t("auth.email_label")}
              name="email"
              type="email"
              placeholder={t("auth.email_placeholder")}
              value={form.email}
              onChange={handleChange}
              required
            />

            <AuthInput
              label={t("auth.phone_label")}
              name="phone"
              type="tel"
              placeholder="0901234567"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <AuthInput
              label={t("auth.password_label")}
              name="password"
              type="password"
              placeholder={t("auth.password_min_placeholder")}
              value={form.password}
              onChange={handleChange}
              required
            />

            <AuthInput
              label={t("auth.confirm_password_label")}
              name="confirmPassword"
              type="password"
              placeholder={t("auth.confirm_password_placeholder")}
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading || !!success}
                className="w-full py-4 bg-slate-900 dark:bg-violet-600 text-white rounded-full font-medium text-base hover:bg-slate-800 dark:hover:bg-violet-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? t("auth.processing") : t("auth.signup")}
              </button>
            </div>
          </form>

          {/* Footer Section */}
          <div className="mt-8 text-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">{t("auth.have_account")} </span>
            <Link to="/login" className="font-medium text-slate-900 dark:text-violet-400 hover:underline underline-offset-4 transition-colors">
              {t("auth.signin_link")}
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

