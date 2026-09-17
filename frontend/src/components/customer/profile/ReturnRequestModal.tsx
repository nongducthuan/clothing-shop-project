import React from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";

export default function ReturnRequestModal({ state, actions }: { state: any; actions: any }) {
  const { t, getReturnReasonLabel, getLocalizedText, language } = useLanguage();

  if (!state.showReturnModal) return null;

  const { returnData, returnOrder } = state;
  const { setShowReturnModal, handleReturnDataChange, handleSubmitReturn } = actions;
  const items = returnOrder?.items || [];
  const selectedItems = returnData.selectedItems || {};

  const handleToggleItem = (itemId: number, maxQty: number) => {
    const current = selectedItems[itemId] || { selected: false, return_quantity: maxQty };
    const nextSelected = !current.selected;
    
    handleReturnDataChange("selectedItems", {
      ...selectedItems,
      [itemId]: {
        selected: nextSelected,
        return_quantity: nextSelected ? (current.return_quantity || maxQty) : maxQty
      }
    });
  };

  const handleQtyChange = (itemId: number, rawVal: string, maxQty: number) => {
    if (rawVal === "") {
      handleReturnDataChange("selectedItems", {
        ...selectedItems,
        [itemId]: {
          ...selectedItems[itemId],
          selected: true,
          return_quantity: ""
        }
      });
      return;
    }

    const val = parseInt(rawVal, 10);
    if (isNaN(val)) return;

    const validQty = Math.min(val, maxQty);
    handleReturnDataChange("selectedItems", {
      ...selectedItems,
      [itemId]: {
        ...selectedItems[itemId],
        selected: true,
        return_quantity: validQty < 1 ? "" : validQty
      }
    });
  };

  const handleQtyBlur = (itemId: number) => {
    const current = selectedItems[itemId]?.return_quantity;
    if (!current || Number(current) < 1) {
      handleReturnDataChange("selectedItems", {
        ...selectedItems,
        [itemId]: {
          ...selectedItems[itemId],
          selected: true,
          return_quantity: 1
        }
      });
    }
  };

  // Calculate total estimated refund amount
  const estimatedRefund = items.reduce((sum: number, item: any) => {
    const sel = selectedItems[item.id];
    if (sel?.selected && !item.is_gift) {
      const qty = Number(sel.return_quantity) || 0;
      return sum + Number(item.price || 0) * qty;
    }
    return sum;
  }, 0);

  // Check if any BuyXGetY gifts are present in the order
  const hasBuyXGetYGift = items.some((i: any) => i.is_gift);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setShowReturnModal(false)}>
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-lg rounded-[2rem] shadow-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>

        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
          <h3 className="font-medium text-slate-900 dark:text-slate-100 text-lg">{t("lookup.return_title", "Yêu cầu đổi trả")}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("lookup.order_no", "Đơn hàng #{id}").replace("{id}", state.returnOrderId)}</p>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 custom-scrollbar">

          {/* Item Selection Section */}
          {items.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                {t("lookup.select_items_title", "Chọn sản phẩm muốn trả")}
              </label>

              {hasBuyXGetYGift && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <i className="fa-solid fa-circle-info text-amber-500 mt-0.5 shrink-0"></i>
                  <span>{t("lookup.gift_must_return_notice", "Quà tặng đi kèm (Buy X Get Y) sẽ được tự động gom trả cùng sản phẩm mua.")}</span>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {items.map((item: any) => {
                  const sel = selectedItems[item.id] || { selected: false, return_quantity: item.quantity };
                  const isGift = item.is_gift;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start sm:items-center justify-between gap-3 ${
                        sel.selected
                          ? "bg-slate-50 dark:bg-slate-700/60 border-slate-900 dark:border-slate-400"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-80"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          disabled={isGift}
                          checked={sel.selected}
                          onChange={() => handleToggleItem(item.id, item.quantity)}
                          className="w-4 h-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-500 cursor-pointer disabled:cursor-not-allowed"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                              {getLocalizedText(item, "product_name") || item.product_name}
                            </p>
                            {isGift && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                                <i className="fa-solid fa-gift" />
                                {t("lookup.gift_item_badge", "Quà tặng")}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {(() => {
                              const colorName = getLocalizedText(item, "color_name") || item.color_name_vi || item.color_name || item.color;
                              return colorName ? `${colorName} | ` : "";
                            })()}
                            {item.size ? `${item.size} | ` : ""}
                            <span className="font-medium">{isGift ? "0đ" : formatCurrency(item.price, language)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Quantity Input */}
                      {sel.selected && !isGift && (
                        <div className="flex items-center gap-1.5 shrink-0 self-center pl-2.5 border-l border-slate-200 dark:border-slate-700">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{t("lookup.return_qty_label", "SL:")}</span>
                          <input
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={sel.return_quantity}
                            onChange={(e) => handleQtyChange(item.id, e.target.value, item.quantity)}
                            onBlur={() => handleQtyBlur(item.id)}
                            className="w-11 text-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-xs py-1 rounded-lg outline-none focus:border-slate-900 dark:focus:border-slate-300 font-bold shadow-sm"
                          />
                          <span className="text-[11px] text-slate-400 font-medium">/{item.quantity}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Estimated Refund Summary */}
              <div className="flex flex-col gap-1 bg-slate-100 dark:bg-slate-700/80 px-4 py-2.5 rounded-xl text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{t("lookup.estimated_refund", "Ước tính hoàn tiền:")}</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{formatCurrency(estimatedRefund, language)}</span>
                </div>
                <span className="text-[10px] text-slate-400 italic text-right">{t("lookup.no_shipping_refund_note", "*Không hoàn lại phí vận chuyển")}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t("lookup.reason_label", "Lý do đổi trả")}</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors"
              value={returnData.reason}
              onChange={(e) => handleReturnDataChange("reason", e.target.value)}
            >
              <option value="Change mind">{getReturnReasonLabel("Change mind")}</option>
              <option value="Damaged">{getReturnReasonLabel("Damaged")}</option>
              <option value="Wrong item">{getReturnReasonLabel("Wrong item")}</option>
              <option value="Not as described">{getReturnReasonLabel("Not as described")}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t("lookup.desc_label", "Ghi chú thêm")}</label>
            <textarea
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-2xl p-4 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400 transition-colors resize-none"
              placeholder={t("lookup.desc_placeholder", "Mô tả vấn đề...")}
              value={returnData.note}
              onChange={(e) => handleReturnDataChange("note", e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1">{t("lookup.images_label", "Ảnh minh chứng")}</label>
            <input
              type="file"
              multiple
              accept="image/*"
              className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
              onChange={(e) => handleReturnDataChange("images", e.target.files)}
            />
          </div>

          <div className="p-5 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3">{t("lookup.refund_info", "Thông tin tài khoản hoàn tiền")}</label>
            <div className="space-y-3">
              <input
                type="text"
                placeholder={t("lookup.bank_name", "Tên ngân hàng")}
                className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
                value={returnData.bankName}
                onChange={(e) => handleReturnDataChange("bankName", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder={t("lookup.bank_acc", "Số tài khoản")}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  value={returnData.bankNumber}
                  onChange={(e) => handleReturnDataChange("bankNumber", e.target.value)}
                />
                <input
                  type="text"
                  placeholder={t("lookup.bank_owner", "Tên chủ tài khoản")}
                  className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl p-3 text-sm outline-none focus:border-slate-900 dark:focus:border-slate-400"
                  value={returnData.accountHolder}
                  onChange={(e) => handleReturnDataChange("accountHolder", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button
              onClick={() => setShowReturnModal(false)}
              className="flex-1 py-3.5 text-slate-600 dark:text-slate-300 font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-full hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors text-sm"
            >
              {t("lookup.cancel", "Hủy")}
            </button>
            <button
              onClick={handleSubmitReturn}
              className="flex-1 py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-medium rounded-full hover:bg-slate-800 dark:hover:bg-white transition-colors text-sm shadow-md"
            >
              {t("lookup.submit_return", "Gửi yêu cầu")}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

