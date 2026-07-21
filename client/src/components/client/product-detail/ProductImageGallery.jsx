import React from "react";

export default function ProductImageGallery({ state, constants }) {
  const { product, mainImage, isSale, activePromotion } = state;
  const { PLACEHOLDER_IMG } = constants;

  return (
    <div className="w-full aspect-[4/5] max-h-[560px] rounded-3xl bg-slate-50 overflow-hidden relative shadow-sm border border-slate-100 mx-auto">
      <img
        src={mainImage}
        alt={product?.name || "Product"}
        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
        onError={(e) => (e.target.src = PLACEHOLDER_IMG)}
      />

      {/* SALE BADGE */}
      {isSale && (
        <span className="absolute top-6 left-6 bg-rose-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md z-10 tracking-wider">
          -{Math.round(product.sale_percent)}% OFF
        </span>
      )}

      {/* PROMOTION BADGE */}
      {activePromotion && (
        <div className="absolute top-6 right-6 z-10">
          <span className="bg-slate-900 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md uppercase tracking-widest">
            BUY {activePromotion.buy_quantity} GET {activePromotion.gift_quantity}
          </span>
        </div>
      )}
    </div>
  );
}
