"use client";

import { useSearch } from "@/hooks/useSearch";
import { useLanguage } from "@shop/shared/context/LanguageContext";
import SidebarFilters from "@/components/search/SidebarFilters";
import SearchBar from "@/components/search/SearchBar";
import SearchResultsGrid from "@/components/search/SearchResultsGrid";
import MobileFilterOverlay from "@/components/search/MobileFilterOverlay";

export default function SearchClient() {
  const { state, refs, actions } = useSearch();
  const { t } = useLanguage();

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-64 text-violet-500 font-bold">
        {t("common.loading", "Loading...")}
      </div>
    );
  }

  return (
    <div className="sr-container container mx-auto py-6 px-3 md:px-4 flex-1 flex flex-col md:flex-row gap-8">
      <SidebarFilters state={state} refs={refs} actions={actions} />

      <div className="flex-1 w-full md:w-3/4">
        <SearchBar state={state} actions={actions} />
        <SearchResultsGrid state={state} actions={actions} />
      </div>

      <MobileFilterOverlay state={state} actions={actions} />
    </div>
  );
}
