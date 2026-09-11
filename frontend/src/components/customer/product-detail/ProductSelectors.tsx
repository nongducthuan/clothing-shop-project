import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductSelectors({ state, actions }) {
  const { product, selectedColor, selectedSize, isProductIncomplete } = state;
  const { setSelectedColor, setSelectedSize } = actions;
  const { t, getLocalizedText } = useLanguage();

  return (
    <div className="space-y-8 mb-8 border-t border-slate-100 dark:border-slate-800 pt-8">

      {/* COLOR THUMBNAILS */}
      {product.colors?.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {product.colors.map((color) => (
            <img
              key={`thumb-${color.id}`}
              src={getImageUrl(color.image_url)}
              className={`w-16 h-20 object-cover rounded-xl cursor-pointer border-2 transition-all ${
                selectedColor?.id === color.id
                  ? "border-slate-900 dark:border-slate-100 opacity-100 shadow-md"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              onClick={() => setSelectedColor(color)}
              alt={getLocalizedText(color, "color_name") || color.color_name}
            />
          ))}
        </div>
      )}

      {/* COLOR DOTS */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">
          {t("product.color_label", "Color")} <span className="text-slate-500 dark:text-slate-400 font-normal normal-case ml-2">{getLocalizedText(selectedColor, "color_name") || selectedColor?.color_name || t("product.not_selected", "Not selected")}</span>
        </h3>
        <div className="flex items-center flex-wrap gap-3">
          {product.colors?.map((color) => (
            <button
              key={color.id}
              onClick={() => setSelectedColor(color)}
              className={`w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 transition-transform focus:outline-none ${
                selectedColor?.id === color.id
                  ? "ring-2 ring-offset-2 ring-slate-900 dark:ring-slate-100 dark:ring-offset-slate-900 scale-110"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: color.color_code }}
              title={getLocalizedText(color, "color_name") || color.color_name}
            />
          ))}
          {isProductIncomplete && (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">{t("product.color_info_unavailable", "Color information not available.")}</p>
          )}
        </div>
      </div>

      {/* SIZES */}
      <div>
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-widest mb-3">{t("product.size_label", "Size")}</h3>
        <div className="flex flex-wrap gap-3">
          {selectedColor?.sizes?.map((sizeObj) => {
            const isSelected = selectedSize?.id === sizeObj.id;
            const isOutOfStock = sizeObj.stock === 0;

            return (
              <button
                key={sizeObj.id}
                onClick={() => setSelectedSize(sizeObj)}
                disabled={isOutOfStock}
                className={`py-3 px-6 text-sm font-medium uppercase rounded-2xl transition-all ${
                  isSelected
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md"
                    : isOutOfStock
                    ? "bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {sizeObj.size} {sizeObj.stock === 0 && <span className="text-xs">{t("product.out_of_stock_label", "(Out of stock)")}</span>}
              </button>
            );
          })}
        </div>
        {!isProductIncomplete && (!selectedColor?.sizes || selectedColor.sizes.length === 0) && (
          <p className="text-sm text-rose-500 mt-2 font-medium">{t("product.no_sizes", "This color has no sizes available.")}</p>
        )}
      </div>
    </div>
  );
}
