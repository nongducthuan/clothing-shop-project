import { NavLink, useNavigate } from "react-router-dom";
import { useContext, useState, useEffect, useRef } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { CartContext } from "../../../context/CartContext";
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
  const timerRef = useRef(null);

  const open = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsOpen(true);
  };

  const close = () => {
    timerRef.current = setTimeout(() => setIsOpen(false), delay);
  };

  const cancelClose = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return { isOpen, open, close, cancelClose };
}

// --- SUB-COMPONENTS ---

// Renders the Desktop Navigation and Dropdowns (SLIDING PILL EFFECT)
const DesktopNav = ({ menuData, navigate }) => {
  const [hoveredGender, setHoveredGender] = useState(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const closeTimer = useRef(null);

  const handleMouseEnter = (gender, e) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoveredGender(gender);

    // Dynamically calculate the position and width for the sliding pill
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
      // Fade out the pill when mouse leaves the nav area entirely
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }, 200);
  };

  return (
    // The Track (Rãnh trượt)
    <div
      className="hidden md:flex relative bg-gray-100 rounded-full p-1.5 mx-auto shadow-inner"
      onMouseLeave={handleMouseLeave}
    >
      {/* The Sliding Pill (Viên thuốc trượt) */}
      <div
        className="absolute top-1.5 bottom-1.5 bg-violet-600 rounded-full transition-all duration-300 ease-out shadow-md pointer-events-none"
        style={pillStyle}
      ></div>

      {GENDERS.map((gender) => (
        <div
          key={gender}
          className="relative z-10" // z-10 ensures the text sits on top of the sliding pill
          onMouseEnter={(e) => handleMouseEnter(gender, e)}
        >
          {/* Nav Item Text */}
          <div
            className={`cursor-pointer uppercase font-bold text-sm tracking-wide px-6 py-2 transition-colors duration-300 ${hoveredGender === gender ? "text-white" : "text-gray-500 hover:text-gray-800"
              }`}
          >
            {gender.toUpperCase()}
          </div>

          {/* Dropdown Menu */}
          {hoveredGender === gender && (
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full mt-5 bg-white shadow-2xl border border-gray-100 rounded-2xl p-6 w-[600px] z-50 animate-fadeIn"
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
                    <div className="mx-auto w-32 aspect-square overflow-hidden rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center transition-colors group-hover:border-violet-200 group-hover:bg-violet-50">
                      <img
                        src={getImgUrl(cat.image_url || cat.preview_image)}
                        className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm"
                        alt={cat.name}
                      />
                    </div>
                    <span className="block text-sm font-bold mt-3 text-gray-700 transition-colors group-hover:text-violet-700">
                      {cat.name}
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
  const { isOpen, open, close, cancelClose } = useHoverDelay();

  return (
    <div className="relative hidden md:block" onMouseEnter={open} onMouseLeave={close}>
      <i
        className={`fa-solid fa-user text-xl cursor-pointer transition-colors ${user ? "text-violet-600" : "text-gray-700 hover:text-violet-600"
          }`}
      ></i>

      {isOpen && (
        <div
          className="absolute right-0 top-10 bg-white shadow-lg rounded-xl border border-gray-100 w-48 py-2 z-50 animate-fadeIn"
          onMouseEnter={cancelClose}
        >
          {user ? (
            <>
              <div className="px-4 py-3 border-b border-gray-100 font-bold text-gray-800 truncate">
                {user.name}
              </div>
              {user.role === "admin" && (
                <div
                  className="px-4 py-2.5 hover:bg-violet-50 hover:text-violet-700 font-medium text-gray-700 cursor-pointer transition-colors flex items-center"
                  onClick={() => navigate("/admin")}
                >
                  <i className="fa-solid fa-screwdriver-wrench mr-2 w-4 text-center"></i> Dashboard
                </div>
              )}
              <div
                className="px-4 py-2.5 hover:bg-violet-50 hover:text-violet-700 font-medium text-gray-700 cursor-pointer transition-colors flex items-center"
                onClick={() => navigate("/profile")}
              >
                <i className="fa-solid fa-user-circle mr-2 w-4 text-center"></i> Profile
              </div>
              <div
                className="px-4 py-2.5 hover:bg-red-50 text-red-600 font-medium cursor-pointer transition-colors flex items-center"
                onClick={onLogout}
              >
                <i className="fa-solid fa-arrow-right-from-bracket mr-2 w-4 text-center"></i> Logout
              </div>
            </>
          ) : (
            <>
              <div
                className="px-4 py-2.5 hover:bg-violet-50 hover:text-violet-700 font-medium text-gray-700 cursor-pointer transition-colors flex items-center"
                onClick={() => navigate("/login")}
              >
                <i className="fa-solid fa-right-to-bracket mr-2 w-4 text-center"></i> Login
              </div>
              <div
                className="px-4 py-2.5 hover:bg-violet-50 hover:text-violet-700 font-medium text-gray-700 cursor-pointer transition-colors flex items-center"
                onClick={() => navigate("/register")}
              >
                <i className="fa-solid fa-user-plus mr-2 w-4 text-center"></i> Register
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

  // Lock background scroll when drawer is open
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
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-xs z-30 md:hidden animate-fadeIn"
        onClick={onClose}
      />

      <div className="fixed top-16 left-0 right-0 bottom-0 bg-white z-40 overflow-y-auto p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:hidden animate-fadeIn flex flex-col justify-between">
        <div>
          {/* User Info Mobile */}
          <div className="mb-6 border-b border-gray-100 pb-4">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center font-bold text-xl shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-lg leading-tight">{user.name}</p>
                  <p
                    className="text-sm text-violet-600 cursor-pointer hover:underline font-medium mt-0.5"
                    onClick={() => handleNav("/profile")}
                  >
                    View profile & orders →
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => handleNav("/login")}
                  className="flex-1 py-3 border-2 border-violet-600 text-violet-600 rounded-xl font-bold transition-all active:scale-[0.98]"
                >
                  Login
                </button>
                <button
                  onClick={() => handleNav("/register")}
                  className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.98]"
                >
                  Register
                </button>
              </div>
            )}
          </div>

          {/* Essential Quick Links (Mobile accessible!) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => handleNav("/sales-policy")}
              className="flex items-center gap-2 px-2.5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-semibold text-[13px] hover:bg-violet-50 hover:text-violet-700 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-shield-halved text-xs"></i>
              </div>
              <span className="whitespace-normal leading-tight">Sales Policy</span>
            </button>

            <button
              onClick={() => handleNav("/order")}
              className="flex items-center gap-2 px-2.5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-700 font-semibold text-[13px] hover:bg-violet-50 hover:text-violet-700 transition-all text-left"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                <i className="fa-solid fa-truck-fast text-xs"></i>
              </div>
              <span className="whitespace-normal leading-tight">Track Order</span>
            </button>
          </div>

          {/* Categories Accordion */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
              Categories
            </div>
            {GENDERS.map((gender) => (
              <div key={gender} className="bg-gray-50 rounded-2xl overflow-hidden border border-slate-100">
                <button
                  onClick={() => toggleGender(gender)}
                  className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
                >
                  <span
                    className={`font-bold text-base uppercase tracking-wide ${expandedGender === gender ? "text-violet-700" : "text-gray-800"
                      }`}
                  >
                    {gender.toUpperCase()}
                  </span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${expandedGender === gender ? 'bg-violet-100' : 'bg-gray-200'}`}>
                    <i
                      className={`fa-solid fa-chevron-down text-xs transition-transform duration-300 ${expandedGender === gender ? "rotate-180 text-violet-700" : "text-gray-500"
                        }`}
                    ></i>
                  </div>
                </button>

                <div
                  className={`transition-all duration-300 ease-in-out ${expandedGender === gender ? "max-h-[1000px] opacity-100 pb-4 px-4" : "max-h-0 opacity-0 overflow-hidden"
                    }`}
                >
                  <div className="grid grid-cols-2 gap-2.5">
                    {menuData[gender].map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => handleNav(`/category/${cat.id}?gender=${gender}`)}
                        className="p-3 bg-white border border-gray-100 rounded-xl text-xs font-semibold text-gray-700 hover:border-violet-300 hover:text-violet-700 transition-all text-center truncate shadow-xs"
                      >
                        {cat.name}
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
                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold transition-all hover:bg-slate-800 flex items-center justify-center gap-2"
              >
                Dashboard
              </button>
            </div>
          )}
        </div>

        {/* Logout Mobile */}
        {user && (
          <div className="pt-6 border-t border-slate-100 mt-6">
            <button
              onClick={onLogout}
              className="w-full py-3 text-red-500 bg-red-50 rounded-xl font-bold transition-colors hover:bg-red-100 flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
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
      <nav className="bg-white/95 backdrop-blur-md shadow-xs border-b border-gray-100 fixed top-0 left-0 right-0 z-50 h-16">
        <div className="container mx-auto px-4 flex gap-4 lg:gap-8 justify-between items-center h-full">
          {/* Logo */}
          <div className="flex-shrink-0">
            <NavLink
              to="/"
              className="font-black text-violet-700 tracking-tighter text-xl md:text-2xl whitespace-nowrap drop-shadow-xs no-underline"
            >
              CLOTHING<span className="text-gray-900">SHOP</span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <DesktopNav menuData={menuData} navigate={navigate} />

          {/* Icons & Actions */}
          <div className="flex items-center gap-4 sm:gap-5">
            {/* Policy Icon */}
            <div
              className="cursor-pointer relative group hidden sm:block p-1.5"
              onClick={() => navigate("/sales-policy")}
              title="Sales Policy"
            >
              <i className="fa-solid fa-shield-halved text-xl text-gray-600 hover:text-violet-600 transition-colors"></i>
            </div>

            {/* Order Lookup (Guest only) */}
            {!user && (
              <div
                className="cursor-pointer relative group hidden sm:block p-1.5"
                onClick={() => navigate("/order")}
                title="Track Order"
              >
                <i className="fa-solid fa-truck-fast text-xl text-gray-600 hover:text-violet-600 transition-colors"></i>
              </div>
            )}

            {/* Search Icon */}
            <div className="p-1.5 cursor-pointer" onClick={() => navigate("/search")}>
              <i className="fa-solid fa-magnifying-glass text-xl text-gray-600 hover:text-violet-600 transition-colors"></i>
            </div>

            {/* Cart Icon */}
            <div
              className="relative cursor-pointer p-1.5"
              onClick={() => navigate("/cart")}
            >
              <i className="fa-solid fa-cart-shopping text-xl text-gray-600 hover:text-violet-600 transition-colors"></i>
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cart.length > 99 ? "99+" : cart.length}
                </span>
              )}
            </div>

            {/* Desktop User Dropdown */}
            <UserDropdown user={user} navigate={navigate} onLogout={handleLogout} />

            {/* Mobile Hamburger Button */}
            <button
              className="md:hidden text-2xl text-gray-700 focus:outline-none p-1.5 ml-1"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <i className={isMobileMenuOpen ? "fa-solid fa-xmark text-violet-700" : "fa-solid fa-bars"}></i>
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
