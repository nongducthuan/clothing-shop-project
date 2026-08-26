import { useState } from "react";
import Toast from "../layout/Toast";

export default function VoucherBanner({ voucher, categoryName }) {
  const [toastMessage, setToastMessage] = useState(null);

  const isAvailable = voucher.usage_limit === null || voucher.usage_limit - voucher.used_count > 0;
  if (!isAvailable) return null;

  const remainingUses = voucher.usage_limit ? voucher.usage_limit - voucher.used_count : null;
  const isRunningOut = remainingUses !== null && remainingUses <= 5;
  const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN").format(amount) + " VND";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(voucher.code);
    setToastMessage("Copied to clipboard: " + voucher.code);
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
      <div className="mb-12 flex flex-col md:flex-row items-center justify-between bg-slate-50 border border-slate-200 p-6 rounded-3xl transition-all">
      <div className="flex items-center gap-4 mb-4 md:mb-0">
        <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-xl flex-shrink-0">
          {voucher.apply_scope === "all" ? "✨" : "🎟️"}
        </div>
        <div>
          <p className="text-base font-medium text-slate-900">
            {voucher.apply_scope === "all" ? "Site-wide Offer: " : `Special Offer for ${categoryName}: `}
            Get {Number.parseFloat(voucher.discount_percent)}% OFF
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="text-xs text-slate-500">Code: <b className="text-slate-900 font-mono text-sm">{voucher.code}</b></span>
            <span className="text-slate-300">|</span>
            {voucher.min_order_value > 0 && (
              <span className="text-xs text-slate-500">Min Spend: <b className="text-slate-900">{formatCurrency(voucher.min_order_value)}</b></span>
            )}
            {voucher.max_discount_amount > 0 && (
              <>
                <span className="text-slate-300">|</span>
                <span className="text-xs text-slate-500">Max Discount: <b className="text-slate-900">{formatCurrency(voucher.max_discount_amount)}</b></span>
              </>
            )}
          </div>
          <p className={`text-xs font-medium mt-2 ${isRunningOut ? "text-rose-500 animate-pulse" : "text-slate-400"}`}>
            {isRunningOut ? `🔥 Hurry! Only ${remainingUses} left!` : remainingUses ? `${remainingUses} uses remaining` : "Unlimited uses"}
          </p>
        </div>
      </div>

      <button
        onClick={handleCopyCode}
        className="w-full md:w-auto bg-slate-900 text-white text-sm font-medium py-3 px-8 rounded-full hover:bg-slate-800 transition-colors active:scale-95 whitespace-nowrap"
      >
        Copy Code
      </button>
    </div>
    </>
  );
}
