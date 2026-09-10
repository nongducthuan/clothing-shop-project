import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { useDashboardStats } from "../../hooks/admin/useDashboard";
import { useLanguage } from "../../context/LanguageContext";

// --- SUB-COMPONENTS ---

/**
 * DashboardHeader Component
 * Minimal, pill-shaped title badge.
 */
const DashboardHeader = () => {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center md:justify-start mb-10">
      <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/80 rounded-full shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></div>
        <h2 className="font-bold uppercase text-gray-700 dark:text-slate-200 tracking-wider text-sm m-0 leading-none">
          {t("admin.dashboard_title")}
        </h2>
      </div>
    </div>
  );
};

/**
 * StatsPillGrid Component (THE SLIDING PILL UI)
 * Replaces the individual StatCards with a cohesive, 2D sliding segmented control.
 */
const StatsPillGrid = ({ stats, navigate }) => {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });
  const closeTimer = useRef(null);

  // Mapping the 8 stats into a structured array for rendering
  const statItems = [
    { id: 'stock', title: t('admin.total_stock'), value: stats.totalStock?.toLocaleString() || 0, sub: t('admin.available_products'), icon: 'fa-boxes-stacked', color: 'text-green-600 dark:text-emerald-400', route: '/admin/products', action: t('admin.manage_products') },
    { id: 'orders', title: t('admin.new_orders'), value: stats.orders || 0, sub: t('admin.need_processing'), icon: 'fa-file-invoice-dollar', color: 'text-yellow-500 dark:text-amber-400', route: '/admin/orders', action: t('admin.order_management') },
    { id: 'cats', title: t('admin.categories'), value: stats.categoriesCount || 0, sub: t('admin.add_edit_delete'), icon: 'fa-tags', color: 'text-gray-800 dark:text-slate-100', route: '/admin/categories', action: t('admin.category_management') },
    { id: 'banners', title: t('admin.banners'), value: stats.banners || 0, sub: t('admin.currently_displayed'), icon: 'fa-panorama', color: 'text-blue-600 dark:text-sky-400', route: '/admin/banners', action: t('admin.banner_management') },
    { id: 'vouchers', title: t('admin.active_vouchers'), value: stats.activeVouchers || 0, sub: t('admin.coupons_running'), icon: 'fa-ticket-simple', color: 'text-cyan-500 dark:text-cyan-400', route: '/admin/vouchers', action: t('admin.manage_vouchers') },
    { id: 'sales', title: t('admin.active_sales'), value: stats.activeSales || 0, sub: t('admin.discount_campaigns'), icon: 'fa-percent', color: 'text-red-500 dark:text-rose-400', route: '/admin/sales', action: t('admin.manage_sales') },
    { id: 'promos', title: t('admin.active_promotions'), value: stats.activePromotions || 0, sub: t('admin.buy_x_get_y'), icon: 'fa-gift', color: 'text-violet-500 dark:text-violet-400', route: '/admin/promotions', action: t('admin.manage_promotions') },
    { id: 'future', title: t('admin.coming_soon'), value: '...', sub: t('admin.future_feature'), icon: 'fa-pen', color: 'text-gray-300 dark:text-slate-600', route: '#', action: t('admin.stay_tuned') },
  ];

  const handleMouseEnter = (id, e) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setHoveredId(id);

    // Calculate 2D position (Left & Top) to support grid layout sliding
    if (e.currentTarget) {
      setPillStyle({
        left: e.currentTarget.offsetLeft,
        top: e.currentTarget.offsetTop,
        width: e.currentTarget.offsetWidth,
        height: e.currentTarget.offsetHeight,
        opacity: 1,
      });
    }
  };

  const handleMouseLeave = () => {
    closeTimer.current = setTimeout(() => {
      setHoveredId(null);
      setPillStyle((prev) => ({ ...prev, opacity: 0 }));
    }, 150);
  };

  return (
    <div
      className="relative bg-slate-200/80 dark:bg-slate-800/60 p-3 rounded-[2rem] border border-gray-200/80 dark:border-slate-700/80 shadow-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10 overflow-hidden"
      onMouseLeave={handleMouseLeave}
    >
      {/* The 2D Sliding Pill Background */}
      <div
        className="absolute bg-white dark:bg-slate-700/90 rounded-3xl shadow-md border border-gray-100 dark:border-slate-600 transition-all duration-300 ease-out pointer-events-none z-0"
        style={pillStyle}
      ></div>

      {statItems.map((item) => (
        <div
          key={item.id}
          onClick={() => item.route !== '#' && navigate(item.route)}
          onMouseEnter={(e) => handleMouseEnter(item.id, e)}
          className={`relative z-10 p-6 flex flex-col items-center text-center cursor-pointer transition-colors duration-300 ${
            item.route === '#' ? 'cursor-default opacity-60' : ''
          }`}
        >
          {/* Icon */}
          <i className={`fa-solid ${item.icon} text-3xl mb-4 transition-transform duration-300 ${hoveredId === item.id ? 'scale-110' : ''} ${item.color}`}></i>

          {/* Title & Value */}
          <h6 className="text-gray-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">
            {item.title}
          </h6>
          <h3 className={`font-extrabold text-3xl mb-1 ${item.color}`}>
            {item.value}
          </h3>
          <p className="text-gray-500 dark:text-slate-400 text-xs font-medium mb-4">
            {item.sub}
          </p>

          {/* Action Footer */}
          <div className="mt-auto pt-2">
            <span className={`text-xs font-bold transition-colors duration-300 ${
              hoveredId === item.id ? item.color : 'text-gray-500 dark:text-slate-400'
            }`}>
              {item.action} {item.route !== '#' && '→'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * RevenueBanner Component
 * Large, horizontal pill-shaped banner for the revenue report.
 */
const RevenueBanner = ({ onClick }) => {
  const { t } = useLanguage();
  return (
    <div
      onClick={onClick}
      className="group w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 md:px-10 md:py-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer mt-8 flex flex-col md:flex-row items-center justify-between gap-6"
    >
      <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
        <div className="w-16 h-16 rounded-full bg-cyan-50 dark:bg-cyan-950/50 flex items-center justify-center text-cyan-500 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
          <i className="fa-solid fa-chart-pie text-2xl"></i>
        </div>
        <div>
          <h6 className="text-gray-400 dark:text-slate-400 uppercase font-bold tracking-widest text-xs mb-1">
            {t("admin.revenue_report")}
          </h6>
          <h2 className="font-extrabold text-gray-800 dark:text-slate-100 text-2xl md:text-3xl">
            {t("admin.view_financial_insights")}
          </h2>
          <p className="text-gray-500 dark:text-slate-300 text-sm mt-1 max-w-md hidden md:block">
            {t("admin.revenue_description")}
          </p>
        </div>
      </div>
      <div className="px-6 py-3 bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 font-bold text-sm rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300 whitespace-nowrap">
        {t("admin.view_charts")} <i className="fa-solid fa-arrow-right ml-2"></i>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

/**
 * Dashboard Page Component.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const { stats } = useDashboardStats();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">
      <DashboardHeader />

      {/* 2D Sliding Pill Grid */}
      <StatsPillGrid stats={stats} navigate={navigate} />

      {/* Revenue Section */}
      <RevenueBanner onClick={() => navigate("/admin/report")} />
    </div>
  );
}
