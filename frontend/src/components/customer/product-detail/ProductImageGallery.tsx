import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductImageGallery({ state }) {
  const { product, mainImage, isSale, activePromotion } = state;
  const { t } = useLanguage();
  const PLACEHOLDER_IMG = "https://placehold.co/300x400?text=No+Image";

  return (
    <div className="w-full aspect-[4/5] max-h-[560px] rounded-3xl bg-slate-50 dark:bg-slate-800 overflow-hidden relative shadow-sm border border-slate-100 dark:border-slate-700 mx-auto">
      <img
        src={mainImage}
        alt={product?.name || t("product.no_desc", "Product")}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        onError={(e) => ((e.target as HTMLImageElement).src = PLACEHOLDER_IMG)}
      />

      {/* SALE BADGE */}
      {isSale && (
        <span className="absolute top-6 left-6 bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md z-10 tracking-wider">
          {t("product.sale_off_badge", "Giảm {percent}%").replace("{percent}", String(Math.round(product.sale_percent)))}
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
  );
}
