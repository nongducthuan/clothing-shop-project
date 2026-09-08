import React, { useEffect } from "react";
import { PRICE_RANGES, GENDERS } from "./searchConstants";
import { useLanguage } from "../../../context/LanguageContext";

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
  const { t, language, getLocalizedText } = useLanguage();

  // Lock body scroll
  useEffect(() => {
    if (typeof document !== "undefined") {
      if (showMobileFilter) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
      }
    }
    return () => {
      if (typeof document !== "undefined") {
        document.body.style.overflow = "unset";
      }
    };
  }, [showMobileFilter]);

  if (!showMobileFilter) return null;

  const handleClose = () => {
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
      <div className="relative w-4/5 max-w-sm bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-sliders text-violet-600 dark:text-violet-400"></i>
            <h3 className="font-extrabold text-lg text-gray-800 dark:text-slate-100">{t("search.filters", "Filters")}</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* Gender Selection */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-sm text-gray-700 dark:text-slate-200 uppercase tracking-wider">{t("search.gender", "Gender")}</h4>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => updateFilter("gender", g.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold border-0 transition-all cursor-pointer ${
                    urlGender === g.id
                      ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-none"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-600 hover:text-violet-600"
                  }`}
                >
                  {t(g.labelKey, g.label)}
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h4 className="font-bold text-sm text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-3">{t("search.category", "Category")}</h4>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => updateFilter("category", "")}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-0 transition-all cursor-pointer ${
                  !urlCategory
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-600 hover:text-violet-700"
                }`}
              >
                {t("search.all_categories", "All Categories")}
              </button>
              {uniqueCategories.map((c) => {
                const currentSelectedCat = categories?.find(
                  (cat) => String(cat.id) === String(urlCategory)
                );
                const isSelected = currentSelectedCat && currentSelectedCat.name === c.name;
                const categoryName = getLocalizedText(c, 'name');
                return (
                  <button
                    key={c.id}
                    onClick={() => updateFilter("category", c.id)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-0 transition-all truncate cursor-pointer ${
                      isSelected
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-600 hover:text-violet-700"
                    }`}
                  >
                    {categoryName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-bold text-sm text-gray-700 dark:text-slate-200 uppercase tracking-wider mb-3">{t("search.price_range", "Price Range")}</h4>
            <div className="flex flex-col gap-1.5">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={i}
                  onClick={() => updateFilter("price", i)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold border-0 transition-all cursor-pointer ${
                    filterPrice === i
                      ? "bg-violet-600 text-white shadow-sm"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-slate-600 hover:text-violet-700"
                  }`}
                >
                  {language === "vi" ? r.label_vi : r.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-slate-700 space-y-2.5">
          <button
            onClick={handleClose}
            className="w-full bg-violet-600 text-white py-3.5 rounded-2xl font-bold border-0 shadow-lg shadow-violet-200 dark:shadow-none hover:bg-violet-700 transition-colors cursor-pointer"
          >
            {t("search.show_results", "Show results")} ({filteredProducts.length})
          </button>
          <button
            onClick={() => { clearFilters(); }}
            className="w-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 py-3 rounded-2xl font-bold border-0 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-sm cursor-pointer"
          >
            {t("search.reset", "Reset Filters")}
          </button>
        </div>
      </div>
    </div>
  );
}

