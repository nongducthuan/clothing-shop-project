import React, { useState } from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";
import ReturnInfoSection from "./ReturnInfoSection";

import { PAYMENT_OPTIONS, STATUS_OPTIONS, isStatusAllowed, isStatusFlowLocked } from "../../../utils/orderUtils";

// Status-flow guard (Pending -> Confirmed -> Shipping -> Delivered | Cancelled)
// lives in useOrderManager so the desktop table and the mobile cards share one rule set.

export default function OrderTable({
  orders,
  getOrderStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  handlePaymentStatus,
  handleOrderStatus,
  handleApproveReturn,
  handleRejectReturn,
  filters // Nhận filters từ props
}) {
  const { t, getLocalizedLabel } = useLanguage();
  const {
    activeTab,
    handleTabSwitch,
    currentFilters,
    currentActiveFilter,
    setCurrentFilter,
    displayedOrders,
  } = filters;

  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const toggleExpand = (orderId) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  const onTabSwitch = (tab) => {
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
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="p-4 pl-6 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.order_code")} / {t("admin.order_date")}</th>
                <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.customer")}</th>
                <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("cart.total")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.payment_status")}</th>
                <th className="p-4 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.order_status")}</th>
                <th className="p-4 pr-6 text-center text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-36">{t("admin.actions")}</th>
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
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      {/* --- DÒNG CHÍNH (MAIN ROW) --- */}
                      <tr className={`transition-colors duration-200 group ${isExpanded ? "bg-blue-50/30 dark:bg-blue-950/20" : "hover:bg-slate-50/60 dark:hover:bg-slate-700/30"}`}>
                        <td className="p-4 pl-6 whitespace-nowrap">
                          <div className="text-sm font-extrabold text-slate-800 dark:text-slate-100">#{order.id}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{new Date(order.created_at).toLocaleDateString("en-GB")}</div>
                        </td>

                        <td className="p-4">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100">{order.user_name || order.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{order.phone}</div>
                        </td>

                        <td className="p-4 whitespace-nowrap text-sm text-red-600 dark:text-rose-400 font-black">
                          {formatCurrency(order.total_price)}
                        </td>

                        <td className="p-4 whitespace-nowrap text-center">
                          <div className="relative inline-block w-[175px]">
                            <select
                              value={order.payment_status || "Unpaid"}
                              onChange={(e) => handlePaymentStatus(order.id, e.target.value)}
                              disabled={isReturnLocked}
                              className="w-full text-[11px] font-bold text-white py-2 pl-3.5 pr-7 rounded-full cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/20 disabled:opacity-60 appearance-none text-left shadow-sm transition-all"
                              style={{ backgroundColor: getPaymentStatusColor(order.payment_status) }}
                            >
                              {PAYMENT_OPTIONS.map((status) => (
                                <option key={status} value={status} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800">
                                  {t(`payment_status.${status.toLowerCase().replace(/\s+/g, '_')}`, status)}
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
                              disabled={isReturnLocked || isStatusFlowLocked(order.status)}
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

                        <td className="p-4 pr-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {isReturnLocked && (
                              <>
                                <button onClick={() => handleApproveReturn(order.id)} title={t("admin.approve_return")} className="w-9 h-9 flex items-center justify-center bg-green-50 dark:bg-emerald-950/50 text-green-600 dark:text-emerald-400 rounded-full hover:bg-green-500 hover:text-white dark:hover:bg-emerald-600 dark:hover:text-white transition-colors shadow-sm">
                                  <i className="fa-solid fa-check text-sm"></i>
                                </button>
                                <button onClick={() => handleRejectReturn(order.id)} title={t("admin.reject_return")} className="w-9 h-9 flex items-center justify-center bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-colors shadow-sm">
                                  <i className="fa-solid fa-xmark text-sm"></i>
                                </button>
                              </>
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
                        <tr className="bg-gray-50/50 dark:bg-slate-700/30">
                          <td colSpan={6} className="p-0 border-b border-gray-100 dark:border-slate-700">
                            <div className="p-6 sm:p-8 animate-fadeIn">
                              <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col gap-8">

                                {/* Header Details */}
                                <h4 className="text-xl font-extrabold text-gray-800 dark:text-slate-100 flex items-center gap-3 border-b border-gray-50 dark:border-slate-700 pb-4 m-0 leading-none">
                                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm">
                                    <i className="fa-solid fa-receipt"></i>
                                  </div>
                                  {t("admin.order_details")} #{order.id}
                                </h4>

                                {/* Return Info (Nếu có) */}
                                {["Return Requested", "Return_Requested", "Return Approved", "Return_Approved", "Return Rejected", "Return_Rejected"].includes(order.status) && (
                                  <ReturnInfoSection order={order} formatCurrency={formatCurrency} />
                                )}

                                {/* Giao hàng & Sản phẩm */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                  <DeliveryInfoSection order={order} />
                                  <OrderItemsList items={order.items} formatCurrency={formatCurrency} />
                                </div>

                                {/* Footer Total */}
                                {(() => {
                                  const itemsSubtotal = order.items?.reduce((sum: number, item: any) => {
                                    if (item.is_gift) return sum;
                                    return sum + (Number(item.price || 0) * (item.quantity || 1));
                                  }, 0) || 0;
                                  const shippingFee = Number(order.shipping_fee || 0);
                                  const voucherCode = order.voucher?.code || order.voucher_code;
                                  const discountAmount = Math.max(0, (itemsSubtotal + shippingFee) - Number(order.total_price || 0));

                                  return (
                                    <div className="pt-4 mt-2 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 p-6 rounded-[1.5rem] space-y-2 text-xs sm:text-sm">
                                      <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
                                        <span>{t('order_details.subtotal', 'Tiền hàng')}:</span>
                                        <span className="font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(itemsSubtotal)}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-gray-500 dark:text-slate-400">
                                        <span>{t('order_details.shipping_fee', 'Phí vận chuyển')}:</span>
                                        {shippingFee > 0 ? (
                                          <span className="font-semibold text-gray-800 dark:text-slate-200">{formatCurrency(shippingFee)}</span>
                                        ) : (
                                          <span className="font-medium text-emerald-600 dark:text-emerald-400">{t('checkout.free', 'Miễn phí')}</span>
                                        )}
                                      </div>
                                      {discountAmount > 0 && (
                                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                                          <span className="flex items-center gap-1.5">
                                            <i className="fa-solid fa-ticket text-xs"></i>
                                            {t("checkout.discount", "Giảm giá")}{voucherCode ? ` (${voucherCode})` : ""}:
                                          </span>
                                          <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between items-center pt-3 border-t border-gray-200/60 dark:border-slate-600">
                                        <span className="font-bold text-gray-700 dark:text-slate-300 uppercase tracking-widest text-sm">{t("cart.total")}</span>
                                        <span className="text-2xl font-black text-red-600 dark:text-rose-400">
                                          {formatCurrency(order.total_price)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}

                              </div>
                            </div>
                          </td>
                        </tr>
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

// ==========================================
// THÀNH PHẦN CHI TIẾT ĐƯỢC TÍCH HỢP TRỰC TIẾP
// ==========================================

const DeliveryInfoSection = ({ order }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-GB';
  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-6 rounded-[1.5rem] border border-blue-100/50 dark:border-blue-900/30 text-sm h-full flex flex-col">
      <h5 className="font-bold text-blue-800 dark:text-blue-200 mb-5 uppercase text-xs tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-truck-fast text-blue-500 dark:text-blue-400 text-base"></i> {t("admin.delivery_details")}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 bg-white dark:bg-slate-700 p-6 rounded-2xl border border-blue-50 dark:border-slate-600 shadow-sm flex-1">
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.recipient")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100 text-base">{order.user_name || order.name}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.phone")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100 text-base">{order.phone}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.shipping_address")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100 leading-relaxed">{order.address}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.placed_on")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100">{new Date(order.created_at).toLocaleString(dateLocale)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.payment_method")}</span>
          <div className="flex items-center gap-2">
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
            {order.payment_status === "Paid" ? (
              <span className="text-green-600 dark:text-emerald-400 font-extrabold bg-green-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px] border border-green-100 dark:border-emerald-900/40">
                <i className="fa-solid fa-check-circle"></i> {t("admin.paid_badge")}
              </span>
            ) : (
              <span className="text-orange-600 dark:text-orange-400 font-extrabold bg-orange-50 dark:bg-orange-950/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px] border border-orange-100 dark:border-orange-900/40">
                <i className="fa-solid fa-clock"></i> {t("admin.awaiting_badge")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderItemsList = ({ items, formatCurrency }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-gray-50/50 dark:bg-slate-700/40 p-6 rounded-[1.5rem] border border-gray-100 dark:border-slate-700 h-full flex flex-col">
      <h5 className="font-bold text-gray-800 dark:text-slate-100 mb-5 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-basket-shopping text-gray-400 dark:text-slate-500 text-base"></i> {t("admin.ordered_products")} ({items?.length || 0})
      </h5>
      <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[350px]">
        {items?.map((item, idx) => (
          <OrderItemCard key={idx} item={item} formatCurrency={formatCurrency} />
        ))}
      </div>
    </div>
  );
};

const OrderItemCard = ({ item, formatCurrency }) => {
  const { t, getLocalizedText } = useLanguage();
  const imageUrl = getImageUrl(item.image_url);

  const isGift = Boolean(item.is_gift);
  const colorDisplay = getLocalizedText(item, "color_name") || item.color_name;

  return (
    <div className={`flex gap-4 rounded-2xl p-4 items-center shadow-sm transition-all border ${
      isGift ? "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-violet-100 hover:shadow-md"
    }`}>
      <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${isGift ? 'border-2 border-white shadow-sm' : 'bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600'}`}>
        <img
          src={imageUrl}
          onError={(e) => ((e.target as HTMLImageElement).src = getImageUrl(null))}
          alt={getLocalizedText(item, "product_name") || item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <h4 className="text-sm font-extrabold text-gray-800 dark:text-slate-100 truncate mb-1">
          {getLocalizedText(item, "product_name") || item.product_name}
        </h4>

        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-3">
          {colorDisplay && <>{t("admin.color_label", "Color:")} {colorDisplay}</>}
          {colorDisplay && item.size && <span className="mx-1.5 text-gray-300 dark:text-slate-600">|</span>}
          {item.size && <>{t("admin.size_label", "Size:")} {item.size}</>}
        </p>

        <div className="flex justify-between items-center">
          <span className="text-[10px] bg-gray-100 dark:bg-slate-600 px-3 py-1 rounded-full font-bold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
            {t("admin.qty_label")}: {item.quantity}
          </span>

          {isGift ? (
            <div className="flex items-center gap-2">
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                {t("admin.free_gift")}
              </span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">0 đ</span>
            </div>
          ) : (
            <span className="text-sm font-black text-gray-900 dark:text-slate-100">
              {formatCurrency(item.price * item.quantity)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
