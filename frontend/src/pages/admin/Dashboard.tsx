import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useDashboardStats } from "../../hooks/admin/useDashboard";

// --- SUB-COMPONENTS ---

/**
 * DashboardHeader Component
 * Minimal, pill-shaped title badge.
 */
const DashboardHeader = () => (
  <div className="flex justify-center md:justify-start mb-10">
    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm">
      <div className="w-2.5 h-2.5 rounded-full bg-violet-500 animate-pulse"></div>
      <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm m-0 leading-none">
        Admin Dashboard
      </h2>
    </div>
  </div>
);

/**
 * StatsPillGrid Component (THE SLIDING PILL UI)
 * Replaces the individual StatCards with a cohesive, 2D sliding segmented control.
 */
const StatsPillGrid = ({ stats, navigate }) => {
  const [hoveredId, setHoveredId] = useState(null);
  const [pillStyle, setPillStyle] = useState({ left: 0, top: 0, width: 0, height: 0, opacity: 0 });
  const closeTimer = useRef(null);

  // Mapping the 8 stats into a structured array for rendering
  const statItems = [
    { id: 'stock', title: 'Total Stock', value: stats.totalStock?.toLocaleString() || 0, sub: 'Available products', icon: 'fa-boxes-stacked', color: 'text-green-600', route: '/admin/products', action: 'Manage Products' },
    { id: 'orders', title: 'New Orders', value: stats.orders || 0, sub: 'Need immediate processing', icon: 'fa-file-invoice-dollar', color: 'text-yellow-500', route: '/admin/orders', action: 'View List' },
    { id: 'cats', title: 'Categories', value: stats.categoriesCount || 0, sub: 'Add, edit, delete', icon: 'fa-tags', color: 'text-gray-800', route: '/admin/categories', action: 'Go to' },
    { id: 'banners', title: 'Banners', value: stats.banners || 0, sub: 'Currently displayed', icon: 'fa-panorama', color: 'text-blue-600', route: '/admin/banners', action: 'Edit' },
    { id: 'vouchers', title: 'Active Vouchers', value: stats.activeVouchers || 0, sub: 'Coupons running', icon: 'fa-ticket-simple', color: 'text-cyan-500', route: '/admin/vouchers', action: 'Manage Vouchers' },
    { id: 'sales', title: 'Active Sales', value: stats.activeSales || 0, sub: 'Discount campaigns', icon: 'fa-percent', color: 'text-red-500', route: '/admin/sales', action: 'Manage Sales' },
    { id: 'promos', title: 'Active Promotions', value: stats.activePromotions || 0, sub: 'Buy X Get Y running', icon: 'fa-gift', color: 'text-violet-500', route: '/admin/promotions', action: 'Manage Promotions' },
    { id: 'future', title: 'Coming Soon', value: '...', sub: 'Future feature', icon: 'fa-pen', color: 'text-gray-300', route: '#', action: 'Stay tuned' },
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
      className="relative bg-gray-50/80 p-3 rounded-[2rem] border border-gray-100 shadow-inner grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-10 overflow-hidden"
      onMouseLeave={handleMouseLeave}
    >
      {/* The 2D Sliding Pill Background */}
      <div
        className="absolute bg-white rounded-3xl shadow-md border border-gray-100 transition-all duration-300 ease-out pointer-events-none z-0"
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
          <h6 className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">
            {item.title}
          </h6>
          <h3 className={`font-extrabold text-3xl mb-1 ${item.color}`}>
            {item.value}
          </h3>
          <p className="text-gray-400 text-xs font-medium mb-4">
            {item.sub}
          </p>

          {/* Action Footer */}
          <div className="mt-auto pt-2">
            <span className={`text-xs font-bold transition-colors duration-300 ${
              hoveredId === item.id ? item.color : 'text-gray-400'
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
const RevenueBanner = ({ onClick }) => (
  <div
    onClick={onClick}
    className="group w-full bg-white border border-gray-100 p-6 md:px-10 md:py-8 rounded-[2rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer mt-8 flex flex-col md:flex-row items-center justify-between gap-6"
  >
    <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
      <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
        <i className="fa-solid fa-chart-pie text-2xl"></i>
      </div>
      <div>
        <h6 className="text-gray-400 uppercase font-bold tracking-widest text-xs mb-1">
          Revenue Report
        </h6>
        <h2 className="font-extrabold text-gray-800 text-2xl md:text-3xl">
          View Financial Insights
        </h2>
        <p className="text-gray-500 text-sm mt-1 max-w-md hidden md:block">
          Access detailed statistics, historical data, and charts for total system revenue.
        </p>
      </div>
    </div>
    <div className="px-6 py-3 bg-cyan-50 text-cyan-600 font-bold text-sm rounded-full group-hover:bg-cyan-500 group-hover:text-white transition-colors duration-300 whitespace-nowrap">
      View Charts <i className="fa-solid fa-arrow-right ml-2"></i>
    </div>
  </div>
);

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
