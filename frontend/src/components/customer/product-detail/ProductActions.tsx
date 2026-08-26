import React from "react";

export default function ProductActions({ state, actions, helpers }) {
  const { quantity, currentStock, isProductIncomplete } = state;
  const { setQuantity, handleAddToCart } = actions;
  const { getStockMessage } = helpers;

  const isOutOfStock = currentStock === 0;

  return (
    <div className="space-y-4">
      {/* QUANTITY CONTROL */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-slate-200 rounded-full h-12 w-32 overflow-hidden bg-white shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
          >
            <i className="fa-solid fa-minus text-xs"></i>
          </button>
          <span className="flex-1 text-center font-medium text-slate-900 text-sm">
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

        <p className={`text-sm font-medium ${currentStock > 0 ? "text-emerald-600" : "text-rose-500"}`}>
          {getStockMessage()}
        </p>
      </div>

      {/* ADD TO CART BUTTON — full width, tall */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || !state.selectedSize}
        className="w-full md:w-80 h-14 bg-slate-900 text-white rounded-full font-semibold text-base hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md flex items-center justify-center"
      >
        {isProductIncomplete ? "Product Not Ready" : isOutOfStock ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}
