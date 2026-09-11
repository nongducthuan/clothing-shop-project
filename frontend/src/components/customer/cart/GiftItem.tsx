import { useLanguage } from "../../../context/LanguageContext";

export default function GiftItem({ gift, detail, helpers, onSelectVariant }) {
  const { formatPrice, getImageUrl } = helpers;
  const { t, getLocalizedText } = useLanguage();

  if (!detail) {
    return <div className="animate-pulse h-24 bg-slate-50 dark:bg-slate-700/40 rounded-2xl"></div>;
  }

  const currentColor = detail.colors?.find(c => c.id === gift.color_id) || detail.colors?.[0];
  const currentSize = currentColor?.sizes?.find(s => s.id === gift.size_id) || currentColor?.sizes?.[0];
  const colorImageUrl = currentColor?.image_url || detail.image_url;

  const handleColorChange = (e) => {
    const newColorId = Number(e.target.value);
    const newColorObj = detail.colors?.find(c => c.id === newColorId);
    const availableSize = newColorObj?.sizes?.find(s => s.stock > 0) || newColorObj?.sizes?.[0];
    if (onSelectVariant) {
      onSelectVariant(gift.giftProductId, newColorId, availableSize?.id || null);
    }
  };

  const handleSizeChange = (e) => {
    const newSizeId = Number(e.target.value);
    if (onSelectVariant) {
      onSelectVariant(gift.giftProductId, currentColor?.id || null, newSizeId);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-700/40 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 relative overflow-hidden group border border-slate-200/60 dark:border-slate-600/60 shadow-sm">
      <div className="w-20 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
        <img src={getImageUrl(colorImageUrl)} alt={detail.name} className="w-full h-full object-cover" />
      </div>

      <div className="flex-grow z-10 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm leading-tight">{detail.name}</h4>
          <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            <i className="fa-solid fa-gift text-rose-500"></i> {t("cart.free_gift", "Free Gift")} ({gift.promoName})
          </span>
        </div>

        {/* COLOR & SIZE SELECTORS FOR FREE GIFT */}
        <div className="flex flex-wrap items-center gap-3 pt-1">
          {detail.colors?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-400 dark:text-slate-400">{t("cart.color_label", "Color:")}</span>
              <select
                value={currentColor?.id || ""}
                onChange={handleColorChange}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-400 font-medium cursor-pointer shadow-sm"
              >
                {detail.colors.map(c => (
                  <option key={c.id} value={c.id}>{getLocalizedText(c, "color_name") || c.color_name}</option>
                ))}
              </select>
            </div>
          )}

          {currentColor?.sizes?.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-medium text-slate-400 dark:text-slate-400">{t("cart.size_label", "Size:")}</span>
              <select
                value={currentSize?.id || ""}
                onChange={handleSizeChange}
                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-slate-400 font-medium cursor-pointer shadow-sm"
              >
                {currentColor.sizes.map(s => (
                  <option key={s.id} value={s.id} disabled={s.stock === 0}>
                    {s.size} {s.stock === 0 && <span> {t("product.out_of_stock_label", "(Out of stock)")}</span>}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="text-right hidden sm:block z-10 pr-4">
        <span className="text-xs text-slate-400 dark:text-slate-500 line-through block">{formatPrice(detail.price)}</span>
        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{t("checkout.free", "Free")}</span>
      </div>

      <div className="font-semibold text-slate-700 dark:text-slate-200 z-10 pr-2 self-end sm:self-center bg-white dark:bg-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-xs shadow-sm">
        x{gift.quantity}
      </div>
    </div>
  );
}
