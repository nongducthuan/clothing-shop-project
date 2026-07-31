import React from "react";
import { useSalesPolicy } from "../../hooks/customer/useSalesPolicy";
import PolicyHeader from "../../components/customer/sales-policy/PolicyHeader";
import PolicyCards from "../../components/customer/sales-policy/PolicyCards";
import PolicyOffers from "../../components/customer/sales-policy/PolicyOffers";
import PolicyFooter from "../../components/customer/sales-policy/PolicyFooter";

export default function SalesPolicy() {
  const { state, actions } = useSalesPolicy();

  return (
    <div className="flex-1 bg-white py-12 px-6 sm:px-12">
      <div className="max-w-[1000px] mx-auto">

        <PolicyHeader />

        <PolicyCards />

        <PolicyOffers state={state} actions={actions} />

        <PolicyFooter />

      </div>
    </div>
  );
}
