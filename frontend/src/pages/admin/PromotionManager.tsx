import React from "react";
import usePromotionManager from "../../hooks/admin/usePromotionManager";
import PromotionForm from "../../components/admin/promotions/PromotionForm";
import PromotionList from "../../components/admin/promotions/PromotionList";

export default function PromotionManager() {
  const { state, actions, helpers } = usePromotionManager();
  const { searchTerm } = state;
  const { setSearchTerm } = actions;

  return (
    <div className="p-6 bg-slate-50 flex-1 font-sans pb-20">
      <div className="max-w-7xl mx-auto">
        {/* HEADER PAGE with Pill UI Title & Search Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3.5 rounded-full shadow-sm shadow-gray-200 border border-gray-100">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
              <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm">
                Promotions
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <PromotionForm state={state} actions={actions} helpers={helpers} />
          <PromotionList state={state} actions={actions} helpers={helpers} />
        </div>
      </div>
    </div>
  );
}
