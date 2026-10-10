import { useLanguage } from "../../../context/LanguageContext";
import ReturnInfoSection from "./ReturnInfoSection";
import OrderItemsList from "./OrderItemsList";
import DeliveryInfoSection from "./DeliveryInfoSection";
import type { AdminOrder } from "./orderTypes";

// Dòng mở rộng (expanded row) của OrderTable — chi tiết đơn hàng.
const OrderExpandedRow = ({ order, formatCurrency }: { order: AdminOrder; formatCurrency: (amount: number | string | null | undefined) => string }) => {
  const { t } = useLanguage();
  return (
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
            {(["Return Requested", "Return_Requested", "Return Approved", "Return_Approved", "Return Rejected", "Return_Rejected"].includes(order.status) || order.return_status === "Pending") && (
              <ReturnInfoSection order={order} formatCurrency={formatCurrency} />
            )}

            {/* Sản phẩm đặt hàng (đặt trước thông tin khách hàng, đồng bộ Guest/Profile) */}
            <OrderItemsList items={order.items} formatCurrency={formatCurrency} />

            {/* Thông tin giao hàng (đẩy xuống sau sản phẩm gốc) */}
            <DeliveryInfoSection order={order} />

            {/* Footer Total */}
            {(() => {
              const itemsSubtotal = order.items?.reduce((sum: number, item: { is_gift?: boolean; price?: number | string; quantity?: number | string }) => {
                if (item.is_gift) return sum;
                return sum + (Number(item.price || 0) * Number(item.quantity || 1));
              }, 0) || 0;
              const shippingFee = Number(order.shipping_fee || 0);
              const voucherCode = order.voucher?.code || order.voucher_code;

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
  );
};

export default OrderExpandedRow;
