import { useLanguage } from "../../../../context/LanguageContext";
import { useTheme } from "../../../../context/ThemeContext";
import type { User } from "../../../../types";
import { useHoverDelay } from "./useHoverMenu";
import type { NavigateFn } from "./navbarShared";

const UserDropdown = ({ user, navigate, onLogout }: { user: User | null; navigate: NavigateFn; onLogout: () => void }) => {
  const { isOpen, open, close, closeImmediately, cancelClose } = useHoverDelay();
  const { t, language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const handleItemClick = (action: () => void) => {
    closeImmediately();
    action();
  };

  return (
    <div className="relative hidden md:block" onMouseEnter={open} onMouseLeave={close}>
      <div className="relative cursor-pointer py-1">
        <i
          className={`fa-solid fa-user text-xl transition-colors ${
            user ? "text-violet-600" : "text-gray-700 dark:text-slate-300 hover:text-violet-600"
          }`}
        ></i>
      </div>

      {isOpen && (
        <div
          className="absolute right-0 top-10 bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-gray-100 dark:border-slate-700 w-56 py-2 z-50 animate-fadeIn"
          onMouseEnter={cancelClose}
          onMouseLeave={close}
        >
          {user ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 font-bold text-gray-800 dark:text-slate-100 truncate">
                {user.name}
              </div>

              {user.role === "admin" && (
                <div
                  className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                  onClick={() => handleItemClick(() => navigate("/admin"))}
                >
                  <i className="fa-solid fa-screwdriver-wrench mr-2 w-4 text-center"></i> {t("nav.dashboard", "Dashboard")}
                </div>
              )}

              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/profile"))}
              >
                <i className="fa-solid fa-user-circle mr-2 w-4 text-center"></i> {t("nav.profile", "Profile")}
              </div>

              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/profile?tab=orders"))}
              >
                <i className="fa-solid fa-box-archive mr-2 w-4 text-center"></i> {t("nav.my_orders", "My Orders")}
              </div>

              <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>

              {/* Language Switcher */}
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => handleItemClick(() => setLanguage(language === "vi" ? "en" : "vi"))}
              >
                <div className="flex items-center">
                  <i className="fa-solid fa-globe mr-2 w-4 text-center"></i> {language === "vi" ? "English" : "Tiếng Việt"}
                </div>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {language === "vi" ? "EN" : "VI"}
                </span>
              </div>

              {/* Theme Toggle */}
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => handleItemClick(toggleTheme)}
              >
                <div className="flex items-center">
                  <i className={`fa-solid ${isDark ? "fa-sun text-amber-400" : "fa-moon text-slate-600"} mr-2 w-4 text-center`}></i>
                  {isDark ? t("common.theme_light", "Giao diện sáng") : t("common.theme_dark", "Giao diện tối")}
                </div>
              </div>

              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/sales-policy"))}
              >
                <i className="fa-solid fa-shield-halved mr-2 w-4 text-center"></i> {t("nav.sales_policy", "Sales Policy")}
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
              <div
                className="px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 font-medium cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(onLogout)}
              >
                <i className="fa-solid fa-arrow-right-from-bracket mr-2 w-4 text-center"></i> {t("nav.logout", "Logout")}
              </div>
            </>
          ) : (
            <>
              {/* Language Switcher */}
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => handleItemClick(() => setLanguage(language === "vi" ? "en" : "vi"))}
              >
                <div className="flex items-center">
                  <i className="fa-solid fa-globe mr-2 w-4 text-center"></i> {language === "vi" ? "English" : "Tiếng Việt"}
                </div>
                <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {language === "vi" ? "EN" : "VI"}
                </span>
              </div>

              {/* Theme Toggle */}
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center justify-between"
                onClick={() => handleItemClick(toggleTheme)}
              >
                <div className="flex items-center">
                  <i className={`fa-solid ${isDark ? "fa-sun text-amber-400" : "fa-moon text-slate-600"} mr-2 w-4 text-center`}></i>
                  {isDark ? t("common.theme_light", "Giao diện sáng") : t("common.theme_dark", "Giao diện tối")}
                </div>
              </div>

              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/order"))}
              >
                <i className="fa-solid fa-truck-fast mr-2 w-4 text-center"></i> {t("nav.track_order", "Track Order")}
              </div>

              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/sales-policy"))}
              >
                <i className="fa-solid fa-shield-halved mr-2 w-4 text-center"></i> {t("nav.sales_policy", "Sales Policy")}
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/login"))}
              >
                <i className="fa-solid fa-right-to-bracket mr-2 w-4 text-center"></i> {t("nav.login_link", "Login")}
              </div>
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/register"))}
              >
                <i className="fa-solid fa-user-plus mr-2 w-4 text-center"></i> {t("nav.register_link", "Register")}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDropdown;
