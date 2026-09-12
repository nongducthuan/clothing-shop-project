import { useState } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import Toast from "../layout/Toast";

export default function VoucherBanner({ voucher, category }) {
  const { t, getLocalizedText } = useLanguage();
  const [toastMessage, setToastMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const isAvailable = voucher.usage_limit === null || voucher.usage_limit - voucher.used_count > 0;
  if (!isAvailable) return null;

  const remainingUses = voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null;
  const isRunningOut = remainingUses !== null && remainingUses <= 5;
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount) + "đ";
  const categoryName = category ? getLocalizedText(category, 'name') || category.name : '';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    setIsCopied(true);
    setToastMessage(t("voucher.code_copied", "Code copied: {code}").replace("{code}", voucher.code));
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}

      {/* Mobile layout — vertical ticket style */}
      <div className="sm:hidden w-full mb-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl">
        {/* Top: info */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-rose-700 dark:text-rose-400 leading-none">
              {t("voucher.discount_badge", "Giảm {percent}%").replace("{percent}", String(Number.parseFloat(voucher.discount_percent)))}
            </span>
            <span className="font-mono text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-800 border border-dashed border-rose-300 dark:border-rose-800 px-2 py-0.5 rounded-md tracking-wide leading-none">
              {voucher.code}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {voucher.apply_scope === "all" ? t("voucher.all_products", "All products") : categoryName}
          </p>
          {(voucher.min_order_value > 0 || voucher.max_discount_amount > 0 || remainingUses !== null) && (
            <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-1.5 border-t border-rose-200/50 dark:border-rose-900/30">
              {voucher.min_order_value > 0 && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("voucher.min_spend", "Min spend")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(voucher.min_order_value)}</span>
                </span>
              )}
              {voucher.max_discount_amount > 0 && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t("voucher.max_discount", "Max discount")}: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(voucher.max_discount_amount)}</span>
                </span>
              )}
              {remainingUses !== null && (
                <span className={`text-[11px] font-bold ${isRunningOut ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-600 dark:text-slate-400"}`}>
                  {remainingUses} {t("voucher.left", "left")}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Horizontal ticket notch divider */}
        <div className="relative h-0 mx-0">
          <div className="absolute -left-[9px] top-0 w-[18px] h-[18px] rounded-full bg-white dark:bg-slate-900" />
          <div className="absolute -right-[9px] top-0 w-[18px] h-[18px] rounded-full bg-white dark:bg-slate-900" />
          <div className="absolute left-[9px] right-[9px] top-[9px] border-t border-dashed border-rose-300 dark:border-rose-800" />
        </div>

        {/* Bottom: copy button */}
        <div className="px-4 pt-4 pb-3 flex items-center justify-center">
          <button
            onClick={handleCopyCode}
            className={`w-full h-10 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isCopied ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
            }`}
          >
            <i className={`fa-solid ${isCopied ? "fa-check text-xs" : "fa-copy text-xs"}`}></i>
            {isCopied ? t("voucher.copied", "Copied!") : t("voucher.copy_code", "Copy code")}
          </button>
        </div>
      </div>

      {/* Desktop layout — ticket style */}
      <div className="hidden sm:flex w-full mb-8 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl items-stretch">
        {/* Left: main info */}
        <div className="flex-1 px-5 py-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-rose-700 dark:text-rose-400">
              {t("voucher.discount_badge", "Giảm {percent}%").replace("{percent}", String(Number.parseFloat(voucher.discount_percent)))}
            </span>
            <span className="font-mono text-xs font-bold text-rose-700 dark:text-rose-400 bg-white dark:bg-slate-800 border border-dashed border-rose-300 dark:border-rose-800 px-2.5 py-1 rounded-md">
              {voucher.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {voucher.apply_scope === "all" ? t("voucher.valid_all", "Valid for all products") : t("voucher.valid_for", "Valid for {category}").replace("{category}", categoryName)}
          </p>
          <div className="flex flex-wrap gap-5 mt-3">
            {voucher.min_order_value > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("voucher.min_spend", "Min spend")}</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{formatCurrency(voucher.min_order_value)}</p>
              </div>
            )}
            {voucher.max_discount_amount > 0 && (
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("voucher.max_discount", "Max discount")}</p>
                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">{formatCurrency(voucher.max_discount_amount)}</p>
              </div>
            )}
            {remainingUses !== null && (
              <div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{t("voucher.remaining", "Remaining")}</p>
                <p className={`text-sm font-bold ${isRunningOut ? "text-rose-600 dark:text-rose-400 animate-pulse" : "text-slate-800 dark:text-slate-200"}`}>
                  {remainingUses} {t("voucher.left", "left")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket notch divider */}
        <div className="relative w-0">
          <div className="absolute -top-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-white dark:bg-slate-900" />
          <div className="absolute -bottom-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-white dark:bg-slate-900" />
          <div className="absolute top-[9px] bottom-[9px] left-0 border-l border-dashed border-rose-300 dark:border-rose-800" />
        </div>

        {/* Right: copy button */}
        <div className="w-[145px] flex items-center justify-center px-4 py-4 shrink-0">
          <button
            onClick={handleCopyCode}
            className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isCopied ? "bg-emerald-600 text-white shadow-sm" : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white"
            }`}
          >
            <i className={`fa-solid ${isCopied ? "fa-check text-xs" : "fa-copy text-xs"}`}></i>
            {isCopied ? t("voucher.copied", "Copied!") : t("voucher.copy_code", "Copy code")}
          </button>
        </div>
      </div>
    </>
  );
}
