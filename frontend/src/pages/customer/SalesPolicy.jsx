import React from "react";
import { useSalesPolicy } from "../../hooks/client/useSalesPolicy";
import PolicyHeader from "../../components/client/sales-policy/PolicyHeader";
import PolicyCards from "../../components/client/sales-policy/PolicyCards";
import PolicyOffers from "../../components/client/sales-policy/PolicyOffers";
import PolicyFooter from "../../components/client/sales-policy/PolicyFooter";

export default function SalesPolicy() {
  const { state, actions } = useSalesPolicy();

  return (
    <div className="min-h-screen bg-white py-16 px-6 sm:px-12">
      <div className="max-w-[1000px] mx-auto">

        <PolicyHeader />

        <PolicyCards />

        <PolicyOffers state={state} actions={actions} />

        <PolicyFooter />

      </div>
    </div>
  );
}
