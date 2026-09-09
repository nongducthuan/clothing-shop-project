import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";

export default function OrderDetailsModal({ order, onClose, formatCurrency }) {
  const { t } = useLanguage();
  if (!order) return null;

  const isReturnRequest = ["Return Requested", "Return Approved", "Return Rejected"].includes(order.status);

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
          {isReturnRequest && <ReturnInfoSection order={order} />}
          <DeliveryInfoSection order={order} />
          <OrderItemsList items={order.items} formatCurrency={formatCurrency} />

          {/* Footer Total */}
          <div className="flex justify-between items-center pt-6 mt-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 p-6 rounded-2xl">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-sm">{t("cart.total")}</span>
            <span className="text-xl font-black text-red-600 dark:text-rose-400">
              {formatCurrency(order.total_price)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SUB COMPONENTS (SRP applied)
// ==========================================

const ReturnInfoSection = ({ order }) => {
  const { t } = useLanguage();
  const bankInfo = order.refund_bank_info;

  const getReturnBadge = (status: string) => {
    if (status === "Return Approved") {
      return (
        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-300/40 whitespace-nowrap inline-flex items-center shrink-0">
          {t("admin.return_approved_badge")}
        </span>
      );
    }
    if (status === "Return Rejected") {
      return (
        <span className="text-[9px] font-extrabold uppercase tracking-widest bg-rose-100 text-rose-800 px-2.5 py-1 rounded-full border border-rose-300/40 whitespace-nowrap inline-flex items-center shrink-0">
          {t("admin.return_rejected_badge")}
        </span>
      );
    }
    return (
      <span className="text-[9px] font-extrabold uppercase tracking-widest bg-amber-200/60 text-amber-800 px-2.5 py-1 rounded-full border border-amber-300/40 whitespace-nowrap inline-flex items-center shrink-0">
        {t("admin.return_action_required")}
      </span>
    );
  };

  return (
    <div className="bg-gradient-to-r from-amber-50/60 via-orange-50/40 to-amber-50/60 p-4 sm:p-5 rounded-[1.5rem] border border-amber-200/60 text-sm shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h5 className="font-extrabold text-amber-900 text-[11px] sm:text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none whitespace-nowrap">
          <span className="w-6 h-6 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center text-[10px] shadow-xs shrink-0">
            <i className="fa-solid fa-rotate-left"></i>
          </span>
          {t("admin.return_request_details")}
        </h5>
        {getReturnBadge(order.status)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Lý do trả hàng */}
        <div className="bg-white dark:bg-slate-700 p-4 rounded-2xl shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              {t("admin.return_reason")}
            </span>
            <span className="inline-block bg-slate-100 dark:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-extrabold px-2.5 py-1 rounded-lg border border-slate-200/60">
              {order.reason_code || t("admin.not_specified")}
            </span>
          </div>

          <div>
            <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
              {t("admin.customer_note")}
            </span>
            <div className="bg-slate-50 dark:bg-slate-600 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-200 italic leading-relaxed min-h-[45px] flex items-center">
              "{order.description || t("admin.no_description")}"
            </div>
          </div>
        </div>

        {/* Thẻ Ngân hàng ATM */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-4 rounded-2xl shadow-lg relative overflow-hidden flex flex-col gap-2">
          <div className="absolute -right-4 -bottom-4 text-white/5 text-7xl pointer-events-none">
            <i className="fa-solid fa-building-columns"></i>
          </div>

          <div className="flex justify-between items-center relative z-10">
            <span className="text-[9px] uppercase font-bold text-slate-400 tracking-widest flex items-center gap-1.5">
              <i className="fa-solid fa-credit-card text-indigo-400"></i> {t("admin.refund_account")}
            </span>
            <i className="fa-solid fa-wifi text-slate-500 text-[10px] rotate-90"></i>
          </div>

          {bankInfo ? (
            <div className="relative z-10 space-y-0.5">
              <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                {bankInfo.name || bankInfo.bankName || t("admin.no_phone", "Bank Account")}
              </p>
              <p className="text-base font-mono font-bold tracking-[0.15em] text-indigo-200 drop-shadow-sm">
                {bankInfo.acc || bankInfo.bankNumber || "•••• •••• ••••"}
              </p>
            </div>
          ) : (
            <p className="text-xs italic text-slate-400 relative z-10">{t("admin.missing_bank_info")}</p>
          )}

          <div className="relative z-10 pt-2 border-t border-white/10 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider truncate max-w-[70%]" title={bankInfo?.owner}>
            {bankInfo?.owner || t("admin.no_phone", "N/A")}
          </span>
            <span className="text-[8px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
              {t("admin.verified")}
            </span>
          </div>
        </div>
      </div>

      {/* Hình ảnh bằng chứng */}
      {order.return_images && order.return_images.length > 0 && (
        <div className="pt-2.5 border-t border-amber-200/60">
          <span className="block text-[10px] font-extrabold text-amber-900/70 uppercase mb-2 tracking-wider">
            {t("admin.evidence_attachments")} ({order.return_images.length})
          </span>
          <div className="flex flex-wrap gap-2.5">
            {order.return_images.map((img, idx) => {
              const fullImgUrl = getImageUrl(img);
              return (
                <div key={idx} className="relative group">
                  <img
                    src={fullImgUrl}
                    alt={`${t("admin.evidence_attachments")} ${idx + 1}`}
                    className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={() => window.open(fullImgUrl, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <i className="fa-solid fa-magnifying-glass-plus text-white text-xs"></i>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const DeliveryInfoSection = ({ order }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';
  return (
    <div className="bg-blue-50/50 p-3 md:p-5 rounded-[1.5rem] border border-blue-100/50 text-sm">
      <h5 className="font-bold text-blue-800 mb-4 uppercase text-xs tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-truck-fast text-blue-500 text-base"></i> {t("admin.delivery_details")}
      </h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 bg-white dark:bg-slate-700 p-4 md:p-5 rounded-2xl border border-blue-50 dark:border-slate-600 shadow-sm">
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">{t("admin.recipient")}</span>
          <span className="font-bold text-gray-800">{order.user_name || order.name}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">{t("admin.phone")}</span>
          <span className="font-bold text-gray-800">{order.phone}</span>
        </div>
        <div className="sm:col-span-2">
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">{t("admin.shipping_address")}</span>
          <span className="font-bold text-gray-800">{order.address}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">{t("admin.placed_on")}</span>
          <span className="font-bold text-gray-800">{new Date(order.created_at).toLocaleString(dateLocale)}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1 tracking-wider">{t("admin.payment_method")}</span>
          <div className="flex items-center gap-2">
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
            {order.payment_status === "Paid" ? (
              <span className="text-green-600 font-extrabold bg-green-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px]">
                <i className="fa-solid fa-check-circle"></i> {t("admin.paid_badge")}
              </span>
            ) : (
              <span className="text-orange-600 font-extrabold bg-orange-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px]">
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
      <h5 className="font-bold text-gray-800 mb-4 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-basket-shopping text-gray-400 text-base"></i> {t("admin.ordered_products")} ({items?.length || 0})
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
      isGift ? "bg-rose-50 border-rose-100" : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-violet-100 hover:shadow-md"
    }`}>
      {/* Cố định kích thước khung ảnh để tránh bị giật layout */}
      <div className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ${isGift ? 'border-2 border-white shadow-sm' : 'bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600'}`}>
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

        <p className="text-xs font-medium text-gray-500 mb-2">
          {item.color_name && `${t("admin.color_label")}: ${item.color_name}`}
          {item.size && <span className="mx-1.5 text-gray-300">|</span>}
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
              <span className="text-sm font-black text-rose-600">0 đ</span>
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

