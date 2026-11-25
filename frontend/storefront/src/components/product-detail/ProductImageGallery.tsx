import { useLanguage } from "@shop/shared/context/LanguageContext";
import { getImageUrl } from "@shop/shared/utils/imageUtils";
import type { useProductDetail } from "@/hooks/useProductDetail";

type Props = Pick<ReturnType<typeof useProductDetail>, "state" | "actions">;

export default function ProductImageGallery({ state, actions }: Props) {
  const { product, mainImage, isSale, activePromotion, selectedColor } = state;
  const { setSelectedColor } = actions;
  const { t, getLocalizedText } = useLanguage();
  const PLACEHOLDER_IMG = "https://placehold.co/300x400?text=No+Image";
  if (!product) return null;

  const hasColors = (product.colors?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Main image */}
      <div className="w-full aspect-[4/5] max-h-[520px] rounded-3xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative shadow-sm border border-slate-100 dark:border-slate-700 mx-auto">
        <img
          src={mainImage}
          alt={product?.name || t("product.no_desc", "Product")}
          className="w-full h-full object-cover transition-all duration-500 hover:scale-105"
          onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMG)}
        />

        {/* SALE BADGE */}
        {isSale && (
          <span className="absolute top-6 left-6 bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md z-10 tracking-wider">
            {t("product.sale_off_badge", "-{percent}%").replace("{percent}", String(Math.round(product.sale_percent ?? 0)))}
          </span>
        )}

        {/* PROMOTION BADGE */}
        {activePromotion && (
          <div className="absolute top-6 right-6 z-10">
            <span className="bg-slate-900/90 dark:bg-slate-100/90 text-white dark:text-slate-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-md uppercase tracking-widest backdrop-blur-sm">
              {t("product.promo_badge", "BUY {buy} GET {gift}").replace("{buy}", String(activePromotion.buy_quantity)).replace("{gift}", String(activePromotion.gift_quantity))}
            </span>
          </div>
        )}
      </div>

      {/* Color thumbnail strip */}
      {hasColors && (
        <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
          {product.colors?.map((color) => (
            <button
              key={`thumb-${color.id}`}
              onClick={() => setSelectedColor(color)}
              aria-label={getLocalizedText(color, "color_name") || color.color_name}
              className={`shrink-0 w-14 h-[72px] rounded-xl overflow-hidden border-2 transition-all focus:outline-none ${
                selectedColor?.id === color.id
                  ? "border-slate-900 dark:border-slate-100 opacity-100 shadow-md scale-105"
                  : "border-transparent opacity-55 hover:opacity-90 hover:scale-105"
              }`}
            >
              <img
                src={getImageUrl(color.image_url)}
                alt={getLocalizedText(color, "color_name") || color.color_name}
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMG)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
