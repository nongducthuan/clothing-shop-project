import React, { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";

import { PAYMENT_OPTIONS, STATUS_OPTIONS } from "../../../hooks/admin/useOrderManager";

export default function OrderCard({
  orders,
  getOrderStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  handleOrderStatus,
  handlePaymentStatus,
  onViewDetails,
  handleApproveReturn,
  handleRejectReturn,
  filters // Nhận filters từ props
}) {
  const { t } = useLanguage();
  const {
    activeTab,
    handleTabSwitch,
    currentFilters,
    currentActiveFilter,
    setCurrentFilter,
    displayedOrders,
  } = filters;

  return (
    <div className="md:hidden space-y-4">

      {/* === TAB SWITCHER === */}
      <div className="inline-flex w-full p-1.5 bg-gray-100 dark:bg-slate-800 rounded-2xl shadow-inner">
        <button
          onClick={() => handleTabSwitch("Standard")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${activeTab === "Standard"
            ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
        >
          <i className="fa-solid fa-box text-xs"></i> {t("admin.orders")}
        </button>
        <button
          onClick={() => handleTabSwitch("Returns")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5 ${activeTab === "Returns"
            ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
            : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
            }`}
        >
          <i className="fa-solid fa-rotate-left text-xs"></i> {t("order_status.return_pending")}
        </button>
      </div>

      {/* === STATUS FILTER CHIPS (Scrollable horizontally) === */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1">
        <div className="flex gap-2 w-max">
          {currentFilters.map((f) => {
            const statusKey = f === "All" || f === "all" ? "order_status.all" : `order_status.${f.toLowerCase().replace(/\s+/g, '_')}`;
            return (
              <button
                key={f}
                onClick={() => setCurrentFilter(f)}
                className={`px-3.5 py-1.5 rounded-full font-bold text-xs whitespace-nowrap transition-all ${currentActiveFilter === f
                  ? "bg-gray-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
              >
                {t(statusKey, f)}
              </button>
            );
          })}
        </div>
      </div>

      {/* === ORDER CARDS === */}
      {displayedOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
          <div className="w-16 h-16 bg-gray-50 dark:bg-slate-700 rounded-full flex items-center justify-center mb-3 shadow-inner">
            <i className="fa-solid fa-folder-open text-gray-300 dark:text-slate-500 text-2xl"></i>
          </div>
          <p className="font-bold text-gray-700 dark:text-slate-100 text-base">{t("admin.system_is_empty")}</p>
          <p className="text-xs text-gray-400 dark:text-slate-400 mt-1">{t("search.no_items_desc")}</p>
        </div>
      ) : (
        displayedOrders.map((order) => {
          const isReturnLocked = order.status === "Return Requested";

          return (
            <div key={order.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-3.5">

              {/* Header: ID & Date & Payment Method */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-extrabold text-gray-800 dark:text-slate-100 text-base">#{order.id}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-400 font-medium mt-0.5">
                    {new Date(order.created_at).toLocaleString("en-GB")}
                  </p>
                </div>
                <PaymentBadge method={order.payment_method} badgeStyle={true} />
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 dark:bg-slate-700/60 px-3.5 py-3 rounded-xl">
                <p className="text-sm font-bold text-gray-800 dark:text-slate-100">{order.user_name || order.name}</p>
                <p className="text-xs text-gray-400 dark:text-slate-400 mt-0.5">{order.phone || t("admin.no_phone")}</p>
              </div>

              {/* Return Action Section */}
              {isReturnLocked && (
                <div className="p-3.5 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-orange-500/30">
                  <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase mb-2.5 text-center tracking-wider flex items-center justify-center gap-1">
                    <AlertTriangle size={14} /> {t("order_status.return_requested")}
                  </p>
                  <div className="flex gap-2.5">
                    <button
                      onClick={() => handleApproveReturn(order.id)}
                      className="flex-1 bg-green-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-green-600 shadow-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> {t("admin.approve_return")}
                    </button>
                    <button
                      onClick={() => handleRejectReturn(order.id)}
                      className="flex-1 bg-red-500 text-white py-2.5 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 shadow-sm transition-colors flex items-center justify-center gap-1"
                    >
                      <X size={12} /> {t("admin.reject_return")}
                    </button>
                  </div>
                </div>
              )}

              {/* Status Controls */}
              <div className="flex flex-col gap-3">
                <div className="text-center">
                  <span className="text-red-600 dark:text-red-400 font-black text-xl">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>

                <div className="flex flex-col gap-2.5">
                  <select
                    value={order.payment_status || "Unpaid"}
                    onChange={(e) => handlePaymentStatus(order.id, e.target.value)}
                    disabled={isReturnLocked}
                    className="w-full min-w-0 text-xs font-bold text-white py-2.5 px-4 rounded-full outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-center shadow-sm cursor-pointer"
                    style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
                  >
                    {PAYMENT_OPTIONS.map((s) => (
                      <option key={s} value={s} className="text-gray-800 bg-white dark:text-slate-100 dark:bg-slate-800">
                        {t(`payment_status.${s.toLowerCase().replace(/\s+/g, '_')}`, s)}
                      </option>
                    ))}
                  </select>

                  <select
                    value={order.status}
                    onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                    disabled={isReturnLocked}
                    className="w-full min-w-0 text-xs font-bold text-white py-2.5 px-4 rounded-full outline-none text-center appearance-none shadow-sm disabled:opacity-60 cursor-pointer"
                    style={{ backgroundColor: getOrderStatusColor(order.status) }}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-white text-gray-800 dark:bg-slate-800 dark:text-slate-100 text-center">
                        {t(`order_status.${s.toLowerCase().replace(/\s+/g, '_')}`, s)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => onViewDetails(order)}
                    className="w-full bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm inline-flex items-center justify-center"
                  >
                    {t("admin.order_details")}
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
