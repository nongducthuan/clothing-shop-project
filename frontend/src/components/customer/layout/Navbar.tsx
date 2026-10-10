import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { AuthContext } from "../../../context/AuthContext";
import { CartContext } from "../../../context/CartContext";
import { useLanguage } from "../../../context/LanguageContext";
import API from "../../../services/apiClient";
import NotificationDropdown from "../../common/NotificationDropdown";
import DesktopNav from "./navbar/DesktopNav";
import UserDropdown from "./navbar/UserDropdown";
import MobileMenu from "./navbar/MobileMenu";
import type { CategoryItem } from "./navbar/navbarShared";
import { useRequiredContext } from "../../../hooks/useRequiredContext";

import { useQuery } from "@tanstack/react-query";

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

export default function Navbar() {
  const { user, setUser } = useRequiredContext(AuthContext, 'AuthContext');
  const { cart } = useRequiredContext(CartContext, 'CartContext');
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
          <div className="flex-1 flex justify-start items-center">
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
          <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">

            {user && (
              <NotificationDropdown isAdmin={false} />
            )}

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
      />
    </>
  );
}
