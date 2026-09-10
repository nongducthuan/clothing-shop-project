import React from "react";
import { ModernStatusBadge, PaymentStatusBadge } from "./OrderBadges";
import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";

export default function OrderDetailModal({ order, onClose, onOpenPaymentModal, helpers }) {
  const { t, getLocalizedText, language } = useLanguage();
  if (!order) return null;
  const { formatCurrency, getImgUrl } = helpers;
  const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';

  return (
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
                {new Date(order.created_at).toLocaleString(dateLocale)}
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
            <PaymentStatusBadge status={order.payment_status} />
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
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.shipping_address', 'Địa chỉ giao hàng')}</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
                {order.address || "N/A"}
              </span>
            </div>

            <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 dark:border-slate-600 pt-2.5 sm:pt-3">
              <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.payment_method', 'Phương thức thanh toán')}</span>
              <PaymentBadge method={order.payment_method} badgeStyle={true} />
            </div>

            <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 dark:border-slate-600 pt-2.5 sm:pt-3">
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('order_details.total', 'Tổng tiền')}</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base whitespace-nowrap">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>

          {order.payment_status === "Unpaid" && order.status !== "Cancelled" && onOpenPaymentModal && (
            <button
              onClick={() => {
                onClose();
                onOpenPaymentModal(order);
              }}
              className="w-full py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-md text-center"
            >
              {t('order_details.pay_change', 'Thanh toán / Đổi phương thức')}
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
