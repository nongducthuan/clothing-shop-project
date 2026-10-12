import { useLanguage } from "../../../../context/LanguageContext";
import type { ProfileOrder } from "../../../../hooks/customer/profileTypes";

const OrderDetailItems = ({ order, formatCurrency, getImgUrl }: {
  order: ProfileOrder; formatCurrency: (amount: number | string | null | undefined) => string;
  getImgUrl: (path: string | null | undefined) => string;
}) => {
  const { t, getLocalizedText } = useLanguage();
  return (
    <div className="bg-white dark:bg-slate-700/40 p-3.5 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-600">
      <h5 className="font-bold text-slate-800 dark:text-slate-200 mb-3 text-xs uppercase tracking-wider flex items-center gap-2 m-0 leading-none">
        <i className="fa-solid fa-basket-shopping text-slate-400 dark:text-slate-500 text-base"></i> {t('order_details.items', 'Sản phẩm')} ({order.items?.length || 0})
      </h5>
      <div className="space-y-2.5 sm:space-y-3">
      {order.items?.map((item, idx) => {
        const rawImage = item.image || item.image_url || item.color_image || item.product_image;
        const safeImgSrc = rawImage
          ? getImgUrl(rawImage)
          : "https://via.placeholder.com/150?text=No+Image";
        const isGift = Boolean(item.is_gift);

        return (
          <div key={idx} className="flex gap-3 sm:gap-4 items-center bg-slate-50/70 dark:bg-slate-700/50 p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">

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

            <div className="flex-1 min-w-0">
              <h4
                className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-snug line-clamp-2"
                title={getLocalizedText(item, "product_name") || item.product_name}
              >
                {getLocalizedText(item, "product_name") || item.product_name}
              </h4>
              {isGift && (
                <span className="inline-flex w-fit items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0 align-middle">
                  <i className="fa-solid fa-gift" />
                  {t("lookup.gift_item_badge", "Quà tặng")}
                </span>
              )}

              <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                  {t('order_details.color_label', 'Color')}: {getLocalizedText(item, "color_name") || item.color_name || item.color || "N/A"}
                </span>
                <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                  {t('order_details.size_label', 'Size')}: {item.size || item.size_name || "N/A"}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 flex flex-col items-end justify-center">
              {isGift ? (
                <>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs sm:text-sm whitespace-nowrap">
                    {formatCurrency(0)}
                  </p>
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 whitespace-nowrap">
                    {formatCurrency(0)} × {item.quantity}
                  </span>
                </>
              ) : (
                <>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                {formatCurrency(item.price * item.quantity)}
              </p>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 whitespace-nowrap">
                {formatCurrency(item.price)} × {item.quantity}
              </span>
                </>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};

export default OrderDetailItems;
