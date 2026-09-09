import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function ProductMeta({ state, helpers }) {
  const { product, isSale, salePrice } = state;
  const { formatPrice } = helpers;
  const { getLocalizedText } = useLanguage();

  const productName = getLocalizedText(product, 'name');
  const categoryName = getLocalizedText(product, 'category_name') || product.category_name;

  return (
    <div className="mb-8">
      <div className="mb-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
        {categoryName}
      </div>
      <h1 className="text-3xl sm:text-4xl font-medium text-slate-900 dark:text-slate-100 mb-4 leading-tight tracking-tight">
        {productName}
      </h1>

      <div>
        {isSale ? (
          <div className="flex items-center gap-4 flex-wrap">
            <p className="text-2xl font-medium text-rose-500">
              {formatPrice(salePrice)} đ
            </p>
            <p className="text-lg text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600">
              {formatPrice(product.price)} đ
            </p>
          </div>
        ) : (
          <p className="text-2xl font-medium text-slate-900 dark:text-slate-100">
            {formatPrice(product.price)} đ
          </p>
        )}
      </div>
    </div>
  );
}
