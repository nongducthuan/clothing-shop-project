import React, { useState } from "react";
import Toast from "../layout/Toast";

export default function ProductVoucher({ state, helpers }) {
  const { activeVoucher, isVoucherValidForProduct, product } = state;
  const { formatPrice } = helpers;
  const [toastMessage, setToastMessage] = useState(null);

  const isAvailable = activeVoucher?.usage_limit === null || (activeVoucher?.usage_limit - activeVoucher?.used_count > 0);

  if (!activeVoucher || !isVoucherValidForProduct || !isAvailable) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeVoucher.code);
    setToastMessage("Code copied: " + activeVoucher.code);
  };

  const remainingUses = activeVoucher?.usage_limit ? activeVoucher.usage_limit - (activeVoucher.used_count || 0) : null;
  const isRunningOut = remainingUses !== null && remainingUses <= 5;

  return (
    <>
      {toastMessage && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setToastMessage(null)}
        />
      )}
      <div className="mb-6 p-4 sm:p-5 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="hidden sm:flex w-10 h-10 bg-white rounded-xl border border-rose-100 items-center justify-center text-rose-500 text-base shadow-sm flex-shrink-0">
            <i className="fa-solid fa-ticket"></i>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2 flex-wrap">
              <span>Exclusive {Number.parseFloat(activeVoucher.discount_percent)}% OFF</span>
              <span className="font-mono font-bold text-rose-600 bg-white px-2.5 py-0.5 rounded-lg border border-rose-200 text-xs shadow-sm">
                {activeVoucher.code}
              </span>
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              {activeVoucher.min_order_value > 0 && (
                <span className="text-[11px] text-slate-600 font-medium">
                  Min: <b className="text-slate-800">{formatPrice(Math.floor(activeVoucher.min_order_value))} đ</b>
                </span>
              )}
              {activeVoucher.max_discount_amount > 0 && (
                <span className="text-[11px] text-slate-600 font-medium">
                  Max: <b className="text-slate-800">{formatPrice(Math.floor(activeVoucher.max_discount_amount))} đ</b>
                </span>
              )}
              {remainingUses !== null && (
                <span className={`text-[11px] font-bold inline-flex items-center ${isRunningOut ? "text-rose-500 animate-pulse" : "text-slate-500 font-medium"}`}>
                {isRunningOut ? (
                  <>
                    <i className="fa-solid fa-fire text-rose-500 mr-1"></i>
                    Only {remainingUses} left!
                  </>
                ) : `${remainingUses} uses left`}
              </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-bold">
              * Valid {activeVoucher.apply_scope === "all" ? "for all products" : activeVoucher.apply_scope === "category" ? `for items in ${product.category_name}` : "for this product only"}
            </p>
          </div>
        </div>
      <button
        onClick={handleCopy}
        className="w-full sm:w-auto bg-slate-900 text-white text-xs font-bold py-2.5 px-6 rounded-full hover:bg-slate-800 transition-colors whitespace-nowrap"
      >
        Copy Code
      </button>
    </div>
    </>
  );
}
