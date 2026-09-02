import { useState } from "react";
import Toast from "../layout/Toast";

export default function VoucherBanner({ voucher, categoryName }) {
  const [toastMessage, setToastMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const isAvailable = voucher.usage_limit === null || voucher.usage_limit - voucher.used_count > 0;
  if (!isAvailable) return null;

  const remainingUses = voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null;
  const isRunningOut = remainingUses !== null && remainingUses <= 5;
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    setIsCopied(true);
    setToastMessage("Code copied: " + voucher.code);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
      <div className="w-full mb-8 bg-rose-50 border border-rose-200 rounded-2xl flex items-stretch">
        {/* Left: main info */}
        <div className="flex-1 px-5 py-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-rose-700">
              {Number.parseFloat(voucher.discount_percent)}% off
            </span>
            <span className="font-mono text-xs font-bold text-rose-700 bg-white border border-dashed border-rose-300 px-2.5 py-1 rounded-md">
              {voucher.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {voucher.apply_scope === "all" ? "Valid for all products" : `Valid for ${categoryName}`}
          </p>

          <div className="flex flex-wrap gap-5 mt-3">
            {voucher.min_order_value > 0 && (
              <div>
                <p className="text-[11px] text-slate-400">Min spend</p>
                <p className="text-sm text-slate-800 font-medium">{formatCurrency(voucher.min_order_value)}</p>
              </div>
            )}
            {voucher.max_discount_amount > 0 && (
              <div>
                <p className="text-[11px] text-slate-400">Max discount</p>
                <p className="text-sm text-slate-800 font-medium">{formatCurrency(voucher.max_discount_amount)}</p>
              </div>
            )}
            {remainingUses !== null && (
              <div>
                <p className="text-[11px] text-slate-400">Remaining</p>
                <p className={`text-sm font-bold ${isRunningOut ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
                  {remainingUses} left
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket notch divider */}
        <div className="relative w-0 hidden sm:block">
          <div className="absolute -top-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-white" />
          <div className="absolute -bottom-[9px] -left-[9px] w-[18px] h-[18px] rounded-full bg-white" />
          <div className="absolute top-[9px] bottom-[9px] left-0 border-l border-dashed border-rose-300" />
        </div>

        {/* Right: copy button */}
        <div className="w-full sm:w-[130px] flex items-center justify-center px-4 py-4 border-t sm:border-t-0 border-dashed border-rose-300 sm:border-0">
          <button
            onClick={handleCopyCode}
            className={`w-full h-10 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 ${
              isCopied ? "bg-emerald-600 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            <i className="fa-solid fa-copy text-xs"></i>
            {isCopied ? "Copied!" : "Copy code"}
          </button>
        </div>
      </div>
    </>
  );
}