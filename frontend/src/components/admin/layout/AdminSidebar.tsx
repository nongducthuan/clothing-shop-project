import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";

/**
 * Sidebar điều hướng dùng chung cho mọi trang admin (render bên trong AdminLayout).
 * - Desktop (lg trở lên): cột dọc cố định bên trái, sticky ngay dưới Navbar.
 * - Mobile/tablet: nút "Menu" + drawer trượt từ trái (nằm dưới Navbar, dùng cùng
 *   quy ước z-index với menu mobile của Navbar để không đè lên nhau).
 * Toàn bộ nhãn lấy từ i18n nên tự động song ngữ vi/en.
 */

const NAV_ITEMS: { to: string; labelKey: string; icon: string; end?: boolean }[] = [
  { to: "/admin", labelKey: "admin.dashboard", icon: "fa-gauge-high", end: true },
  { to: "/admin/products", labelKey: "admin.product_management", icon: "fa-boxes-stacked" },
  { to: "/admin/categories", labelKey: "admin.category_management", icon: "fa-tags" },
  { to: "/admin/orders", labelKey: "admin.order_management", icon: "fa-file-invoice-dollar" },
  { to: "/admin/banners", labelKey: "admin.banner_management", icon: "fa-panorama" },
  { to: "/admin/vouchers", labelKey: "admin.voucher_management", icon: "fa-ticket-simple" },
  { to: "/admin/sales", labelKey: "admin.sale_management", icon: "fa-percent" },
  { to: "/admin/promotions", labelKey: "admin.promotion_management", icon: "fa-gift" },
  { to: "/admin/users", labelKey: "admin.user_management", icon: "fa-users-gear" },
  { to: "/admin/report", labelKey: "admin.report_management", icon: "fa-chart-line" },
];

export default function AdminSidebar() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all duration-300 ${
      isActive
        ? "bg-violet-600 text-white shadow-sm"
        : "text-slate-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-700 hover:text-violet-600 dark:hover:text-violet-400"
    }`;

  const navLinks = (
    <>
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={linkClass}
          onClick={() => setOpen(false)}
        >
          <i className={`fa-solid ${item.icon} w-5 text-center`}></i>
          <span className="truncate">{t(item.labelKey)}</span>
        </NavLink>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile: nút mở menu điều hướng (dính ngay dưới Navbar) */}
      <div className="lg:hidden sticky top-16 z-30 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 shadow-sm">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t("admin.menu")}
          className="flex w-full max-w-lg mx-auto items-center justify-center gap-2 px-4 py-2 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50 font-bold text-sm hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white transition-colors duration-300 shadow-sm"
        >
          <i className="fa-solid fa-bars"></i>
          {t("admin.menu")}
        </button>
      </div>

      {/* Mobile: backdrop + drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 top-16 bg-slate-900/40 backdrop-blur-sm z-30 lg:hidden animate-fadeIn"
            onClick={() => setOpen(false)}
          />
          <div className="fixed top-16 left-0 bottom-0 w-72 max-w-[80vw] bg-white dark:bg-slate-800 z-40 lg:hidden shadow-2xl border-r border-slate-200/80 dark:border-slate-700 overflow-y-auto p-3 flex flex-col gap-1 animate-fadeIn">
            <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-slate-100 dark:border-slate-700">
              <span className="font-black uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400">
                {t("admin.dashboard_title")}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            {navLinks}
          </div>
        </>
      )}

      {/* Desktop: sidebar dọc cố định */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-16 h-[calc(100vh-4rem)] p-4">
        <nav className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[2rem] shadow-sm p-3 flex flex-col gap-1 h-full overflow-y-auto">
          {navLinks}
        </nav>
      </aside>
    </>
  );
}
