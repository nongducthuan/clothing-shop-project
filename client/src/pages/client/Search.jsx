import React from "react";
import { useSearch } from "../../hooks/client/useSearch";

import SidebarFilters from "../../components/client/search/SidebarFilters";
import SearchBar from "../../components/client/search/SearchBar";
import SearchResultsGrid from "../../components/client/search/SearchResultsGrid";
import MobileFilterOverlay from "../../components/client/search/MobileFilterOverlay";

export default function SearchResults() {
  const { state, refs, actions } = useSearch();

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-64 text-violet-500 font-bold">
        Loading...
      </div>
    );
  }

  return (
    <div className="sr-container container mx-auto py-6 px-3 md:px-4 min-h-screen flex flex-col md:flex-row gap-8">

      {/* ========== SIDEBAR (PC only) ========== */}
      <SidebarFilters state={state} refs={refs} actions={actions} />

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 w-full md:w-3/4">

        <SearchBar state={state} actions={actions} />

        <SearchResultsGrid state={state} actions={actions} />

      </div>

      {/* ========== MOBILE FILTER OVERLAY ========== */}
      <MobileFilterOverlay state={state} actions={actions} refs={refs} />

    </div>
  );
}
