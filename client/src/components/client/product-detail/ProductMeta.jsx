import React from "react";

export default function ProductMeta({ state, helpers }) {
  const { product, isSale, salePrice } = state;
  const { formatPrice } = helpers;

  return (
    <div className="mb-8">
      <div className="mb-3 text-xs font-bold text-slate-400 uppercase tracking-widest">
        {product.category_name}
      </div>
      <h1 className="text-3xl sm:text-4xl font-medium text-slate-900 mb-4 leading-tight tracking-tight">
        {product.name}
      </h1>

      <div>
        {isSale ? (
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-2xl font-medium text-rose-500">
              {formatPrice(salePrice)} đ
            </p>
            <p className="text-lg text-slate-400 line-through decoration-slate-300">
              {formatPrice(product.price)} đ
            </p>
          </div>
        ) : (
          <p className="text-2xl font-medium text-slate-900">
            {formatPrice(product.price)} đ
          </p>
        )}
      </div>
    </div>
  );
}
