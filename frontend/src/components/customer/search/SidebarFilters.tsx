import React from "react";
import { PRICE_RANGES, GENDERS } from "./searchConstants";
import { useLanguage } from "../../../context/LanguageContext";

export default function SidebarFilters({ state, refs, actions }) {
  const {
    urlGender, urlCategory, filterPrice, uniqueCategories, categories,
    pillStyle, categoryPillStyle, pricePillStyle
  } = state;
  const { buttonRefs, categoryRefs, priceRefs } = refs;
  const { updateFilter, clearFilters } = actions;
  const { t, language, getLocalizedText } = useLanguage();

  return (
    <div className="hidden md:block md:w-1/4 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm custom-scrollbar">

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400 dark:text-slate-400">{t("search.filters", "Filters")}</h3>
          <button
            className="text-xs font-bold bg-transparent border-0 text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors cursor-pointer"
            onClick={clearFilters}
          >
            {t("search.reset", "Reset")}
          </button>
        </div>

        {/* iOS Segmented Control - Gender */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-3 text-gray-700 dark:text-slate-200">{t("search.gender", "Gender Selection")}</h4>
          <div className="relative flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl select-none">
            <div
              className="absolute top-1 bottom-1 left-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
              style={{ width: `${pillStyle.width}px`, transform: `translateX(${pillStyle.left}px)` }}
            ></div>

            {GENDERS.map((g, index) => (
              <button
                key={g.id}
                ref={(el) => { buttonRefs.current[index] = el; }}
                onClick={() => updateFilter("gender", g.id)}
                className={`relative z-10 flex-1 px-3 py-2 text-xs font-bold bg-transparent border-0 transition-colors duration-300 outline-none ring-0 focus:ring-0 cursor-pointer ${
                  urlGender === g.id ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200"
                }`}
              >
                {t(g.labelKey, g.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-3 text-gray-700 dark:text-slate-200">{t("search.category", "Category")}</h4>
          <div className="relative flex flex-col p-1 bg-gray-100 dark:bg-slate-900 rounded-xl select-none">
            <div
              className="absolute top-0 left-1 right-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
              style={{ height: `${categoryPillStyle.height}px`, transform: `translateY(${categoryPillStyle.top}px)` }}
            ></div>

            <button
              ref={(el) => { categoryRefs.current[0] = el; }}
              onClick={() => updateFilter("category", "")}
              className={`bg-transparent border-0 relative z-10 px-3 py-2 text-sm rounded-lg text-left transition-all font-bold outline-none ring-0 focus:ring-0 cursor-pointer ${
                !urlCategory ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              }`}
            >
              {t("search.all_categories", "All Categories")}
            </button>

            {uniqueCategories.map((c, index) => {
              const currentSelectedCat = categories.find((cat) => String(cat.id) === String(urlCategory));
              const isSelected = currentSelectedCat && currentSelectedCat.name === c.name;
              const categoryName = getLocalizedText(c, 'name');

              return (
                <button
                  key={c.id}
                  ref={(el) => { categoryRefs.current[index + 1] = el; }}
                  onClick={() => updateFilter("category", c.id)}
                  className={`relative bg-transparent border-0 z-10 px-3 py-2 text-sm rounded-lg text-left transition-all font-bold truncate outline-none ring-0 focus:ring-0 cursor-pointer ${
                    isSelected ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                  }`}
                >
                  {categoryName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-gray-700 dark:text-slate-200">{t("search.price_range", "Price Range")}</h4>
          <div className="relative flex flex-col p-1 bg-gray-100 dark:bg-slate-900 rounded-xl select-none">
            <div
              className="absolute top-0 left-1 right-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
              style={{ height: `${pricePillStyle.height}px`, transform: `translateY(${pricePillStyle.top}px)` }}
            ></div>

            {PRICE_RANGES.map((r, i) => (
              <button
                key={i}
                ref={(el) => { priceRefs.current[i] = el; }}
                onClick={() => updateFilter("price", i)}
                className={`bg-transparent border-0 relative z-10 block w-full text-left px-3 py-2 text-sm rounded-lg transition-all font-bold outline-none ring-0 focus:ring-0 cursor-pointer ${
                  filterPrice === i ? "text-violet-600 dark:text-violet-400" : "text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
                }`}
              >
                {language === "vi" ? r.label_vi : r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


