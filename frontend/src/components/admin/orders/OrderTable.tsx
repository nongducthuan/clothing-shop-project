import React, { useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import OrderExpandedRow from "./OrderExpandedRow";

import { PAYMENT_OPTIONS, STATUS_OPTIONS, isStatusAllowed, isStatusFlowLocked, isClosedOrderStatus, isPaymentAllowed } from "../../../utils/orderUtils";
import type { OrderDisplayProps } from "./orderTypes";

// Status-flow guard (Pending -> Confirmed -> Shipping -> Delivered | Cancelled)
// lives in useOrderManager so the desktop table and the mobile cards share one rule set.

export default function OrderTable({
  getOrderStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  handlePaymentStatus,
  handleOrderStatus,
  handleApproveReturn,
  handleRejectReturn,
  onUndoApproveReturn,
  filters // Nhận filters từ props
}: OrderDisplayProps) {
  const { t } = useLanguage();
  const {
    activeTab,
    handleTabSwitch,
    currentFilters,
    currentActiveFilter,
    setCurrentFilter,
    displayedOrders,
  } = filters;

  const [expandedOrderId, setExpandedOrderId] = useState<number | string | null>(null);

  const toggleExpand = (orderId: number | string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const onTabSwitch = (tab: "Standard" | "Returns") => {
    handleTabSwitch(tab);
    setExpandedOrderId(null); // Đóng hàng đang mở khi chuyển tab
  };

  return (
    <div className="hidden md:flex flex-col gap-6">

      {/* ================= HEADER: TABS & FILTERS ================= */}
      <div className="bg-slate-50/50 dark:bg-slate-700/40 p-5 md:p-6 rounded-[2rem] shadow-xs border border-slate-200/80 dark:border-slate-700 flex flex-col gap-5">

        {/* TABS */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-xl flex items-center gap-3 m-0 leading-none">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-table-list"></i>
            </div>
            {t("admin.order_management")}
          </h3>

          <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 rounded-full shadow-inner">
            <button
              onClick={() => onTabSwitch("Standard")}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ease-out flex items-center gap-2 ${
                activeTab === "Standard"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm scale-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 scale-95"
              }`}
            >
              <i className="fa-solid fa-box"></i> {t("admin.orders")}
            </button>
            <button
              onClick={() => onTabSwitch("Returns")}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ease-out flex items-center gap-2 ${
                activeTab === "Returns"
                  ? "bg-white dark:bg-slate-800 text-orange-600 dark:text-amber-400 shadow-sm scale-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 scale-95"
              }`}
            >
              <i className="fa-solid fa-rotate-left"></i> {t("order_status.return_pending")}
            </button>
          </div>
        </div>

        {/* FILTERS CHO TAB HIỆN TẠI */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-200/80 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider py-2 mr-2">{t("search.filters")}:</span>
          {currentFilters.map((f) => {
            const statusKey = f === "All" || f === "all" ? "order_status.all" : `order_status.${f.toLowerCase().replace(/\s+/g, '_')}`;
            return (
              <button
                key={f}
                onClick={() => setCurrentFilter(f)}
                className={`px-4 py-1.5 rounded-full font-bold text-xs transition-all duration-300 ease-out ${
                  currentActiveFilter === f
                    ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                }`}
              >
                {t(statusKey, f)}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= BẢNG DỮ LIỆU CHÍNH ================= */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700 rounded-[2rem] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.order_code")} / {t("admin.order_date")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.customer")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("cart.total")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.payment_status")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.order_status")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">

              {/* NẾU KHÔNG CÓ ĐƠN HÀNG */}
              {displayedOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-16 text-center">
                    <div className="w-20 h-20 bg-slate-50 dark:bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200/80 dark:border-slate-600 shadow-inner">
                      <i className="fa-solid fa-folder-open text-slate-300 dark:text-slate-500 text-3xl"></i>
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">{t("admin.system_is_empty")}</h4>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                      {t("search.no_items_desc")}
                    </p>
                  </td>
                </tr>
              ) : (
                /* HIỂN THỊ DANH SÁCH ĐƠN HÀNG */
                displayedOrders.map((order) => {
                  const isReturnLocked = ["Return Requested", "Return_Requested"].includes(order.status);
                  const isReturnApproved = ["Return Approved", "Return_Approved"].includes(order.status);
                  // Đơn đã hoàn tác duyệt nhầm: status về Delivered nhưng return_request còn
                  // Pending (chờ duyệt lại) → hiện lại nút Chấp nhận/Từ chối.
                  const isPendingRedo = order.status === "Delivered" && order.return_status === "Pending";
                  // Nút Chấp nhận/Từ chối CHỈ nằm ở tab "Chờ duyệt đổi trả" — tab Quản lý Đơn
                  // hàng giữ thuần luồng giao hàng, không trộn quyết định đổi trả vào.
                  const showReturnActions = activeTab === "Returns" && (isReturnLocked || isPendingRedo);
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      {/* --- DÒNG CHÍNH (MAIN ROW) --- */}
                      <tr className={`transition-colors duration-200 group ${isExpanded ? "bg-blue-50/30 dark:bg-blue-950/20" : "hover:bg-slate-50/60 dark:hover:bg-slate-700/30"}`}>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">#{order.id}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.created_at ? new Date(order.created_at).toLocaleDateString("en-GB") : ""}</div>
                        </td>

                        <td className="p-4 text-center">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{order.user_name || order.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.phone}</div>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap text-sm text-red-600 dark:text-rose-400 font-black">
                          {formatCurrency(order.total_price)}
                        </td>

                        <td className="p-4 whitespace-nowrap text-center">
                          <div className="relative inline-block w-[175px]">
                            <select
                              value={order.payment_status || "Unpaid"}
                              onChange={(e) => handlePaymentStatus(order.id, e.target.value)}
                              disabled={isReturnLocked}
                              className="w-full text-[11px] font-bold text-white py-2 pl-3.5 pr-7 rounded-full cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-left shadow-sm transition-all"
                              style={{ backgroundColor: getPaymentStatusColor(order.payment_status || "Unpaid") }}
                            >
                              {PAYMENT_OPTIONS.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  disabled={!isPaymentAllowed(order.payment_status || "Unpaid", status, order.status)}
                                  className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 disabled:text-gray-300 disabled:dark:text-slate-600 disabled:bg-gray-50 disabled:dark:bg-slate-900"
                                >
                                  {status === "Unpaid" && isClosedOrderStatus(order.status)
                                    ? t("payment_status.not_collected", "Chưa thu tiền")
                                    : t(`payment_status.${status.toLowerCase().replace(/\s+/g, '_')}`, status)}
                                </option>
                              ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none text-[10px]"></i>
                          </div>
                        </td>

                        <td className="p-4 whitespace-nowrap text-center">
                          <div className="relative inline-block w-[175px]">
                            <select
                              value={order.status}
                              onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                              disabled={isStatusFlowLocked(order.status)}
                              className="w-full text-[11px] font-bold text-white py-2 pl-3.5 pr-7 rounded-full cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-left shadow-sm transition-all"
                              style={{ backgroundColor: getOrderStatusColor(order.status) }}
                            >
                              {STATUS_OPTIONS.map((status) => (
                                <option
                                  key={status}
                                  value={status}
                                  disabled={!isStatusAllowed(order.status, status)}
                                  className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 disabled:text-gray-300 disabled:dark:text-slate-600 disabled:bg-gray-50 disabled:dark:bg-slate-900"
                                >
                                  {t(`order_status.${status.toLowerCase().replace(/\s+/g, '_')}`, status)}
                                </option>
                              ))}
                            </select>
                            <i className="fa-solid fa-chevron-down absolute right-2.5 top-1/2 -translate-y-1/2 text-white/80 pointer-events-none text-[10px]"></i>
                          </div>
                        </td>

                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {showReturnActions && (
                              <>
                                <button onClick={() => handleApproveReturn(order.id)} title={t("admin.approve_return")} className="w-9 h-9 flex items-center justify-center bg-green-50 dark:bg-emerald-950/50 text-green-600 dark:text-emerald-400 rounded-full hover:bg-green-500 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors shadow-sm">
                                  <i className="fa-solid fa-check text-sm"></i>
                                </button>
                                <button onClick={() => handleRejectReturn(order.id)} title={t("admin.reject_return")} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors shadow-sm">
                                  <i className="fa-solid fa-xmark text-sm"></i>
                                </button>
                              </>
                            )}
                            {isReturnApproved && (
                              <button
                                onClick={() => onUndoApproveReturn(order)}
                                title={t("admin.undo_approve_btn", "Hoàn tác duyệt nhầm")}
                                className="w-9 h-9 flex items-center justify-center bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-full hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 dark:hover:text-white transition-colors shadow-sm"
                              >
                                <i className="fa-solid fa-rotate-left text-sm"></i>
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(order.id)}
                              className={`px-4 py-2 rounded-full font-bold text-xs transition-all duration-300 shadow-sm flex items-center gap-2 ${
                                isExpanded ? "bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900" : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white"
                              }`}
                            >
                              {isExpanded ? t("common.close") : t("admin.details")}
                              <i className={`fa-solid fa-chevron-down transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}></i>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* --- DÒNG MỞ RỘNG (EXPANDABLE DETAILS) --- */}
                      {isExpanded && (
                        <OrderExpandedRow order={order} formatCurrency={formatCurrency} />
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
