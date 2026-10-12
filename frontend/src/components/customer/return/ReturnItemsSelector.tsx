import { useLanguage } from "../../../context/LanguageContext";
import { getItemUnitPayableAmount } from "../../../utils/currencyUtils";
import { getImageUrl } from "../../../utils/imageUtils";
import useReturnItemSelection from "../../../hooks/customer/useReturnItemSelection";
import {
  getPromotionBuyProductIds,
  isPromotionBuyItem,
  getLinkedBuyItems,
  isGiftAutoReturned,
} from "../../../utils/promotionUtils";

export interface ReturnSelectableItem {
  id?: number;
  quantity?: number;
  is_gift?: boolean;
  product_name?: string;
  image_url?: string | null;
  payable_amount?: number | string;
  price?: number | string;
  color_name_vi?: string;
  color_name?: string;
  color?: string;
  size?: string;
  [key: string]: unknown;
}

export type ReturnSelectedItems = Record<number | string, {
  selected: boolean;
  return_quantity: string | number;
}>;

interface Props {
  items: ReturnSelectableItem[];
  selectedItems: ReturnSelectedItems;
  onChange: (selectedItems: ReturnSelectedItems) => void;
  formatCurrency: (value: number, language?: string) => string;
  className?: string;
}

export default function ReturnItemsSelector({
  items,
  selectedItems,
  onChange,
  formatCurrency,
  className = "",
}: Props) {
  const { t, getLocalizedText, language } = useLanguage();
  const buyProductIds = getPromotionBuyProductIds(items);
  const hasGiftItems = items.some((item) => item.is_gift);
  const isItemSelected = (item: ReturnSelectableItem) => !!selectedItems[item.id as number]?.selected;

  const { handleToggleItem, handleQtyChange, handleQtyBlur } = useReturnItemSelection(
    selectedItems,
    onChange
  );

  const estimatedRefund = Math.round(items.reduce((sum, item) => {
    const sel = selectedItems[item.id as number];
    if (sel?.selected && !item.is_gift) {
      return sum + getItemUnitPayableAmount(item) * (Number(sel.return_quantity) || 0);
    }
    return sum;
  }, 0));

  return (
    <div className={`space-y-2.5 bg-gray-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-gray-200 dark:border-slate-600 ${className}`}>
      <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
        {t("lookup.select_items_title", "Chọn sản phẩm muốn trả")}
      </label>

      {hasGiftItems && (
        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
          <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 shrink-0"></i>
          <span>{t("lookup.gift_must_return_notice", "Sản phẩm mua để nhận quà (X) chỉ có thể hoàn trả toàn bộ số lượng. Quà tặng (Y) chỉ được hoàn kèm khi bạn chọn trả sản phẩm X tương ứng.")}</span>
        </div>
      )}

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => {
          const sel = selectedItems[item.id as number] || {
            selected: false,
            return_quantity: item.quantity as number,
          };

          if (item.is_gift) {
            const linkedBuyItems = getLinkedBuyItems(item, items);
            const isAutoReturned = isGiftAutoReturned(item, items, isItemSelected);
            const linkedBuyName = linkedBuyItems.length > 0
              ? String(getLocalizedText(linkedBuyItems[0], "product_name") || linkedBuyItems[0].product_name || "")
              : "";

            return (
              <div key={String(item.id)} className="p-2.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/30 flex items-center justify-between gap-3 opacity-80">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <img
                    src={getImageUrl(item.image_url)}
                    alt=""
                    aria-hidden="true"
                    className="w-10 h-10 rounded-lg object-cover border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-700 flex-shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(null); }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 line-clamp-2 leading-snug">
                        {getLocalizedText(item, "product_name") || item.product_name}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 shrink-0">
                        <i className="fa-solid fa-gift" /> {t("lookup.gift_item_badge", "Quà tặng")}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                      {(() => {
                        const colorName = getLocalizedText(item, "color_name") || item.color_name_vi || item.color_name || item.color;
                        return colorName ? `${t("lookup.color_label", "Màu")}: ${colorName} | ` : "";
                      })()}
                      {item.size ? `${t("lookup.size_label", "Size")}: ${item.size} | ` : ""}
                      <span className="font-medium">{formatCurrency(0, language)}</span>
                      <span className="ml-1.5 font-semibold text-slate-900 dark:text-slate-100">{`× ${item.quantity}`} = {formatCurrency(0, language)}</span>
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold shrink-0 italic text-right max-w-[45%] ${isAutoReturned ? "text-amber-600 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"}`}>
                  {isAutoReturned
                    ? t("lookup.auto_included", "Tự động hoàn trả")
                    : linkedBuyItems.length > 0
                      ? t("lookup.gift_return_with_buy", "Chỉ hoàn kèm khi chọn: {name}").replace("{name}", linkedBuyName)
                      : t("lookup.gift_return_with_purchased", "Chỉ hoàn kèm sản phẩm mua tương ứng")}
                </span>
              </div>
            );
          }

          const returnQty = Number(sel.return_quantity) || 0;
          const unitPayable = getItemUnitPayableAmount(item);
          const itemRefund = unitPayable * returnQty;
          const isBuyItem = isPromotionBuyItem(item, buyProductIds);

          return (
            <div
              key={String(item.id)}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${sel.selected
                ? "bg-white dark:bg-slate-800 border-slate-900 dark:border-slate-300 shadow-xs"
                : "bg-gray-100/70 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-75"}`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <input
                  type="checkbox"
                  checked={sel.selected}
                  onChange={() => handleToggleItem(Number(item.id), Number(item.quantity), isBuyItem)}
                  className="w-4 h-4 rounded border-gray-300 text-slate-900 focus:ring-slate-500 cursor-pointer shrink-0"
                />
                <img
                  src={getImageUrl(item.image_url)}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(null); }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 line-clamp-2 leading-snug">
                      {getLocalizedText(item, "product_name") || item.product_name}
                    </p>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                    {(() => {
                      const colorName = getLocalizedText(item, "color_name") || item.color_name_vi || item.color_name || item.color;
                      return colorName ? `${t("lookup.color_label", "Màu")}: ${colorName} | ` : "";
                    })()}
                    {item.size ? `${t("lookup.size_label", "Size")}: ${item.size} | ` : ""}
                    <span className="font-medium">
                      {formatCurrency(unitPayable, language)}
                      {unitPayable < Number(item.price || 0) && (
                        <span className="ml-1 text-[10px] text-gray-400 dark:text-slate-500 line-through">{formatCurrency(Number(item.price || 0), language)}</span>
                      )}
                      {sel.selected && returnQty > 0 && (
                        <span className="ml-1.5 font-semibold text-slate-700 dark:text-slate-200">x {returnQty} = {formatCurrency(itemRefund, language)}</span>
                      )}
                    </span>
                  </p>
                </div>
              </div>

              {sel.selected && !isBuyItem && (
                <div className="flex items-center gap-1 shrink-0 self-center pl-2 border-l border-gray-200 dark:border-slate-700">
                  <span className="text-[11px] text-gray-400 font-medium">{t("lookup.return_qty_label", "SL:")}</span>
                  <input
                    type="number"
                    min={1}
                    max={Number(item.quantity)}
                    value={sel.return_quantity}
                    onChange={(e) => handleQtyChange(Number(item.id), e.target.value, Number(item.quantity))}
                    onBlur={() => handleQtyBlur(Number(item.id))}
                    className="w-10 text-center bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-xs py-1 rounded-lg outline-none focus:border-slate-400 font-bold"
                  />
                  <span className="text-[11px] text-gray-400">/{item.quantity}</span>
                </div>
              )}
              {sel.selected && isBuyItem && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 shrink-0 pl-2 border-l border-gray-200 dark:border-slate-700">x{item.quantity}</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-700/80 px-3 py-2 rounded-lg text-xs">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-slate-600 dark:text-slate-300">{t("lookup.estimated_refund", "Ước tính hoàn tiền:")}</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(estimatedRefund, language)}</span>
        </div>
        <span className="text-[10px] text-slate-400 italic text-right">{t("lookup.no_shipping_refund_note", "*Không hoàn lại phí vận chuyển")}</span>
      </div>
    </div>
  );
}
