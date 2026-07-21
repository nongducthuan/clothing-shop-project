import React from "react";
import { PRICE_RANGES, GENDERS } from "./searchConstants";

export default function MobileFilterOverlay({ state, actions, refs }) {
  const {
    showMobileFilter,
    filteredProducts,
    urlGender,
    urlCategory,
    filterPrice,
    uniqueCategories,
    categories,
  } = state;

  const { setShowMobileFilter, updateFilter, clearFilters } = actions;
  const { categoryRefs, priceRefs } = refs || {};

  if (!showMobileFilter) return null;

  // Lock body scroll
  if (typeof document !== "undefined") {
    document.body.style.overflow = "hidden";
  }

  const handleClose = () => {
    if (typeof document !== "undefined") {
      document.body.style.overflow = "unset";
    }
    setShowMobileFilter(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-sliders text-violet-600"></i>
            <h3 className="font-extrabold text-lg text-gray-800">Filters</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* Gender Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider">Gender</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => updateFilter("gender", g.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                    urlGender === g.id
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200"
                      : "bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-3">Category</h4>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => updateFilter("category", "")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  !urlCategory
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                All Categories
              </button>
              {uniqueCategories.map((c) => {
                const currentSelectedCat = categories?.find(
                  (cat) => String(cat.id) === String(urlCategory)
                );
                const isSelected = currentSelectedCat && currentSelectedCat.name === c.name;
                return (
                  <button
                    key={c.id}
                    onClick={() => updateFilter("category", c.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all truncate ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-bold text-sm text-gray-700 uppercase tracking-wider mb-3">Price Range</h4>
            <div className="flex flex-col gap-1.5">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={i}
                  onClick={() => updateFilter("price", i)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    filterPrice === i
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-gray-100 space-y-2.5">
          <button
            onClick={handleClose}
            className="w-full bg-violet-600 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-violet-200 hover:bg-violet-700 transition-colors"
          >
            Show {filteredProducts.length} Results
          </button>
          <button
            onClick={() => { clearFilters(); }}
            className="w-full bg-gray-100 text-gray-600 py-3 rounded-2xl font-bold hover:bg-gray-200 transition-colors text-sm"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
