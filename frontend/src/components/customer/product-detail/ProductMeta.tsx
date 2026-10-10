import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";
import type { useProductDetail } from "../../../hooks/customer/useProductDetail";

export default function ProductMeta({ state }: Pick<ReturnType<typeof useProductDetail>, "state">) {
  const { product, isSale, salePrice } = state;
  const { getLocalizedText, language } = useLanguage();
  if (!product) return null;

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
              {formatCurrency(salePrice, language)}
            </p>
            <p className="text-lg text-slate-400 dark:text-slate-500 line-through decoration-slate-300 dark:decoration-slate-600">
              {formatCurrency(product.price, language)}
            </p>
          </div>
        ) : (
          <p className="text-2xl font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(product.price, language)}
          </p>
        )}
      </div>
    </div>
  );
}
