import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ReturnFormStep({
  returnForm, setReturnForm, selectedOrder, formatCurrency,
  handleReturnSubmit, loading, onCancel
}) {
  const { t, getLocalizedText, language } = useLanguage();
  const inputCls = "w-full p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500";

  const items = selectedOrder?.items || [];
  const selectedItems = returnForm.selectedItems || {};

  const handleToggleItem = (itemId: number, maxQty: number) => {
    const current = selectedItems[itemId] || { selected: false, return_quantity: maxQty };
    const nextSelected = !current.selected;
    setReturnForm({
      ...returnForm,
      selectedItems: {
        ...selectedItems,
        [itemId]: {
          selected: nextSelected,
          return_quantity: nextSelected ? (current.return_quantity || maxQty) : maxQty
        }
      }
    });
  };

  const handleQtyChange = (itemId: number, rawVal: string, maxQty: number) => {
    if (rawVal === "") {
      setReturnForm({
        ...returnForm,
        selectedItems: {
          ...selectedItems,
          [itemId]: { ...selectedItems[itemId], selected: true, return_quantity: "" }
        }
      });
      return;
    }
    const val = parseInt(rawVal, 10);
    if (isNaN(val)) return;
    const validQty = Math.min(val, maxQty);
    setReturnForm({
      ...returnForm,
      selectedItems: {
        ...selectedItems,
        [itemId]: { ...selectedItems[itemId], selected: true, return_quantity: validQty < 1 ? "" : validQty }
      }
    });
  };

  const handleQtyBlur = (itemId: number) => {
    const current = selectedItems[itemId]?.return_quantity;
    if (!current || Number(current) < 1) {
      setReturnForm({
        ...returnForm,
        selectedItems: {
          ...selectedItems,
          [itemId]: { ...selectedItems[itemId], selected: true, return_quantity: 1 }
        }
      });
    }
  };

  const estimatedRefund = items.reduce((sum: number, item: any) => {
    const sel = selectedItems[item.id];
    if (sel?.selected && !item.is_gift) {
      const qty = Number(sel.return_quantity) || 0;
      return sum + Number(item.price || 0) * qty;
    }
    return sum;
  }, 0);

  const hasBuyXGetYGift = items.some((i: any) => i.is_gift);

  return (
    <form onSubmit={handleReturnSubmit} className="space-y-4">
      <div className="bg-violet-50 dark:bg-violet-900/30 p-3 rounded-lg text-xs sm:text-sm text-violet-700 dark:text-violet-300 mb-4 flex flex-wrap justify-between items-center gap-1 border border-violet-100 dark:border-violet-700">
        <span>{t("lookup.order_code")} <strong>#{selectedOrder?.id}</strong></span>
        <span>{t("lookup.total")} <strong>{formatCurrency(selectedOrder?.total_price)}</strong></span>
      </div>

      {/* Item Selection Section */}
      {items.length > 0 && (
        <div className="space-y-2.5 bg-gray-50 dark:bg-slate-700/40 p-3.5 rounded-xl border border-gray-200 dark:border-slate-600">
          <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            {t("lookup.select_items_title", "Chọn sản phẩm muốn trả")}
          </label>

          {hasBuyXGetYGift && (
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-lg text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 shrink-0"></i>
              <span>{t("lookup.gift_must_return_notice", "Quà tặng đi kèm (Buy X Get Y) sẽ được tự động gom trả cùng sản phẩm mua.")}</span>
            </div>
          )}

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {items.map((item: any) => {
              const sel = selectedItems[item.id] || { selected: false, return_quantity: item.quantity };
              const isGift = item.is_gift;

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    sel.selected
                      ? "bg-white dark:bg-slate-800 border-violet-500 dark:border-violet-400 shadow-xs"
                      : "bg-gray-100/70 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      disabled={isGift}
                      checked={sel.selected}
                      onChange={() => handleToggleItem(item.id, item.quantity)}
                      className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-semibold text-gray-800 dark:text-slate-100 line-clamp-2 leading-snug">
                          {getLocalizedText(item, "product_name") || item.product_name}
                        </p>
                        {isGift && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                            <i className="fa-solid fa-gift" />
                            {t("lookup.gift_item_badge", "Quà tặng")}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5">
                        {(() => {
                          const colorName = getLocalizedText(item, "color_name") || item.color_name_vi || item.color_name || item.color;
                          return colorName ? `${colorName} | ` : "";
                        })()}
                        {item.size ? `${item.size} | ` : ""}
                        <span className="font-medium">{isGift ? "0đ" : formatCurrency(item.price)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Quantity Input */}
                  {sel.selected && !isGift && (
                    <div className="flex items-center gap-1 shrink-0 self-center pl-2 border-l border-gray-200 dark:border-slate-700">
                      <span className="text-[11px] text-gray-400 font-medium">{t("lookup.return_qty_label", "SL:")}</span>
                      <input
                        type="number"
                        min={1}
                        max={item.quantity}
                        value={sel.return_quantity}
                        onChange={(e) => handleQtyChange(item.id, e.target.value, item.quantity)}
                        onBlur={() => handleQtyBlur(item.id)}
                        className="w-10 text-center bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100 text-xs py-1 rounded-lg outline-none focus:border-violet-500 font-bold"
                      />
                      <span className="text-[11px] text-gray-400">/{item.quantity}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center bg-violet-100/70 dark:bg-violet-900/40 px-3 py-2 rounded-lg text-xs">
            <span className="font-semibold text-violet-800 dark:text-violet-200">{t("lookup.estimated_refund", "Ước tính hoàn tiền:")}</span>
            <span className="font-bold text-violet-900 dark:text-violet-100 text-sm">{formatCurrency(estimatedRefund)}</span>
          </div>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{t("lookup.reason_label")}</label>
        <select
          required
          className={inputCls}
          value={returnForm.reason_code}
          onChange={(e) => setReturnForm({ ...returnForm, reason_code: e.target.value })}
        >
          <option value="">{t("lookup.reason_placeholder")}</option>
          <option value="Damaged">{t("lookup.reason_damaged")}</option>
          <option value="Wrong item">{t("lookup.reason_wrong_item")}</option>
          <option value="Not as described">{t("lookup.reason_not_as_described")}</option>
          <option value="Change mind">{t("lookup.reason_change_mind")}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">{t("lookup.desc_label")}</label>
        <textarea
          required
          rows={3}
          className={inputCls}
          placeholder={t("lookup.desc_placeholder")}
          value={returnForm.description}
          onChange={(e) => setReturnForm({ ...returnForm, description: e.target.value })}
        ></textarea>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-1 sm:col-span-2">
          <label className="block text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase">{t("lookup.refund_info")}</label>
        </div>
        <input
          type="text" placeholder={t("lookup.bank_name")} required
          className={inputCls}
          value={returnForm.bank_name}
          onChange={(e) => setReturnForm({ ...returnForm, bank_name: e.target.value })}
        />
        <input
          type="text" placeholder={t("lookup.bank_acc")} required
          className={inputCls}
          value={returnForm.bank_acc}
          onChange={(e) => setReturnForm({ ...returnForm, bank_acc: e.target.value })}
        />
        <input
          type="text" placeholder={t("lookup.bank_owner")} required
          className={`col-span-1 sm:col-span-2 p-2.5 border border-gray-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500`}
          value={returnForm.bank_owner}
          onChange={(e) => setReturnForm({ ...returnForm, bank_owner: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase mb-1">
          {t("lookup.images_label")}
        </label>
        <input
          type="file"
          multiple
          accept="image/*"
          className="w-full text-xs sm:text-sm text-gray-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 dark:file:bg-violet-900/40 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/60"
          onChange={(e) => setReturnForm({ ...returnForm, images: Array.from(e.target.files) })}
        />
        {returnForm.images && returnForm.images.length > 0 && (
          <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1">
            <i className="fa-solid fa-paperclip mr-1"></i> {t("lookup.files_selected").replace("{count}", returnForm.images.length)}
          </p>
        )}
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{t("lookup.images_hint")}</p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg text-gray-600 dark:text-slate-300 font-bold text-sm hover:bg-gray-50 dark:hover:bg-slate-700 transition text-center"
        >
          {t("lookup.cancel")}
        </button>
        <button
          type="submit" disabled={loading}
          className="flex-1 px-4 py-3 bg-violet-600 text-white rounded-lg font-bold text-sm hover:bg-violet-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i> {t("lookup.sending")}
            </>
          ) : (
            t("lookup.submit_return")
          )}
        </button>
      </div>
    </form>
  );
}
