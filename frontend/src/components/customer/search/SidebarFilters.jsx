import React from "react";
import { PRICE_RANGES, GENDERS } from "./searchConstants";

export default function SidebarFilters({ state, refs, actions }) {
  const {
    urlGender, urlCategory, filterPrice, uniqueCategories, categories,
    pillStyle, categoryPillStyle, pricePillStyle
  } = state;
  const { buttonRefs, categoryRefs, priceRefs } = refs;
  const { updateFilter, clearFilters } = actions;

  return (
    <div className="hidden md:block md:w-1/4 flex-shrink-0">
      <div className="sticky top-24 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">

        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-gray-400">Filters</h3>
          <button
            className="text-xs font-bold bg-transparent border text-violet-600 hover:text-violet-800 transition-colors"
            onClick={clearFilters}
          >
            Reset
          </button>
        </div>

        {/* iOS Segmented Control - Gender */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-3 text-gray-700">Gender Selection</h4>
          <div className="relative flex bg-gray-100 p-1 rounded-xl select-none">
            <div
              className="absolute top-1 bottom-1 left-0 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
              style={{ width: `${pillStyle.width}px`, transform: `translateX(${pillStyle.left}px)` }}
            ></div>

            {GENDERS.map((g, index) => (
              <button
                key={g.id}
                ref={(el) => (buttonRefs.current[index] = el)}
                onClick={() => updateFilter("gender", g.id)}
                className={`relative z-10 flex-1 px-3 py-2 text-xs font-bold bg-transparent transition-colors duration-300 outline-none ring-0 focus:ring-0 ${
                  urlGender === g.id ? "text-violet-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h4 className="font-bold text-sm mb-3 text-gray-700">Category</h4>
          <div className="relative flex flex-col p-1 bg-gray-100 rounded-xl select-none">
            <div
              className="absolute top-0 left-1 right-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
              style={{ height: `${categoryPillStyle.height}px`, transform: `translateY(${categoryPillStyle.top}px)` }}
            ></div>

            <button
              ref={(el) => (categoryRefs.current[0] = el)}
              onClick={() => updateFilter("category", "")}
              className={`bg-transparent relative z-10 px-3 py-2 text-sm rounded-lg text-left transition-all font-bold outline-none ring-0 focus:ring-0 ${
                !urlCategory ? "text-violet-600" : "text-gray-500 hover:text-gray-700 bg-transparent"
              }`}
            >
              All Categories
            </button>

            {uniqueCategories.map((c, index) => {
              const currentSelectedCat = categories.find((cat) => String(cat.id) === String(urlCategory));
              const isSelected = currentSelectedCat && currentSelectedCat.name === c.name;

              return (
                <button
                  key={c.id}
                  ref={(el) => (categoryRefs.current[index + 1] = el)}
                  onClick={() => updateFilter("category", c.id)}
                  className={`relative bg-transparent z-10 px-3 py-2 text-sm rounded-lg text-left transition-all font-bold truncate outline-none ring-0 focus:ring-0 ${
                    isSelected ? "text-violet-600" : "text-gray-500 hover:text-gray-700 bg-transparent"
                  }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Filter */}
        <div>
          <h4 className="font-bold text-sm mb-3 text-gray-700">Price Range</h4>
          <div className="relative flex flex-col p-1 bg-gray-100 rounded-xl select-none">
            <div
              className="absolute top-0 left-1 right-1 bg-white rounded-lg shadow-sm transition-all duration-300 ease-out pointer-events-none"
              style={{ height: `${pricePillStyle.height}px`, transform: `translateY(${pricePillStyle.top}px)` }}
            ></div>

            {PRICE_RANGES.map((r, i) => (
              <button
                key={i}
                ref={(el) => (priceRefs.current[i] = el)}
                onClick={() => updateFilter("price", i)}
                className={`bg-transparent relative z-10 block w-full text-left px-3 py-2 text-sm rounded-lg transition-all font-bold outline-none ring-0 focus:ring-0 ${
                  filterPrice === i ? "text-violet-600" : "text-gray-500 hover:text-gray-700 bg-transparent"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
