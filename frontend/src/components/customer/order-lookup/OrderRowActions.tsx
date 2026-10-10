import type { OrderLookupOrder } from "./OrderRowTypes";
import { canRepayOrder } from "../../../utils/orderUtils";

interface Props {
  order: OrderLookupOrder;
  openReturnForm: (order: OrderLookupOrder) => void;
  handleCancelReturn?: (id: number | string) => void;
  handleCancelOrder?: (id: number | string) => void;
  handleBuyAgain?: (order: OrderLookupOrder) => void;
  handleOpenPaymentModal: (order: OrderLookupOrder) => void;
  loading: boolean;
  t: (key: string, fallback?: string) => string;
  isOnlinePendingUnpaid: boolean;
  countdown: string | null;
}

export default function OrderRowActions({ order, openReturnForm, handleCancelReturn, handleCancelOrder, handleBuyAgain, handleOpenPaymentModal, loading, t, isOnlinePendingUnpaid, countdown }: Props) {
              const showPay = canRepayOrder(order);
              const showCancelOrder = ["Pending", "Confirmed"].includes(order.status) && !order.return_request && Boolean(handleCancelOrder);
              const showReturn = order.status === 'Delivered' && order.can_return !== false && !order.return_request;
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

}
