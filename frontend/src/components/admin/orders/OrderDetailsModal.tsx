import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";
import { isClosedOrderStatus } from "../../../utils/orderUtils";
import ReturnInfoSection from "./ReturnInfoSection";

export default function OrderDetailsModal({ order, onClose, formatCurrency }) {
  const { t } = useLanguage();
  if (!order) return null;

  const isReturnRequest = ["Return Requested", "Return_Requested", "Return Approved", "Return_Approved", "Return Rejected", "Return_Rejected"].includes(order.status);

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-scaleIn relative overflow-hidden">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
          <h4 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3 m-0 leading-none">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm">
              <i className="fa-solid fa-receipt"></i>
            </div>
            {t("admin.order_code")} #{order.id}
          </h4>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-100 dark:hover:bg-red-950/50 hover:text-red-500 dark:hover:text-red-400 rounded-full transition-colors outline-none"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 md:p-6 overflow-y-auto custom-scrollbar flex flex-col gap-4 md:gap-6">
          {isReturnRequest && <ReturnInfoSection order={order} formatCurrency={formatCurrency} />}
          <DeliveryInfoSection order={order} />
          <OrderItemsList items={order.items} formatCurrency={formatCurrency} />

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
              <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 p-5 rounded-2xl space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>{t("admin.items_subtotal", "Tiền hàng")}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(itemsSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span>{t('order_details.shipping_fee', 'Phí vận chuyển')}:</span>
                  {shippingFee > 0 ? (
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(shippingFee)}</span>
                  ) : (
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{t('checkout.free', 'Miễn phí')}</span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      {t("checkout.discount", "Giảm giá")}{voucherCode ? ` (${voucherCode})` : ""}:
                    </span>
                    <span className="font-bold">-{formatCurrency(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 dark:border-slate-600">
                  <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest text-sm">{t("cart.total")}</span>
                  <span className="text-xl font-black text-red-600 dark:text-rose-400">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB COMPONENTS (SRP applied)
// ==========================================

const DeliveryInfoSection = ({ order }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';
  return (
    <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 md:p-5 rounded-[1.5rem] border border-blue-100/50 dark:border-blue-900/40 text-sm">
      <h5 className="font-bold text-blue-800 dark:text-blue-300 mb-4 uppercase text-xs tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-truck-fast text-blue-500 dark:text-blue-400 text-base"></i> {t("admin.delivery_details")}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 bg-white dark:bg-slate-700 p-4 md:p-5 rounded-2xl border border-blue-50 dark:border-slate-600 shadow-sm">
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.recipient")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100">{order.user_name || order.name}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.phone")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100">{order.phone}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.shipping_address")}</span>
          <span className="font-bold text-gray-800 dark:text-slate-100">{order.address}</span>
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
              <span className="text-green-600 dark:text-emerald-300 font-extrabold bg-green-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px]">
                <i className="fa-solid fa-check-circle"></i> {t("admin.paid_badge")}
              </span>
            ) : order.payment_status === "Refunded" ? (
              <span className="text-purple-600 dark:text-purple-300 font-extrabold bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px]">
                <i className="fa-solid fa-rotate-left"></i> {t("admin.refunded_badge", "Đã hoàn tiền")}
              </span>
            ) : isClosedOrderStatus(order.status) ? (
              <span className="text-slate-500 dark:text-slate-400 font-extrabold bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px]">
                <i className="fa-solid fa-circle-minus"></i> {t("payment_status.not_collected", "Chưa thu tiền")}
              </span>
            ) : (
              <span className="text-orange-600 dark:text-amber-300 font-extrabold bg-orange-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px]">
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
    <div>
      <h5 className="font-bold text-gray-800 dark:text-slate-200 mb-4 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-basket-shopping text-gray-400 dark:text-slate-500 text-base"></i> {t("admin.ordered_products")} ({items?.length || 0})
      </h5>
      <div className="space-y-3">
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

  return (
    <div className={`flex gap-3 md:gap-4 rounded-2xl p-3 items-center shadow-sm transition-all border ${
      isGift ? "bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-violet-100 dark:hover:border-violet-900/50 hover:shadow-md"
    }`}>
      {/* Cố định kích thước khung ảnh để tránh bị giật layout */}
      <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${isGift ? 'border-2 border-white dark:border-rose-900/50 shadow-sm' : 'bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600'}`}>
        <img
          src={imageUrl}
          onError={(e) => {
            (e.target as HTMLImageElement).onerror = null;
            (e.target as HTMLImageElement).src = getImageUrl(null);
          }}
          alt={getLocalizedText(item, "product_name") || item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-extrabold text-gray-800 dark:text-slate-100 truncate mb-0.5">
          {getLocalizedText(item, "product_name") || item.product_name}
        </h4>

        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
          {(getLocalizedText(item, "color_name") || item.color_name) && `${t("admin.color_label")}: ${getLocalizedText(item, "color_name") || item.color_name}`}
          {(getLocalizedText(item, "color_name") || item.color_name) && item.size && <span className="mx-1.5 text-gray-300 dark:text-slate-600">|</span>}
          {item.size && `${t("admin.size_label")}: ${item.size}`}
        </p>

        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[10px] bg-gray-100 dark:bg-slate-600 px-2.5 py-1 rounded-full font-bold text-gray-600 dark:text-slate-200 uppercase tracking-wider">
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
