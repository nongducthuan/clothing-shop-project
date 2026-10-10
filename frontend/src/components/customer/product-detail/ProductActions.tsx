import { useLanguage } from "../../../context/LanguageContext";
import type { useProductDetail } from "../../../hooks/customer/useProductDetail";

type Props = Pick<ReturnType<typeof useProductDetail>, "state" | "actions" | "helpers">;

export default function ProductActions({ state, actions, helpers }: Props) {
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
            onClick={() => setQuantity(Math.max(1, Number(quantity) - 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            disabled={Number(quantity) <= 1}
          >
            <i className="fa-solid fa-minus text-xs"></i>
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) {
                setQuantity(Math.min(Math.max(1, val), currentStock || 1));
              } else if (e.target.value === '') {
                // Allows temporary empty state while typing
                setQuantity('');
              }
            }}
            onBlur={() => {
              if (quantity === '' || isNaN(Number(quantity)) || Number(quantity) < 1) {
                setQuantity(1);
              }
            }}
            className="w-10 text-center font-medium text-slate-900 dark:text-slate-100 text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => setQuantity(Math.min(currentStock || 1, (Number(quantity) || 0) + 1))}
            className="flex-1 h-full text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            disabled={Number(quantity) >= currentStock}
          >
            <i className="fa-solid fa-plus text-xs"></i>
          </button>
        </div>

        <p className={`text-sm font-medium ${currentStock > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"}`}>
          {getStockMessage()}
        </p>
      </div>

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
