import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";
import { isClosedOrderStatus } from "../../../utils/orderUtils";
import { useAutoCancelCountdown } from "../../../hooks/useAutoCancelCountdown";

export default function OrdersStep({
  orders, expandedOrder, toggleOrder, formatCurrency,
  handleRepay, handleOpenPaymentModal, loading, openReturnForm, handleCancelReturn, handleCancelOrder, handleBuyAgain, onReset
}) {
  const { t, getLocalizedText, getLocalizedLabel, language } = useLanguage();
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';
  const statusLabels = {
    'Pending': t('lookup.status_pending'),
    'Confirmed': t('lookup.status_confirmed'),
    'Shipping': t('lookup.status_shipping'),
    'Delivered': t('lookup.status_delivered'),
    'Cancelled': t('lookup.status_cancelled'),
    'Return Requested': t('lookup.status_return_requested'),
    'Return Rejected': t('lookup.status_return_rejected'),
    'Return Approved': t('lookup.status_return_approved')
  };
  const paymentLabels = { Paid: t('lookup.payment_paid'), Unpaid: t('lookup.payment_unpaid'), Refunded: t('lookup.payment_refunded') };
  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-10">
          <i className="fa-solid fa-box-open text-4xl text-gray-300 dark:text-slate-600 mb-3"></i>
          <p className="text-gray-500 dark:text-slate-400">{t("lookup.no_orders")}</p>
        </div>
      ) : (
        <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 space-y-4 custom-scrollbar">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expandedOrder={expandedOrder}
              toggleOrder={toggleOrder}
              formatCurrency={formatCurrency}
              handleOpenPaymentModal={handleOpenPaymentModal}
              loading={loading}
              openReturnForm={openReturnForm}
              handleCancelReturn={handleCancelReturn}
              handleCancelOrder={handleCancelOrder}
              handleBuyAgain={handleBuyAgain}
              t={t}
              getLocalizedText={getLocalizedText}
              getLocalizedLabel={getLocalizedLabel}
              language={language}
              statusLabels={statusLabels}
              paymentLabels={paymentLabels}
              dateLocale={dateLocale}
            />
          ))}
        </div>
      )}
      <button
        onClick={onReset}
        className="w-full mt-4 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 font-bold py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition"
      >
        {t("lookup.other_email")}
      </button>
    </div>
  );
}

// ─── Per-order row (sub-component so hooks run correctly per-order) ────────────
function OrderRow({
  order, expandedOrder, toggleOrder, formatCurrency,
  handleOpenPaymentModal, loading, openReturnForm, handleCancelReturn, handleCancelOrder, handleBuyAgain,
  t, getLocalizedText, getLocalizedLabel, language, statusLabels, paymentLabels, dateLocale,
}) {
  const isOnlinePendingUnpaid =
    order.payment_status === 'Unpaid' &&
    order.status === 'Pending' &&
    ['momo', 'vnpay'].includes(order.payment_method ?? '');
  const countdown = useAutoCancelCountdown(isOnlinePendingUnpaid ? order.created_at : null);

  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-700 shadow-sm">
      <div onClick={() => toggleOrder(order.id)} className="p-3.5 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 flex flex-col gap-2.5 transition">
        {/* ROW 1: Order ID + Status (Left) vs Total Price + Chevron (Right) */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">{t("lookup.order_no").replace("{id}", order.id)}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
              order.status === 'Delivered' ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' :
              order.status === 'Cancelled' ? 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
            }`}>
              {statusLabels[order.status] || order.status}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-bold text-violet-600 dark:text-violet-400 text-sm sm:text-base">
            <span>{formatCurrency(order.total_price)}</span>
            <i className={`fa-solid fa-chevron-${expandedOrder === order.id ? 'up' : 'down'} text-xs text-gray-400 dark:text-slate-500`}></i>
          </div>
        </div>

        {/* ROW 2: Date + Payment Method (Left) vs Payment Status (Right) */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-2">
            <span>{new Date(order.created_at).toLocaleDateString(dateLocale)}</span>
            <span>•</span>
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
          </div>
          <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
            order.payment_status === 'Paid'
              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700'
              : order.payment_status === 'Refunded'
              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-700'
              : isClosedOrderStatus(order.status)
              ? 'bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
              : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700'
          }`}>
            {order.payment_status === 'Unpaid' && isClosedOrderStatus(order.status)
              ? t('lookup.payment_not_collected')
              : paymentLabels[order.payment_status] || order.payment_status || t('lookup.payment_unpaid')}
          </span>
        </div>
      </div>

      {expandedOrder === order.id && (
        <div className="bg-gray-50 dark:bg-slate-800 p-3 sm:p-4 border-t border-gray-100 dark:border-slate-600 space-y-3 animate-fadeIn">
          {order.items?.map((item, idx) => (
            <div key={idx} className="flex gap-3 items-start sm:items-center">
              <img src={getImageUrl(item.image_url)} alt={getLocalizedText(item, "product_name") || item.product_name} className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-md border dark:border-slate-600 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(null) }} />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200 leading-tight">{getLocalizedText(item, "product_name") || item.product_name}</h4>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                  <span className="bg-white dark:bg-slate-700 border border-gray-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-300">
                    {t("lookup.color_label", "Màu")}: {getLocalizedText(item, "color_name") || item.color_name || item.color || "N/A"}
                  </span>
                  <span className="bg-white dark:bg-slate-700 border border-gray-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-300">
                    {t("lookup.size_label", "Size")}: {item.size || "N/A"}
                  </span>
                  <span className="text-gray-500 dark:text-slate-400">x{item.quantity}</span>
                </div>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 flex-shrink-0">{formatCurrency(item.price)}</p>
            </div>
          ))}

          {/* CUSTOMER & SHIPPING DETAILS */}
          <div className="mt-3 pt-3 border-t border-dashed border-gray-300 dark:border-slate-600 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
              <div>
                <span className="text-gray-400 dark:text-slate-400 block text-[11px]">{t("lookup.customer_name")}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{order.name || t('lookup.guest')}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-slate-400 block text-[11px]">{t("lookup.phone")}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{order.phone || t('lookup.none')}</span>
              </div>
              <div className="sm:col-span-2 pt-1 mt-1 border-t border-gray-100 dark:border-slate-600/50">
                <span className="text-gray-400 dark:text-slate-400 block text-[11px]">{t("lookup.shipping_address")}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200 break-words">{order.address || t('lookup.none')}</span>
              </div>
            </div>

            {/* Order Financial Breakdown Summary */}
            {(() => {
              const itemsSubtotal = order.items?.reduce((sum: number, item: any) => {
                if (item.is_gift) return sum;
                return sum + (Number(item.price || 0) * (item.quantity || 1));
              }, 0) || 0;
              const shippingFee = Number(order.shipping_fee || 0);
              const voucherCode = order.voucher?.code || order.voucher_code;
              const discountAmount = Math.max(0, (itemsSubtotal + shippingFee) - Number(order.total_price || 0));
              return (
                <div className="bg-white dark:bg-slate-700/80 p-3 rounded-lg border border-gray-100 dark:border-slate-600 space-y-2 text-xs">
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
                      <span className="shrink-0">
                        {t("checkout.discount", "Giảm giá")}{voucherCode ? ` (${voucherCode})` : ""}:
                      </span>
                      <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 dark:border-slate-600 font-bold text-gray-800 dark:text-slate-100">
                    <span>{t('order_details.total', 'Tổng tiền')}:</span>
                    <span className="text-violet-600 dark:text-violet-400 text-sm">{formatCurrency(order.total_price)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons Section */}
            {(() => {
              const showPay = order.payment_status === 'Unpaid' && order.status !== 'Cancelled';
              const showCancelOrder = ["Pending", "Confirmed"].includes(order.status) && !order.return_request && Boolean(handleCancelOrder);
              const showReturn = order.status === 'Delivered' && !order.return_request;
              const showCancelReturn = (order.status === 'Return Requested' || Boolean(order.return_request)) && Boolean(handleCancelReturn);
              const showBuyAgain = ["Cancelled", "Delivered"].includes(order.status) && Boolean(handleBuyAgain);

              const renderPayBtn = (fullWidth = true) => (
                <button
                  key="pay"
                  onClick={() => handleOpenPaymentModal(order)}
                  disabled={loading}
                  className={`${fullWidth ? "w-full mt-3" : "flex-1"} bg-slate-900 dark:bg-violet-600 hover:bg-slate-800 dark:hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-bold transition flex flex-col items-center justify-center`}
                >
                  {loading ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <>
                      <span>{t("lookup.pay_or_change")}</span>
                      {isOnlinePendingUnpaid && countdown && (
                        <span className="text-[10px] font-medium opacity-80 mt-0.5">
                          {t('orders.auto_cancel_warning', 'Tự hủy sau {time}').replace('{time}', countdown)}
                        </span>
                      )}
                    </>
                  )}
                </button>
              );

              const renderCancelOrderBtn = (fullWidth = true) => (
                <button
                  key="cancelOrder"
                  onClick={() => handleCancelOrder && handleCancelOrder(order.id)}
                  disabled={loading}
                  className={`${fullWidth ? "w-full mt-3" : "flex-1"} bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 py-2.5 rounded-lg text-xs sm:text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <><i className="fa-solid fa-xmark"></i> {t("lookup.cancel_order")}</>
                  )}
                </button>
              );

              const renderReturnBtn = (fullWidth = true) => (
                <button
                  key="return"
                  onClick={() => openReturnForm(order)}
                  className={`${fullWidth ? "w-full mt-3" : "flex-1"} bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-700 py-2.5 rounded-lg text-sm font-bold hover:bg-orange-100 dark:hover:bg-orange-900/50 transition flex items-center justify-center gap-2`}
                >
                  <i className="fa-solid fa-rotate-left"></i> {t("lookup.request_return")}
                </button>
              );

              const renderBuyAgainBtn = (fullWidth = true) => (
                <button
                  key="buyAgain"
                  onClick={() => handleBuyAgain && handleBuyAgain(order)}
                  disabled={loading}
                  className={`${fullWidth ? "w-full mt-3" : "flex-1"} bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <i className="fa-solid fa-circle-notch fa-spin"></i>
                  ) : (
                    <><i className="fa-solid fa-cart-plus"></i> {t("orders.buy_again", "Mua lại")}</>
                  )}
                </button>
              );

              return (
                <div className="space-y-2">
                  {/* Return request status details if present */}
                  {showCancelReturn && (
                    <div className="mt-3 space-y-2">
                      {order.return_request ? (
                        <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-xs space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <i className="fa-solid fa-rotate-left text-amber-600 dark:text-amber-400 shrink-0"></i>
                              <span className="font-semibold text-amber-900 dark:text-amber-300 truncate">
                                {t("order_details.return_summary", "Yêu cầu đổi trả")}
                              </span>
                              {order.return_request.reason_code && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 shrink-0 hidden sm:inline-block">
                                  {getLocalizedLabel("returnReason", order.return_request.reason_code) || order.return_request.reason_code}
                                </span>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1.5 hidden sm:inline">{t("order_details.estimated_refund", "Hoàn dự kiến:")}</span>
                              <span className="font-bold text-amber-700 dark:text-amber-300 text-xs sm:text-sm">
                                {formatCurrency(order.return_request.refund_amount || 0)}
                              </span>
                            </div>
                          </div>
                          {order.return_request.items && order.return_request.items.length > 0 && (
                            <div className="space-y-1.5 border-t border-amber-200/60 dark:border-amber-900/50 pt-2">
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('order_details.returned_items_title', 'Sản phẩm yêu cầu trả:')}</p>
                              {order.return_request.items.map((ri: any, rIdx: number) => {
                                const pName = getLocalizedText(ri, "product_name") || ri.product_name || `Sản phẩm #${ri.order_item_id}`;
                                const cName = getLocalizedText(ri, "color_name") || ri.color_name;
                                return (
                                  <div key={rIdx} className="flex justify-between items-start bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 gap-2">
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-medium text-slate-800 dark:text-slate-200">{pName}</span>
                                        {ri.is_gift && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                                            <i className="fa-solid fa-gift" />
                                            {t("lookup.gift_item_badge", "Quà tặng")}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-slate-400">
                                        {[cName, ri.size, `x${ri.return_quantity}`].filter(Boolean).join(" | ")}
                                      </span>
                                    </div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                                      {formatCurrency(ri.refund_amount)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {order.return_request.admin_response ? (
                            <div className="mt-2 bg-white/60 dark:bg-slate-800/60 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/30">
                              <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 block mb-0.5">
                                {t('order_details.admin_response', 'Phản hồi từ Admin:')}
                              </span>
                              <p className="text-xs text-slate-700 dark:text-slate-300">
                                {["Approved", "Rejected", "Rejected by admin", "Manually approved by admin", "Manually rejected by admin"].includes(order.return_request.admin_response)
                                  ? t(`api_msg.${order.return_request.admin_response}`, order.return_request.admin_response)
                                  : order.return_request.admin_response}
                              </p>
                            </div>
                          ) : order.return_request.status === "Approved" ? (
                            <div className="mt-2 bg-emerald-50 dark:bg-emerald-900/30 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <i className="fa-solid fa-circle-check"></i>
                                {t('order_details.return_approved_note', 'Yêu cầu đổi trả đã được chấp nhận. Shop sẽ liên hệ để hoàn tiền.')}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-center rounded-lg text-xs font-bold border border-orange-100 dark:border-orange-700 flex items-center justify-center gap-2">
                          <i className="fa-solid fa-spinner animate-spin"></i> {t("lookup.return_processing")}
                        </div>
                      )}
                      <button
                        onClick={() => handleCancelReturn && handleCancelReturn(order.id)}
                        disabled={loading}
                        className="w-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-xmark"></i> {t("lookup.cancel_return")}
                      </button>
                    </div>
                  )}

                  {/* 2-button combinations (50:50 row) */}
                  {showPay && showCancelOrder && (
                    <div className="flex gap-2 mt-3">
                      {renderPayBtn(false)}
                      {renderCancelOrderBtn(false)}
                    </div>
                  )}

                  {showReturn && showBuyAgain && (
                    <div className="flex gap-2 mt-3">
                      {renderReturnBtn(false)}
                      {renderBuyAgainBtn(false)}
                    </div>
                  )}

                  {/* Single buttons */}
                  {showPay && !showCancelOrder && renderPayBtn(true)}
                  {showCancelOrder && !showPay && renderCancelOrderBtn(true)}
                  {showReturn && !showBuyAgain && renderReturnBtn(true)}
                  {showBuyAgain && !showReturn && renderBuyAgainBtn(true)}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}