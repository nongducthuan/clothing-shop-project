import React from "react";
import { getImageUrl, PLACEHOLDER_IMG } from "../../../utils/imageUtils";
import { PaymentBadge } from "../../common/PaymentBadge";
import { ModernStatusBadge, PaymentStatusBadge } from "../profile/OrderBadges";
import { useLanguage } from "../../../context/LanguageContext";
import { balanceReturnItemsRefund } from "../../../utils/orderUtils";
import { useAutoCancelCountdown } from "../../../hooks/useAutoCancelCountdown";

type ReturnItemImages = {
  color?: { image_url?: string };
  product?: { image_url?: string };
};

export default function OrdersStep({
  orders, expandedOrder, toggleOrder, formatCurrency,
  handleOpenPaymentModal, loading, openReturnForm, handleCancelReturn, handleCancelOrder, handleBuyAgain, onReset
}) {
  const { t, getLocalizedText, getLocalizedLabel, language } = useLanguage();
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';
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
  t, getLocalizedText, getLocalizedLabel, dateLocale,
}) {
  const isOnlinePendingUnpaid =
    order.payment_status === 'Unpaid' &&
    order.status === 'Pending' &&
    ['momo', 'vnpay'].includes(order.payment_method ?? '');
  const countdown = useAutoCancelCountdown(isOnlinePendingUnpaid ? order.created_at : null);

  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-700 shadow-sm">
      <div onClick={() => toggleOrder(order.id)} className="p-3.5 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 flex flex-col gap-2.5 transition"><div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">{t("lookup.order_no").replace("{id}", order.id)}</span>
            <ModernStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            <span>{formatCurrency(order.total_price)}</span>
            <i className={`fa-solid fa-chevron-${expandedOrder === order.id ? 'up' : 'down'} text-xs text-gray-400 dark:text-slate-500`}></i>
          </div>
        </div><div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-2">
            <span>{new Date(order.created_at).toLocaleDateString(dateLocale)}</span>
            <span>•</span>
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
          </div>
          <PaymentStatusBadge status={order.payment_status} orderStatus={order.status} />
        </div>
      </div>

      {expandedOrder === order.id && (
        <div className="bg-gray-50 dark:bg-slate-800 p-3 sm:p-4 border-t border-gray-100 dark:border-slate-600 space-y-3 animate-fadeIn">
          
                      {order.return_request && ( <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 rounded-xl text-xs space-y-2">
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
                              {balanceReturnItemsRefund(order.return_request.items, order.return_request.refund_amount).map((ri: Record<string, unknown>, rIdx: number) => {
                                const pName = getLocalizedText(ri, "product_name") || ri.product_name || `Sản phẩm #${ri.order_item_id}`;
                                const cName = getLocalizedText(ri, "color_name") || ri.color_name;
                                const originalItem = order.items?.find((item) => item.id === ri.order_item_id);
                                const oi = ri.order_item as ReturnItemImages | undefined;
                                const rawImg = (originalItem?.image || originalItem?.image_url || originalItem?.color_image || originalItem?.product_image || oi?.color?.image_url || oi?.product?.image_url || ri.image || ri.image_url || ri.color_image || ri.product_image) as string | undefined;
                                const safeImgSrc = getImageUrl(rawImg);
                                return (
                                  <div key={rIdx} className="flex justify-between items-start bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 gap-2.5">
                                    <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 border border-slate-200/60 dark:border-slate-600 bg-white dark:bg-slate-700">
                                      <img
                                        src={safeImgSrc}
                                        alt={pName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).onerror = null;
                                          (e.target as HTMLImageElement).src = PLACEHOLDER_IMG;
                                        }}
                                      />
                                    </div>
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span 
                                          className="font-medium text-slate-800 dark:text-slate-200 line-clamp-2"
                                          title={pName}
                                        >{pName}</span>
                                        {ri.is_gift && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0">
                                            <i className="fa-solid fa-gift" />
                                            {t("lookup.gift_item_badge", "Quà tặng")}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                        {cName && <span className="bg-white/80 dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{t('order_details.color_label', 'Màu')}: {cName}</span>}
                                        {ri.size && <span className="bg-white/80 dark:bg-slate-700/80 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{t('order_details.size_label', 'Size')}: {ri.size}</span>}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end justify-center text-right shrink-0">
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {ri.is_gift ? formatCurrency(0) : formatCurrency(ri.refund_amount)}
                                      </span>
                                      {ri.refund_amount != null && (
                                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                                          {ri.is_gift ? `${formatCurrency(0)} × ${ri.return_quantity}` : `${formatCurrency(Math.round(Number(ri.refund_amount) / Number(ri.return_quantity)))} x ${ri.return_quantity}`}
                                        </span>
                                      )}
                                    </div>
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
                        )}
          {/* Sản phẩm gốc */}
          <div className="bg-white dark:bg-slate-700/40 p-3.5 sm:p-4 rounded-xl border border-gray-100 dark:border-slate-600">
            <h5 className="font-bold text-gray-800 dark:text-slate-200 mb-3 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
              <i className="fa-solid fa-basket-shopping text-gray-400 dark:text-slate-500 text-base"></i> {t("order_details.items", "Sản phẩm")} ({order.items?.length || 0})
            </h5>
            <div className="space-y-2.5">
              {order.items?.map((item, idx) => {
                const isGiftItem = Boolean(item?.is_gift);
                return (
                <div key={idx} className="flex gap-3 items-center bg-white dark:bg-slate-700/60 p-2.5 sm:p-3 rounded-lg border border-gray-100 dark:border-slate-600">
                <img src={getImageUrl(item.image_url)} alt={getLocalizedText(item, "product_name") || item.product_name} className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-md border dark:border-slate-600 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(null) }} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-800 dark:text-slate-200 leading-tight line-clamp-2" title={getLocalizedText(item, "product_name") || item.product_name}>
                    {getLocalizedText(item, "product_name") || item.product_name}
                  </h4>
                  {isGiftItem && (
                    <span className="inline-flex w-fit items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0 align-middle">
                      <i className="fa-solid fa-gift" />
                      {t("lookup.gift_item_badge", "Quà tặng")}
                    </span>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-gray-500 dark:text-slate-400">
                    <span className="bg-white dark:bg-slate-700 border border-gray-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-300">
                      {t("lookup.color_label", "Màu")}: {getLocalizedText(item, "color_name") || item.color_name || item.color || "N/A"}
                    </span>
                    <span className="bg-white dark:bg-slate-700 border border-gray-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-slate-300">
                      {t("lookup.size_label", "Size")}: {item.size || "N/A"}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  {isGiftItem ? (
                    <>
                      <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-300 whitespace-nowrap">{formatCurrency(0)}</p>
                      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap">{formatCurrency(0)} × {item.quantity}</span>
                    </>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-slate-100 whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</p>
                      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap">{formatCurrency(item.price)} x {item.quantity}</span>
                    </>
                  )}
                </div>
              </div>
                );
              })}
            </div>
          </div>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white dark:bg-slate-700 p-3 rounded-lg border border-gray-100 dark:border-slate-600">
              <div>
                <span className="text-gray-400 dark:text-slate-400 block text-[11px]">{t("lookup.customer_name")}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{order.name || t('lookup.guest')}</span>
              </div>
              <div>
                <span className="text-gray-400 dark:text-slate-400 block text-[11px]">{t("lookup.phone")}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200">{order.phone || t('lookup.none')}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-gray-400 dark:text-slate-400 block text-[11px]">{t("lookup.shipping_address")}</span>
                <span className="font-semibold text-gray-800 dark:text-slate-200 break-words">{order.address || t('lookup.none')}</span>
              </div>
            </div>{(() => {
              const itemsSubtotal = order.items?.reduce((sum: number, item: { is_gift?: boolean; price?: number | string; quantity?: number | string }) => {
                if (item.is_gift) return sum;
                return sum + (Number(item.price || 0) * Number(item.quantity || 1));
              }, 0) || 0;
              const shippingFee = Number(order.shipping_fee || 0);
              const voucherCode = order.voucher?.code || order.voucher_code;
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
                  {Number(order.membership_discount || 0) > 0 && (
                    <div className="flex justify-between items-center text-gray-500 dark:text-slate-400 font-medium">
                      <span>{t("cart.member_discount", "Giảm giá thành viên")}:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(Number(order.membership_discount))}</span>
                    </div>
                  )}
                  {Number(order.voucher_discount || 0) > 0 && (
                    <div className="flex justify-between items-center text-gray-500 dark:text-slate-400 font-medium">
                      <span>{t("cart.voucher_discount", "Giảm giá voucher")}{voucherCode ? ` (${voucherCode})` : ""}:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(Number(order.voucher_discount))}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200/60 dark:border-slate-600 font-bold text-gray-800 dark:text-slate-100">
                    <span>{t('order_details.total', 'Tổng tiền')}:</span>
                    <span className="text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(order.total_price)}</span>
                  </div>
                </div>
              );
            })()}{(() => {
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
                <div className="space-y-2">{showCancelReturn && (
                    <div className="mt-3 space-y-2">
                      <button
                        onClick={() => handleCancelReturn && handleCancelReturn(order.id)}
                        disabled={loading}
                        className="w-full bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 py-2 rounded-lg text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/50 transition flex items-center justify-center gap-1.5"
                      >
                        <i className="fa-solid fa-xmark"></i> {t("lookup.cancel_return")}
                      </button>
                    </div>
                  )}{showPay && showCancelOrder && (
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
                  )}{showPay && !showCancelOrder && renderPayBtn(true)}
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



