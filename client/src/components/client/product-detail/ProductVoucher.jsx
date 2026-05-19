import React from "react";

export default function ProductVoucher({ state, helpers }) {
  const { activeVoucher, isVoucherValidForProduct, product } = state;
  const { formatPrice } = helpers;

  const isAvailable = activeVoucher?.usage_limit === null || (activeVoucher?.usage_limit - activeVoucher?.used_count > 0);

  if (!activeVoucher || !isVoucherValidForProduct || !isAvailable) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeVoucher.code);
    alert("Code copied: " + activeVoucher.code);
  };

  return (
    <div className="mb-8 p-5 bg-rose-50 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between border border-rose-100 gap-4 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-lg flex-shrink-0">
          {activeVoucher.apply_scope === "all" ? "✨" : "🎁"}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-900">
            Exclusive {Number.parseFloat(activeVoucher.discount_percent)}% OFF
            <span className="ml-2 font-mono font-bold text-rose-600 bg-white px-2 py-0.5 rounded border border-rose-100">
              {activeVoucher.code}
            </span>
          </p>
          <div className="flex flex-wrap gap-3 mt-2">
            {activeVoucher.min_order_value > 0 && (
              <span className="text-[11px] text-slate-600 font-medium">
                Min: {formatPrice(Math.floor(activeVoucher.min_order_value))} đ
              </span>
            )}
            {activeVoucher.max_discount_amount > 0 && (
              <span className="text-[11px] text-slate-600 font-medium">
                Max: {formatPrice(Math.floor(activeVoucher.max_discount_amount))} đ
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
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
  );
}
