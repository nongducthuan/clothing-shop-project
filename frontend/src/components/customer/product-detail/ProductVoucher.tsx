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

  const scopeLabel =
    activeVoucher.apply_scope === "all"
      ? "Valid for all products"
      : activeVoucher.apply_scope === "category"
      ? `Valid for ${product.category_name}`
      : "Valid for this product only";

  return (
    <>
      {toastMessage && (
        <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />
      )}
      <div className="w-full mb-6 bg-rose-50 border border-rose-200 rounded-2xl flex items-stretch">
        {/* Left: main info */}
        <div className="flex-1 px-5 py-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold text-rose-700">
              {Number.parseFloat(activeVoucher.discount_percent)}% off
            </span>
            <span className="font-mono text-xs font-bold text-rose-700 bg-white border border-dashed border-rose-300 px-2.5 py-1 rounded-md">
              {activeVoucher.code}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{scopeLabel}</p>

          <div className="flex flex-wrap gap-5 mt-3">
            {activeVoucher.min_order_value > 0 && (
              <div>
                <p className="text-[11px] text-slate-400">Min spend</p>
                <p className="text-sm text-slate-800 font-medium">{formatPrice(Math.floor(activeVoucher.min_order_value))} đ</p>
              </div>
            )}
            {activeVoucher.max_discount_amount > 0 && (
              <div>
                <p className="text-[11px] text-slate-400">Max discount</p>
                <p className="text-sm text-slate-800 font-medium">{formatPrice(Math.floor(activeVoucher.max_discount_amount))} đ</p>
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
            onClick={handleCopy}
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