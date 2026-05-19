import React from "react";

export default function MobileFilterOverlay({ state, actions }) {
  const { showMobileFilter, filteredProducts } = state;
  const { setShowMobileFilter } = actions;

  if (!showMobileFilter) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setShowMobileFilter(false)}
      ></div>
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto">

        <div className="flex justify-between items-center mb-8">
          <h3 className="font-bold text-xl">Filters</h3>
          <button onClick={() => setShowMobileFilter(false)} className="text-2xl">
            ✕
          </button>
        </div>

        {/* Filter content similar to Sidebar... */}
        <p className="text-sm text-gray-400 italic mb-8">
          Mobile filters UI will be rendered here.
        </p>

        <button
          onClick={() => setShowMobileFilter(false)}
          className="w-full bg-violet-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-violet-200 mt-10"
        >
          Show {filteredProducts.length} Results
        </button>

      </div>
    </div>
  );
}
