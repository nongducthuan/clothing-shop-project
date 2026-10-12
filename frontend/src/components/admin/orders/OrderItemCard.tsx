import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";
import type { AdminOrderItem } from "./orderTypes";

const OrderItemCard = ({ item, formatCurrency }: { item: AdminOrderItem; formatCurrency: (amount: number | string | null | undefined) => string }) => {
  const { t, getLocalizedText } = useLanguage();
  const imageUrl = getImageUrl(item.image_url);

  const isGift = Boolean(item.is_gift);
  const colorDisplay = getLocalizedText(item, "color_name") || item.color_name;

  return (
    <div className="flex gap-4 rounded-2xl p-4 items-center shadow-sm transition-all border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-violet-100 hover:shadow-md">
      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50 dark:bg-slate-700 border border-gray-100 dark:border-slate-600">
        <img
          src={imageUrl}
          onError={(e) => ((e.target as HTMLImageElement).src = getImageUrl(null))}
          alt={getLocalizedText(item, "product_name") || item.product_name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex flex-col gap-0.5 min-w-0 w-full sm:flex-1">
        <h4
          className="text-sm font-extrabold text-gray-800 dark:text-slate-100 line-clamp-2 leading-snug"
          title={getLocalizedText(item, "product_name") || item.product_name}
        >
          {getLocalizedText(item, "product_name") || item.product_name}
        </h4>
        {isGift && (
          <span className="inline-flex w-fit items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0">
            <i className="fa-solid fa-gift" /> {t("admin.free_gift")}
          </span>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-gray-500 dark:text-slate-400">
          {colorDisplay && (
            <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
              {t("admin.color_label", "Màu")}: {colorDisplay}
            </span>
          )}
          {item.size && (
            <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
              {t("admin.size_label", "Size")}: {item.size}
            </span>
          )}
        </div>
      </div>

      <div className="text-right shrink-0 flex flex-col items-end justify-center">
        {isGift ? (
          <>
            <span className="text-sm font-black text-gray-700 dark:text-slate-300">{formatCurrency(0)}</span>
            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap mt-0.5">{formatCurrency(0)} × {item.quantity}</span>
          </>
        ) : (
          <>
            <p className="text-sm font-black text-gray-900 dark:text-slate-100 leading-tight">
              {formatCurrency(item.price * item.quantity)}
            </p>
            <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500 whitespace-nowrap mt-0.5">
              {formatCurrency(item.price)} × {item.quantity}
            </span>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderItemCard;
