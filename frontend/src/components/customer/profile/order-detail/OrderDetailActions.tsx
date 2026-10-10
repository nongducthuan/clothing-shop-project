import { useLanguage } from "../../../../context/LanguageContext";
import type { ProfileOrder } from "../../../../hooks/customer/profileTypes";
import { canRepayOrder } from "../../../../utils/orderUtils";

// Nút hành động của modal chi tiết đơn (thanh toán / hủy đơn / đổi trả / mua lại).
const OrderDetailActions = ({ order, onClose, onOpenPaymentModal, actions, state, isOnlinePendingUnpaid, countdown, handleBuyAgain, buyingAgain }: {
  order: ProfileOrder; onClose: () => void; onOpenPaymentModal?: (order: ProfileOrder) => void;
  actions?: {
    handleCancelOrder?: (id: number) => void; handleOpenReturnModal?: (order: ProfileOrder) => void;
    handleCancelReturn?: (id: number) => void;
  };
  state?: { cancellingOrderId?: number | null };
  isOnlinePendingUnpaid: boolean; countdown: string | null;
  handleBuyAgain: () => void | Promise<void>; buyingAgain: boolean;
}) => {
  const { t } = useLanguage();
  const showPay = canRepayOrder(order) && Boolean(onOpenPaymentModal);
  const showCancelOrder = ["Pending", "Confirmed"].includes(order.status) && !order.return_request && Boolean(actions?.handleCancelOrder);
  const showReturn = order.status === "Delivered" && order.can_return !== false && !order.return_request && Boolean(actions?.handleOpenReturnModal);
  const showCancelReturn = order.status === "Return Requested" && Boolean(actions?.handleCancelReturn);
  const showBuyAgain = ["Cancelled", "Delivered"].includes(order.status);

  const renderPayBtn = (fullWidth = true) => (
    <button
      key="pay"
      onClick={() => {
        onClose();
        onOpenPaymentModal?.(order);
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
      onClick={() => { onClose(); actions?.handleCancelOrder?.(order.id); }}
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
      onClick={() => { onClose(); actions?.handleOpenReturnModal?.(order); }}
      className={`${fullWidth ? "w-full" : "flex-1"} py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl font-semibold text-xs sm:text-sm transition-colors text-center flex items-center justify-center gap-2`}
    >
      <i className="fa-solid fa-rotate-left" /> {t("orders.return", "Đổi trả")}
    </button>
  );

  const renderCancelReturnBtn = (fullWidth = true) => (
    <button
      key="cancelReturn"
      onClick={() => { onClose(); actions?.handleCancelReturn?.(order.id); }}
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

  if (showPay) return renderPayBtn(true);
  if (showCancelOrder) return renderCancelOrderBtn(true);
  if (showReturn) return renderReturnBtn(true);
  if (showCancelReturn) return renderCancelReturnBtn(true);
  if (showBuyAgain) return renderBuyAgainBtn(true);

  return null;
};

export default OrderDetailActions;
