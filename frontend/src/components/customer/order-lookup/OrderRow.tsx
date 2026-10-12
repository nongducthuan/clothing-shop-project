import { PaymentBadge } from "../../common/PaymentBadge";
import { ModernStatusBadge, PaymentStatusBadge } from "../profile/OrderBadges";
import { useAutoCancelCountdown } from "../../../hooks/useAutoCancelCountdown";
import OrderRowDetails from "./OrderRowDetails";
import type { LocalizedTextObject, OrderLookupOrder } from "./OrderRowTypes";
import type { LabelType } from "../../../context/LanguageContext";

interface Props {
  order: OrderLookupOrder; expandedOrder: number | string | null; toggleOrder: (id: number | string) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  handleOpenPaymentModal: (order: OrderLookupOrder) => void; loading: boolean;
  openReturnForm: (order: OrderLookupOrder) => void; handleCancelReturn: (id: number | string) => void;
  handleCancelOrder: (id: number | string) => void; handleBuyAgain: (order: OrderLookupOrder) => void;
  t: (key: string, fallback?: string) => string;
  getLocalizedText: (item: LocalizedTextObject, key: string) => string;
  getLocalizedLabel: (category: LabelType, value?: string | null) => string; dateLocale: string;
}

export default function OrderRow({
  order, expandedOrder, toggleOrder, formatCurrency,
  handleOpenPaymentModal, loading, openReturnForm, handleCancelReturn, handleCancelOrder, handleBuyAgain,
  t, getLocalizedText, getLocalizedLabel, dateLocale,
}: Props) {
  const isOnlinePendingUnpaid =
    order.payment_status === 'Unpaid' &&
    order.status === 'Pending' &&
    ['momo', 'vnpay'].includes(order.payment_method ?? '');
  const countdown = useAutoCancelCountdown(isOnlinePendingUnpaid ? order.created_at : null);

  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white dark:bg-slate-700 shadow-sm">
      <div onClick={() => toggleOrder(order.id)} className="p-3.5 sm:p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600 flex flex-col gap-2.5 transition"><div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 dark:text-slate-100 text-sm sm:text-base">{t("lookup.order_no").replace("{id}", String(order.id))}</span>
            <ModernStatusBadge status={order.status} />
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
            <span>{formatCurrency(order.total_price)}</span>
            <i className={`fa-solid fa-chevron-${expandedOrder === order.id ? 'up' : 'down'} text-xs text-gray-400 dark:text-slate-500`}></i>
          </div>
        </div><div className="flex items-center justify-between text-xs text-gray-400 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-600">
          <div className="flex items-center gap-2">
          <span>{order.created_at ? new Date(order.created_at).toLocaleDateString(dateLocale) : ""}</span>
            <span>•</span>
            <PaymentBadge method={order.payment_method} badgeStyle={true} />
          </div>
          <PaymentStatusBadge status={order.payment_status ?? "Unpaid"} orderStatus={order.status} />
        </div>
      </div>

      {expandedOrder === order.id && (
        <OrderRowDetails
          order={order}
          formatCurrency={formatCurrency}
          openReturnForm={openReturnForm}
          handleCancelReturn={handleCancelReturn}
          handleCancelOrder={handleCancelOrder}
          handleBuyAgain={handleBuyAgain}
          handleOpenPaymentModal={handleOpenPaymentModal}
          loading={loading}
          t={t}
          getLocalizedText={getLocalizedText}
          getLocalizedLabel={getLocalizedLabel}
          isOnlinePendingUnpaid={isOnlinePendingUnpaid}
          countdown={countdown}
        />
      )}
    </div>
  );
}
