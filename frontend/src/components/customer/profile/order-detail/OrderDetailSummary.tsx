import { useLanguage } from "../../../../context/LanguageContext";
import type { ProfileOrder } from "../../../../hooks/customer/profileTypes";

const OrderDetailSummary = ({ order, formatCurrency }: { order: ProfileOrder; formatCurrency: (amount: number | string | null | undefined) => string }) => {
  const { t } = useLanguage();
  const itemsSubtotal = order.items?.reduce((sum: number, item: { is_gift?: boolean; price?: number | string; quantity?: number | string }) => {
    if (item.is_gift) return sum;
    return sum + (Number(item.price || 0) * Number(item.quantity || 1));
  }, 0) || 0;
  const shippingFee = Number(order.shipping_fee || 0);
  const voucherCode = order.voucher?.code || order.voucher_code;

  return (
    <div className="bg-slate-50/70 dark:bg-slate-700/50 p-3.5 sm:p-5 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
      <p className="text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">{t('order_details.summary', 'Tóm tắt đơn hàng')}</p>

      <div className="flex justify-between items-start gap-3">
        <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.customer_name', 'Tên khách hàng')}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
          {order.name || "N/A"}
        </span>
      </div>

      <div className="flex justify-between items-start gap-3">
        <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.phone', 'SĐT')}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
          {order.phone || "N/A"}
        </span>
      </div>

      <div className="flex justify-between items-start gap-3">
        <span className="text-slate-500 dark:text-slate-400 shrink-0">{t('order_details.shipping_address', 'Địa chỉ giao hàng')}</span>
        <span className="font-medium text-slate-900 dark:text-slate-100 text-right break-words max-w-[65%]">
          {order.address || "N/A"}
        </span>
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

      {Number(order.membership_discount || 0) > 0 && (
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
          <span>{t("cart.member_discount", "Giảm giá thành viên")}:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(Number(order.membership_discount))}</span>
        </div>
      )}
      {Number(order.voucher_discount || 0) > 0 && (
        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-medium">
          <span>{t("cart.voucher_discount", "Giảm giá voucher")}{voucherCode ? ` (${voucherCode})` : ""}:</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">-{formatCurrency(Number(order.voucher_discount))}</span>
        </div>
      )}
      <div className="flex justify-between items-center gap-3 border-t border-slate-200/60 dark:border-slate-600 pt-2 sm:pt-2.5">
        <span className="font-semibold text-slate-700 dark:text-slate-300">{t('order_details.total', 'Tổng tiền')}</span>
        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base whitespace-nowrap">
          {formatCurrency(order.total_price)}
        </span>
      </div>
    </div>
  );
};

export default OrderDetailSummary;
