import React from "react";
import usePromotionManager from "../../hooks/admin/usePromotionManager";
import PromotionForm from "../../components/admin/promotions/PromotionForm";
import PromotionList from "../../components/admin/promotions/PromotionList";
import PageHeader from "../../components/admin/layout/PageHeader";
import PageLoader from "../../components/common/PageLoader";

export default function PromotionManager() {
  const { state, actions, helpers } = usePromotionManager();
  const { searchTerm } = state;
  const { setSearchTerm } = actions;

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1 font-sans flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <PageHeader title="Promotions" colorClass="bg-purple-500" />
      </div>

      {state.isLoading ? (
        <PageLoader />
      ) : (
        <div className="space-y-10">
          <PromotionForm state={state} actions={actions} helpers={helpers} />
          <PromotionList state={state} actions={actions} helpers={helpers} />
        </div>
      )}
    </div>
  );
}
