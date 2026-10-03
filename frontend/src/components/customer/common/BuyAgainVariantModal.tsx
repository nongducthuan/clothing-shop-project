import React, { useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";
import { SubstitutionSuggestion, VariantChoice } from "../../../utils/buyAgainUtils";

interface BuyAgainVariantModalProps {
  substitutions: SubstitutionSuggestion[];
  onConfirm: (selections: Array<{ suggestion: SubstitutionSuggestion; choice: VariantChoice }>) => void;
  onClose: () => void;
}

const choiceKey = (c: VariantChoice) => `${c.color_id}-${c.size_id}`;

/**
 * Modal hiển thị các sản phẩm trong đơn "Mua lại" mà variant cũ đã hết hàng,
 * cho phép khách chọn 1 variant thay thế (còn hàng) hoặc bỏ qua từng sản phẩm.
 */
export default function BuyAgainVariantModal({ substitutions, onConfirm, onClose }: BuyAgainVariantModalProps) {
  const { t, getLocalizedText, language } = useLanguage();

  // Pre-select the best (first) alternative for each item
  const [selections, setSelections] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    substitutions.forEach((sub, idx) => {
      if (sub.choices.length > 0) initial[idx] = choiceKey(sub.choices[0]);
    });
    return initial;
  });

  if (!substitutions || substitutions.length === 0) return null;

  const selectedCount = substitutions.filter(
    (_sub, idx) => selections[idx] && selections[idx] !== "skip"
  ).length;

  const handleSelect = (idx: number, key: string) =>
    setSelections((prev) => ({ ...prev, [idx]: key }));

  const handleConfirm = () => {
    const result: Array<{ suggestion: SubstitutionSuggestion; choice: VariantChoice }> = [];
    substitutions.forEach((sub, idx) => {
      const key = selections[idx];
      if (key && key !== "skip") {
        const choice = sub.choices.find((c) => choiceKey(c) === key);
        if (choice) result.push({ suggestion: sub, choice });
      }
    });
    onConfirm(result);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 py-3.5 sm:px-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base sm:text-lg">
              {t('orders.buy_again_modal_title', 'Chọn biến thể thay thế')}
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('orders.buy_again_modal_desc', 'Một số sản phẩm đã hết hàng — chọn biến thể khác hoặc bỏ qua.')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-300 hover:text-slate-700 dark:hover:text-slate-100 flex items-center justify-center transition-colors shadow-sm shrink-0"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-4">
          {substitutions.map((sub, idx) => {
            const currentKey = selections[idx];
            return (
              <div key={idx} className="border border-slate-100 dark:border-slate-700 rounded-xl p-3 space-y-2.5">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{sub.productName}</p>
                  <span className="text-[11px] text-slate-400 shrink-0">x{sub.quantity}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('orders.buy_again_original', 'Biến thể cũ:')}{" "}
                  <span className="line-through text-slate-400 dark:text-slate-500">{sub.originalLabel}</span>{" "}
                  <span className="text-rose-500 font-medium">({t('orders.buy_again_out_of_stock', 'Hết hàng')})</span>
                </p>

                <div className="space-y-1.5">
                  {sub.choices.map((choice) => {
                    const key = choiceKey(choice);
                    const checked = currentKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelect(idx, key)}
                        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-lg border text-xs transition ${
                          checked
                            ? "border-violet-500 dark:border-violet-400 bg-violet-50 dark:bg-violet-900/20"
                            : "border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500"
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 ${checked ? "border-violet-500 dark:border-violet-400 bg-violet-500" : "border-slate-300 dark:border-slate-500"}`}></span>
                          <span className="font-medium text-slate-700 dark:text-slate-200 truncate">
                            {getLocalizedText(choice, "color_name") || choice.color_name} • {choice.size}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 shrink-0">
                            {t('orders.buy_again_stock_left', 'Còn {count}').replace("{count}", String(choice.stock))}
                          </span>
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                          {formatCurrency(choice.price, language)}
                        </span>
                      </button>
                    );
                  })}

                  {/* Skip option */}
                  <button
                    onClick={() => handleSelect(idx, "skip")}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg border text-xs transition ${
                      currentKey === "skip"
                        ? "border-rose-400 dark:border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 font-medium"
                        : "border-dashed border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"
                    }`}
                  >
                    <i className={`fa-solid ${currentKey === "skip" ? "fa-circle-xmark" : "fa-xmark"} w-3.5 ml-0.5`}></i>
                    {t('orders.buy_again_skip_item', 'Bỏ qua sản phẩm này')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-700 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className="w-full py-3 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl font-semibold text-xs sm:text-sm transition-colors shadow-md text-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('orders.buy_again_add_selected', 'Thêm vào giỏ ({count})').replace("{count}", String(selectedCount))}
          </button>
        </div>
      </div>
    </div>
  );
}
