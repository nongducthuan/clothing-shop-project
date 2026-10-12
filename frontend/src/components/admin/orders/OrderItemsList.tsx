import { useLanguage } from "../../../context/LanguageContext";
import OrderItemCard from "./OrderItemCard";
import type { AdminOrderItem } from "./orderTypes";

const OrderItemsList = ({ items, formatCurrency }: { items?: AdminOrderItem[]; formatCurrency: (amount: number | string | null | undefined) => string }) => {
  const { t } = useLanguage();
  return (
    <div className="bg-gray-50/50 dark:bg-slate-700/40 p-6 rounded-[1.5rem] border border-gray-100 dark:border-slate-700">
      <h5 className="font-bold text-gray-800 dark:text-slate-100 mb-5 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
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

export default OrderItemsList;
