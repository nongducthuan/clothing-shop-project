import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";
import { useToast } from "../../../context/ToastContext";
import { CartContext } from "../../../context/CartContext.jsx";
import { buyAgainFromOrder, applySubstitutions, SubstitutionSuggestion, VariantChoice } from "../../../utils/buyAgainUtils";
import BuyAgainVariantModal from "../common/BuyAgainVariantModal";
import { useAutoCancelCountdown } from "../../../hooks/useAutoCancelCountdown";

// Format datetime deterministically as "HH:mm:ss dd/mm/yyyy" (Vietnamese style).
// Avoids locale/browser-dependent output like mm/dd/yyyy (en-US).
const formatOrderDateTime = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "N/A";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export default function OrderDetailModal({ order, onClose, onOpenPaymentModal, actions, state, helpers }) {
  const { t, getLocalizedText, getLocalizedLabel, language } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { setCart } = useContext(CartContext);
  const [buyingAgain, setBuyingAgain] = useState(false);
  const [substitutions, setSubstitutions] = useState<SubstitutionSuggestion[] | null>(null);

  // Countdown for Pending+Unpaid online orders (hook must be called unconditionally)
  const isOnlinePendingUnpaid =
    order?.payment_status === "Unpaid" &&
    order?.status === "Pending" &&
    ["momo", "vnpay"].includes(order?.payment_method ?? "");
  const countdown = useAutoCancelCountdown(isOnlinePendingUnpaid ? order?.created_at : null);

  if (!order) return null;
  const { formatCurrency, getImgUrl } = helpers;

  // "Buy Again": re-add this order's items (current prices/stock) into the cart
  const handleBuyAgain = async () => {
    if (!order) return;
    setBuyingAgain(true);
    try {
      const summary = await buyAgainFromOrder(order, setCart);
      if (summary.addedCount > 0) {
        if (summary.skippedNames.length > 0) {
          showToast(t("orders.buy_again_partial").replace("{count}", String(summary.addedCount)).replace("{skipped}", summary.skippedNames.join(", ")), "warning");
        } else {
          showToast(t("orders.buy_again_success").replace("{count}", String(summary.addedCount)), "success");
        }
      }
      if (summary.substitutions.length > 0) {
        // Mở modal cho khách chọn variant thay thế — điều hướng giỏ hàng sau khi xác nhận
        setSubstitutions(summary.substitutions);
        return;
      }
      if (summary.addedCount === 0) {
        showToast(summary.skippedNames.length ? t("orders.buy_again_none") : t("orders.buy_again_empty"), "warning");
        return;
      }
      onClose();
      navigate("/cart");
    } catch (error) {
      console.error("Buy again error:", error);
      showToast(t("orders.buy_again_none"), "error");
    } finally {
      setBuyingAgain(false);
    }
  };

  // Xác nhận các variant thay thế đã chọn trong BuyAgainVariantModal
  const handleConfirmSubstitutions = (selections: Array<{ suggestion: SubstitutionSuggestion; choice: VariantChoice }>) => {
    applySubstitutions(setCart, selections);
    if (selections.length > 0) {
      showToast(t("orders.buy_again_substituted", "Đã thêm sản phẩm thay thế vào giỏ hàng"), "success");
    }
    setSubstitutions(null);
    onClose();
    navigate("/cart");
  };

  const itemsSubtotal = order.items?.reduce((sum: number, item: { is_gift?: boolean; price?: number | string; quantity?: number | string }) => {
    if (item.is_gift) return sum;
    return sum + (Number(item.price || 0) * Number(item.quantity || 1));
  }, 0) || 0;
  const shippingFee = Number(order.shipping_fee || 0);
  const voucherCode = order.voucher?.code || order.voucher_code;
  const discountAmount = Math.max(0, (itemsSubtotal + shippingFee) - Number(order.total_price || 0));

  return (
    <>
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-md sm:max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg">{t('order_details.title', 'Đơn hàng')} #{order.id}</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {formatOrderDateTime(order.created_at)}
              </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 flex items-center justify-center transition-colors shadow-sm shrink-0"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 sm:space-y-6">
          
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2 items-center">
            <ModernStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.payment_status} orderStatus={order.status} />
          </div>

          {/* Item List */}
          <div className="space-y-2.5 sm:space-y-3">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{t('order_details.items', 'Sản phẩm')}</p>
            {order.items?.map((item, idx) => {
              const rawImage = item.image || item.image_url || item.color_image || item.product_image;
              const safeImgSrc = rawImage
                ? getImgUrl(rawImage)
                : "https://via.placeholder.com/150?text=No+Image";

              return (
                <div key={idx} className="flex gap-3 sm:gap-4 items-center bg-slate-50/70 dark:bg-slate-700/50 p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
                  {/* Ảnh sản phẩm */}
                  <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-lg overflow-hidden border border-slate-200/60 dark:border-slate-600 bg-white dark:bg-slate-700">
                      <img
                        src={safeImgSrc}
                        alt={getLocalizedText(item, "product_name") || t("product.no_desc", "Product")}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = "https://via.placeholder.com/150?text=No+Image";
                      }}
                    />
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 min-w-0">
                    <h4
                      className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2"
                      title={getLocalizedText(item, "product_name") || item.product_name}
                    >
                      {getLocalizedText(item, "product_name") || item.product_name}
                    </h4>
                    
                    {/* Badge thuộc tính */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {t('order_details.color_label', 'Color')}: {getLocalizedText(item, "color_name") || item.color_name || item.color || "N/A"}
                      </span>
                      <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {t('order_details.size_label', 'Size')}: {item.size || item.size_name || "N/A"}
                      </span>
                      {item.is_gift && (
                         <span className="bg-amber-100 dark:bg-amber-900/60 border border-amber-200/80 dark:border-amber-700 px-1.5 py-0.5 rounded text-amber-700 dark:text-amber-300 flex items-center gap-1">
                           <i className="fa-solid fa-gift" /> {t("lookup.gift_item_badge", "Quà tặng")}
                         </span>
                      )}
                    </div>
                  </div>

                  {/* Giá tiền & Số lượng */}
                  <div className="text-right shrink-0 flex flex-col items-end justify-center">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                      {formatCurrency(item.price)}
                    </p>
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="bg-slate-50/70 dark:bg-slate-700/50 p-3.5 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
            <p className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('order_details.summary', 'Tóm tắt đơn hàng')}</p>
            
            <div className="flex justify-between items-start gap-3">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.customer_name', 'Tên khách hàng')}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
                {order.name || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-start gap-3">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.shipping_address', 'Địa chỉ giao hàng')}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
                {order.address || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.payment_method', 'Phương thức thanh toán')}</span>
              <PaymentBadge method={order.payment_method} badgeStyle={true} />
            </div>

            <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 dark:border-slate-600 pt-2.5 sm:pt-3">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.subtotal', 'Tiền hàng')}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatCurrency(itemsSubtotal)}
              </span>
            </div>

            {shippingFee > 0 ? (
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.shipping_fee', 'Phí vận chuyển')}</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(shippingFee)}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center gap-3">
                <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.shipping_fee', 'Phí vận chuyển')}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{t('checkout.free', 'Miễn phí')}</span>
              </div>
            )}

            {discountAmount > 0 && (
              <div className="flex justify-between items-center gap-3 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="shrink-0">
                  {t('checkout.discount', 'Giảm giá')}{voucherCode ? ` (${voucherCode})` : ''}:
                </span>
                <span className="font-bold whitespace-nowrap">
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 dark:border-slate-600 pt-2 sm:pt-2.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('order_details.total', 'Tổng tiền')}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base whitespace-nowrap">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>

          {/* Return Request Info Section (if exists) */}
          {order.return_request && (
            <div className="bg-amber-50/60 dark:bg-amber-950/40 p-3.5 sm:p-5 rounded-xl border border-amber-200/70 dark:border-amber-900/50 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center">
                <p className="text-[11px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  {t('order_details.return_summary', 'Thông tin yêu cầu đổi trả')}
                </p>
                {order.return_request.reason_code && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                    {getLocalizedLabel("returnReason", order.return_request.reason_code) || order.return_request.reason_code}
                  </span>
                )}
              </div>

              {/* Returned Items List */}
              {order.return_request.items && order.return_request.items.length > 0 && (
                <div className="space-y-1.5 border-t border-amber-200/60 dark:border-amber-900/50 pt-2">
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{t('order_details.returned_items_title', 'Sản phẩm yêu cầu trả:')}</p>
                  {order.return_request.items.map((ri: Record<string, unknown>, rIdx: number) => {
                    const pName = getLocalizedText(ri, "product_name") || ri.product_name || `Sản phẩm #${ri.order_item_id}`;
                    const cName = getLocalizedText(ri, "color_name") || ri.color_name;
                    return (
                      <div key={rIdx} className="flex justify-between items-start text-xs bg-white/70 dark:bg-slate-800/70 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 gap-2">
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

              <div className="flex justify-between items-center border-t border-amber-200/60 dark:border-amber-900/50 pt-2">
                <div>
                  <span className="text-slate-600 dark:text-slate-400 font-medium block">{t('order_details.estimated_refund', 'Số tiền hoàn dự kiến:')}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 italic block">{t('lookup.no_shipping_refund_note', '*Không hoàn lại phí vận chuyển')}</span>
                </div>
                <span className="font-bold text-amber-700 dark:text-amber-300 text-sm">
                  {formatCurrency(order.return_request.refund_amount || 0)}
                </span>
              </div>

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

          {/* Action Buttons Section */}
          {(() => {
            const showPay = order.payment_status === "Unpaid" && order.status !== "Cancelled" && Boolean(onOpenPaymentModal);
            const showCancelOrder = ["Pending", "Confirmed"].includes(order.status) && !order.return_request && Boolean(actions?.handleCancelOrder);
            const showReturn = order.status === "Delivered" && !order.return_request && Boolean(actions?.handleOpenReturnModal);
            const showCancelReturn = order.status === "Return Requested" && Boolean(actions?.handleCancelReturn);
            const showBuyAgain = ["Cancelled", "Delivered"].includes(order.status);

            const renderPayBtn = (fullWidth = true) => (
              <button
                key="pay"
                onClick={() => {
                  onClose();
                  onOpenPaymentModal(order);
                }}
                className={`${fullWidth ? "w-full" : "flex-1"} py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-md text-center flex flex-col items-center justify-center leading-tight`}
              >
                <span>{t('order_details.pay_change', 'Thanh toán / Đổi phương thức')}</span>
                {isOnlinePendingUnpaid && countdown && (
                  <span className="text-[10px] font-medium opacity-80 mt-0.5">
                    {t('orders.auto_cancel_warning', 'Tự hủy sau {time}').replace('{time}', countdown)}
                  </span>
                )}
              </button>
            );

            const renderCancelOrderBtn = (fullWidth = true) => (
              <button
                key="cancelOrder"
                onClick={() => { onClose(); actions.handleCancelOrder(order.id); }}
                disabled={state?.cancellingOrderId === order.id}
                className={`${fullWidth ? "w-full" : "flex-1"} py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-semibold text-xs sm:text-sm transition-colors text-center flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {state?.cancellingOrderId === order.id ? (
                  <i className="fa-solid fa-circle-notch fa-spin" />
                ) : (
                  <><i className="fa-solid fa-ban" /> {t("lookup.cancel_order", "Hủy đơn hàng")}</>
                )}
              </button>
            );

            const renderReturnBtn = (fullWidth = true) => (
              <button
                key="return"
                onClick={() => { onClose(); actions.handleOpenReturnModal(order); }}
                className={`${fullWidth ? "w-full" : "flex-1"} py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs sm:text-sm transition-colors text-center flex items-center justify-center gap-2`}
              >
                <i className="fa-solid fa-rotate-left" /> {t("orders.return", "Đổi trả")}
              </button>
            );

            const renderCancelReturnBtn = (fullWidth = true) => (
              <button
                key="cancelReturn"
                onClick={() => { onClose(); actions.handleCancelReturn(order.id); }}
                className={`${fullWidth ? "w-full" : "flex-1"} py-3 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl font-semibold text-xs sm:text-sm transition-colors text-center flex items-center justify-center gap-2`}
              >
                <i className="fa-solid fa-xmark" /> {t("orders.cancel_return", "Hủy yêu cầu đổi trả")}
              </button>
            );

            const renderBuyAgainBtn = (fullWidth = true) => (
              <button
                key="buyAgain"
                onClick={handleBuyAgain}
                disabled={buyingAgain}
                className={`${fullWidth ? "w-full" : "flex-1"} py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-md text-center flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {buyingAgain ? (
                  <i className="fa-solid fa-circle-notch fa-spin" />
                ) : (
                  <><i className="fa-solid fa-cart-plus" /> {t("orders.buy_again", "Mua lại")}</>
                )}
              </button>
            );

            // Pair 1: Unpaid + Pending/Confirmed -> Pay + Cancel Order
            if (showPay && showCancelOrder) {
              return (
                <div className="flex gap-2">
                  {renderPayBtn(false)}
                  {renderCancelOrderBtn(false)}
                </div>
              );
            }

            // Pair 2: Delivered + No Return Request -> Return + Buy Again
            if (showReturn && showBuyAgain) {
              return (
                <div className="flex gap-2">
                  {renderReturnBtn(false)}
                  {renderBuyAgainBtn(false)}
                </div>
              );
            }

            // Pair 3: Delivered + Cancel Return Requested -> Cancel Return + Buy Again
            if (showCancelReturn && showBuyAgain) {
              return (
                <div className="flex gap-2">
                  {renderCancelReturnBtn(false)}
                  {renderBuyAgainBtn(false)}
                </div>
              );
            }

            // Single buttons
            if (showPay) return renderPayBtn(true);
            if (showCancelOrder) return renderCancelOrderBtn(true);
            if (showReturn) return renderReturnBtn(true);
            if (showCancelReturn) return renderCancelReturnBtn(true);
            if (showBuyAgain) return renderBuyAgainBtn(true);

            return null;
          })()}

        </div>
      </div>
    </div>

      {/* Variant replacement modal */}
      {substitutions && substitutions.length > 0 && (
        <BuyAgainVariantModal
          substitutions={substitutions}
          onConfirm={handleConfirmSubstitutions}
          onClose={() => setSubstitutions(null)}
        />
      )}
    </>
  );
}
