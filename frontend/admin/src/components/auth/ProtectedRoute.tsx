import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "@shop/shared/context/AuthContext";
import { useRequiredContext } from "@shop/shared/hooks/useRequiredContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { buildLoginPath } from "@shop/shared/utils/redirectUtils";

export default function ProtectedRoute({ children, roleRequired }: { children: ReactNode; roleRequired?: string }) {
  // Read the session from AuthContext so the route reacts when it is cleared (logout, expired session).
  const { user, logout } = useRequiredContext(AuthContext, "AuthContext");
  const { t } = useLanguage();
  const location = useLocation();

  if (!user) {
    return <Navigate to={buildLoginPath(`${location.pathname}${location.search}${location.hash}`)} replace />;
  }

  if (roleRequired && user.role !== roleRequired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-slate-50 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          {t("auth.no_permission_title", "Bạn không có quyền truy cập")}
        </h2>
        <p className="max-w-md text-slate-500 dark:text-slate-400">
          {t("auth.no_permission_desc", "Tài khoản hiện tại không có quyền quản trị. Hãy đăng xuất và đăng nhập bằng tài khoản quản trị viên.")}
        </p>
        <button
          type="button"
          onClick={() => { void logout(); }}
          className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
        >
          {t("nav.logout", "Đăng xuất")}
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
