import { useLanguage } from "../../../context/LanguageContext";
import OrderRow from "./OrderRow";
import type { OrderLookupOrder } from "./OrderRowTypes";

interface Props {
  orders: OrderLookupOrder[]; expandedOrder: number | string | null; toggleOrder: (id: number | string) => void;
  formatCurrency: (amount: number | string | null | undefined) => string;
  handleOpenPaymentModal: (order: OrderLookupOrder) => void; loading: boolean;
  openReturnForm: (order: OrderLookupOrder) => void; handleCancelReturn: (id: number | string) => void;
  handleCancelOrder: (id: number | string) => void; handleBuyAgain: (order: OrderLookupOrder) => void; onReset: () => void;
}

export default function OrdersStep({
  orders, expandedOrder, toggleOrder, formatCurrency,
  handleOpenPaymentModal, loading, openReturnForm, handleCancelReturn, handleCancelOrder, handleBuyAgain, onReset
}: Props) {
  const { t, getLocalizedText, getLocalizedLabel, language } = useLanguage();
  const dateLocale = language === "vi" ? "vi-VN" : "en-US";

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-10">
          <i className="fa-solid fa-box-open text-4xl text-gray-300 dark:text-slate-600 mb-3"></i>
          <p className="text-gray-500 dark:text-slate-400">{t("lookup.no_orders")}</p>
        </div>
      ) : (
        <div className="max-h-[60vh] sm:max-h-[500px] overflow-y-auto pr-1 sm:pr-2 space-y-4 custom-scrollbar">
          {orders.map((order) => (
            <OrderRow
              key={order.id}
              order={order}
              expandedOrder={expandedOrder}
              toggleOrder={toggleOrder}
              formatCurrency={formatCurrency}
              handleOpenPaymentModal={handleOpenPaymentModal}
              loading={loading}
              openReturnForm={openReturnForm}
              handleCancelReturn={handleCancelReturn}
              handleCancelOrder={handleCancelOrder}
              handleBuyAgain={handleBuyAgain}
              t={t}
              getLocalizedText={getLocalizedText}
              getLocalizedLabel={getLocalizedLabel}
              dateLocale={dateLocale}
            />
          ))}
        </div>
      )}
      <button onClick={onReset} className="w-full mt-4 border border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-400 font-bold py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition">
        {t("lookup.other_email")}
      </button>
    </div>
  );
}
