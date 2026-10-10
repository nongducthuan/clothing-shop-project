import { PaymentBadge } from "../../common/PaymentBadge";
import { useLanguage } from "../../../context/LanguageContext";
import { isClosedOrderStatus } from "../../../utils/orderUtils";
import type { AdminOrder } from "./orderTypes";

const DeliveryInfoSection = ({ order }: { order: AdminOrder }) => {
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
          <span className="font-bold text-gray-800 dark:text-slate-100">{order.created_at ? new Date(order.created_at).toLocaleString(dateLocale) : ""}</span>
        </div>
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-400 dark:text-slate-400 mb-1 tracking-wider">{t("admin.payment_method")}</span>
          <div className="flex items-center gap-2">
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
            {order.payment_status === "Paid" ? (
              <span className="text-green-600 dark:text-emerald-400 font-extrabold bg-green-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px] border border-green-100 dark:border-emerald-900/40">
                <i className="fa-solid fa-check-circle"></i> {t("admin.paid_badge")}
              </span>
            ) : order.payment_status === "Refunded" ? (
              <span className="text-purple-600 dark:text-purple-300 font-extrabold bg-purple-50 dark:bg-purple-950/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px] border border-purple-100 dark:border-purple-900/40">
                <i className="fa-solid fa-rotate-left"></i> {t("admin.refunded_badge", "Đã hoàn tiền")}
              </span>
            ) : isClosedOrderStatus(order.status) ? (
              <span className="text-slate-500 dark:text-slate-400 font-extrabold bg-slate-100 dark:bg-slate-700/50 px-2.5 py-1 rounded-full inline-flex items-center gap-1 text-[11px] border border-slate-200 dark:border-slate-600">
                <i className="fa-solid fa-circle-minus"></i> {t("payment_status.not_collected", "Chưa thu tiền")}
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

export default DeliveryInfoSection;
