import React from "react";
import ProductCard from "../product/ProductCard";

export default function SearchResultsGrid({ state, actions }) {
  const { filteredProducts, activePromotions, resultDisplayText } = state;
  const { clearFilters } = actions;

  return (
    <>
      <div className="mb-6 flex items-center gap-1">
        <span className="text-gray-400 text-sm font-medium">Results for:</span>
        <span className="text-gray-900 font-bold bg-gray-100 px-3 py-1 rounded-full text-sm">
          {resultDisplayText}
        </span>
        <span className="text-gray-400 text-sm ml-auto">
          {filteredProducts.length} items
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
        <div className="text-center py-32 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
            <i className="fa-solid fa-box-open text-gray-300 text-2xl"></i>
          </div>
          <h3 className="text-gray-900 font-extrabold text-xl mb-2">No matching items</h3>
          <p className="text-gray-500 max-w-xs mx-auto text-sm mb-8">
            Try adjusting your filters or search terms to find what you're looking for.
          </p>
          <button
            onClick={clearFilters}
            className="bg-white text-violet-600 font-bold text-sm hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </>
  );
}
