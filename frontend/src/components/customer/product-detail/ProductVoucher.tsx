import React, { useState } from "react";
import Toast from "../layout/Toast";

export default function ProductVoucher({ state, helpers }) {
  const { activeVoucher, isVoucherValidForProduct, product } = state;
  const { formatPrice } = helpers;
  const [toastMessage, setToastMessage] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const isAvailable = activeVoucher?.usage_limit === null || (activeVoucher?.usage_limit - activeVoucher?.used_count > 0);

  if (!activeVoucher || !isVoucherValidForProduct || !isAvailable) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeVoucher.code);
    setIsCopied(true);
    setToastMessage("Code copied: " + activeVoucher.code);
    setTimeout(() => setIsCopied(false), 2000);
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
      <div className="w-full mb-6 p-4 sm:p-5 bg-gradient-to-r from-rose-50/90 via-pink-50/80 to-rose-50/90 border border-rose-200/90 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 transition-all shadow-xs hover:shadow-md">
        {/* Left: Soft Ticket Icon & Main Info */}
        <div className="flex items-center gap-3.5 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center flex-shrink-0 text-lg">
            <i className="fa-solid fa-ticket-simple"></i>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-extrabold text-slate-900">
                Exclusive {Number.parseFloat(activeVoucher.discount_percent)}% OFF
              </span>
              <span className="font-mono text-xs font-bold bg-white text-rose-600 border border-dashed border-rose-300 px-2.5 py-0.5 rounded-lg shadow-2xs">
                {activeVoucher.code}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-slate-500 font-medium">
              {activeVoucher.min_order_value > 0 && (
                <span>Min spend: <b className="text-slate-800">{formatPrice(Math.floor(activeVoucher.min_order_value))} đ</b></span>
              )}
              {activeVoucher.max_discount_amount > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Max discount: <b className="text-slate-800">{formatPrice(Math.floor(activeVoucher.max_discount_amount))} đ</b></span>
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
            <p className="text-[10px] text-slate-400 mt-1.5 uppercase tracking-wider font-bold">
              * Valid {activeVoucher.apply_scope === "all" ? "for all products" : activeVoucher.apply_scope === "category" ? `for items in ${product.category_name}` : "for this product only"}
            </p>
          </div>
        </div>

        {/* Right: Dashed divider & Copy Code button */}
        <div className="flex sm:flex-col items-center justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-dashed border-rose-200 sm:pl-5 gap-3">
          <button
            onClick={handleCopy}
            className={`w-full sm:w-auto text-xs font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 whitespace-nowrap shadow-xs ${
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
