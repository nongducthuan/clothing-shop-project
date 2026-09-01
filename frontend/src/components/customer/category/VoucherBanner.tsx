import { useState } from "react";
import Toast from "../layout/Toast";

export default function VoucherBanner({ voucher, categoryName }) {
  const [toastMessage, setToastMessage] = useState(null);

  const isAvailable = voucher.usage_limit === null || voucher.usage_limit - voucher.used_count > 0;
  if (!isAvailable) return null;

  const remainingUses = voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null;
  const isRunningOut = remainingUses !== null && remainingUses <= 5;
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount) + "đ";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    setToastMessage("Code copied: " + voucher.code);
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
      <div className="w-full mb-8 p-5 sm:px-8 sm:py-5 bg-rose-50 border border-rose-100 rounded-2xl sm:rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="hidden sm:flex w-11 h-11 bg-white rounded-2xl border border-rose-100 items-center justify-center text-rose-500 text-lg shadow-sm flex-shrink-0">
            <i className="fa-solid fa-ticket"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {voucher.apply_scope === "all" ? "Site-wide" : categoryName} — Get {Number.parseFloat(voucher.discount_percent)}% OFF
              </span>
              <span className="font-mono font-bold text-rose-600 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 text-xs shadow-sm">
                {voucher.code}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
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
                  <span className={`font-bold inline-flex items-center ${isRunningOut ? "text-rose-500 animate-pulse" : "text-slate-500"}`}>
                    {isRunningOut ? (
                      <>
                        <i className="fa-solid fa-fire text-rose-500 mr-1"></i>
                        Only {remainingUses} left!
                      </>
                    ) : `${remainingUses} uses left`}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyCode}
          className="w-full sm:w-auto bg-slate-900 text-white text-xs sm:text-sm font-bold py-3 px-7 rounded-full hover:bg-slate-800 transition-all active:scale-95 whitespace-nowrap shadow-sm self-stretch sm:self-center"
        >
          Copy Code
        </button>
      </div>
    </>
  );
}

