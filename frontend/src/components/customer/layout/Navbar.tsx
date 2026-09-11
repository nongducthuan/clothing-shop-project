import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { Sun, Moon, Globe, Menu, X } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import { CartContext } from "../../../context/CartContext";
import { useTheme } from "../../../context/ThemeContext";
import { useLanguage } from "../../../context/LanguageContext";
import API from "../../../services/apiClient";
import { getImageUrl as getImgUrl } from "../../../utils/imageUtils";

// --- UTILS & CONSTANTS ---
const GENDERS = ["male", "female", "unisex"];

// --- CUSTOM HOOKS ---

// Hook to manage category data fetching and updates
function useCategoryData() {
  const [menuData, setMenuData] = useState({
    male: [],
    female: [],
    unisex: [],
  });

  const fetchData = async () => {
    try {
      const res = await API.get("/categories/preview");
      const list = res.data.data || [];
      const grouped = { male: [], female: [], unisex: [] };
      list.forEach((c) => {
        if (grouped[c.gender]) grouped[c.gender].push(c);
      });
      setMenuData(grouped);
    } catch (err) {
      console.error("Error loading menu:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const refresh = () => fetchData();
    window.addEventListener("categories-updated", refresh);
    return () => window.removeEventListener("categories-updated", refresh);
  }, []);

  return menuData;
}

// Hook to manage delayed hover effects (Debounce)
function useHoverDelay(delay = 200) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef<any>(null);

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

// --- SUB-COMPONENTS ---

// Renders the Desktop Navigation and Dropdowns (SLIDING PILL EFFECT)
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

// Renders the User Icon and Dropdown (Desktop)
const UserDropdown = ({ user, navigate, onLogout }) => {
  const { isOpen, open, close, closeImmediately, cancelClose } = useHoverDelay();
  const { t } = useLanguage();

  const handleItemClick = (action: () => void) => {
    closeImmediately();
    action();
  };

  return (
    <div className="relative hidden md:block" onMouseEnter={open} onMouseLeave={close}>
      <i
        className={`fa-solid fa-user text-xl cursor-pointer transition-colors ${
          user ? "text-violet-600" : "text-gray-700 dark:text-slate-300 hover:text-violet-600"
        }`}
      ></i>

      {isOpen && (
        <div
          className="absolute right-0 top-10 bg-white dark:bg-slate-800 shadow-lg rounded-xl border border-gray-100 dark:border-slate-700 w-52 py-2 z-50 animate-fadeIn"
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
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/sales-policy"))}
              >
                <i className="fa-solid fa-shield-halved mr-2 w-4 text-center"></i> {t("nav.sales_policy", "Sales Policy")}
              </div>
              <div
                className="px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 font-medium cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(onLogout)}
              >
                <i className="fa-solid fa-arrow-right-from-bracket mr-2 w-4 text-center"></i> {t("nav.logout", "Logout")}
              </div>
            </>
          ) : (
            <>
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/sales-policy"))}
              >
                <i className="fa-solid fa-shield-halved mr-2 w-4 text-center"></i> {t("nav.sales_policy", "Sales Policy")}
              </div>
              <div
                className="px-4 py-2.5 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-700 dark:hover:text-violet-400 font-medium text-gray-700 dark:text-slate-300 cursor-pointer transition-colors flex items-center"
                onClick={() => handleItemClick(() => navigate("/order"))}
              >
                <i className="fa-solid fa-truck-fast mr-2 w-4 text-center"></i> {t("nav.track_order", "Track Order")}
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

// Renders the Mobile Drawer (Hidden on Desktop)
const MobileMenu = ({ isOpen, onClose, user, menuData, navigate, onLogout }) => {
  const [expandedGender, setExpandedGender] = useState(null);
  const { t } = useLanguage();
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
                    View profile &amp; orders <i className="fa-solid fa-arrow-right text-[10px]"></i>
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

          {/* Essential Quick Links (Mobile accessible!) */}
          <div className="grid grid-cols-2 gap-2.5 mb-3.5">
            <button
              onClick={() => handleNav("/sales-policy")}
              className="flex items-center gap-2 px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-shield-halved text-xs"></i>
              </div>
              <span className="min-w-0 flex-1 text-center leading-tight">{t("nav.sales_policy", "Sales Policy")}</span>
            </button>

            {user ? (
              <button
                onClick={() => handleNav("/profile?tab=orders")}
                className="flex items-center gap-2 px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-box-archive text-xs"></i>
                </div>
                <span className="min-w-0 flex-1 text-center leading-tight">{t("nav.my_orders", "My Orders")}</span>
              </button>
            ) : (
              <button
                onClick={() => handleNav("/order")}
                className="flex items-center gap-2 px-2.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 hover:text-violet-700 transition-all text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-truck-fast text-xs"></i>
                </div>
                <span className="min-w-0 flex-1 text-center leading-tight">{t("nav.track_order", "Track Order")}</span>
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

// --- MAIN COMPONENT ---

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const menuData = useCategoryData();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
              className="font-black text-violet-700 dark:text-violet-400 tracking-tighter text-lg sm:text-xl md:text-2xl whitespace-nowrap drop-shadow-xs no-underline"
            >
              CLOTHING<span className="text-gray-900 dark:text-slate-100">SHOP</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <DesktopNav menuData={menuData} navigate={navigate} />

          {/* Icons & Actions */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 md:gap-4 shrink-0">

            {/* Language Switcher Button */}
            <button
              onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
              className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 sm:gap-1.5 border border-slate-200 dark:border-slate-700"
              title="Switch Language"
            >
              <Globe size={13} className="text-violet-600 dark:text-violet-400 shrink-0" />
              <span>{language.toUpperCase()}</span>
            </button>

            {/* Dark / Light Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-1 sm:p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? t("common.theme_light") : t("common.theme_dark")}
            >
              {isDark ? <Sun size={18} className="text-amber-400 sm:w-5 sm:h-5" /> : <Moon size={18} className="text-slate-700 sm:w-5 sm:h-5" />}
            </button>

            {/* Search Icon */}
            <div className="p-1 sm:p-1.5 cursor-pointer" onClick={() => navigate("/search")}>
              <i className="fa-solid fa-magnifying-glass text-lg sm:text-xl text-gray-600 dark:text-slate-300 hover:text-violet-600 transition-colors"></i>
            </div>

            {/* Cart Icon */}
            <div
              className="relative cursor-pointer p-1 sm:p-1.5"
              onClick={() => navigate("/cart")}
            >
              <i className="fa-solid fa-cart-shopping text-lg sm:text-xl text-gray-600 dark:text-slate-300 hover:text-violet-600 transition-colors"></i>
              {cart.reduce((total, item) => total + item.quantity, 0) > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cart.reduce((total, item) => total + item.quantity, 0) > 99 ? "99+" : cart.reduce((total, item) => total + item.quantity, 0)}
                </span>
              )}
            </div>

            {/* Desktop User Dropdown */}
            <UserDropdown user={user} navigate={navigate} onLogout={handleLogout} />

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden text-gray-700 dark:text-slate-200 focus:outline-none p-1 shrink-0"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
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
      />
    </>
  );
}
