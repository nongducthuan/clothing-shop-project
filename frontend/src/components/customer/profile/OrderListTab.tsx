import React from "react";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";
import { useAutoCancelCountdown } from "../../../hooks/useAutoCancelCountdown";

export default function OrderListTab({ state, actions, helpers }) {
  const { orders, loadingOrders, cancellingOrderId, buyingAgainId } = state;
  const { setSelectedOrder, handleOpenPaymentModal, handleOpenReturnModal, handleCancelReturn, handleCancelOrder, handleBuyAgain } = actions;
  const { formatCurrency } = helpers;
  const { t, getLocalizedText, getLocalizedLabel, language } = useLanguage();

  if (loadingOrders) {
    return (
      <div className="flex justify-center py-20">
        <i className="fa-solid fa-circle-notch fa-spin text-3xl text-slate-300"></i>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-6">
        <i className="fa-solid fa-box-open text-4xl text-slate-300 dark:text-slate-600 mb-3"></i>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{t("orders.no_history", "You have no order history yet.")}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-5 animate-in fade-in duration-300">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          setSelectedOrder={setSelectedOrder}
          handleOpenPaymentModal={handleOpenPaymentModal}
          handleOpenReturnModal={handleOpenReturnModal}
          handleCancelReturn={handleCancelReturn}
          handleCancelOrder={handleCancelOrder}
          handleBuyAgain={handleBuyAgain}
          cancellingOrderId={cancellingOrderId}
          buyingAgainId={buyingAgainId}
          formatCurrency={formatCurrency}
          t={t}
          getLocalizedText={getLocalizedText}
          language={language}
        />
      ))}
    </div>
  );
}

// ─── Per-order card (sub-component so hooks run correctly per-order) ──────────
function OrderCard({
  order, setSelectedOrder, handleOpenPaymentModal, handleOpenReturnModal,
  handleCancelReturn, handleCancelOrder, handleBuyAgain,
  cancellingOrderId, buyingAgainId, formatCurrency, t, getLocalizedText, language,
}) {
  const totalItems = order.items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0;
  const itemsSummary = order.items?.map(item =>
    `${getLocalizedText(item, "product_name") || t("orders.items_count", "Item")} (x${item.quantity})`
  ).join(', ');

  // Countdown only meaningful for online-payment Pending+Unpaid orders
  const isOnlinePendingUnpaid =
    order.payment_status === "Unpaid" &&
    order.status === "Pending" &&
    ["momo", "vnpay"].includes(order.payment_method);

  const countdown = useAutoCancelCountdown(
    isOnlinePendingUnpaid ? order.created_at : null,
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-600 transition-all">
      <div>
        {/* Header: Order ID & Status */}
        <div className="flex justify-between items-start pb-3 mb-3 border-b border-slate-100 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t("orders.order_prefix")} #{order.id}
            </span>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-0.5">
               {new Date(order.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <ModernStatusBadge status={order.status} />
        </div>

        {/* Items Summary */}
        <div className="mb-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1" title={itemsSummary}>
            <i className="fa-solid fa-bag-shopping mr-1.5 text-slate-400 dark:text-slate-500"></i>
            {itemsSummary || `${totalItems} ${t("orders.items_count")}`}
          </p>
        </div>

        {/* Payment & Total Block */}
        <div className="bg-slate-50 dark:bg-slate-700/60 p-3.5 rounded-xl border border-slate-100/80 dark:border-slate-700 mb-4 space-y-2.5">
          {/* Hàng 1 */}
          <div className="flex justify-between items-center">
            <PaymentStatusBadge status={order.payment_status} />
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {t("orders.total", "Total")}
            </span>
          </div>

          {/* Hàng 2 */}
          <div className="flex justify-between items-center">
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
            <p className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none">
              {formatCurrency(order.total_price)}
            </p>
          </div>
        </div>
      </div>

      {/* Actions Button */}
      <div className="flex gap-2.5 pt-1">
        <button
          onClick={() => setSelectedOrder(order)}
          className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition-colors"
        >
          {t("orders.details", "Details")}
        </button>

        {order.payment_status === "Unpaid" && order.status !== "Cancelled" && (
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(order); }}
            className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm text-center flex flex-col items-center justify-center leading-tight"
          >
            <span>{t("orders.pay_change", "Pay / Change")}</span>
            {isOnlinePendingUnpaid && countdown && (
              <span className="text-[10px] font-medium opacity-80 mt-0.5">
                {t('orders.auto_cancel_warning', 'Tự hủy sau {time}').replace('{time}', countdown)}
              </span>
            )}
          </button>
        )}

        {order.status === "Delivered" && !order.return_request && (
          <button
            onClick={(e) => { e.stopPropagation(); handleOpenReturnModal(order); }}
            className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-medium text-xs sm:text-sm transition-colors"
          >
            {t("orders.return", "Return")}
          </button>
        )}

        {order.status === "Return Requested" && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCancelReturn(order.id); }}
            className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-medium text-xs sm:text-sm transition-colors"
          >
            {t("orders.cancel_return", "Cancel Return")}
          </button>
        )}

        {["Pending", "Confirmed"].includes(order.status) && !order.return_request && (
          <button
            onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
            disabled={cancellingOrderId === order.id}
            className="flex-1 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-medium text-xs sm:text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {cancellingOrderId === order.id ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              t("lookup.cancel_order", "Hủy đơn hàng")
            )}
          </button>
        )}

        {["Cancelled", "Delivered"].includes(order.status) && (
          <button
            onClick={(e) => { e.stopPropagation(); handleBuyAgain(order); }}
            disabled={buyingAgainId === order.id}
            className="flex-1 py-2.5 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-sm text-center disabled:opacity-60"
          >
            {buyingAgainId === order.id ? (
              <i className="fa-solid fa-circle-notch fa-spin"></i>
            ) : (
              <><i className="fa-solid fa-cart-plus mr-1"></i>{t("orders.buy_again", "Mua lại")}</>
            )}
          </button>
        )}
      </div>

    </div>
  );
}