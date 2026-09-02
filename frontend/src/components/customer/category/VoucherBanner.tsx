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
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
      <div className="w-full mb-8 p-4 sm:p-5 bg-gradient-to-r from-rose-50/90 via-pink-50/80 to-rose-50/90 border border-rose-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all shadow-xs hover:shadow-md">
        {/* Left: Soft Ticket Icon & Main Info */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0 text-lg">
            <i className="fa-solid fa-ticket-simple"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-slate-900">
                {voucher.apply_scope === "all" ? "Site-wide" : categoryName} — Get {Number.parseFloat(voucher.discount_percent)}% OFF
              </span>
              <span className="font-mono text-xs font-bold bg-white text-rose-600 border border-dashed border-rose-300 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {voucher.code}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-500 font-medium">
              {voucher.min_order_value > 0 && (
                <span>Min spend: <b className="text-slate-800">{formatCurrency(voucher.min_order_value)}</b></span>
              )}
              {voucher.max_discount_amount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Max discount: <b className="text-slate-800">{formatCurrency(voucher.max_discount_amount)}</b></span>
                </>
              )}
              {remainingUses !== null && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className={`font-bold inline-flex items-center gap-1 ${isRunningOut ? "text-rose-500 animate-pulse" : "text-slate-500"}`}>
                    <i className="fa-solid fa-fire text-rose-500 text-xs"></i>
                    Only {remainingUses} left!
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Dashed divider & Copy Code button */}
        <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-dashed border-rose-200 sm:pl-5 gap-3">
          <button
            onClick={handleCopyCode}
            className={`w-full sm:w-auto text-xs sm:text-sm font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-xs ${
              isCopied
                ? "bg-emerald-600 text-white"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            {isCopied ? "Copied! ✓" : "Copy Code"}
          </button>
        </div>
      </div>
    </>
  );
}

