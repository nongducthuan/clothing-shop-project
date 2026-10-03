import { Link } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";

export default function CartItem({ item, actions, helpers }) {
  const { removeFromCart, updateQuantity } = actions;
  const { formatPrice, getImageUrl } = helpers;
  const { t, getLocalizedText } = useLanguage();
  const imageSrc = getImageUrl(item.color_image || item.image_url);
  const productName = getLocalizedText(item, "name") || item.name;
  const colorName = getLocalizedText(item, "color_name") || item.color;

  return (
    <div className="py-8 flex gap-6">
      <div className="w-32 h-40 bg-slate-50 dark:bg-slate-800 rounded-2xl overflow-hidden flex-shrink-0 border border-slate-100 dark:border-slate-700">
        <img src={imageSrc} alt={productName} className="w-full h-full object-cover" />
      </div>

      <div className="flex-grow flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <Link to={`/products/${item.id}`} className="text-lg font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {productName}
            </Link>
            <div className="text-right hidden sm:block shrink-0">
              <p className="text-lg font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                {formatPrice(item.price * item.quantity)}
              </p>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                {formatPrice(item.price)} × {item.quantity}
              </span>
            </div>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 space-x-2">
            {colorName && <span>{t("cart.color_label", "Color:")} {colorName}</span>}
            {colorName && item.size && <span>|</span>}
            {item.size && <span>{t("cart.size_label", "Size:")} {item.size}</span>}
          </div>
          <div className="text-right sm:hidden mt-2">
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
              {formatPrice(item.price * item.quantity)}
            </p>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {formatPrice(item.price)} × {item.quantity}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-6">
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-full px-1 py-1">
            <button
              onClick={() => updateQuantity(item.cartItemId, -1)}
              disabled={item.quantity <= 1}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 transition-colors"
            >
              <i className="fa-solid fa-minus text-xs"></i>
            </button>
            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) {
                  actions.setItemQuantity(item.cartItemId, val);
                } else if (e.target.value === '') {
                  // Empty input: CartContext clamps the quantity back to the allowed minimum (1).
                  actions.setItemQuantity(item.cartItemId, 1);
                }
              }}
              onBlur={(e) => {
                if (e.target.value === '' || isNaN(item.quantity) || item.quantity < 1) {
                  actions.setItemQuantity(item.cartItemId, 1);
                }
              }}
              className="w-10 text-center font-medium text-slate-900 dark:text-slate-100 text-sm bg-transparent border-none focus:outline-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => updateQuantity(item.cartItemId, 1)}
              disabled={item.quantity >= (item.stock || 99)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-50 transition-colors"
            >
              <i className="fa-solid fa-plus text-xs"></i>
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.cartItemId)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
            title={t("cart.remove_item", "Remove item")}
          >
            <i className="fa-regular fa-trash-can text-base"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
