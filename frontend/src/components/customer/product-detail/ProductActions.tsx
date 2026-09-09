import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductActions({ state, actions, helpers }) {
  const { quantity, currentStock, isProductIncomplete } = state;
  const { setQuantity, handleAddToCart } = actions;
  const { getStockMessage } = helpers;
  const { t } = useLanguage();

  const isOutOfStock = currentStock === 0;

  return (
    <div className="space-y-4">
      {/* QUANTITY CONTROL */}
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full h-12 w-32 overflow-hidden bg-white dark:bg-slate-800 shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            disabled={quantity <= 1}
          >
            <i className="fa-solid fa-minus text-xs"></i>
          </button>
          <span className="flex-1 text-center font-medium text-slate-900 dark:text-slate-100 text-sm">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(Math.min(currentStock || 1, quantity + 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            disabled={quantity >= currentStock}
          >
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </div>

        <p className={`text-sm font-medium ${currentStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
          {getStockMessage()}
        </p>
      </div>

      {/* ADD TO CART BUTTON */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || !state.selectedSize}
        className="w-full md:w-80 h-14 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-full font-semibold text-base hover:bg-slate-800 dark:hover:bg-white disabled:bg-slate-200 dark:disabled:bg-slate-700 disabled:text-slate-400 dark:disabled:text-slate-500 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-md flex items-center justify-center"
      >
        {isProductIncomplete ? t("product.not_ready", "Product Not Ready") : isOutOfStock ? t("product.out_of_stock", "Out of Stock") : t("product.add_to_cart", "Add to Cart")}
      </button>
    </div>
  );
}
