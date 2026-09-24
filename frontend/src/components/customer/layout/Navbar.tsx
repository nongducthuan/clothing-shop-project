import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { Sun, Moon, Globe, Menu, X, ShieldCheck, PackageCheck, Truck } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import { CartContext } from "../../../context/CartContext";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import API from "../../../services/apiClient";
import { getImageUrl as getImgUrl } from "../../../utils/imageUtils";
import type { User } from "../../../types";

import { useQuery } from "@tanstack/react-query";

type CategoryItem = { id: number; gender: string; name?: string; name_vi?: string; name_en?: string; [key: string]: unknown };
const GENDERS = ["male", "female", "unisex"];

function useCategoryData() {
  const { data: menuData = { male: [], female: [], unisex: [] } } = useQuery({
    queryKey: ["categories-preview"],
    queryFn: async () => {
      const res = await API.get("/categories/preview");
      const list: CategoryItem[] = res.data.data || [];
      const grouped: Record<string, CategoryItem[]> = { male: [], female: [], unisex: [] };
      list.forEach((c) => {
        if (grouped[c.gender]) grouped[c.gender].push(c);
      });
      return grouped;
    },
    staleTime: 5 * 60 * 1000,
  });

  return menuData;
}


// Hook to manage delayed hover effects (Debounce)
function useHoverDelay(delay = 200) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), delay);
  };

  const closeImmediately = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const cancelClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { isOpen, open, close, closeImmediately, cancelClose };
}

const DesktopNav = ({ menuData, navigate }) => {
  const [hoveredGender, setHoveredGender] = useState(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const closeTimer = useRef(null);
  const { t } = useLanguage();
  const { getLocalizedText } = useLanguage();

  const handleMouseEnter = (gender, e) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoveredGender(gender);

    if (e.currentTarget) {
      setPillStyle({
        left: e.currentTarget.offsetLeft,
        width: e.currentTarget.offsetWidth,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setHoveredGender(null);
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }, 200);
  };

  return (
    <div
      className="hidden md:flex relative bg-slate-100/80 dark:bg-white/10 backdrop-blur-sm rounded-full p-1.5 mx-auto shadow-inner border border-slate-200/60 dark:border-white/10"
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute top-1.5 bottom-1.5 bg-violet-600 rounded-full transition-all duration-300 ease-out shadow-md pointer-events-none"
        style={pillStyle}
      ></div>

      {GENDERS.map((gender) => (
        <div
          key={gender}
          className="relative z-10"
          onMouseEnter={(e) => handleMouseEnter(gender, e)}
        >
          <div
            className={`cursor-pointer uppercase font-bold text-sm tracking-wide px-6 py-2 transition-colors duration-300 ${
              hoveredGender === gender
                ? "text-white"
                : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            {t(`gender.${gender}`)}
          </div>

          {hoveredGender === gender && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-5 bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 rounded-2xl p-6 w-[600px] z-50 animate-fadeIn"
              onMouseEnter={() => clearTimeout(closeTimer.current)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="grid grid-cols-3 gap-4">
                {menuData[gender].map((cat) => (
                  <div
                    key={cat.id}
                    className="cursor-pointer group text-center"
                    onClick={() => navigate(`/category/${cat.id}?gender=${gender}`)}
                  >
                    <div className="mx-auto w-32 aspect-square overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center transition-colors group-hover:border-violet-500 group-hover:bg-violet-50 dark:group-hover:bg-violet-900/40">
                      <img
                        src={getImgUrl(cat.image_url || cat.preview_image)}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                        alt={getLocalizedText(cat, 'name')}
                      />
                    </div>
                    <span className="block text-sm font-bold mt-3 text-slate-800 dark:text-slate-200 transition-colors group-hover:text-violet-600 dark:group-hover:text-violet-400">
                      {getLocalizedText(cat, 'name')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

type NavigateFn = ReturnType<typeof useNavigate>;

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

const MobileMenu = ({ isOpen, onClose, user, menuData, navigate, onLogout, cartCount }: { isOpen: boolean; onClose: () => void; user: User | null; menuData: Record<string, CategoryItem[]>; navigate: NavigateFn; onLogout: () => void; cartCount: number }) => {
  const [expandedGender, setExpandedGender] = useState(null);
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

  const toggleGender = (gender) => {
    setExpandedGender((prev) => (prev === gender ? null : gender));
  };

  const handleNav = (path) => {
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

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const menuData = useCategoryData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xs border-b border-gray-100 dark:border-slate-800 fixed top-0 left-0 right-0 z-50 h-16 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-full gap-2 sm:gap-4">
          {/* Logo */}
          <div className="shrink-0">
            <NavLink
              to="/"
              className="font-black text-violet-700 dark:text-violet-400 tracking-wider text-xl sm:text-2xl md:text-3xl whitespace-nowrap drop-shadow-xs no-underline flex items-center gap-1"
            >
              <span>LOOM</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <DesktopNav menuData={menuData} navigate={navigate} />

          {/* Icons & Actions */}
          <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">

            {/* Search Button */}
            <button
              onClick={() => navigate("/search")}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center justify-center"
              title={t("nav.search", "Search")}
            >
              <i className="fa-solid fa-magnifying-glass text-lg"></i>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => navigate("/cart")}
              className="relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center justify-center"
              title={t("nav.cart", "Cart")}
            >
              <i className="fa-solid fa-cart-shopping text-lg"></i>
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 leading-none shadow-xs">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Desktop User Dropdown */}
            <UserDropdown user={user} navigate={navigate} onLogout={handleLogout} />

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden text-gray-700 dark:text-slate-200 focus:outline-none p-1 shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={t("nav.toggle_menu", "Toggle menu")}
            >
              {isMobileMenuOpen
                ? <X size={22} className="text-violet-700 dark:text-violet-400" />
                : <Menu size={22} />
              }
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
        menuData={menuData}
        navigate={navigate}
        onLogout={handleLogout}
        cartCount={cartCount}
      />
    </>
  );
}
