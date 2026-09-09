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
            <p className="text-lg font-medium text-slate-900 dark:text-slate-100 hidden sm:block">
              {formatPrice(item.price * item.quantity)}
            </p>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-sm mt-1 space-x-2">
            {colorName && <span>{t("cart.color_label", "Color:")} {colorName}</span>}
            {colorName && item.size && <span>|</span>}
            {item.size && <span>{t("cart.size_label", "Size:")} {item.size}</span>}
          </div>
          <p className="text-lg font-medium text-slate-900 dark:text-slate-100 sm:hidden mt-2">
            {formatPrice(item.price * item.quantity)}
          </p>
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
            <span className="w-8 text-center text-sm font-medium text-slate-900 dark:text-slate-100">{item.quantity}</span>
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
