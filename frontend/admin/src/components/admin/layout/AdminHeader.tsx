import { useNavigate } from "react-router-dom";
import { AuthContext } from "@shop/shared/context/AuthContext";
import { useRequiredContext } from "@shop/shared/hooks/useRequiredContext";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import { useTheme } from "@shop/shared/context/ThemeContext";
import NotificationDropdown from "@shop/shared/components/common/NotificationDropdown";

export default function AdminHeader() {
  const { user, logout } = useRequiredContext(AuthContext, "AuthContext");
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 h-16 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
          A
        </div>
        <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-slate-100 hidden sm:inline">
          {t("admin.dashboard_title", "Shop Admin")}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Realtime Notifications */}
        <NotificationDropdown isAdmin={true} />

        {/* Language switch */}
        <button
          onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Switch Language"
        >
          {language.toUpperCase()}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? (
            <i className="fa-solid fa-sun text-lg text-amber-400"></i>
          ) : (
            <i className="fa-solid fa-moon text-lg"></i>
          )}
        </button>

        {/* Admin profile & logout */}
        {user && (
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hidden md:inline">
              {user.name}
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
              <span className="hidden sm:inline">{t("nav.logout", "Đăng xuất")}</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
