import React from "react";

export default function ProductActions({ state, actions, helpers }) {
  const { quantity, currentStock, isProductIncomplete } = state;
  const { setQuantity, handleAddToCart } = actions;
  const { getStockMessage } = helpers;

  const isOutOfStock = currentStock === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

        {/* QUANTITY CONTROL */}
        <div className="flex items-center border border-slate-200 rounded-full h-14 w-36 overflow-hidden bg-white">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
          >
            <i className="fa-solid fa-minus text-xs"></i>
          </button>
          <span className="flex-1 text-center font-medium text-slate-900">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(currentStock || 1, quantity + 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
            disabled={quantity >= currentStock}
          >
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || !state.selectedSize}
          className="flex-1 w-full min-h-12 sm:min-h-14 h-12 sm:h-14 bg-slate-900 text-white rounded-full font-semibold text-base sm:text-lg hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md inline-flex items-center justify-center px-6"
        >
          {isProductIncomplete ? "Product Not Ready" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>

      <p className={`text-sm font-medium ${currentStock > 0 ? "text-emerald-600" : "text-rose-500"}`}>
        {getStockMessage()}
      </p>
    </div>
  );
}
