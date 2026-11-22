import { Navigate } from "react-router-dom";
import { useLogin } from "../../hooks/auth/useLogin";
import { AuthContext } from "@shop/shared/context/AuthContext";
import { useRequiredContext } from "@shop/shared/hooks/useRequiredContext";
import { getSafeRedirect, REDIRECT_PARAM } from "@shop/shared/utils/redirectUtils";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import AuthInput from "@shop/shared/components/auth/AuthInput";
import AuthAlert from "@shop/shared/components/auth/AuthAlert";

export default function Login() {
  const { state, actions } = useLogin();
  const { t } = useLanguage();
  const { user } = useRequiredContext(AuthContext, "AuthContext");
  const { form, error, isLoading } = state;
  const { handleChange, handleSubmit } = actions;

  // Already signed in as admin: skip the form.
  if (user?.role === "admin") {
    const target = getSafeRedirect(new URLSearchParams(window.location.search).get(REDIRECT_PARAM));
    return <Navigate to={target} replace />;
  }

  return (
    <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex flex-col justify-center items-center py-12 px-6 min-h-screen">
      <div className="w-full max-w-md">

        {/* Header Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-medium text-slate-900 dark:text-slate-100 tracking-tight mb-3">
            {t("admin.dashboard_title", "Quản trị hệ thống")}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t("auth.login_subtitle", "Đăng nhập với quyền quản trị viên")}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 py-10 px-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">

          <AuthAlert type="error" message={error} />

          <form onSubmit={handleSubmit} className="space-y-2">
            <AuthInput
              label={t("auth.email_label")}
              name="identifier"
              type="email"
              placeholder={t("auth.email_placeholder")}
              value={form.identifier}
              onChange={handleChange}
              required
            />

            <AuthInput
              label={t("auth.password_label")}
              name="password"
              type="password"
              placeholder={t("auth.password_placeholder")}
              value={form.password}
              onChange={handleChange}
              required
            />

            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-slate-900 dark:bg-violet-600 text-white rounded-full font-medium text-base hover:bg-slate-800 dark:hover:bg-violet-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? t("auth.signing_in") : t("auth.signin")}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}
