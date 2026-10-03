import React from "react";
import ProductCard from "../product/ProductCard";
import { useLanguage } from "../../../context/LanguageContext";

export default function SearchResultsGrid({ state, actions }) {
  const { filteredProducts, activePromotions, resultDisplayText } = state;
  const { clearFilters } = actions;
  const { t } = useLanguage();

  return (
    <>
      <div className="mb-6 flex items-center gap-1 flex-wrap">
        <span className="text-gray-400 dark:text-slate-400 text-sm font-medium">{t("search.results_for", "Results for:")}</span>
        <span className="text-gray-900 dark:text-slate-100 font-bold bg-gray-100 dark:bg-slate-800 px-3 py-1 rounded-full text-sm">
          {resultDisplayText}
        </span>
        <span className="text-gray-400 dark:text-slate-400 text-sm ml-auto">
          {filteredProducts.length} {t("search.items", "items")}
        </span>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const productPromo = activePromotions.find(
              (promo) => String(promo.buy_product_id) === String(p.id)
            );
            return <ProductCard key={p.id} product={p} promotion={productPromo} />;
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-gray-50/50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
          <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-box-open text-gray-300 dark:text-slate-500 text-2xl"></i>
          </div>
          <h3 className="text-gray-900 dark:text-slate-100 font-extrabold text-xl mb-2">{t("search.no_items", "No matching items")}</h3>
          <p className="text-gray-500 dark:text-slate-400 max-w-xs mx-auto text-sm mb-8">
            {t("search.no_items_desc", "Try adjusting your filters or search terms to find what you're looking for.")}
          </p>
          <button
            onClick={clearFilters}
            className="bg-transparent border-0 text-violet-600 dark:text-violet-400 font-bold text-sm hover:underline cursor-pointer"
          >
            {t("search.clear_all", "Clear all filters")}
          </button>
        </div>
      )}
    </>
  );
}

