import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";
import { balanceReturnItemsRefund } from "../../../utils/orderUtils";
import type { ReturnItem, ReturnOrder, ReturnOrderItem } from "./ReturnInfoSection";

export default function ReturnItemsList({ order, formatCurrency }: { order: ReturnOrder; formatCurrency?: (val: number | string) => string }) {
  const { t, getLocalizedText } = useLanguage();
  if (!order.return_items?.length) return null;

  return (
    <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/40 space-y-2">
      <span className="block text-[10px] font-extrabold text-amber-900/70 dark:text-amber-300/80 uppercase tracking-wider">
        {t("admin.items_to_return", "Sản phẩm muốn trả")} ({order.return_items.length})
      </span>
      <div className="space-y-1.5">
        {balanceReturnItemsRefund(order.return_items, order.refund_amount).map((ri: ReturnItem, idx: number) => {
          const orderItem = ri.order_item;
          const pName = String(getLocalizedText(orderItem?.product || {}, "name") || orderItem?.product?.name || getLocalizedText(orderItem || {}, "product_name") || orderItem?.product_name || `Item #${ri.order_item_id}`);
          const cName = String(getLocalizedText(orderItem ?? {}, "color_name") || orderItem?.color_name || "");
          const sizeName = orderItem?.size;
          const isGift = Boolean(orderItem?.is_gift || ri.is_gift);
          const originalItem = order.items?.find((item: ReturnOrderItem) => item.id === ri.order_item_id);
          const rawImg = originalItem?.image || originalItem?.image_url || originalItem?.color_image || originalItem?.product_image || orderItem?.color?.image_url || (orderItem?.product as { image_url?: string } | undefined)?.image_url || ri.image || ri.image_url;
          const imageUrl = rawImg ? getImageUrl(rawImg) : getImageUrl(null);

          return (
            <div key={idx} className="bg-white dark:bg-slate-700 px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 border border-amber-100 dark:border-slate-600 shadow-xs">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden shrink-0 ${isGift ? "border-2 border-white dark:border-amber-900/50 shadow-sm" : "bg-gray-50 dark:bg-slate-800 border border-amber-50 dark:border-slate-600"}`}>
                <img src={imageUrl} onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = getImageUrl(null); }} alt={pName} className="w-full h-full object-cover" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 w-full sm:flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-800 dark:text-slate-200 leading-snug line-clamp-2" title={pName}>{pName}</span>
                  {isGift && <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0"><i className="fa-solid fa-gift" /> {t("lookup.gift_item_badge", "Quà tặng")}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {cName && <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{t("admin.color_label", "Màu")}: {cName}</span>}
                  {sizeName && <span className="bg-white dark:bg-slate-700 border border-slate-200/80 dark:border-slate-600 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{t("admin.size_label", "Size")}: {sizeName}</span>}
                </div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end justify-center self-end sm:self-auto mt-1 sm:mt-0">
                <p className={`font-semibold text-sm whitespace-nowrap leading-tight ${isGift ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100"}`}>
                  {isGift ? (formatCurrency ? formatCurrency(0) : "0đ") : (formatCurrency && ri.refund_amount != null ? formatCurrency(ri.refund_amount) : `${Number(ri.refund_amount || 0).toLocaleString()}đ`)}
                </p>
                {ri.refund_amount != null && (
                  <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                    {isGift ? `${formatCurrency ? formatCurrency(0) : "0đ"} × ${ri.return_quantity}` : `${formatCurrency ? formatCurrency(Math.round(Number(ri.refund_amount) / Number(ri.return_quantity))) : `${Math.round(Number(ri.refund_amount) / Number(ri.return_quantity)).toLocaleString()}đ`} × ${ri.return_quantity}`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
