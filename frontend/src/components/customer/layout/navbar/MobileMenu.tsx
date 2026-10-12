import { useState, useEffect } from "react";
import { Sun, Moon, Globe, ShieldCheck, PackageCheck, Truck } from "lucide-react";
import { useTheme } from "../../../../context/ThemeContext";
import { useLanguage } from "../../../../context/LanguageContext";
import type { User } from "../../../../types";
import { GENDERS } from "./navbarShared";
import type { CategoryItem, Gender, NavigateFn } from "./navbarShared";

const MobileMenu = ({ isOpen, onClose, user, menuData, navigate, onLogout }: { isOpen: boolean; onClose: () => void; user: User | null; menuData: Record<Gender, CategoryItem[]>; navigate: NavigateFn; onLogout: () => void }) => {
  const [expandedGender, setExpandedGender] = useState<Gender | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const { getLocalizedText } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const toggleGender = (gender: Gender) => {
    setExpandedGender((prev) => (prev === gender ? null : gender));
  };

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed top-16 left-0 right-0 bottom-0 bg-white dark:bg-slate-900 z-40 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden animate-fadeIn flex flex-col justify-between">
        <div>
          {/* User Info Mobile */}
          <div className="mb-3.5">
            {user ? (
              <div
                className="flex items-center gap-3.5 p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl cursor-pointer hover:bg-violet-50/60 dark:hover:bg-violet-900/20 hover:border-violet-200 transition-all shadow-xs"
                onClick={() => handleNav("/profile")}
              >
                <div className="w-11 h-11 bg-violet-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="font-bold text-gray-900 dark:text-slate-100 text-base leading-snug truncate">{user.name}</p>
                  <p className="text-xs text-violet-600 dark:text-violet-400 font-semibold mt-0.5 flex items-center gap-1">
                    {t("nav.view_profile_orders", "View profile & orders")} <i className="fa-solid fa-arrow-right text-[10px]"></i>
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleNav("/login")}
                  className="flex-1 py-3 border-2 border-violet-600 text-violet-600 rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  {t("nav.login_link", "Login")}
                </button>
                <button
                  onClick={() => handleNav("/register")}
                  className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  {t("nav.register_link", "Register")}
                </button>
              </div>
            )}
          </div>

          {/* Language & Theme Controls Mobile */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-center"
            >
              <Globe size={15} className="text-violet-600 dark:text-violet-400 shrink-0" />
              <span>{language === "vi" ? "English (EN)" : "Tiếng Việt (VI)"}</span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-center"
            >
              {isDark ? <Sun size={15} className="text-amber-400 shrink-0" /> : <Moon size={15} className="text-slate-700 dark:text-slate-300 shrink-0" />}
              <span>{isDark ? t("common.theme_light", "Sáng") : t("common.theme_dark", "Tối")}</span>
            </button>
          </div>

          {/* Essential Quick Links */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <button
              onClick={() => handleNav("/sales-policy")}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-center"
            >
              <ShieldCheck size={15} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="leading-tight">{t("nav.sales_policy", "Sales Policy")}</span>
            </button>

            {user ? (
              <button
                onClick={() => handleNav("/profile?tab=orders")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-center"
              >
                <PackageCheck size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="leading-tight">{t("nav.my_orders", "My Orders")}</span>
              </button>
            ) : (
              <button
                onClick={() => handleNav("/order")}
                className="flex items-center justify-center gap-2 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-center"
              >
                <Truck size={15} className="text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="leading-tight">{t("nav.track_order", "Track Order")}</span>
              </button>
            )}
          </div>

          {/* Categories Accordion */}
          <div className="space-y-3">
            {GENDERS.map((gender) => (
              <div key={gender} className="bg-gray-50 dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => toggleGender(gender)}
                  className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                >
                  <span
                    className={`font-bold text-base uppercase tracking-wide ${
                      expandedGender === gender ? "text-violet-700 dark:text-violet-400" : "text-gray-800 dark:text-slate-200"
                    }`}
                  >
                    {t(`gender.${gender}`)}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${expandedGender === gender ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-gray-200 dark:bg-slate-700'}`}>
                    <i
                      className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${
                        expandedGender === gender ? "rotate-180 text-violet-700 dark:text-violet-400" : "text-gray-500 dark:text-slate-400"
                      }`}
                    ></i>
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${
                    expandedGender === gender ? "max-h-[1000px] opacity-100 pb-4 px-4" : "max-h-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    {menuData[gender].map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => handleNav(`/category/${cat.id}?gender=${gender}`)}
                        className="p-3 bg-white dark:bg-slate-700 border border-gray-100 dark:border-slate-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 hover:border-violet-300 hover:text-violet-700 dark:hover:text-violet-400 transition-all text-center truncate shadow-xs"
                      >
                        {getLocalizedText(cat, 'name')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Link Mobile */}
          {user?.role === "admin" && (
            <div className="mt-6">
              <button
                onClick={() => handleNav("/admin")}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl font-bold transition-all hover:bg-slate-800 dark:hover:bg-slate-600 flex items-center justify-center gap-2"
              >
                {t("nav.dashboard", "Dashboard")}
              </button>
            </div>
          )}
        </div>

        {/* Logout Mobile */}
        {user && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700 mt-6">
            <button
              onClick={onLogout}
              className="w-full py-3 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl font-bold transition-colors hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> {t("nav.logout", "Logout")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileMenu;
