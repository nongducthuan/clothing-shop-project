"use client";

import { useSalesPolicy } from "@/hooks/useSalesPolicy";
import PolicyHeader from "@/components/sales-policy/PolicyHeader";
import PolicyCards from "@/components/sales-policy/PolicyCards";
import PolicyOffers from "@/components/sales-policy/PolicyOffers";
import PolicyFooter from "@/components/sales-policy/PolicyFooter";

export default function SalesPolicyClient() {
  const { state, actions } = useSalesPolicy();

  return (
    <div className="flex-1 bg-white dark:bg-slate-900 py-12 px-6 sm:px-12 transition-colors">
      <div className="max-w-[1000px] mx-auto">
        <PolicyHeader />
        <PolicyCards />
        <PolicyOffers state={state} actions={actions} />
        <PolicyFooter />
      </div>
    </div>
  );
}
