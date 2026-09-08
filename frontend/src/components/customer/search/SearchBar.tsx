import React from "react";
import { useLanguage } from "../../../context/LanguageContext";

export default function SearchBar({ state, actions }) {
  const { searchInput } = state;
  const { setSearchInput, handleSearchSubmit, setShowMobileFilter } = actions;
  const { t } = useLanguage();

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-8">
      <form onSubmit={handleSearchSubmit} className="flex-1 relative">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            className="w-full bg-white dark:bg-slate-800 dark:text-slate-100 pl-5 pr-14 py-3.5 border border-gray-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all shadow-sm"
            placeholder={t("search.placeholder", "Find your favorite products...")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center text-white bg-violet-600 rounded-xl hover:bg-violet-700 transition-all shadow-md active:scale-95"
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
      </form>

      <button
        onClick={() => setShowMobileFilter(true)}
        className="md:hidden px-6 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl font-bold text-gray-700 dark:text-slate-200 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 shadow-sm"
      >
        <i className="fa-solid fa-sliders text-violet-600"></i> {t("search.filters", "Filters")}
      </button>
    </div>
  );
}

